import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, ClipboardList, MapPinOff } from "lucide-react";
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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <ClientDate mode="today-long" fallback="—" />
          </p>
          <h1 className="font-display truncate text-3xl font-bold uppercase tracking-wide">
            Today&apos;s deck
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile
          to="/audits"
          label="Due today"
          count={due.length}
          icon={ClipboardList}
          accent="ink"
        />
        <Tile
          to="/audits"
          label="Completed today"
          count={completedToday.length}
          icon={CheckCircle2}
          accent="pass"
        />
        <Tile
          to="/audits"
          label="Open flags · 7d"
          count={flagged.length}
          icon={AlertTriangle}
          accent="fail"
        />
        <Tile
          to="/audits"
          label="Off-site · 30d"
          count={offSite.length}
          icon={MapPinOff}
          accent="flag"
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">
            Recent flagged items
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            last 7 days
          </span>
        </div>

        <div className="rounded-sm border border-border bg-card">
          {flagged.length === 0 ? (
            <EmptyState
              title="No flagged items in the last 7 days."
              hint="Everything's stamped clean. Keep it that way."
              cta={{ to: "/audits", label: "Run an audit" }}
            />
          ) : (
            <ul className="divide-y divide-border">
              {flagged.map((f) => (
                <li key={`${f.auditId}-${f.itemId}`} className="flex items-start gap-3 p-4">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-fail" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {findItemLabel(allTemplates, f.itemId)}
                    </p>
                    <p className="font-mono mt-0.5 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                      {tplName(f.templateId)} · {locName(f.locationId)} ·{" "}
                      <ClientDate value={f.submittedAt} />
                    </p>
                    {f.note && <p className="mt-1 text-sm text-muted-foreground">“{f.note}”</p>}
                  </div>
                  <Link
                    to="/audits/$id"
                    params={{ id: f.auditId }}
                    className="font-mono shrink-0 self-center rounded-sm border border-border px-2 py-1 text-[10px] uppercase tracking-widest hover:bg-muted"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">
            Due today
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            daily audits
          </span>
        </div>
        <div className="rounded-sm border border-border bg-card">
          {due.length === 0 ? (
            <EmptyState
              title="No daily audits are outstanding for this view."
              hint="Switch locations in the top bar to see other kitchens."
            />
          ) : (
            <ul className="divide-y divide-border">
              {due.map((d) => (
                <li
                  key={`${d.templateId}-${d.locationId}`}
                  className="flex items-center gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tplName(d.templateId)}</p>
                    <p className="font-mono truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                      {locName(d.locationId)} · daily
                    </p>
                  </div>
                  <Link
                    to="/audits/run/$id"
                    params={{ id: d.templateId }}
                    search={{ location: d.locationId }}
                    className="font-display shrink-0 rounded-sm bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-paper"
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
  icon: Icon,
  accent,
}: {
  to: string;
  label: string;
  count: number;
  icon: typeof ClipboardList;
  accent: "ink" | "pass" | "fail" | "flag";
}) {
  const accentBar =
    accent === "pass"
      ? "bg-pass"
      : accent === "fail"
        ? "bg-fail"
        : accent === "flag"
          ? "bg-flag"
          : "bg-ink";
  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between overflow-hidden rounded-sm border border-border bg-card p-4 shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${accentBar}`} />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="font-display mt-3 text-4xl font-bold tabular-nums">
        {count}
      </span>
    </Link>
  );
}

function EmptyState({
  title,
  hint,
  cta,
}: {
  title: string;
  hint: string;
  cta?: { to: string; label: string };
}) {
  return (
    <div className="p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      {cta && (
        <Link
          to={cta.to}
          className="font-display mt-4 inline-flex rounded-sm bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-paper"
        >
          {cta.label} →
        </Link>
      )}
    </div>
  );
}