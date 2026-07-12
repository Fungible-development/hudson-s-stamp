## Goals

1. Fold "Templates" into "Audits" so admins have one place to create, rename, edit, duplicate, delete, and run audit definitions.
2. Let the person running an audit choose which assigned location they're auditing at (instead of silently defaulting to the first one).
3. Bump the persistence key so everyone picks up the current 4-audit seed.

## Changes

### 1. One place for audit management ("Audits")

Rework the Admin nav from **Dashboard / Templates / Audits** to **Dashboard / Audits**. All template CRUD moves under `/audits`.

Route restructure (rename existing files, keep the components/logic):

```text
/audits                    Definitions list + "New audit" button  (was /templates)
                             Each row: name, schedule, sections/items count,
                             assigned locations, actions (Run, Edit, Duplicate, Delete)
                             Below: "Recent audits" list with Recent / Flagged / Off-site tabs
                             (merges the old Templates list and Audits history into one screen)
/audits/new                Create audit definition                (was /templates/new)
/audits/$id/edit           Edit audit definition                  (was /templates/$id)
/audits/$id/run            Run an audit                           (was /audits/run/$id)
/audits/record/$id         View a submitted audit record          (was /audits/$id)
```

Copy changes: "Template" → "Audit" everywhere user-facing (headers, buttons, empty states, page titles). Internally the data model keeps `Template` / `templateId` — no store/type churn.

Remove `/templates` routes and the Templates entry from sidebar + bottom tab bar. Dashboard tiles/links that pointed at `/templates` re-point at `/audits`.

### 2. Location picker when starting an audit

Replace the current "Start" link (which pre-filled the first location in the query string) with a two-step start:

- On `/audits`, the Run action opens a small dialog: "Where are you auditing?" with a radio/select of **only** the locations that audit is assigned to. If exactly one location is assigned, skip the dialog and go straight in.
- Confirming navigates to `/audits/$id/run?location=<chosen>`.
- Inside the runner, if `?location` is missing or not in the audit's `locationIds`, show an inline picker instead of the checklist and only start the audit (and GPS check) after the user picks.

Also add the same picker to the Dashboard "Due today" tiles and any other "Start" entry point so no path silently defaults.

### 3. Fresh seed for everyone

- Update seed data to the four audits requested:
  - **GM Monday Audit** — weekly (keep current checklist)
  - **Chef Audit** — monthly (keep current checklist)
  - **Maintenance / Equipment Audit** — monthly (keep current checklist)
  - **Waitress Training Audit** — as_needed (keep current checklist)
  (These match what's already seeded; no content changes needed beyond confirming schedules.)
- Bump the Zustand persist key from `hudsons-compliance-v1` to `hudsons-compliance-v2` so every existing browser drops its stale cache and re-seeds. Old key is not migrated — it's demo data.
- Keep the two seeded historical audit records so the Dashboard "recent flagged" tile still has something to show.

## Out of scope

- No changes to the data model (`Template`, `Audit`, responses, GPS logic).
- No changes to the Manager placeholder, stamp UI, or GPS/off-site behavior.
- No new roles, no real backend — still local mock store.
