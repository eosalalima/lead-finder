import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ContactChannel, LeadStatus, SourceType } from '@prisma/client';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const leadSchema = z.object({
  companyName: z.string().min(2).max(150),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  contactChannel: z.nativeEnum(ContactChannel),
  contactValue: z.string().min(2).max(120),
  industry: z.string().max(80).optional(),
  cityProvince: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  sourcePlaceId: z.string().min(2),
  sourceGoogleMapsUrl: z.string().url().optional().or(z.literal(''))
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = leadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        assignedToId: session.user.id,
        companyName: parsed.data.companyName,
        websiteUrl: parsed.data.websiteUrl || null,
        contactChannel: parsed.data.contactChannel,
        contactValue: parsed.data.contactValue,
        industry: parsed.data.industry || null,
        cityProvince: parsed.data.cityProvince || null,
        notes: parsed.data.notes || null,
        status: parsed.data.status,
        sourceType: SourceType.GOOGLE_PLACES_DISCOVERY,
        sourcePlaceId: parsed.data.sourcePlaceId,
        sourceGoogleMapsUrl: parsed.data.sourceGoogleMapsUrl || null,
        sourceDiscoveredAt: new Date()
      }
    });

    return NextResponse.json({ leadId: lead.id });
  } catch (error) {
    console.error('lead create error', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
