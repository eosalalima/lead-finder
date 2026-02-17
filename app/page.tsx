import { MapSearch } from '@/components/map-search';
import { requireSession } from '@/lib/session';

export default async function HomePage() {
  await requireSession();
  const jsApiKey = process.env.GOOGLE_MAPS_JS_API_KEY || '';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Map Discovery</h1>
      <MapSearch jsApiKey={jsApiKey} />
    </div>
  );
}
