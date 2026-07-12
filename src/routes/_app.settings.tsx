import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { DateFormat, Location } from "@/lib/mock/types";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Hudson's Compliance" },
      { name: "description", content: "Manage restaurant locations and display preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Admin
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">Settings</h1>
      </div>

      <LocationsSection />
      <BrandSection />
    </div>
  );
}

// ---------------- Locations ----------------

function LocationsSection() {
  const locations = useStore((s) => s.locations);
  const templates = useStore((s) => s.templates);
  const audits = useStore((s) => s.audits);
  const createLocation = useStore((s) => s.createLocation);
  const updateLocation = useStore((s) => s.updateLocation);
  const deleteLocation = useStore((s) => s.deleteLocation);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="mb-8 rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Locations</h2>
          <p className="text-[13px] text-muted-foreground">
            Restaurants that appear in the location switcher and audit picker.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="font-display flex shrink-0 items-center gap-2 rounded-sm bg-ink px-3 py-2 text-xs font-bold uppercase tracking-widest text-paper"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        )}
      </header>

      <ul className="divide-y divide-border">
        {adding && (
          <li className="p-4">
            <LocationForm
              onCancel={() => setAdding(false)}
              onSave={(name, address) => {
                createLocation({ name, address });
                setAdding(false);
              }}
            />
          </li>
        )}

        {locations.length === 0 && !adding && (
          <li className="p-8 text-center text-sm text-muted-foreground">
            No locations yet. Add your first restaurant.
          </li>
        )}

        {locations.map((l) =>
          editingId === l.id ? (
            <li key={l.id} className="p-4">
              <LocationForm
                initial={l}
                onCancel={() => setEditingId(null)}
                onSave={(name, address) => {
                  updateLocation(l.id, { name, address });
                  setEditingId(null);
                }}
              />
            </li>
          ) : (
            <li key={l.id} className="flex items-start gap-3 p-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-foreground">{l.name}</p>
                <p className="mt-0.5 whitespace-pre-line text-[13px] text-muted-foreground">
                  {l.address || (
                    <span className="italic text-muted-foreground/70">No address set</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setEditingId(l.id)}
                  className="grid h-9 w-9 place-items-center rounded-sm border border-border bg-background hover:bg-muted"
                  title="Edit"
                  aria-label="Edit location"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    const usedByTpls = templates.filter((t) => t.locationIds.includes(l.id));
                    const usedByAudits = audits.some((a) => a.locationId === l.id);
                    const parts = [`Delete "${l.name}"?`];
                    if (usedByTpls.length > 0) {
                      parts.push(
                        `\nIt is on ${usedByTpls.length} audit definition${
                          usedByTpls.length === 1 ? "" : "s"
                        }. It will be removed from those.`,
                      );
                    }
                    if (usedByAudits) {
                      parts.push(
                        "\nPast audit records for this location will be kept for history.",
                      );
                    }
                    if (confirm(parts.join(""))) deleteLocation(l.id);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-sm border border-border bg-background text-fail hover:bg-muted"
                  title="Delete"
                  aria-label="Delete location"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

function LocationForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Location;
  onSave: (name: string, address: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const canSave = name.trim().length > 0;

  return (
    <div className="space-y-3">
      <div>
        <label className="font-mono block text-[10px] uppercase tracking-widest text-muted-foreground">
          Display name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Camps Bay"
          className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ink"
        />
      </div>
      <div>
        <label className="font-mono block text-[10px] uppercase tracking-widest text-muted-foreground">
          Physical address
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, area, city, postcode"
          rows={2}
          className="mt-1 w-full resize-y rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ink"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="font-display flex items-center gap-1 rounded-sm border border-border px-3 py-2 text-xs font-bold uppercase tracking-widest"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave(name.trim(), address.trim())}
          className="font-display rounded-sm bg-ink px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ---------------- Brand & display ----------------

function BrandSection() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  const [groupName, setGroupName] = useState(settings.groupName);
  const [brandMark, setBrandMark] = useState(settings.brandMark);
  const [dateFormat, setDateFormat] = useState<DateFormat>(settings.dateFormat);
  const [saved, setSaved] = useState(false);

  const dirty = useMemo(
    () =>
      groupName !== settings.groupName ||
      brandMark !== settings.brandMark ||
      dateFormat !== settings.dateFormat,
    [groupName, brandMark, dateFormat, settings],
  );

  const save = () => {
    updateSettings({
      groupName: groupName.trim() || "Hudson's Compliance",
      brandMark: (brandMark.trim().slice(0, 1) || "H").toUpperCase(),
      dateFormat,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-4 py-3.5">
        <h2 className="font-display text-lg font-semibold text-foreground">Brand &amp; display</h2>
        <p className="text-[13px] text-muted-foreground">
          Group name, brand mark and how dates are shown across the app.
        </p>
      </header>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="font-mono block text-[10px] uppercase tracking-widest text-muted-foreground">
              Group name
            </label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="font-mono block text-[10px] uppercase tracking-widest text-muted-foreground">
              Brand mark
            </label>
            <input
              value={brandMark}
              onChange={(e) => setBrandMark(e.target.value.slice(0, 1).toUpperCase())}
              maxLength={1}
              className="mt-1 w-16 rounded-sm border border-border bg-background px-3 py-2 text-center font-display text-lg font-bold uppercase text-foreground outline-none focus:border-ink"
            />
          </div>
        </div>

        <div>
          <span className="font-mono block text-[10px] uppercase tracking-widest text-muted-foreground">
            Date format
          </span>
          <div className="mt-2 flex gap-2">
            {(
              [
                { id: "uk", label: "UK", example: "31/12/2026" },
                { id: "us", label: "US", example: "12/31/2026" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDateFormat(opt.id)}
                className={`flex-1 rounded-sm border px-3 py-2 text-left text-sm transition-colors ${
                  dateFormat === opt.id
                    ? "border-ink bg-muted"
                    : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <span className="font-display block text-xs font-bold uppercase tracking-widest">
                  {opt.label}
                </span>
                <span className="text-[13px] text-muted-foreground">{opt.example}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-pass">
              Saved
            </span>
          )}
          <button
            disabled={!dirty}
            onClick={save}
            className="font-display rounded-sm bg-ink px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper disabled:opacity-40"
          >
            Save changes
          </button>
        </div>
      </div>
    </section>
  );
}