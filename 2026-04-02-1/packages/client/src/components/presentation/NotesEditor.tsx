import { useState, useCallback } from "react";
import type { Presentation } from "@seminar/shared";
import { presentationsApi } from "../../api/presentations";
import { useAutoSave } from "../../hooks/useAutoSave";

interface Props {
  presentation: Presentation;
  sessionId: number;
}

export function NotesEditor({ presentation }: Props) {
  const [notes, setNotes] = useState(presentation.notes);

  const saveFn = useCallback(
    (value: string) => presentationsApi.saveNotes(presentation.id, value),
    [presentation.id]
  );

  const { save, saving, saved } = useAutoSave(saveFn);

  const handleChange = (value: string) => {
    setNotes(value);
    save(value);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">メモ</h4>
        <span className="text-xs text-gray-400">
          {saving ? "保存中..." : saved ? "保存済み" : ""}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="発表を聞きながらメモ..."
        className="w-full min-h-[200px] p-4 border border-gray-200 rounded-lg resize-y font-serif text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-300"
      />
    </div>
  );
}
