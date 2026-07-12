export type Schedule = "daily" | "weekly" | "monthly" | "as_needed";

export type Location = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radiusM: number;
};

export type AuditItem = {
  id: string;
  label: string;
  requiresNote: boolean;
};

export type AuditSection = {
  id: string;
  name: string;
  items: AuditItem[];
};

export type Template = {
  id: string;
  name: string;
  schedule: Schedule;
  locationIds: string[];
  sections: AuditSection[];
  createdAt: string;
  updatedAt: string;
};

export type ResponseStatus = "pass" | "fail" | "na";

export type AuditResponse = {
  itemId: string;
  status: ResponseStatus;
  note?: string;
};

export type OffSiteReason = "denied" | "out_of_range" | "unavailable";

export type Audit = {
  id: string;
  templateId: string;
  locationId: string;
  startedAt: string;
  submittedAt?: string;
  responses: AuditResponse[];
  offSite: boolean;
  offSiteReason?: OffSiteReason;
};

export type Role = "admin" | "manager";

export type DateFormat = "uk" | "us";

export type AppSettings = {
  groupName: string;
  brandMark: string;
  dateFormat: DateFormat;
};
