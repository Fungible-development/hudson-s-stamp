## Settings tab — plan

### Access
- Add a **gear icon** in the top bar (`src/routes/_app.tsx`), admin-only, next to the location switcher. Opens `/settings`.
- No change to bottom tab bar / sidebar nav.

### Route
- New file: `src/routes/_app.settings.tsx` (single page with two sections stacked; no sub-routes needed for v1).

### Section 1 — Locations
Admin can manage the list of restaurants used everywhere (top-bar switcher, audit assignment, location picker on Start).

Per location, editable fields:
- **Display name** (e.g. "Hudson's Camden")
- **Physical address** (single multi-line field)

Actions:
- Add new location (name + address; new `id` generated).
- Edit inline (row expands to form).
- Delete (confirm dialog). Guard: if the location is referenced by any template's `locationIds` or by any audit, the delete confirm warns and, on confirm, also strips the id from those templates. Existing audit records keep the id (historical truth) and fall back to "Unknown location" in the UI.

Data-model change (`src/lib/mock/types.ts`):
- Add `address: string` to `Location`.
- Keep existing `lat`, `lng`, `radiusM` (untouched by this UI, still used by soft GPS check against seed coordinates).

Store (`src/lib/store.ts`):
- Add `createLocation`, `updateLocation`, `deleteLocation` actions.
- On delete, also purge the id from every template's `locationIds`.
- Seed (`src/lib/mock/seed.ts`): add an `address` string to each existing seeded location.

### Section 2 — Brand & display
Small, focused settings that change what the whole app shows:
- **Group name** — string shown in the top bar (currently hard-coded "Hudson's Compliance"). Default kept as today.
- **Brand mark** — single letter for the square badge in the top bar (default "H").
- **Date format** — radio: `UK (DD/MM/YYYY)` (default) or `US (MM/DD/YYYY)`. Wired into `src/components/client-date.tsx` so every rendered date respects it.

Store additions:
- `settings: { groupName: string; brandMark: string; dateFormat: "uk" | "us" }` with an `updateSettings(patch)` action. Persisted via the existing Zustand persist config (key stays `hudsons-compliance-v2` — new fields default in cleanly).

### UI details
- Page header: "Settings" in the display font, matching Dashboard/Audits.
- Two card blocks: **Locations** (list + Add button) and **Brand & display** (form).
- Save-on-blur for inline edits; explicit "Save" button on Brand & display.
- Toast confirmations on create / update / delete (using existing sonner setup if present, else inline success flash).

### Files touched
- `src/routes/_app.tsx` — gear icon + admin-only link.
- `src/routes/_app.settings.tsx` — new page.
- `src/lib/mock/types.ts` — `address` on Location; `AppSettings` type.
- `src/lib/mock/seed.ts` — addresses for seeded locations; default settings.
- `src/lib/store.ts` — location CRUD, settings state + action, delete-cascade to templates.
- `src/components/client-date.tsx` — honor `dateFormat` setting.
- `src/routes/_app.tsx` (top bar) — use `settings.groupName` and `settings.brandMark`.

### Out of scope (called out for clarity)
- Editing GPS coordinates / geofence radius from the UI — the soft GPS check keeps using the seeded coordinates. Easy to add later once real venues are onboarded.
- GPS strictness toggle, seed-reset button — you deferred these.

### Other settings worth considering later (not building now)
- **Team / users** — invite managers, assign them to locations (needs real auth).
- **Notification rules** — who gets pinged when an audit is flagged or missed.
- **Audit reminder times** — when "due today" starts nagging.
- **Data export** — CSV of audits for a date range.
- **Retention** — auto-archive audits older than N months.