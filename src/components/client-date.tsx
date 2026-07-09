import { useHydrated } from "@/hooks/use-hydrated";

type Mode = "datetime" | "date" | "today-long";

/** Renders locale-formatted dates only after hydration to avoid SSR mismatch. */
export function ClientDate({
  value,
  mode = "datetime",
  fallback = "",
}: {
  value?: string | number | Date;
  mode?: Mode;
  fallback?: string;
}) {
  const hydrated = useHydrated();
  if (!hydrated) return <>{fallback}</>;
  const d = value ? new Date(value) : new Date();
  if (mode === "today-long") {
    return (
      <>
        {d.toLocaleDateString(undefined, {
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </>
    );
  }
  if (mode === "date") return <>{d.toLocaleDateString()}</>;
  return <>{d.toLocaleString()}</>;
}