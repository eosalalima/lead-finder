import { z } from 'zod';

export const searchSchema = z.object({
  keyword: z.string().min(2).max(80),
  type: z.string().max(50).optional().or(z.literal('')),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  radius: z.number().int().min(100).max(50000),
  maxResults: z.number().int().min(1).max(60)
});

export type PlaceSummary = {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  geometry?: { location: { lat: number; lng: number } };
};

export async function placesNearbySearch(input: z.infer<typeof searchSchema>) {
  const key = process.env.GOOGLE_PLACES_WEB_SERVICE_KEY;
  if (!key) throw new Error('Missing GOOGLE_PLACES_WEB_SERVICE_KEY');

  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('key', key);
  url.searchParams.set('location', `${input.lat},${input.lng}`);
  url.searchParams.set('radius', String(input.radius));
  url.searchParams.set('keyword', input.keyword);
  if (input.type) url.searchParams.set('type', input.type);

  const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error(`Places search failed: ${res.status}`);
  const data = await res.json();
  const results = (data.results ?? []).slice(0, input.maxResults) as PlaceSummary[];
  return { status: data.status, results };
}

export async function placeDetails(placeId: string) {
  const key = process.env.GOOGLE_PLACES_WEB_SERVICE_KEY;
  if (!key) throw new Error('Missing GOOGLE_PLACES_WEB_SERVICE_KEY');

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('key', key);
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'place_id,name,formatted_address,formatted_phone_number,website,url');

  const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error(`Place details failed: ${res.status}`);
  const data = await res.json();
  return data.result;
}
