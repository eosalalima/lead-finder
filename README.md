# Territory Finder (Internal Tool)

Compliant discovery workflow for Relationship Managers (RMs) to find businesses in a selected area using Google Maps Platform.

## What this app does
- Authenticated map-based business discovery using Google Maps JS + Places API.
- Interactive-only search by keyword/type/radius with hard caps.
- Per-user rate limiting to reduce abuse/high-volume query patterns.
- Manual lead creation into Postgres with RM-entered contact details from official channels.
- Admin and RM lead management with role-aware visibility.

## Compliance rules (non-negotiable)
1. **No export / extraction** of Google Maps/Places content.
   - No CSV export, no bulk download, no background harvesting jobs.
2. **No long-term storage/caching** of Google Places listing data.
   - Place details are fetched/displayed in-session only.
   - Persist only `sourcePlaceId`, `sourceGoogleMapsUrl`, and user-entered CRM lead fields.
3. **Google map display is required** whenever displaying Google Places results.
4. **Rate limits and result caps** are enforced.

> In-app reminder: “Use Google results for discovery only. Capture contact details from the company’s official website/contact channels.”

## Tech stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL
- NextAuth credentials auth (email/password)
- Places API Web Service called only server-side

## Environment variables
Copy `.env.example` to `.env` and set real values:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/territory_finder?schema=public"
NEXTAUTH_SECRET="replace-with-strong-secret"
GOOGLE_MAPS_JS_API_KEY="restricted-browser-key"
GOOGLE_PLACES_WEB_SERVICE_KEY="restricted-server-key"
```

## Local setup
1. Start Postgres:
   ```bash
   docker compose up -d
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Apply DB schema:
   ```bash
   npx prisma migrate dev
   ```
4. Seed default users:
   ```bash
   npm run prisma:seed
   ```
5. Run app:
   ```bash
   npm run dev
   ```

Open `http://localhost:3000`.

## Seed users
- `admin@territory.local` / `Admin1234!`
- `rm@territory.local` / `Rm1234!`

## Key routes
- `/login` - credentials auth
- `/` - map search + place drawer + create lead
- `/leads` - lead list (ADMIN sees all, RM sees own)
- `/leads/:id` - lead details
- `/compliance` - policy and guardrails
- `/api/places/search` - rate-limited places search
- `/api/places/details` - rate-limited place detail lookup
- `/api/leads` - manual lead creation endpoint

## Production notes
- Replace in-memory rate limiter with Redis.
- Enforce strict CSP/referrer restrictions for Maps JS key.
- Restrict Places Web Service key by server egress IP and API scope.
- Add audit logs for user search activity and lead creation events.
