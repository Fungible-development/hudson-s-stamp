import { useHydrated } from "@/hooks/use-hydrated";

type Mode = "datetime" | "date" | "today-long";

const pad = (n: number) => n.toString().padStart(2, "0");

function formatShort(d: Date, withTime: boolean) {
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const date = `${dd}/${mm}/${yyyy}`;
  if (!withTime) return date;
  return `${date}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  return <>{formatShort(d, mode === "datetime")}</>;
}