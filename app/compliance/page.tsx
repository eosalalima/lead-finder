export default function CompliancePage() {
  return (
    <div className="space-y-3 rounded bg-white p-5 shadow">
      <h1 className="text-2xl font-semibold">Compliance Guardrails</h1>
      <ul className="list-disc space-y-2 pl-6 text-sm">
        <li>Discovery-only workflow. No export, scraping, or bulk downloading of Google Maps/Places content.</li>
        <li>Google place details are displayed interactively and not persisted to internal storage.</li>
        <li>Only source_place_id and source Google Maps URL are stored when an RM manually creates a lead.</li>
        <li>Contact details must be copied by the RM from official company channels (website/contact page).</li>
        <li>Rate limits and a hard result cap (60 per search) are enforced to prevent high-volume harvesting.</li>
      </ul>
    </div>
  );
}
