import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPinOff } from "lucide-react";
import { checkLocation } from "@/lib/geo";
import type { AuditResponse, OffSiteReason, ResponseStatus, Schedule } from "@/lib/mock/types";
import { useStore } from "@/lib/store";

type Search = { location: string };

const scheduleLabel: Record<Schedule, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  as_needed: "As needed",
};

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

  const allItems = useMemo(() => template?.sections.flatMap((s) => s.items) ?? [], [template]);
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
        <p className="text-sm text-foreground">Template or location not found.</p>
        <button
          onClick={() => navigate({ to: "/audits" })}
          className="mt-4 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-paper"
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
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <p className="text-sm text-muted-foreground">{location.name}</p>
        <h1 className="font-display text-[28px] font-semibold text-foreground">{template.name}</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{scheduleLabel[template.schedule]}</p>
      </div>

      {geoStatus === "checking" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-steel" />
          Verifying location…
        </div>
      )}
      {geoStatus === "onsite" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-pass/30 bg-pass/10 px-3.5 py-2.5 text-sm text-pass">
          <CheckCircle2 className="h-4 w-4" />
          On-site at {location.name}
        </div>
      )}
      {geoStatus === "offsite" && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-flag/30 bg-flag/10 px-3.5 py-2.5 text-sm">
          <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-flag" />
          <div className="min-w-0">
            <p className="text-flag">Recorded off-site — an admin will review</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {offSiteReason === "denied"
                ? "Location permission denied."
                : offSiteReason === "out_of_range"
                  ? "You're outside the assigned radius. Continue anyway."
                  : "Location unavailable. Continue anyway."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {template.sections.map((sec) => (
          <section key={sec.id}>
            <p className="mb-2.5 text-[15px] font-medium text-foreground">{sec.name}</p>
            <div className="rounded-lg border border-border bg-card">
              {sec.items.map((item, i) => {
                const r = responses[item.id];
                const needNote = item.requiresNote || r?.status === "fail";
                return (
                  <div key={item.id} className={`p-4 ${i > 0 ? "border-t border-border" : ""}`}>
                    <p className="mb-2.5 text-sm text-foreground">
                      {item.label || <span className="italic text-muted-foreground">(unnamed item)</span>}
                    </p>
                    <div className="flex gap-2">
                      <StampBtn
                        active={r?.status === "pass"}
                        onClick={() => stamp(item.id, "pass")}
                        color="pass"
                        label="Pass"
                      />
                      <StampBtn
                        active={r?.status === "fail"}
                        onClick={() => stamp(item.id, "fail")}
                        color="fail"
                        label="Fail"
                      />
                      <StampBtn
                        active={r?.status === "na"}
                        onClick={() => stamp(item.id, "na")}
                        color="steel"
                        label="N/a"
                      />
                    </div>
                    {r && needNote && (
                      <textarea
                        value={r.note ?? ""}
                        onChange={(e) => setNote(item.id, e.target.value)}
                        rows={2}
                        className="mt-2.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Add a note"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-16 z-30 mt-6 flex items-center gap-3 rounded-lg border border-border bg-background/95 p-3 shadow-sm backdrop-blur md:bottom-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-muted-foreground">
            {stamped} of {total} done
          </p>
          {!canSubmit && stamped === total && (
            <p className="flex items-center gap-1 text-[13px] text-flag">
              <AlertTriangle className="h-3 w-3" /> Notes required
            </p>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="shrink-0 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper disabled:opacity-40"
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
  label,
}: {
  active: boolean;
  onClick: () => void;
  color: "pass" | "fail" | "steel";
  label: string;
}) {
  const activeClasses =
    color === "pass"
      ? "bg-pass/10 border-pass text-pass font-medium"
      : color === "fail"
        ? "bg-fail/10 border-fail text-fail font-medium"
        : "bg-steel/10 border-steel text-steel font-medium";
  const idleClasses =
    color === "pass"
      ? "border-border text-pass"
      : color === "fail"
        ? "border-border text-fail"
        : "border-border text-muted-foreground";
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg border px-3 py-2 text-[13px] ${active ? activeClasses : idleClasses}`}
    >
      {label}
    </button>
  );
}
