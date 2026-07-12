import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TemplateEditor } from "@/components/template-editor";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_app/audits/new")({
  head: () => ({ meta: [{ title: "New audit — Hudson's Compliance" }] }),
  component: NewAudit,
});

function NewAudit() {
  const navigate = useNavigate();
  const create = useStore((s) => s.createTemplate);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display mb-6 text-3xl font-bold uppercase tracking-wide">
        New audit
      </h1>
      <TemplateEditor
        saveLabel="Save audit"
        onCancel={() => navigate({ to: "/audits" })}
        onSave={(draft) => {
          create(draft);
          navigate({ to: "/audits" });
        }}
      />
    </div>
  );
}