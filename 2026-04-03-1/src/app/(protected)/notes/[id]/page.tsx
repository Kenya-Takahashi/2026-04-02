import { notFound } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { NoteEditor } from "@/components/note/NoteEditor";
import { getNoteById } from "@/lib/actions/notes";
import { listTaskOptions } from "@/lib/actions/tasks";

export const dynamic = "force-dynamic";

export default async function NoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [note, taskOptions] = await Promise.all([getNoteById(params.id), listTaskOptions()]);

  if (!note) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Header
        title={note.title}
        description="メモを育てながら、wiki link と関連タスクで研究の文脈をつないでいきます。"
      />
      <NoteEditor note={note} taskOptions={taskOptions} />
    </div>
  );
}
