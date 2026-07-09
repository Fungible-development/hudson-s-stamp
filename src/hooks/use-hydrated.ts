import { useEffect, useState } from "react";

/** Returns true after the first client-side render — safe gate for
 * locale-formatted dates, persisted store reads, etc. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}