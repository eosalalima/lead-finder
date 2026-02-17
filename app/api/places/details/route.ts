import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { placeDetails } from '@/lib/google-places';

const bodySchema = z.object({ placeId: z.string().min(2) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = checkRateLimit(`places-details:${session.user.id}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const details = await placeDetails(parsed.data.placeId);
    return NextResponse.json({ details });
  } catch (error) {
    console.error('places/details error', error);
    return NextResponse.json({ error: 'Details lookup failed' }, { status: 500 });
  }
}
