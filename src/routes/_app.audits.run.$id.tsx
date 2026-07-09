import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPinOff, MinusCircle, XCircle } from "lucide-react";
import { checkLocation } from "@/lib/geo";
import type { AuditResponse, OffSiteReason, ResponseStatus } from "@/lib/mock/types";
import { useStore } from "@/lib/store";

type Search = { location: string };

export const Route = createFileRoute("/_app/audits/run/$id")({
  head: () => ({ meta: [{ title: "Run audit — Hudson's Compliance" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    location: String(s.location ?? "loc-gardens"),
  }),
  component: RunAudit,
});

function RunAudit() {
  const { id: templateId } = Route.useParams();
  const { location: locationId } = Route.useSearch();
  const navigate = useNavigate();

  const template = useStore((s) => s.templates.find((t) => t.id === templateId));
  const location = useStore((s) => s.locations.find((l) => l.id === locationId));
  const startAudit = useStore((s) => s.startAudit);
  const saveResponse = useStore((s) => s.saveResponse);
  const submitAudit = useStore((s) => s.submitAudit);

  const [auditId, setAuditId] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<"checking" | "onsite" | "offsite">("checking");
  const [offSiteReason, setOffSiteReason] = useState<OffSiteReason | undefined>();
  const [responses, setResponses] = useState<Record<string, AuditResponse>>({});

  // Kick off GPS + create audit once
  useEffect(() => {
    if (!template || !location) return;
    let cancelled = false;
    (async () => {
      const res = await checkLocation(location);
      if (cancelled) return;
      const onSite = res.onSite;
      const reason = onSite ? undefined : res.reason;
      setGeoStatus(onSite ? "onsite" : "offsite");
      setOffSiteReason(reason);
      const id = startAudit(templateId, locationId, !onSite, reason);
      setAuditId(id);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, locationId]);

  const allItems = useMemo(
    () => template?.sections.flatMap((s) => s.items) ?? [],
    [template],
  );
  const stamped = Object.keys(responses).length;
  const total = allItems.length;

  const canSubmit =
    stamped === total &&
    allItems.every((it) => {
      const r = responses[it.id];
      if (!r) return false;
      const noteNeeded = it.requiresNote || r.status === "fail";
      return noteNeeded ? !!r.note?.trim() : true;
    });

  if (!template || !location) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="font-medium">Template or location not found.</p>
        <button
          onClick={() => navigate({ to: "/audits" })}
          className="font-display mt-4 rounded-sm bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-paper"
        >
          Back to audits
        </button>
      </div>
    );
  }

  const stamp = (itemId: string, status: ResponseStatus) => {
    setResponses((prev) => {
      const next: AuditResponse = { itemId, status, note: prev[itemId]?.note };
      const updated = { ...prev, [itemId]: next };
      if (auditId) saveResponse(auditId, next);
      return updated;
    });
  };
  const setNote = (itemId: string, note: string) => {
    setResponses((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const next = { ...existing, note };
      if (auditId) saveResponse(auditId, next);
      return { ...prev, [itemId]: next };
    });
  };

  const handleSubmit = () => {
    if (!auditId || !canSubmit) return;
    submitAudit(auditId);
    navigate({ to: "/audits/$id", params: { id: auditId } });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {template.schedule} · {location.name}
        </p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          {template.name}
        </h1>
      </div>

      {geoStatus === "checking" && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-steel" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Verifying location…
          </span>
        </div>
      )}
      {geoStatus === "onsite" && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-pass/40 bg-pass/10 px-3 py-2 text-sm text-pass">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-mono text-[11px] uppercase tracking-widest">
            On-site at {location.name}
          </span>
        </div>
      )}
      {geoStatus === "offsite" && (
        <div className="mb-4 flex items-start gap-2 rounded-sm border border-flag/50 bg-flag/10 px-3 py-2 text-sm">
          <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-flag" />
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest text-flag">
              Recorded off-site — an admin will review
            </p>
            <p className="text-xs text-muted-foreground">
              {offSiteReason === "denied"
                ? "Location permission denied."
                : offSiteReason === "out_of_range"
                  ? "You're outside the assigned radius. Continue anyway."
                  : "Location unavailable. Continue anyway."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {template.sections.map((sec) => (
          <section key={sec.id} className="rounded-sm border border-border bg-card">
            <header className="border-b border-border bg-muted/50 px-4 py-2">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest">
                {sec.name}
              </h2>
            </header>
            <ul className="divide-y divide-border">
              {sec.items.map((item) => {
                const r = responses[item.id];
                const needNote = item.requiresNote || r?.status === "fail";
                return (
                  <li key={item.id} className="p-4">
                    <p className="font-medium">{item.label || <span className="italic text-muted-foreground">(unnamed item)</span>}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StampBtn
                        active={r?.status === "pass"}
                        onClick={() => stamp(item.id, "pass")}
                        color="pass"
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Pass"
                      />
                      <StampBtn
                        active={r?.status === "fail"}
                        onClick={() => stamp(item.id, "fail")}
                        color="fail"
                        icon={<XCircle className="h-4 w-4" />}
                        label="Fail"
                      />
                      <StampBtn
                        active={r?.status === "na"}
                        onClick={() => stamp(item.id, "na")}
                        color="steel"
                        icon={<MinusCircle className="h-4 w-4" />}
                        label="N/A"
                      />
                    </div>
                    {r && needNote && (
                      <div className="mt-3">
                        <label className="font-mono block text-[10px] uppercase tracking-widest text-muted-foreground">
                          Note {item.requiresNote ? "required" : "required for fails"}
                        </label>
                        <textarea
                          value={r.note ?? ""}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          rows={2}
                          className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          placeholder="What did you observe?"
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="sticky bottom-16 z-30 mt-6 flex items-center gap-3 rounded-sm border border-border bg-background/95 p-3 shadow-sm backdrop-blur md:bottom-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Progress
          </p>
          <p className="font-display text-lg font-bold tabular-nums">
            {stamped} / {total} stamped
          </p>
        </div>
        {!canSubmit && stamped === total && (
          <span className="font-mono flex items-center gap-1 text-[10px] uppercase tracking-widest text-flag">
            <AlertTriangle className="h-3 w-3" /> Notes required
          </span>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="font-display shrink-0 rounded-sm bg-ink px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-paper disabled:opacity-40"
        >
          Submit audit
        </button>
      </div>
    </div>
  );
}

function StampBtn({
  active,
  onClick,
  color,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  color: "pass" | "fail" | "steel";
  icon: React.ReactNode;
  label: string;
}) {
  const colorClasses =
    color === "pass"
      ? "border-pass text-pass"
      : color === "fail"
        ? "border-fail text-fail"
        : "border-steel text-steel";
  const activeClasses =
    color === "pass"
      ? "bg-pass text-paper border-pass"
      : color === "fail"
        ? "bg-fail text-paper border-fail"
        : "bg-steel text-paper border-steel";
  return (
    <button
      onClick={onClick}
      className={`font-display flex items-center gap-1.5 rounded-sm border-2 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-none ${
        active ? `${activeClasses} stamp-in` : `bg-background ${colorClasses}`
      }`}
    >
      {icon}
      {label}
    </button>
  );
}