import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPinOff, Play } from "lucide-react";
import { useStore, useVisibleAudits, useVisibleTemplates } from "@/lib/store";

export const Route = createFileRoute("/_app/audits/")({
  head: () => ({
    meta: [
      { title: "Audits — Hudson's Compliance" },
      { name: "description", content: "Run audits and review recent records." },
    ],
  }),
  component: AuditsIndex,
});

type Tab = "recent" | "flagged" | "offsite";

function AuditsIndex() {
  const audits = useVisibleAudits();
  const templates = useVisibleTemplates();
  const locations = useStore((s) => s.locations);
  const allTemplates = useStore((s) => s.templates);
  const [tab, setTab] = useState<Tab>("recent");

  const submitted = audits.filter((a) => a.submittedAt);
  const recent = [...submitted].sort(
    (a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime(),
  );
  const flagged = recent.filter((a) => a.responses.some((r) => r.status === "fail"));
  const offsite = recent.filter((a) => a.offSite);

  const list = tab === "flagged" ? flagged : tab === "offsite" ? offsite : recent;

  const tplName = (id: string) => allTemplates.find((t) => t.id === id)?.name ?? id;
  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display mb-6 text-3xl font-bold uppercase tracking-wide">
        Audits
      </h1>

      <section className="mb-8">
        <h2 className="font-mono mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Start an audit
        </h2>
        {templates.length === 0 ? (
          <div className="rounded-sm border border-border bg-card p-6 text-center">
            <p className="font-medium">No templates available for this location.</p>
            <Link
              to="/templates/new"
              className="font-display mt-3 inline-flex rounded-sm bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-paper"
            >
              Build a template →
            </Link>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Link
                key={t.id}
                to="/audits/run/$id"
                params={{ id: t.id }}
                search={{ location: t.locationIds[0] ?? "loc-gardens" }}
                className="group flex items-center gap-3 rounded-sm border border-border bg-card p-4 hover:border-ink"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.name}</p>
                  <p className="font-mono mt-0.5 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t.schedule} · {t.sections.reduce((n, s) => n + s.items.length, 0)} items
                  </p>
                </div>
                <Play className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-ink" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mb-3 flex gap-1 border-b border-border">
        {(["recent", "flagged", "offsite"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-display -mb-px border-b-2 px-3 py-2 text-xs font-bold uppercase tracking-widest ${
              tab === t
                ? "border-ink text-ink"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {t === "recent" ? "Recent" : t === "flagged" ? `Flagged (${flagged.length})` : `Off-site (${offsite.length})`}
          </button>
        ))}
      </div>

      <div className="rounded-sm border border-border bg-card">
        {list.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium">
              {tab === "flagged"
                ? "No flagged audits — kitchens are clean."
                : tab === "offsite"
                  ? "No off-site audits recorded."
                  : "No audits yet — run your first one from above."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((a) => {
              const failCount = a.responses.filter((r) => r.status === "fail").length;
              return (
                <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tplName(a.templateId)}</p>
                    <p className="font-mono mt-0.5 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                      {a.id} · {locName(a.locationId)} ·{" "}
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "in progress"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {a.offSite && (
                      <span className="font-mono flex items-center gap-1 rounded-sm border border-flag/60 bg-flag/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-flag">
                        <MapPinOff className="h-3 w-3" /> off-site
                      </span>
                    )}
                    {failCount > 0 && (
                      <span className="font-mono rounded-sm border border-fail/60 bg-fail/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-fail">
                        {failCount} flag{failCount === 1 ? "" : "s"}
                      </span>
                    )}
                    <Link
                      to="/audits/$id"
                      params={{ id: a.id }}
                      className="font-mono rounded-sm border border-border px-2 py-1 text-[10px] uppercase tracking-widest hover:bg-muted"
                    >
                      View
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}