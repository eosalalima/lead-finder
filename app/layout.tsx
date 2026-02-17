import './globals.css';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Territory Finder',
  description: 'Compliant Google Places discovery workflow for relationship managers.'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Link href="/" className="font-semibold">Territory Finder</Link>
              {session && (
                <>
                  <Link href="/leads" className="text-sm text-blue-700">Leads</Link>
                  <Link href="/compliance" className="text-sm text-blue-700">Compliance</Link>
                </>
              )}
            </div>
            <div className="text-sm text-slate-600">{session?.user?.email ?? 'Not signed in'}</div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4">{children}</main>
      </body>
    </html>
  );
}
