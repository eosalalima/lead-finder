import { notFound } from 'next/navigation';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/session';

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const lead = await prisma.lead.findUnique({ where: { id: params.id }, include: { assignedTo: true } });
  if (!lead) return notFound();
  if (session.user.role !== Role.ADMIN && lead.assignedToId !== session.user.id) return notFound();

  return (
    <div className="rounded bg-white p-5 shadow">
      <h1 className="text-2xl font-semibold">{lead.companyName}</h1>
      <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
        <div><dt className="font-semibold">Owner</dt><dd>{lead.assignedTo.email}</dd></div>
        <div><dt className="font-semibold">Status</dt><dd>{lead.status}</dd></div>
        <div><dt className="font-semibold">Website</dt><dd>{lead.websiteUrl || '—'}</dd></div>
        <div><dt className="font-semibold">Contact Channel</dt><dd>{lead.contactChannel}</dd></div>
        <div><dt className="font-semibold">Contact Value</dt><dd>{lead.contactValue}</dd></div>
        <div><dt className="font-semibold">Industry</dt><dd>{lead.industry || '—'}</dd></div>
        <div><dt className="font-semibold">City/Province</dt><dd>{lead.cityProvince || '—'}</dd></div>
        <div><dt className="font-semibold">Source Place ID</dt><dd>{lead.sourcePlaceId}</dd></div>
      </dl>
      <p className="mt-3 text-sm text-slate-700">Notes: {lead.notes || '—'}</p>
    </div>
  );
}
