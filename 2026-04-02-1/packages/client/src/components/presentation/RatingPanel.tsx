import { useState, useCallback } from "react";
import type { Presentation, Ratings, RatingLevel } from "@seminar/shared";
import { RESEARCH_ELEMENTS, RATING_LABELS } from "@seminar/shared";
import { presentationsApi } from "../../api/presentations";
import { useAutoSave } from "../../hooks/useAutoSave";

interface Props {
  presentation: Presentation;
  sessionId: number;
}

const ratingColors: Record<number, string> = {
  0: "bg-gray-100 text-gray-400 border-gray-200",
  1: "bg-red-50 text-red-700 border-red-300",
  2: "bg-yellow-50 text-yellow-700 border-yellow-300",
  3: "bg-blue-50 text-blue-700 border-blue-300",
  4: "bg-green-50 text-green-700 border-green-300",
};

const ratingColorsActive: Record<number, string> = {
  1: "bg-red-500 text-white border-red-500",
  2: "bg-yellow-500 text-white border-yellow-500",
  3: "bg-blue-500 text-white border-blue-500",
  4: "bg-green-500 text-white border-green-500",
};

export function RatingPanel({ presentation }: Props) {
  const [ratings, setRatings] = useState<Ratings>({ ...presentation.ratings });

  const saveFn = useCallback(
    (value: Ratings) => presentationsApi.saveRatings(presentation.id, value),
    [presentation.id]
  );

  const { save, saving, saved } = useAutoSave(saveFn, 300);

  const setRating = (key: string, value: RatingLevel) => {
    const next = { ...ratings, [key]: value };
    setRatings(next);
    save(next);
  };

  // Deficiency summary
  const deficiencies = RESEARCH_ELEMENTS.filter(
    (el) => ratings[el.key] === 1 || ratings[el.key] === 2
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">研究要素評価</h4>
        <span className="text-xs text-gray-400">
          {saving ? "保存中..." : saved ? "保存済み" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {RESEARCH_ELEMENTS.map((el) => {
          const current = (ratings[el.key] ?? 0) as RatingLevel;
          return (
            <div key={el.key} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-36 shrink-0">
                {el.labelJa}
              </span>
              <div className="flex gap-1">
                {([1, 2, 3, 4] as RatingLevel[]).map((level) => {
                  const label = RATING_LABELS.find((l) => l.value === level)!;
                  const isActive = current === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setRating(el.key, isActive ? 0 as RatingLevel : level)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                        isActive
                          ? ratingColorsActive[level]
                          : ratingColors[0] + " hover:border-gray-300"
                      }`}
                    >
                      {label.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deficiency Summary */}
      {deficiencies.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <span className="font-medium">要注意項目:</span>
            <div className="flex flex-wrap gap-1.5">
              {deficiencies.map((el) => {
                const level = ratings[el.key] as number;
                return (
                  <span
                    key={el.key}
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      level === 1
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {el.labelJa}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
