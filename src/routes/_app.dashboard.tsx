import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientDate } from "@/components/client-date";
import {
  findItemLabel,
  selectCompletedToday,
  selectDueToday,
  selectOffSite,
  selectRecentFlagged,
  useStore,
  useVisibleAudits,
  useVisibleTemplates,
} from "@/lib/store";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Hudson's Compliance" },
      { name: "description", content: "Today's due audits, flagged items, and off-site records." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const locations = useStore((s) => s.locations);
  const locFilter = useStore((s) => s.activeLocationId);
  const templates = useVisibleTemplates();
  const audits = useVisibleAudits();
  const allTemplates = useStore((s) => s.templates);

  const due = selectDueToday(templates, audits, locations, locFilter);
  const completedToday = selectCompletedToday(audits);
  const flagged = selectRecentFlagged(audits, 7);
  const offSite = selectOffSite(audits, 30);

  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  const tplName = (id: string) => allTemplates.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <p className="text-sm text-muted-foreground">
          <ClientDate mode="today-long" fallback="—" />
        </p>
        <h1 className="font-display truncate text-3xl font-semibold text-foreground">Today</h1>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Tile to="/audits" label="Due today" count={due.length} valueClassName="text-foreground" />
        <Tile to="/audits" label="Completed" count={completedToday.length} valueClassName="text-pass" />
        <Tile to="/audits" label="Open flags" count={flagged.length} valueClassName="text-fail" />
        <Tile to="/audits" label="Off-site" count={offSite.length} valueClassName="text-flag" />
      </div>

      <section className="mt-7">
        <p className="mb-2.5 text-[15px] font-medium text-foreground">Flagged items</p>
        <div className="rounded-lg border border-border bg-card">
          {flagged.length === 0 ? (
            <EmptyState
              title="No flagged items in the last 7 days."
              hint="Everything's stamped clean. Keep it that way."
              cta={{ to: "/audits", label: "Run an audit" }}
            />
          ) : (
            <ul className="divide-y divide-border">
              {flagged.map((f) => (
                <li key={`${f.auditId}-${f.itemId}`} className="flex items-start gap-3 p-3.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fail" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{findItemLabel(allTemplates, f.itemId)}</p>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {tplName(f.templateId)} · {locName(f.locationId)} · <ClientDate value={f.submittedAt} />
                    </p>
                    {f.note && <p className="mt-1 text-sm text-muted-foreground">"{f.note}"</p>}
                  </div>
                  <Link
                    to="/audits/record/$id"
                    params={{ id: f.auditId }}
                    className="shrink-0 self-center text-[13px] text-muted-foreground hover:text-foreground"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-7">
        <p className="mb-2.5 text-[15px] font-medium text-foreground">Due today</p>
        <div className="rounded-lg border border-border bg-card">
          {due.length === 0 ? (
            <EmptyState
              title="No audits are outstanding for this view."
              hint="Switch locations in the top bar to see other kitchens."
            />
          ) : (
            <ul className="divide-y divide-border">
              {due.map((d) => (
                <li key={`${d.templateId}-${d.locationId}`} className="flex items-center gap-3 p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{tplName(d.templateId)}</p>
                    <p className="truncate text-[13px] text-muted-foreground">{locName(d.locationId)}</p>
                  </div>
                  <Link
                    to="/audits/$id/run"
                    params={{ id: d.templateId }}
                    search={{ location: d.locationId }}
                    className="shrink-0 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-paper"
                  >
                    Start
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Tile({
  to,
  label,
  count,
  valueClassName,
}: {
  to: string;
  label: string;
  count: number;
  valueClassName: string;
}) {
  return (
    <Link to={to} className="flex flex-col justify-between rounded-lg border border-border bg-card p-3.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={`mt-1.5 text-[26px] font-medium tabular-nums ${valueClassName}`}>{count}</span>
    </Link>
  );
}

function EmptyState({ title, hint, cta }: { title: string; hint: string; cta?: { to: string; label: string } }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      {cta && (
        <Link to={cta.to} className="mt-4 inline-flex rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-paper">
          {cta.label} →
        </Link>
      )}
    </div>
  );
}
