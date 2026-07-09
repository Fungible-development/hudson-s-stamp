import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/_app/manager")({
  head: () => ({
    meta: [
      { title: "Manager — Hudson's Compliance" },
      { name: "description", content: "Manager tools coming soon." },
    ],
  }),
  component: ManagerHome,
});

function ManagerHome() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-16">
      <div className="w-full rounded-sm border border-border bg-card p-8 text-center shadow-sm">
        <ClipboardCheck className="mx-auto h-10 w-10 text-steel" />
        <h1 className="font-display mt-4 text-2xl font-bold uppercase tracking-wide">
          Manager tools
        </h1>
        <p className="font-mono mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          Coming soon
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Your shift dashboard, assigned audits, and flag review will live here.
          For now, hand-offs still run through the manager on shift.
        </p>
      </div>
    </div>
  );
}