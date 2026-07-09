import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useStore, useVisibleTemplates } from "@/lib/store";

export const Route = createFileRoute("/_app/templates/")({
  head: () => ({
    meta: [
      { title: "Templates — Hudson's Compliance" },
      { name: "description", content: "Audit templates per location." },
    ],
  }),
  component: TemplatesIndex,
});

function TemplatesIndex() {
  const templates = useVisibleTemplates();
  const locations = useStore((s) => s.locations);
  const duplicate = useStore((s) => s.duplicateTemplate);
  const del = useStore((s) => s.deleteTemplate);
  const locFilter = useStore((s) => s.activeLocationId);
  const navigate = useNavigate();

  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {locFilter === "all" ? "All locations" : locName(locFilter)}
          </p>
          <h1 className="font-display truncate text-3xl font-bold uppercase tracking-wide">
            Templates
          </h1>
        </div>
        <Link
          to="/templates/new"
          className="font-display flex shrink-0 items-center gap-2 rounded-sm bg-ink px-3 py-2 text-xs font-bold uppercase tracking-widest text-paper"
        >
          <Plus className="h-4 w-4" /> New
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-8 text-center">
          <p className="font-medium">No templates for this location yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Build your first template — a section, a few items, and you&apos;re ready.
          </p>
          <Link
            to="/templates/new"
            className="font-display mt-4 inline-flex rounded-sm bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-paper"
          >
            New template →
          </Link>
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-card">
          <ul className="divide-y divide-border">
            {templates.map((t) => {
              const itemCount = t.sections.reduce((n, s) => n + s.items.length, 0);
              return (
                <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 sm:flex">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="font-mono mt-0.5 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                      {t.schedule} · {t.sections.length} sections · {itemCount} items ·{" "}
                      {t.locationIds.map(locName).join(", ")}
                    </p>
                  </div>
                  <div className="col-span-2 flex shrink-0 items-center gap-1 sm:col-auto">
                    <IconBtn
                      title="Run"
                      onClick={() =>
                        navigate({
                          to: "/audits/run/$id",
                          params: { id: t.id },
                          search: { location: t.locationIds[0] ?? "loc-gardens" },
                        })
                      }
                    >
                      <Play className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn title="Edit" onClick={() => navigate({ to: "/templates/$id", params: { id: t.id } })}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn title="Duplicate" onClick={() => duplicate(t.id)}>
                      <Copy className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn
                      title="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${t.name}"?`)) del(t.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-fail" />
                    </IconBtn>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid h-9 w-9 place-items-center rounded-sm border border-border bg-background hover:bg-muted"
    >
      {children}
    </button>
  );
}