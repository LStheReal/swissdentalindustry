import { NewsEditorPageShell } from "../NewsEditorPageShell";
import { LinkNewsForm } from "../LinkNewsForm";
import { createLinkNews } from "../actions";

export default function NewLinkNewsPage() {
  return (
    <NewsEditorPageShell
      eyebrow="News"
      title="Link einfügen"
      description="Externe Inhalte im gleichen Portal-Raster anlegen."
    >
      <LinkNewsForm action={createLinkNews} />
    </NewsEditorPageShell>
  );
}
