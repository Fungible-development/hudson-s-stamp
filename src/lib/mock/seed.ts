import type { Audit, Location, Template } from "./types";

export const seedLocations: Location[] = [
  { id: "loc-gardens", name: "Gardens", lat: -33.9308, lng: 18.4155, radiusM: 150 },
  { id: "loc-campsbay", name: "Camps Bay", lat: -33.9500, lng: 18.3776, radiusM: 150 },
  { id: "loc-vawaterfront", name: "V&A Waterfront", lat: -33.9036, lng: 18.4207, radiusM: 200 },
];

const now = () => new Date().toISOString();

export const seedTemplates: Template[] = [
  {
    id: "tpl-opening",
    name: "Opening Compliance Check",
    schedule: "daily",
    locationIds: seedLocations.map((l) => l.id),
    createdAt: now(),
    updatedAt: now(),
    sections: [
      {
        id: "sec-front",
        name: "Front of House",
        items: [
          { id: "itm-tables", label: "Tables wiped and set", requiresNote: false },
          { id: "itm-floor", label: "Floor swept and mopped", requiresNote: false },
          { id: "itm-menus", label: "Menus clean and stocked", requiresNote: false },
        ],
      },
      {
        id: "sec-bar",
        name: "Bar",
        items: [
          { id: "itm-ice", label: "Ice bin filled", requiresNote: false },
          { id: "itm-taps", label: "Beer taps pouring clean", requiresNote: true },
        ],
      },
    ],
  },
  {
    id: "tpl-chef",
    name: "Chef Audit",
    schedule: "weekly",
    locationIds: [seedLocations[0].id, seedLocations[1].id],
    createdAt: now(),
    updatedAt: now(),
    sections: [
      {
        id: "sec-cold",
        name: "Cold Rooms",
        items: [
          { id: "itm-temp", label: "Walk-in temp under 4°C", requiresNote: true },
          { id: "itm-labels", label: "All containers labelled and dated", requiresNote: false },
          { id: "itm-rotation", label: "Stock rotation FIFO", requiresNote: false },
        ],
      },
      {
        id: "sec-dry",
        name: "Dry Storage",
        items: [
          { id: "itm-pests", label: "No signs of pests", requiresNote: true },
          { id: "itm-shelving", label: "Shelving 15cm off floor", requiresNote: false },
        ],
      },
      {
        id: "sec-line",
        name: "Cook Line",
        items: [
          { id: "itm-oil", label: "Fryer oil clarity acceptable", requiresNote: false },
          { id: "itm-grill", label: "Grill scraped and seasoned", requiresNote: false },
        ],
      },
    ],
  },
  {
    id: "tpl-deep",
    name: "Deep Clean",
    schedule: "monthly",
    locationIds: [seedLocations[2].id],
    createdAt: now(),
    updatedAt: now(),
    sections: [
      {
        id: "sec-hood",
        name: "Extraction",
        items: [
          { id: "itm-hood", label: "Hood filters degreased", requiresNote: false },
          { id: "itm-ducts", label: "Ducts inspected", requiresNote: true },
        ],
      },
    ],
  },
];

const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();

export const seedAudits: Audit[] = [
  {
    id: "aud-0001",
    templateId: "tpl-opening",
    locationId: "loc-gardens",
    startedAt: yesterday,
    submittedAt: yesterday,
    offSite: false,
    responses: [
      { itemId: "itm-tables", status: "pass" },
      { itemId: "itm-floor", status: "pass" },
      { itemId: "itm-menus", status: "fail", note: "Three menus torn — replace by Friday." },
      { itemId: "itm-ice", status: "pass" },
      { itemId: "itm-taps", status: "pass", note: "Pilsner line flushed at open." },
    ],
  },
  {
    id: "aud-0002",
    templateId: "tpl-chef",
    locationId: "loc-campsbay",
    startedAt: twoDaysAgo,
    submittedAt: twoDaysAgo,
    offSite: true,
    offSiteReason: "out_of_range",
    responses: [
      { itemId: "itm-temp", status: "pass", note: "3.2°C at 09:14." },
      { itemId: "itm-labels", status: "fail", note: "Two unlabelled sauce tubs on middle shelf." },
      { itemId: "itm-rotation", status: "pass" },
      { itemId: "itm-pests", status: "pass", note: "No droppings, traps clean." },
      { itemId: "itm-shelving", status: "pass" },
      { itemId: "itm-oil", status: "na" },
      { itemId: "itm-grill", status: "pass" },
    ],
  },
];