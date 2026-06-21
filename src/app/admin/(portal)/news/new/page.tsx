import { NewsEditorPageShell } from "../NewsEditorPageShell";
import { NewsForm } from "../NewsForm";
import { createNews } from "../actions";

export default function NewNewsPage() {
  return (
    <NewsEditorPageShell
      eyebrow="News"
      title="Neue News"
      description="Textbeitrag im blockartigen Portal-Layout erstellen."
    >
      <NewsForm action={createNews} />
    </NewsEditorPageShell>
  );
}
