import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Audit,
  AuditResponse,
  AppSettings,
  Location,
  OffSiteReason,
  Role,
  Template,
} from "./mock/types";
import { defaultSettings, seedAudits, seedLocations, seedTemplates } from "./mock/seed";

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

type State = {
  role: Role;
  devRole: Role | null; // dev override
  activeLocationId: string | "all";
  locations: Location[];
  templates: Template[];
  audits: Audit[];
  settings: AppSettings;
};

type Actions = {
  setDevRole: (r: Role | null) => void;
  setActiveLocation: (id: string | "all") => void;

  createLocation: (input: { name: string; address: string }) => string;
  updateLocation: (id: string, patch: Partial<Pick<Location, "name" | "address">>) => void;
  deleteLocation: (id: string) => void;

  updateSettings: (patch: Partial<AppSettings>) => void;

  createTemplate: (t: Omit<Template, "id" | "createdAt" | "updatedAt">) => string;
  updateTemplate: (id: string, patch: Partial<Template>) => void;
  duplicateTemplate: (id: string) => string | undefined;
  deleteTemplate: (id: string) => void;

  startAudit: (
    templateId: string,
    locationId: string,
    offSite: boolean,
    offSiteReason?: OffSiteReason,
  ) => string;
  saveResponse: (auditId: string, response: AuditResponse) => void;
  submitAudit: (auditId: string) => void;
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      role: "admin",
      devRole: null,
      activeLocationId: "all",
      locations: seedLocations,
      templates: seedTemplates,
      audits: seedAudits,
      settings: defaultSettings,

      setDevRole: (devRole) => set({ devRole }),
      setActiveLocation: (id) => set({ activeLocationId: id }),

      createLocation: ({ name, address }) => {
        const id = uid("loc");
        set((s) => ({
          locations: [
            ...s.locations,
            { id, name, address, lat: 0, lng: 0, radiusM: 150 },
          ],
        }));
        return id;
      },
      updateLocation: (id, patch) =>
        set((s) => ({
          locations: s.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      deleteLocation: (id) =>
        set((s) => ({
          locations: s.locations.filter((l) => l.id !== id),
          templates: s.templates.map((t) =>
            t.locationIds.includes(id)
              ? { ...t, locationIds: t.locationIds.filter((x) => x !== id) }
              : t,
          ),
          activeLocationId: s.activeLocationId === id ? "all" : s.activeLocationId,
        })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      createTemplate: (t) => {
        const id = uid("tpl");
        const now = new Date().toISOString();
        set((s) => ({
          templates: [...s.templates, { ...t, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },
      updateTemplate: (id, patch) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
          ),
        })),
      duplicateTemplate: (id) => {
        const src = get().templates.find((t) => t.id === id);
        if (!src) return;
        const newId = uid("tpl");
        const now = new Date().toISOString();
        set((s) => ({
          templates: [
            ...s.templates,
            {
              ...src,
              id: newId,
              name: `${src.name} (copy)`,
              createdAt: now,
              updatedAt: now,
              sections: src.sections.map((sec) => ({
                ...sec,
                id: uid("sec"),
                items: sec.items.map((it) => ({ ...it, id: uid("itm") })),
              })),
            },
          ],
        }));
        return newId;
      },
      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      startAudit: (templateId, locationId, offSite, offSiteReason) => {
        const id = uid("aud");
        set((s) => ({
          audits: [
            ...s.audits,
            {
              id,
              templateId,
              locationId,
              startedAt: new Date().toISOString(),
              responses: [],
              offSite,
              offSiteReason,
            },
          ],
        }));
        return id;
      },
      saveResponse: (auditId, response) =>
        set((s) => ({
          audits: s.audits.map((a) => {
            if (a.id !== auditId) return a;
            const others = a.responses.filter((r) => r.itemId !== response.itemId);
            return { ...a, responses: [...others, response] };
          }),
        })),
      submitAudit: (auditId) =>
        set((s) => ({
          audits: s.audits.map((a) =>
            a.id === auditId ? { ...a, submittedAt: new Date().toISOString() } : a,
          ),
        })),
    }),
    {
      name: "hudsons-compliance-v2",
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...(p.settings ?? {}) },
          locations: (p.locations ?? current.locations).map((l) => ({
            ...l,
            address: l.address ?? "",
          })),
        };
      },
    },
  ),
);

// ---------- Selectors ----------

export const useActiveRole = (): Role => {
  const { role, devRole } = useStore();
  return devRole ?? role;
};

export const useActiveLocationFilter = () => useStore((s) => s.activeLocationId);

/** Templates visible for the current location filter. */
export const useVisibleTemplates = () => {
  const templates = useStore((s) => s.templates);
  const loc = useStore((s) => s.activeLocationId);
  if (loc === "all") return templates;
  return templates.filter((t) => t.locationIds.includes(loc));
};

/** Audits filtered by location. */
export const useVisibleAudits = () => {
  const audits = useStore((s) => s.audits);
  const loc = useStore((s) => s.activeLocationId);
  if (loc === "all") return audits;
  return audits.filter((a) => a.locationId === loc);
};

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Audits submitted today. */
export const selectCompletedToday = (audits: Audit[]) => {
  const today = new Date();
  return audits.filter(
    (a) => a.submittedAt && isSameDay(new Date(a.submittedAt), today),
  );
};

/** "Due today" is a per-location count of daily templates minus completions today. */
export const selectDueToday = (
  templates: Template[],
  audits: Audit[],
  locations: Location[],
  locFilter: string | "all",
) => {
  const today = new Date();
  const targetLocs =
    locFilter === "all" ? locations.map((l) => l.id) : [locFilter];
  const due: { templateId: string; locationId: string }[] = [];
  for (const tpl of templates) {
    if (tpl.schedule !== "daily") continue;
    for (const locId of tpl.locationIds) {
      if (!targetLocs.includes(locId)) continue;
      const done = audits.some(
        (a) =>
          a.templateId === tpl.id &&
          a.locationId === locId &&
          a.submittedAt &&
          isSameDay(new Date(a.submittedAt), today),
      );
      if (!done) due.push({ templateId: tpl.id, locationId: locId });
    }
  }
  return due;
};

/** Flagged responses (fail) across visible audits in last N days. */
export const selectRecentFlagged = (audits: Audit[], days = 7) => {
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  const flagged: {
    auditId: string;
    itemId: string;
    templateId: string;
    locationId: string;
    submittedAt: string;
    note?: string;
  }[] = [];
  for (const a of audits) {
    if (!a.submittedAt) continue;
    if (new Date(a.submittedAt).getTime() < cutoff) continue;
    for (const r of a.responses) {
      if (r.status === "fail")
        flagged.push({
          auditId: a.id,
          itemId: r.itemId,
          templateId: a.templateId,
          locationId: a.locationId,
          submittedAt: a.submittedAt,
          note: r.note,
        });
    }
  }
  return flagged;
};

export const selectOffSite = (audits: Audit[], days = 30) => {
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  return audits.filter(
    (a) => a.offSite && a.submittedAt && new Date(a.submittedAt).getTime() >= cutoff,
  );
};

export const findItemLabel = (templates: Template[], itemId: string) => {
  for (const t of templates) {
    for (const s of t.sections) {
      const item = s.items.find((i) => i.id === itemId);
      if (item) return item.label;
    }
  }
  return itemId;
};