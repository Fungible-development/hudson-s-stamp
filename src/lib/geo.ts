import type { OffSiteReason } from "./mock/types";

export type GeoResult =
  | { onSite: true }
  | { onSite: false; reason: OffSiteReason };

function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function checkLocation(
  target: { lat: number; lng: number; radiusM: number },
  timeoutMs = 5000,
): Promise<GeoResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ onSite: false, reason: "unavailable" });
      return;
    }
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve({ onSite: false, reason: "unavailable" });
    }, timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        const d = haversineMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          target.lat,
          target.lng,
        );
        if (d <= target.radiusM) resolve({ onSite: true });
        else resolve({ onSite: false, reason: "out_of_range" });
      },
      (err) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (err.code === err.PERMISSION_DENIED)
          resolve({ onSite: false, reason: "denied" });
        else resolve({ onSite: false, reason: "unavailable" });
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}