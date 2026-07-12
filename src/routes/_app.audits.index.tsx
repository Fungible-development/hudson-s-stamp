import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPinOff } from "lucide-react";
import { useStore, useVisibleAudits, useVisibleTemplates } from "@/lib/store";
import { ClientDate } from "@/components/client-date";
import type { Schedule } from "@/lib/mock/types";

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
  const recent = [...submitted].sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());
  const flagged = recent.filter((a) => a.responses.some((r) => r.status === "fail"));
  const offsite = recent.filter((a) => a.offSite);

  const list = tab === "flagged" ? flagged : tab === "offsite" ? offsite : recent;

  const tplName = (id: string) => allTemplates.find((t) => t.id === id)?.name ?? id;
  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display mb-5 text-3xl font-semibold text-foreground">Audits</h1>

      <section className="mb-7">
        {templates.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-foreground">No templates available for this location.</p>
            <Link
              to="/templates/new"
              className="mt-3 inline-flex rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-paper"
            >
              Build a template →
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            {templates.map((t, i) => (
              <Link
                key={t.id}
                to="/audits/run/$id"
                params={{ id: t.id }}
                search={{ location: t.locationIds[0] ?? "loc-gardens" }}
                className={`flex items-center gap-3.5 p-4 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-foreground">{t.name}</p>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{scheduleLabel[t.schedule]}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-paper">Start</span>
              </Link>
            ))}
          </div>
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
              ? "Recent"
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
                  : "No audits yet — run your first one from above."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((a) => {
              const failCount = a.responses.filter((r) => r.status === "fail").length;
              return (
                <li key={a.id} className="flex items-center gap-3.5 p-3.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${failCount > 0 ? "bg-fail" : "bg-pass"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{tplName(a.templateId)}</p>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {locName(a.locationId)} · {a.submittedAt ? <ClientDate value={a.submittedAt} /> : "in progress"}
                      {a.offSite && " · off-site"}
                      {failCount > 0 && ` · ${failCount} flag${failCount === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  {a.offSite && <MapPinOff className="h-4 w-4 shrink-0 text-flag" />}
                  <Link
                    to="/audits/$id"
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
    </div>
  );
}
