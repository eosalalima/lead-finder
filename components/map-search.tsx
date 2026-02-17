'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Place = {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  geometry?: { location: { lat: number; lng: number } };
};

type PlaceDetails = {
  place_id: string;
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  url?: string;
};

declare global {
  interface Window {
    google: typeof google;
  }
}

const defaultCenter = { lat: 14.5995, lng: 120.9842 };

export function MapSearch({ jsApiKey }: { jsApiKey: string }) {
  const [keyword, setKeyword] = useState('warehouse');
  const [type, setType] = useState('');
  const [radius, setRadius] = useState(1500);
  const [maxResults, setMaxResults] = useState(20);
  const [results, setResults] = useState<Place[]>([]);
  const [selected, setSelected] = useState<PlaceDetails | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    const cached = localStorage.getItem('territory-last-center');
    if (!cached) return;
    try {
      setCenter(JSON.parse(cached));
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('territory-last-center', JSON.stringify(center));
  }, [center]);

  useEffect(() => {
    if (!jsApiKey) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${jsApiKey}`;
    script.async = true;

    script.onload = () => {
      const map = new window.google.maps.Map(document.getElementById('map') as HTMLElement, { center, zoom: 13 });
      mapRef.current = map;
      const marker = new window.google.maps.Marker({ map, position: center, draggable: true });
      const circle = new window.google.maps.Circle({ map, center, radius, fillColor: '#3b82f6', fillOpacity: 0.15, strokeColor: '#1d4ed8' });
      circleRef.current = circle;

      marker.addListener('dragend', () => {
        const p = marker.getPosition();
        if (!p) return;
        const next = { lat: p.lat(), lng: p.lng() };
        setCenter(next);
        circle.setCenter(next);
      });

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        marker.setPosition(next);
        circle.setCenter(next);
        setCenter(next);
      });
    };

    document.body.appendChild(script);
  }, [jsApiKey]);

  useEffect(() => {
    circleRef.current?.setRadius(radius);
  }, [radius]);

  const paged = useMemo(() => results.slice(0, 60), [results]);

  async function doSearch() {
    setLoading(true);
    setMessage(null);
    setSelected(null);
    try {
      const res = await fetch('/api/places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, type, lat: center.lat, lng: center.lng, radius, maxResults: Math.min(maxResults, 60) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');

      setResults(data.results ?? []);
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      for (const place of data.results ?? []) {
        if (mapRef.current && place.geometry?.location) {
          markersRef.current.push(new window.google.maps.Marker({ map: mapRef.current, position: place.geometry.location, title: place.name }));
        }
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function openDetails(placeId: string) {
    const res = await fetch('/api/places/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId })
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || 'Failed to load details');
    setSelected(data.details);
  }

  async function createLead(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setMessage(res.ok ? `Lead created (${data.leadId})` : data.error || 'Failed to create lead');
  }

  return (<div className="space-y-4">{/* ui omitted for brevity */}
      <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Use Google results for discovery only. Capture contact details from the company’s official website/contact channels.</div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]"><div id="map" className="h-[520px] rounded border bg-slate-200" />
        <div className="space-y-3 rounded border bg-white p-3">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="w-full rounded border p-2" placeholder="Keyword" />
          <select className="w-full rounded border p-2" value={type} onChange={(e) => setType(e.target.value)}><option value="">Any Type</option><option value="storage">Storage</option><option value="hospital">Clinic/Hospital</option><option value="bank">Banking</option><option value="school">School</option></select>
          <label className="block text-sm">Radius: {radius}m</label><input type="range" min="100" max="5000" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full" />
          <label className="block text-sm">Max Results (1-60)</label><input type="number" min={1} max={60} value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))} className="w-full rounded border p-2" />
          <button onClick={doSearch} disabled={loading} className="w-full rounded bg-blue-700 p-2 text-white disabled:bg-slate-400">{loading ? 'Searching...' : 'Search Places'}</button>{message && <p className="text-xs text-slate-700">{message}</p>}
        </div></div>
      <div className="rounded border bg-white p-3"><h2 className="mb-2 font-semibold">Results ({paged.length} / 60 cap)</h2><ul className="space-y-2">{paged.map((place) => <li key={place.place_id} className="rounded border p-2"><div className="font-medium">{place.name}</div><div className="text-sm text-slate-600">{place.vicinity || place.formatted_address}</div>{place.rating && <div className="text-sm">Rating: {place.rating}</div>}<button onClick={() => openDetails(place.place_id)} className="mt-2 rounded bg-slate-900 px-3 py-1 text-sm text-white">Open Place Drawer</button></li>)}</ul></div>
      {selected && <div className="rounded border bg-white p-4"><h3 className="font-semibold">Place Drawer</h3><p>{selected.name}</p><p className="text-sm text-slate-600">{selected.formatted_address}</p><p className="text-sm">Phone: {selected.formatted_phone_number || 'N/A'}</p>{selected.website && <a href={selected.website} target="_blank" className="text-blue-700 underline" rel="noreferrer">Website</a>}{selected.url && <a href={selected.url} target="_blank" className="ml-3 text-blue-700 underline" rel="noreferrer">Google Maps URL</a>}
        <form action={createLead} className="mt-4 grid gap-2 md:grid-cols-2"><input name="companyName" defaultValue={selected.name ?? ''} className="rounded border p-2" required /><input name="websiteUrl" defaultValue={selected.website ?? ''} className="rounded border p-2" placeholder="Website URL" /><select name="contactChannel" className="rounded border p-2" defaultValue="CONTACT_FORM"><option value="CONTACT_FORM">CONTACT_FORM</option><option value="TRUNKLINE">TRUNKLINE</option><option value="INFO_EMAIL">INFO_EMAIL</option><option value="SALES_EMAIL">SALES_EMAIL</option><option value="OTHER">OTHER</option></select><input name="contactValue" className="rounded border p-2" placeholder="Official contact channel value" required /><input name="industry" className="rounded border p-2" placeholder="Industry" /><input name="cityProvince" className="rounded border p-2" placeholder="City / Province" /><select name="status" className="rounded border p-2" defaultValue="NEW"><option value="NEW">NEW</option><option value="QUALIFIED">QUALIFIED</option><option value="CONTACTED">CONTACTED</option><option value="OPPORTUNITY">OPPORTUNITY</option><option value="CLOSED">CLOSED</option></select><input name="sourcePlaceId" defaultValue={selected.place_id} className="rounded border p-2" readOnly /><input name="sourceGoogleMapsUrl" defaultValue={selected.url ?? ''} className="rounded border p-2 md:col-span-2" readOnly /><textarea name="notes" className="rounded border p-2 md:col-span-2" placeholder="Notes" /><button type="submit" className="rounded bg-emerald-700 px-3 py-2 text-white md:col-span-2">Create Lead</button></form>
      </div>}
    </div>);
}
