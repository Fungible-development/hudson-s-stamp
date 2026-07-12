import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, MapPinOff } from "lucide-react";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { checkLocation } from "@/lib/geo";
import type { AuditResponse, OffSiteReason, ResponseStatus } from "@/lib/mock/types";

const searchSchema = z.object({
  location: z.string().optional(),
});

export const Route = createFileRoute("/_app/audits/$id/run")({
  head: () => ({ meta: [{ title: "Run audit — Hudson's Compliance" }] }),
  validateSearch: (raw) => searchSchema.parse(raw),
  component: RunAudit,
});

function RunAudit() {
  const { id } = Route.useParams();
  const { location } = Route.useSearch();
  const navigate = useNavigate();
  const template = useStore((s) => s.templates.find((t) => t.id === id));
  const locations = useStore((s) => s.locations);

  const validLocation = useMemo(() => {
    if (!location || !template) return undefined;
    if (!template.locationIds.includes(location)) return undefined;
    return locations.find((l) => l.id === location);
  }, [location, template, locations]);

  if (!template) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="font-medium">Audit not found.</p>
      </div>
    );
  }

  if (!validLocation) {
    const options = locations.filter((l) => template.locationIds.includes(l.id));
    return (
      <div className="mx-auto w-full max-w-md px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {template.name}
        </p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-foreground">
          Where are you auditing?
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Pick a location to start.
        </p>
        <ul className="mt-4 space-y-2">
          {options.map((l) => (
            <li key={l.id}>
              <button
                onClick={() =>
                  navigate({
                    to: "/audits/$id/run",
                    params: { id: template.id },
                    search: { location: l.id },
                    replace: true,
                  })
                }
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3.5 py-3 text-left text-sm hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {l.name}
                </span>
                <span className="text-[13px] text-muted-foreground">Start →</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <Runner templateId={template.id} location={validLocation} key={validLocation.id} />;
}

function Runner({
  templateId,
  location,
}: {
  templateId: string;
  location: { id: string; name: string; lat: number; lng: number; radiusM: number };
}) {
  const navigate = useNavigate();
  const template = useStore((s) => s.templates.find((t) => t.id === templateId))!;
  const startAudit = useStore((s) => s.startAudit);
  const saveResponse = useStore((s) => s.saveResponse);
  const submitAudit = useStore((s) => s.submitAudit);

  const [auditId, setAuditId] = useState<string | null>(null);
  const [offSite, setOffSite] = useState(false);
  const [offReason, setOffReason] = useState<OffSiteReason | undefined>();
  const [responses, setResponses] = useState<Record<string, AuditResponse>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await checkLocation(location);
      if (cancelled) return;
      const isOff = !res.onSite;
      const reason = res.onSite ? undefined : res.reason;
      setOffSite(isOff);
      setOffReason(reason);
      const id = startAudit(templateId, location.id, isOff, reason);
      setAuditId(id);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = (itemId: string, status: ResponseStatus, requiresNote: boolean) => {
    if (!auditId) return;
    const note = notes[itemId];
    const needsNote = status === "fail" || (requiresNote && status !== "na");
    const res: AuditResponse = { itemId, status, note: needsNote ? note : undefined };
    setResponses((r) => ({ ...r, [itemId]: res }));
    saveResponse(auditId, res);
  };

  const setNote = (itemId: string, value: string) => {
    setNotes((n) => ({ ...n, [itemId]: value }));
    const existing = responses[itemId];
    if (existing && auditId) {
      const updated = { ...existing, note: value };
      setResponses((r) => ({ ...r, [itemId]: updated }));
      saveResponse(auditId, updated);
    }
  };

  const allItems = template.sections.flatMap((s) =>
    s.items.map((it) => ({ ...it, sectionId: s.id })),
  );
  const answered = allItems.filter((i) => responses[i.id]);
  const missingNotes = allItems.filter((i) => {
    const r = responses[i.id];
    if (!r) return false;
    if (r.status === "fail" && !(notes[i.id]?.trim())) return true;
    if (i.requiresNote && r.status === "pass" && !(notes[i.id]?.trim())) return true;
    return false;
  });
  const canSubmit =
    !!auditId && answered.length === allItems.length && missingNotes.length === 0;

  const submit = () => {
    if (!auditId || !canSubmit) return;
    submitAudit(auditId);
    navigate({ to: "/audits/record/$id", params: { id: auditId } });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {location.name}
      </p>
      <h1 className="font-display text-2xl font-semibold text-foreground">{template.name}</h1>

      {offSite && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-flag/40 bg-flag/10 p-3 text-[13px] text-foreground">
          <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-flag" />
          <div>
            <p className="font-medium">Marked off-site — not blocking.</p>
            <p className="text-muted-foreground">
              {offReason === "denied"
                ? "Location access was denied."
                : offReason === "out_of_range"
                  ? "You appear to be outside the location radius."
                  : "Location signal unavailable."}{" "}
              This audit will be flagged for review.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {template.sections.map((sec) => (
          <section key={sec.id} className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
              {sec.name}
            </h2>
            <ul className="mt-3 space-y-4">
              {sec.items.map((item) => {
                const r = responses[item.id];
                const needsNoteFail = r?.status === "fail";
                const needsNoteReq = item.requiresNote && r?.status === "pass";
                const showNote = needsNoteFail || needsNoteReq;
                return (
                  <li key={item.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <p className="text-[15px] text-foreground">
                      {item.label || <span className="italic text-muted-foreground">Untitled item</span>}
                      {item.requiresNote && (
                        <span className="font-mono ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                          note required
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StampBtn
                        active={r?.status === "pass"}
                        activeClass="bg-pass text-paper border-pass"
                        onClick={() => setStatus(item.id, "pass", item.requiresNote)}
                      >
                        Pass
                      </StampBtn>
                      <StampBtn
                        active={r?.status === "fail"}
                        activeClass="bg-fail text-paper border-fail"
                        onClick={() => setStatus(item.id, "fail", item.requiresNote)}
                      >
                        Fail
                      </StampBtn>
                      <StampBtn
                        active={r?.status === "na"}
                        activeClass="bg-muted text-foreground border-border"
                        onClick={() => setStatus(item.id, "na", item.requiresNote)}
                      >
                        N/A
                      </StampBtn>
                    </div>
                    {showNote && (
                      <textarea
                        value={notes[item.id] ?? ""}
                        onChange={(e) => setNote(item.id, e.target.value)}
                        placeholder={needsNoteFail ? "What went wrong?" : "Add a note"}
                        className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        rows={2}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="sticky bottom-16 mt-6 flex items-center justify-between gap-3 border-t border-border bg-background/95 py-3 backdrop-blur md:bottom-0">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {answered.length}/{allItems.length} answered
          {missingNotes.length > 0 && ` · ${missingNotes.length} note${missingNotes.length === 1 ? "" : "s"} needed`}
        </p>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="font-display rounded-sm bg-ink px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper disabled:opacity-40"
        >
          Submit audit
        </button>
      </div>
    </div>
  );
}

function StampBtn({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-display rounded-sm border px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
        active
          ? `${activeClass} animate-[stamp-in_.18s_ease-out]`
          : "border-border bg-background text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}