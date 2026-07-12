import { useHydrated } from "@/hooks/use-hydrated";
import { useStore } from "@/lib/store";

type Mode = "datetime" | "date" | "today-long";

const pad = (n: number) => n.toString().padStart(2, "0");

function formatShort(d: Date, fmt: "uk" | "us", withTime: boolean) {
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const date = fmt === "us" ? `${mm}/${dd}/${yyyy}` : `${dd}/${mm}/${yyyy}`;
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
  const dateFormat = useStore((s) => s.settings.dateFormat);
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
  return <>{formatShort(d, dateFormat, mode === "datetime")}</>;
}