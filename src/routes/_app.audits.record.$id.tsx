import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPinOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { ClientDate } from "@/components/client-date";

export const Route = createFileRoute("/_app/audits/record/$id")({
  head: () => ({ meta: [{ title: "Audit record — Hudson's Compliance" }] }),
  component: AuditRecord,
});

function AuditRecord() {
  const { id } = Route.useParams();
  const audit = useStore((s) => s.audits.find((a) => a.id === id));
  const template = useStore((s) =>
    audit ? s.templates.find((t) => t.id === audit.templateId) : undefined,
  );
  const location = useStore((s) =>
    audit ? s.locations.find((l) => l.id === audit.locationId) : undefined,
  );

  if (!audit) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="font-medium">Audit record not found.</p>
        <Link
          to="/audits"
          className="font-display mt-4 inline-flex rounded-sm bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-paper"
        >
          Back to audits
        </Link>
      </div>
    );
  }

  const fails = audit.responses.filter((r) => r.status === "fail");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {location?.name ?? audit.locationId}
      </p>
      <h1 className="font-display text-2xl font-semibold text-foreground">
        {template?.name ?? "Audit"}
      </h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {audit.submittedAt ? (
          <>
            Submitted <ClientDate value={audit.submittedAt} />
          </>
        ) : (
          "In progress"
        )}
        {audit.offSite && " · off-site"}
      </p>

      {audit.offSite && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-flag/40 bg-flag/10 p-3 text-[13px] text-foreground">
          <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-flag" />
          <p>Flagged off-site — reviewer should confirm.</p>
        </div>
      )}

      {fails.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-fail">
            {fails.length} flag{fails.length === 1 ? "" : "s"}
          </h2>
          <ul className="mt-2 space-y-2">
            {fails.map((r) => {
              const item = template?.sections
                .flatMap((s) => s.items)
                .find((i) => i.id === r.itemId);
              return (
                <li
                  key={r.itemId}
                  className="rounded-lg border border-fail/40 bg-fail/5 p-3 text-sm"
                >
                  <p className="font-medium text-foreground">{item?.label ?? r.itemId}</p>
                  {r.note && (
                    <p className="mt-1 text-[13px] text-muted-foreground">“{r.note}”</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-6 space-y-4">
        {template?.sections.map((sec) => (
          <section key={sec.id} className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
              {sec.name}
            </h2>
            <ul className="mt-2 divide-y divide-border">
              {sec.items.map((it) => {
                const r = audit.responses.find((x) => x.itemId === it.id);
                const label =
                  r?.status === "pass"
                    ? "Pass"
                    : r?.status === "fail"
                      ? "Fail"
                      : r?.status === "na"
                        ? "N/A"
                        : "—";
                const cls =
                  r?.status === "pass"
                    ? "bg-pass text-paper"
                    : r?.status === "fail"
                      ? "bg-fail text-paper"
                      : "bg-muted text-foreground";
                return (
                  <li key={it.id} className="flex items-start gap-3 py-2">
                    <span
                      className={`font-mono mt-0.5 rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-widest ${cls}`}
                    >
                      {label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{it.label}</p>
                      {r?.note && (
                        <p className="mt-0.5 text-[13px] text-muted-foreground">{r.note}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-6">
        <Link
          to="/audits"
          className="font-display inline-flex rounded-sm border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
        >
          Back to audits
        </Link>
      </div>
    </div>
  );
}