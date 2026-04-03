import { useState } from "react";
import type { Presentation, ActionPlan, Priority } from "@seminar/shared";
import { useUpdatePresentation } from "../../hooks/usePresentation";

interface Props {
  presentation: Presentation;
  sessionId: number;
}

const priorityStyles: Record<Priority, string> = {
  高: "bg-red-100 text-red-700 border-red-200",
  中: "bg-yellow-100 text-yellow-700 border-yellow-200",
  低: "bg-gray-100 text-gray-600 border-gray-200",
};

function EditableList({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const addItem = () => {
    onChange([...items, ""]);
    setEditIdx(items.length);
  };

  const updateItem = (idx: number, value: string) => {
    const next = [...items];
    next[idx] = value;
    onChange(next);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
    setEditIdx(null);
  };

  return (
    <div>
      <h5 className="text-sm font-medium text-gray-600 mb-2">{title}</h5>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="group flex items-start gap-2">
            <span className="text-gray-300 mt-1 text-sm">-</span>
            {editIdx === i ? (
              <input
                autoFocus
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                onBlur={() => {
                  if (!item.trim()) {
                    removeItem(i);
                  } else {
                    setEditIdx(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!item.trim()) {
                      removeItem(i);
                    } else {
                      setEditIdx(null);
                    }
                  }
                }}
                className="flex-1 text-sm bg-transparent border-b border-blue-300 focus:outline-none py-0.5"
              />
            ) : (
              <span
                className="flex-1 text-sm text-gray-700 cursor-pointer hover:text-blue-600 py-0.5"
                onClick={() => setEditIdx(i)}
              >
                {item || "(空)"}
              </span>
            )}
            <button
              onClick={() => removeItem(i)}
              className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity mt-1"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={addItem}
        className="text-xs text-gray-400 hover:text-gray-600 mt-1.5 transition-colors"
      >
        + 追加
      </button>
    </div>
  );
}

function ActionPlanList({
  items,
  onChange,
}: {
  items: ActionPlan[];
  onChange: (items: ActionPlan[]) => void;
}) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const priorities: Priority[] = ["高", "中", "低"];

  const addItem = () => {
    onChange([...items, { text: "", priority: "中" }]);
    setEditIdx(items.length);
  };

  const updateItem = (idx: number, patch: Partial<ActionPlan>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
    setEditIdx(null);
  };

  return (
    <div>
      <h5 className="text-sm font-medium text-gray-600 mb-2">アクションプラン</h5>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="group flex items-start gap-2">
            <select
              value={item.priority}
              onChange={(e) =>
                updateItem(i, { priority: e.target.value as Priority })
              }
              className={`text-xs px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${
                priorityStyles[item.priority]
              }`}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {editIdx === i ? (
              <input
                autoFocus
                value={item.text}
                onChange={(e) => updateItem(i, { text: e.target.value })}
                onBlur={() => {
                  if (!item.text.trim()) {
                    removeItem(i);
                  } else {
                    setEditIdx(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!item.text.trim()) {
                      removeItem(i);
                    } else {
                      setEditIdx(null);
                    }
                  }
                }}
                className="flex-1 text-sm bg-transparent border-b border-blue-300 focus:outline-none py-0.5"
              />
            ) : (
              <span
                className="flex-1 text-sm text-gray-700 cursor-pointer hover:text-blue-600 py-0.5"
                onClick={() => setEditIdx(i)}
              >
                {item.text || "(空)"}
              </span>
            )}
            <button
              onClick={() => removeItem(i)}
              className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity mt-1"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={addItem}
        className="text-xs text-gray-400 hover:text-gray-600 mt-1.5 transition-colors"
      >
        + 追加
      </button>
    </div>
  );
}

export function FeedbackSection({ presentation, sessionId }: Props) {
  const update = useUpdatePresentation(sessionId);

  const [goodPoints, setGoodPoints] = useState(presentation.goodPoints);
  const [issues, setIssues] = useState(presentation.issues);
  const [actionPlans, setActionPlans] = useState(presentation.actionPlans);

  const saveGoodPoints = (items: string[]) => {
    setGoodPoints(items);
    update.mutate({ id: presentation.id, goodPoints: items });
  };

  const saveIssues = (items: string[]) => {
    setIssues(items);
    update.mutate({ id: presentation.id, issues: items });
  };

  const saveActionPlans = (items: ActionPlan[]) => {
    setActionPlans(items);
    update.mutate({ id: presentation.id, actionPlans: items });
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="border-t border-gray-100 pt-5">
        <EditableList
          title="良い点"
          items={goodPoints}
          onChange={saveGoodPoints}
        />
      </div>
      <div className="border-t border-gray-100 pt-5">
        <EditableList
          title="指摘事項"
          items={issues}
          onChange={saveIssues}
        />
      </div>
      <div className="border-t border-gray-100 pt-5">
        <ActionPlanList items={actionPlans} onChange={saveActionPlans} />
      </div>
    </div>
  );
}
