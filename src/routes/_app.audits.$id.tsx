import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, MapPinOff, MinusCircle, XCircle } from "lucide-react";
import type { ResponseStatus } from "@/lib/mock/types";
import { useStore } from "@/lib/store";
import { ClientDate } from "@/components/client-date";

export const Route = createFileRoute("/_app/audits/$id")({
  head: () => ({ meta: [{ title: "Audit record — Hudson's Compliance" }] }),
  component: AuditDetail,
});

function AuditDetail() {
  const { id } = Route.useParams();
  const audit = useStore((s) => s.audits.find((a) => a.id === id));
  const templates = useStore((s) => s.templates);
  const locations = useStore((s) => s.locations);

  if (!audit) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="font-medium">Audit not found.</p>
        <Link
          to="/audits"
          className="font-display mt-4 inline-flex rounded-sm bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-paper"
        >
          Back to audits
        </Link>
      </div>
    );
  }

  const template = templates.find((t) => t.id === audit.templateId);
  const location = locations.find((l) => l.id === audit.locationId);
  const byId = new Map(audit.responses.map((r) => [r.itemId, r]));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {audit.id}
      </p>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        {template?.name ?? "Audit"}
      </h1>
      <p className="font-mono mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
        {location?.name ?? audit.locationId} ·{" "}
        {audit.submittedAt ? <ClientDate value={audit.submittedAt} /> : "in progress"}
      </p>

      {audit.offSite && (
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-flag/50 bg-flag/10 px-3 py-2 text-sm text-flag">
          <MapPinOff className="h-4 w-4" />
          <span className="font-mono text-[11px] uppercase tracking-widest">
            Off-site · {audit.offSiteReason ?? "unknown"}
          </span>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {template?.sections.map((sec) => (
          <section key={sec.id} className="rounded-sm border border-border bg-card">
            <header className="border-b border-border bg-muted/50 px-4 py-2">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest">
                {sec.name}
              </h2>
            </header>
            <ul className="divide-y divide-border">
              {sec.items.map((item) => {
                const r = byId.get(item.id);
                return (
                  <li key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 p-4">
                    <StatusChip status={r?.status} />
                    <div className="min-w-0">
                      <p className="font-medium">{item.label}</p>
                      {r?.note && (
                        <p className="mt-1 text-sm text-muted-foreground">“{r.note}”</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status?: ResponseStatus }) {
  if (!status) {
    return (
      <span className="font-mono grid h-6 w-14 place-items-center rounded-sm border border-border text-[10px] uppercase tracking-widest text-muted-foreground">
        —
      </span>
    );
  }
  if (status === "pass")
    return (
      <span className="font-mono flex h-6 w-14 items-center justify-center gap-1 rounded-sm bg-pass text-[10px] font-bold uppercase tracking-widest text-paper">
        <CheckCircle2 className="h-3 w-3" /> Pass
      </span>
    );
  if (status === "fail")
    return (
      <span className="font-mono flex h-6 w-14 items-center justify-center gap-1 rounded-sm bg-fail text-[10px] font-bold uppercase tracking-widest text-paper">
        <XCircle className="h-3 w-3" /> Fail
      </span>
    );
  return (
    <span className="font-mono flex h-6 w-14 items-center justify-center gap-1 rounded-sm bg-steel text-[10px] font-bold uppercase tracking-widest text-paper">
      <MinusCircle className="h-3 w-3" /> N/A
    </span>
  );
}