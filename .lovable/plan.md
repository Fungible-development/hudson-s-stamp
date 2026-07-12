## Goal

Let the user narrow the Dashboard's **Flagged items** list to a single restaurant, independently of the top-bar location switcher.

## Change

In `src/routes/_app.dashboard.tsx`, add a compact selector in the "Flagged items" section header:

- Options: **All locations** + one entry per restaurant from `useStore(s => s.locations)`.
- Local `useState` (default `"all"`). Does not touch the global `activeLocationId`, so tiles and "Due today" stay unaffected.
- Applied on top of the already-filtered `flagged` list: when a location is picked, filter to `f.locationId === selected`.
- Empty state copy updates to reflect the chosen location (e.g. "No flagged items at Camps Bay in the last 7 days.").
- The flag count tile above continues to reflect the global filter — the new selector only scopes the list, matching the existing "honest counts" behaviour.

## Layout

```text
Flagged items                        [ Location ▾ ]
─────────────────────────────────────────────────
• Menus torn — GM Monday · Gardens · 08/07/2026
• Unlabelled sauce tubs — Chef · Camps Bay · 07/07/2026
```

Selector uses the same styling as the top-bar location `<select>` (bordered, small, `MapPin` icon) but on a light surface to fit the card header.

## Out of scope

- No changes to the top-bar switcher, tiles, "Due today" section, or the underlying `selectRecentFlagged` selector.
