import { NewsEditorPageShell } from "../NewsEditorPageShell";
import { YoutubeNewsForm } from "../YoutubeNewsForm";
import { createYoutubeNews } from "../actions";

export default function NewYoutubeNewsPage() {
  return (
    <NewsEditorPageShell
      eyebrow="News"
      title="YouTube Video verlinken"
      description="Video-News mit Vorschau und derselben blockartigen Portal-Struktur erfassen."
    >
      <YoutubeNewsForm action={createYoutubeNews} />
    </NewsEditorPageShell>
  );
}
