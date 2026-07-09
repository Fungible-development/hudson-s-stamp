import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TemplateEditor } from "@/components/template-editor";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_app/templates/new")({
  head: () => ({ meta: [{ title: "New template — Hudson's Compliance" }] }),
  component: NewTemplate,
});

function NewTemplate() {
  const navigate = useNavigate();
  const create = useStore((s) => s.createTemplate);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display mb-6 text-3xl font-bold uppercase tracking-wide">
        New template
      </h1>
      <TemplateEditor
        onCancel={() => navigate({ to: "/templates" })}
        onSave={(draft) => {
          create(draft);
          navigate({ to: "/templates" });
        }}
      />
    </div>
  );
}