import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TemplateEditor } from "@/components/template-editor";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_app/templates/$id")({
  head: () => ({ meta: [{ title: "Edit template — Hudson's Compliance" }] }),
  component: EditTemplate,
});

function EditTemplate() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const template = useStore((s) => s.templates.find((t) => t.id === id));
  const update = useStore((s) => s.updateTemplate);

  if (!template) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="font-medium">Template not found.</p>
        <button
          onClick={() => navigate({ to: "/templates" })}
          className="font-display mt-4 rounded-sm bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-paper"
        >
          Back to templates
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {template.id}
      </p>
      <h1 className="font-display mb-6 text-3xl font-bold uppercase tracking-wide">
        Edit template
      </h1>
      <TemplateEditor
        initial={template}
        saveLabel="Save changes"
        onCancel={() => navigate({ to: "/templates" })}
        onSave={(draft) => {
          update(id, draft);
          navigate({ to: "/templates" });
        }}
      />
    </div>
  );
}