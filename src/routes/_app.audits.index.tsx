import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Copy, MapPinOff, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useStore, useVisibleAudits, useVisibleTemplates } from "@/lib/store";
import { ClientDate } from "@/components/client-date";
import type { Schedule, Template } from "@/lib/mock/types";

const scheduleLabel: Record<Schedule, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  as_needed: "As needed",
};

export const Route = createFileRoute("/_app/audits/")({
  head: () => ({
    meta: [
      { title: "Audits — Hudson's Compliance" },
      { name: "description", content: "Manage audit definitions and review recent records." },
    ],
  }),
  component: AuditsIndex,
});

type Tab = "recent" | "flagged" | "offsite";

function AuditsIndex() {
  const templates = useVisibleTemplates();
  const audits = useVisibleAudits();
  const locations = useStore((s) => s.locations);
  const allTemplates = useStore((s) => s.templates);
  const duplicate = useStore((s) => s.duplicateTemplate);
  const del = useStore((s) => s.deleteTemplate);
  const locFilter = useStore((s) => s.activeLocationId);
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("recent");
  const [startFor, setStartFor] = useState<Template | null>(null);

  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  const tplName = (id: string) => allTemplates.find((t) => t.id === id)?.name ?? id;

  const submitted = audits.filter((a) => a.submittedAt);
  const recent = [...submitted].sort(
    (a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime(),
  );
  const flagged = recent.filter((a) => a.responses.some((r) => r.status === "fail"));
  const offsite = recent.filter((a) => a.offSite);
  const list = tab === "flagged" ? flagged : tab === "offsite" ? offsite : recent;

  const startAudit = (t: Template) => {
    if (t.locationIds.length === 1) {
      navigate({
        to: "/audits/$id/run",
        params: { id: t.id },
        search: { location: t.locationIds[0] },
      });
    } else {
      setStartFor(t);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {locFilter === "all" ? "All locations" : locName(locFilter)}
          </p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Audits</h1>
        </div>
        <Link
          to="/audits/new"
          className="font-display flex shrink-0 items-center gap-2 rounded-sm bg-ink px-3 py-2 text-xs font-bold uppercase tracking-widest text-paper"
        >
          <Plus className="h-4 w-4" /> New audit
        </Link>
      </div>

      <section className="mb-8">
        {templates.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-foreground">No audits for this location yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create one — a section, a few items, and you&apos;re ready to run.
            </p>
            <Link
              to="/audits/new"
              className="mt-4 inline-flex rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-paper"
            >
              New audit →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {templates.map((t) => {
              const itemCount = t.sections.reduce((n, s) => n + s.items.length, 0);
              return (
                <li
                  key={t.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 sm:flex"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">{t.name}</p>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {scheduleLabel[t.schedule]} · {t.sections.length} sections · {itemCount} items ·{" "}
                      {t.locationIds.map(locName).join(", ")}
                    </p>
                  </div>
                  <div className="col-span-2 flex shrink-0 items-center gap-1 sm:col-auto">
                    <button
                      onClick={() => startAudit(t)}
                      className="rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-paper"
                    >
                      Start
                    </button>
                    <RowMenu
                      onEdit={() => navigate({ to: "/audits/$id/edit", params: { id: t.id } })}
                      onDuplicate={() => duplicate(t.id)}
                      onDelete={() => {
                        if (confirm(`Delete "${t.name}"?`)) del(t.id);
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mb-2.5 flex gap-4">
        {(["recent", "flagged", "offsite"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-[13px] ${tab === t ? "font-medium text-foreground" : "text-muted-foreground"}`}
          >
            {t === "recent"
              ? `Recent (${recent.length})`
              : t === "flagged"
                ? `Flagged (${flagged.length})`
                : `Off-site (${offsite.length})`}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card">
        {list.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-foreground">
              {tab === "flagged"
                ? "No flagged audits — kitchens are clean."
                : tab === "offsite"
                  ? "No off-site audits recorded."
                  : "No audits recorded yet — run one from above."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((a) => {
              const failCount = a.responses.filter((r) => r.status === "fail").length;
              return (
                <li key={a.id} className="flex items-center gap-3.5 p-3.5">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${failCount > 0 ? "bg-fail" : "bg-pass"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{tplName(a.templateId)}</p>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {locName(a.locationId)} ·{" "}
                      {a.submittedAt ? <ClientDate value={a.submittedAt} /> : "in progress"}
                      {a.offSite && " · off-site"}
                      {failCount > 0 && ` · ${failCount} flag${failCount === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  {a.offSite && <MapPinOff className="h-4 w-4 shrink-0 text-flag" />}
                  <Link
                    to="/audits/record/$id"
                    params={{ id: a.id }}
                    className="shrink-0 text-[13px] text-muted-foreground hover:text-foreground"
                  >
                    View
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {startFor && (
        <StartDialog
          template={startFor}
          onCancel={() => setStartFor(null)}
          onConfirm={(locationId) => {
            const t = startFor;
            setStartFor(null);
            navigate({
              to: "/audits/$id/run",
              params: { id: t.id },
              search: { location: locationId },
            });
          }}
        />
      )}
    </div>
  );
}

function RowMenu({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-muted";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="More"
        aria-label="More actions"
        className="grid h-9 w-9 place-items-center rounded-sm border border-border bg-background hover:bg-muted"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card shadow-md">
          <button
            className={item}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            className={item}
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
          >
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          <button
            className={`${item} text-fail`}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function StartDialog({
  template,
  onCancel,
  onConfirm,
}: {
  template: Template;
  onCancel: () => void;
  onConfirm: (locationId: string) => void;
}) {
  const locations = useStore((s) => s.locations);
  const options = locations.filter((l) => template.locationIds.includes(l.id));
  const [selected, setSelected] = useState(options[0]?.id ?? "");

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {template.name}
        </p>
        <h2 className="font-display mt-1 text-xl font-semibold text-foreground">
          Where are you auditing?
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Pick the location you&apos;re at right now.
        </p>

        <div className="mt-4 space-y-2">
          {options.map((l) => (
            <label
              key={l.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                selected === l.id
                  ? "border-ink bg-muted"
                  : "border-border bg-background hover:bg-muted/40"
              }`}
            >
              <input
                type="radio"
                name="location"
                value={l.id}
                checked={selected === l.id}
                onChange={() => setSelected(l.id)}
                className="accent-ink"
              />
              <span className="min-w-0 flex-1 truncate">{l.name}</span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="font-display rounded-sm border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="font-display rounded-sm bg-ink px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper disabled:opacity-40"
          >
            Start audit
          </button>
        </div>
      </div>
    </div>
  );
}