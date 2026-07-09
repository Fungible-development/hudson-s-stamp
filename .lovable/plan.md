
# Hudson's Compliance — v1 Plan

Fast-casual burger group compliance/audit tool. Replaces "Dataflow." Mobile-first, mock state only (no Cloud yet). Fixes the three trust bugs from the old tool: honest counts, no dead-end GPS block, explanatory empty states.

## Design system (locked)

Tokens in `src/styles.css` (`@theme inline` + `:root`), oklch equivalents of:
- `--ink` #1E2321 · `--paper` #EFEDE4 · `--pass` #3F7D5C · `--fail` #C1442D · `--flag` #D9A441 · `--steel` #7C8B86
- Radius small (2–4px), sharp corners; subtle paper grain background utility.
- Fonts loaded via `<link>` in `__root.tsx` head (Google Fonts): Barlow Condensed (headers/nav), Inter (body), IBM Plex Mono (timestamps/IDs). Registered in `@theme` as `--font-display`, `--font-body`, `--font-mono`.
- Shadcn tokens remapped (`--background` = paper, `--foreground` = ink, `--primary` = ink, `--destructive` = fail, etc.) so all shadcn components inherit the aesthetic.
- Stamp interaction: custom `@utility stamp-in` — scale 1.15 → 1 + opacity 0 → 1 over ~120ms, ease-out, no smooth toggle.

## Routes (TanStack Start, file-based)

```
src/routes/
  __root.tsx                  → shell: fonts, meta, AppProviders
  index.tsx                   → redirects to /dashboard (admin default)
  _app.tsx                    → layout: responsive nav (sidebar desktop, bottom tabs mobile) + top bar (location switcher + Admin/Manager dev toggle)
  _app.dashboard.tsx          → Admin dashboard
  _app.templates.index.tsx    → Templates list (per location)
  _app.templates.new.tsx      → Template builder
  _app.templates.$id.tsx      → Template edit
  _app.audits.index.tsx       → Audits list (due today, in-progress, recent)
  _app.audits.run.$id.tsx     → Run an audit (GPS check → sections → submit)
  _app.audits.$id.tsx         → Completed audit detail (flagged items visible)
  _app.manager.tsx            → Manager "coming soon" placeholder
```

Role/location state lives in a small Zustand store persisted to `localStorage` (role: 'admin'|'manager', activeLocationId, devRoleOverride).

## Data shapes (mock, in `src/lib/mock/`)

```ts
type Location = { id: string; name: string; lat: number; lng: number; radiusM: number }
// Gardens, Camps Bay, V&A Waterfront

type Schedule = 'daily' | 'weekly' | 'monthly'

type AuditItem = { id: string; label: string; requiresNote: boolean }
type AuditSection = { id: string; name: string; items: AuditItem[] }
type Template = {
  id: string; name: string; schedule: Schedule;
  locationIds: string[]; sections: AuditSection[];
  createdAt: string; updatedAt: string;
}

type AuditResponse = { itemId: string; status: 'pass' | 'fail' | 'na'; note?: string }
type Audit = {
  id: string; templateId: string; locationId: string;
  startedAt: string; submittedAt?: string;
  responses: AuditResponse[];
  offSite: boolean;              // true if GPS didn't match / denied
  offSiteReason?: 'denied' | 'out_of_range' | 'unavailable';
}
```

Seed: 3 locations, 3 templates (Opening Compliance Check — daily; Chef Audit — weekly; Deep Clean — monthly), a handful of past audits including some with flagged (`fail`) items and one `offSite: true` for Admin visibility.

Store: single Zustand store `useComplianceStore` with actions (`createTemplate`, `duplicateTemplate`, `deleteTemplate`, `startAudit`, `saveResponse`, `submitAudit`). All derived counts (badges, tiles, tabs) are selectors off this store — no independent counters, ever.

## Screen behavior

**Nav shell (`_app.tsx`)**
- Desktop ≥ md: left sidebar (Dashboard, Templates, Audits) with Barlow Condensed uppercase labels; badges use live selectors.
- Mobile: bottom tab bar (same three), 56px, thumb-reachable.
- Top bar: location switcher (default "All Locations"), tiny dev toggle chip "Admin / Manager" bottom-right corner of top bar, labeled `dev`.
- Manager role → sidebar/tabs collapse to just "Home" pointing to `/manager`.

**Dashboard**
- Tiles: Due today, Completed today, Open flags (last 7d), Off-site audits (last 30d).
- Each tile links to a pre-filtered Audits list. Count = length of the same filtered array the destination renders.
- "Recent flagged items" list (item label · template · location · timestamp mono).
- Empty states: "No audits logged yet this month — run your first Chef Audit →" with a real CTA.

**Templates**
- Filtered by active location (or all).
- Row actions: Run (→ start audit), Duplicate, Edit, Delete (confirm).
- New/Edit: name, schedule, location multi-select, sections (add/rename/reorder), items per section (label + `requiresNote` switch).

**Audits — run flow**
- On mount of `/audits/run/$id`: request geolocation once.
  - Success + within `radiusM` of assigned location → proceed, `offSite: false`.
  - Denied / unavailable / out of range → proceed anyway, set `offSite: true` with reason. Small amber banner: "Recorded off-site — an admin will review."
  - Never blocks.
- Sections rendered as ticket-paper cards. Each item: label, three stamp buttons (PASS green / FAIL red / N/A steel). Selecting stamps with `stamp-in` animation.
- If `requiresNote` OR status is `fail`, a note field appears; submit disabled until filled.
- Sticky bottom bar shows progress "12 / 34 stamped" and Submit.
- Submit → writes Audit, redirects to detail view with a mono record ID.

**Audit detail** — read-only recap, flagged items highlighted, off-site chip if applicable.

**Manager placeholder** — same shell, single centered card: "Manager tools — coming soon." Styled, not blank.

## Honest-counts contract

One rule enforced in code review: any number rendered in the UI must come from a selector that returns the same array the target screen renders. No hand-maintained counters, no "99+" placeholders. Badge components accept `count` from selector only.

## Out of scope for v1

Cloud/Supabase, real auth, real GPS enforcement, photo attachments, exports, notifications, Manager live features, analytics beyond dashboard tiles.

## Technical notes

- Zustand + `persist` middleware for mock store (localStorage key `hudsons-compliance-v1`).
- Geolocation wrapped in `useLocationCheck(locationId)` hook returning `{ status, reason }`, timeout 5s, never throws.
- All shadcn colors driven by tokens; no hardcoded hex in components.
- SEO/meta: `__root.tsx` title "Hudson's Compliance", each route sets its own head().
- Responsive layout follows the grid + `min-w-0` + `shrink-0` pattern for the top bar.

## Build order

1. Tokens + fonts + shadcn remap + base layout shell with responsive nav and dev role toggle.
2. Mock store + seed data + selectors.
3. Templates list + builder/editor.
4. Audits list + run flow (with soft GPS) + detail.
5. Dashboard tiles + flagged list + empty states wired to selectors.
6. Manager placeholder + polish pass (stamp animation, paper texture, mono timestamps).
