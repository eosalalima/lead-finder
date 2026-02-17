import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { placesNearbySearch, searchSchema } from '@/lib/google-places';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = checkRateLimit(`places-search:${session.user.id}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const results = await placesNearbySearch(parsed.data);
    return NextResponse.json(results);
  } catch (error) {
    console.error('places/search error', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
