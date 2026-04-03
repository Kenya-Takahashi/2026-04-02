import type { Presentation } from "@seminar/shared";
import { NotesEditor } from "./NotesEditor";
import { RatingPanel } from "./RatingPanel";
import { FeedbackSection } from "./FeedbackSection";
import { useUpdatePresentation } from "../../hooks/usePresentation";
import { useState } from "react";

interface Props {
  presentation: Presentation;
  sessionId: number;
}

export function PresentationView({ presentation, sessionId }: Props) {
  const updatePresentation = useUpdatePresentation(sessionId);
  const [editingName, setEditingName] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [nameDraft, setNameDraft] = useState(presentation.studentName);
  const [titleDraft, setTitleDraft] = useState(presentation.thesisTitle);

  const saveName = () => {
    if (nameDraft !== presentation.studentName) {
      updatePresentation.mutate({ id: presentation.id, studentName: nameDraft });
    }
    setEditingName(false);
  };

  const saveTitle = () => {
    if (titleDraft !== presentation.thesisTitle) {
      updatePresentation.mutate({ id: presentation.id, thesisTitle: titleDraft });
    }
    setEditingTitle(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
      {/* Student Info */}
      <div className="space-y-1">
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            className="text-xl font-semibold bg-transparent border-b-2 border-blue-400 focus:outline-none w-full"
          />
        ) : (
          <h3
            className="text-xl font-semibold cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => setEditingName(true)}
          >
            {presentation.studentName}
          </h3>
        )}
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            placeholder="テーマを入力..."
            className="text-sm text-gray-500 bg-transparent border-b border-gray-300 focus:outline-none w-full"
          />
        ) : (
          <p
            className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
            onClick={() => setEditingTitle(true)}
          >
            {presentation.thesisTitle || "テーマを入力..."}
          </p>
        )}
      </div>

      {/* Notes */}
      <NotesEditor presentation={presentation} sessionId={sessionId} />

      {/* Ratings */}
      <RatingPanel presentation={presentation} sessionId={sessionId} />

      {/* Feedback */}
      <FeedbackSection presentation={presentation} sessionId={sessionId} />
    </div>
  );
}
