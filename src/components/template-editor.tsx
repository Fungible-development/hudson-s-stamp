import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { AuditSection, Schedule, Template } from "@/lib/mock/types";
import { useStore } from "@/lib/store";

const uid = (p: string) =>
  `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

type Draft = {
  name: string;
  schedule: Schedule;
  locationIds: string[];
  sections: AuditSection[];
};

export function TemplateEditor({
  initial,
  onSave,
  onCancel,
  saveLabel = "Save template",
}: {
  initial?: Template;
  onSave: (draft: Draft) => void;
  onCancel: () => void;
  saveLabel?: string;
}) {
  const locations = useStore((s) => s.locations);
  const [draft, setDraft] = useState<Draft>(() => ({
    name: initial?.name ?? "",
    schedule: initial?.schedule ?? "daily",
    locationIds: initial?.locationIds ?? [locations[0]?.id].filter(Boolean) as string[],
    sections:
      initial?.sections ?? [
        { id: uid("sec"), name: "New section", items: [{ id: uid("itm"), label: "", requiresNote: false }] },
      ],
  }));

  const canSave = draft.name.trim().length > 0 && draft.locationIds.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-border bg-card p-4">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Name</span>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. Chef Audit"
            className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Schedule</span>
            <select
              value={draft.schedule}
              onChange={(e) => setDraft({ ...draft, schedule: e.target.value as Schedule })}
              className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="as_needed">As needed</option>
            </select>
          </label>

          <fieldset>
            <legend className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Locations
            </legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {locations.map((l) => {
                const on = draft.locationIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        locationIds: on
                          ? draft.locationIds.filter((x) => x !== l.id)
                          : [...draft.locationIds, l.id],
                      })
                    }
                    className={`rounded-sm border px-3 py-1.5 text-sm ${
                      on
                        ? "border-ink bg-ink text-paper"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </div>

      <div className="space-y-4">
        {draft.sections.map((sec, sIdx) => (
          <div key={sec.id} className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <input
                value={sec.name}
                onChange={(e) => {
                  const sections = [...draft.sections];
                  sections[sIdx] = { ...sec, name: e.target.value };
                  setDraft({ ...draft, sections });
                }}
                className="font-display flex-1 rounded-sm border border-transparent bg-transparent px-2 py-1 text-lg font-bold uppercase tracking-wide hover:border-border focus:border-border focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    sections: draft.sections.filter((s) => s.id !== sec.id),
                  })
                }
                className="grid h-8 w-8 place-items-center rounded-sm border border-border hover:bg-muted"
                title="Remove section"
              >
                <Trash2 className="h-4 w-4 text-fail" />
              </button>
            </div>

            <ul className="mt-3 space-y-2">
              {sec.items.map((item, iIdx) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2"
                >
                  <input
                    value={item.label}
                    placeholder="Item label"
                    onChange={(e) => {
                      const sections = [...draft.sections];
                      const items = [...sec.items];
                      items[iIdx] = { ...item, label: e.target.value };
                      sections[sIdx] = { ...sec, items };
                      setDraft({ ...draft, sections });
                    }}
                    className="min-w-0 rounded-sm border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                  />
                  <label className="font-mono flex shrink-0 items-center gap-1.5 rounded-sm border border-border px-2 py-1.5 text-[10px] uppercase tracking-widest">
                    <input
                      type="checkbox"
                      checked={item.requiresNote}
                      onChange={(e) => {
                        const sections = [...draft.sections];
                        const items = [...sec.items];
                        items[iIdx] = { ...item, requiresNote: e.target.checked };
                        sections[sIdx] = { ...sec, items };
                        setDraft({ ...draft, sections });
                      }}
                    />
                    Note required
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const sections = [...draft.sections];
                      sections[sIdx] = {
                        ...sec,
                        items: sec.items.filter((x) => x.id !== item.id),
                      };
                      setDraft({ ...draft, sections });
                    }}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-border hover:bg-muted"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4 text-fail" />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                const sections = [...draft.sections];
                sections[sIdx] = {
                  ...sec,
                  items: [...sec.items, { id: uid("itm"), label: "", requiresNote: false }],
                };
                setDraft({ ...draft, sections });
              }}
              className="font-mono mt-3 inline-flex items-center gap-1 rounded-sm border border-dashed border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" /> Add item
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              sections: [
                ...draft.sections,
                { id: uid("sec"), name: "New section", items: [] },
              ],
            })
          }
          className="font-display flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-card px-3 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted"
        >
          <Plus className="h-4 w-4" /> Add section
        </button>
      </div>

      <div className="sticky bottom-16 flex items-center justify-end gap-2 border-t border-border bg-background/95 py-3 backdrop-blur md:bottom-0">
        <button
          type="button"
          onClick={onCancel}
          className="font-display rounded-sm border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave(draft)}
          className="font-display rounded-sm bg-ink px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper disabled:opacity-40"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}