import Link from 'next/link';
import { LeadStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/session';

export default async function LeadsPage({ searchParams }: { searchParams?: { status?: LeadStatus; city?: string; owner?: string } }) {
  const session = await requireSession();
  const where = {
    ...(searchParams?.status ? { status: searchParams.status } : {}),
    ...(searchParams?.city ? { cityProvince: { contains: searchParams.city, mode: 'insensitive' as const } } : {}),
    ...(session.user.role === Role.ADMIN ? (searchParams?.owner ? { assignedToId: searchParams.owner } : {}) : { assignedToId: session.user.id })
  };

  const leads = await prisma.lead.findMany({ where, include: { assignedTo: true }, orderBy: { createdAt: 'desc' } });
  const owners = session.user.role === Role.ADMIN ? await prisma.user.findMany({ where: { role: Role.RM } }) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Leads</h1>
      <form className="grid gap-2 rounded bg-white p-3 md:grid-cols-4">
        <select name="status" defaultValue={searchParams?.status || ''} className="rounded border p-2">
          <option value="">All Statuses</option>
          {Object.values(LeadStatus).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <input name="city" defaultValue={searchParams?.city || ''} placeholder="City/Province" className="rounded border p-2" />
        {session.user.role === Role.ADMIN && (
          <select name="owner" defaultValue={searchParams?.owner || ''} className="rounded border p-2">
            <option value="">All Owners</option>
            {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.email}</option>)}
          </select>
        )}
        <button className="rounded bg-slate-900 px-3 py-2 text-white" type="submit">Apply</button>
      </form>
      <div className="space-y-2">
        {leads.map((lead) => (
          <Link key={lead.id} href={`/leads/${lead.id}`} className="block rounded border bg-white p-3 hover:bg-slate-50">
            <div className="font-medium">{lead.companyName}</div>
            <div className="text-sm text-slate-600">{lead.cityProvince || 'No city'} · {lead.status} · Owner: {lead.assignedTo.email}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
