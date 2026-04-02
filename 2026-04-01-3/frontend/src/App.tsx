import { useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Prism from "prismjs";
import { createNode, deleteNode, fetchPage, fetchTree, savePage, updateNode } from "./api";
import type { NodeItem, PageBlock, TextBlock, TreeNode } from "./types";

type VisibleNode = {
  id: string;
  depth: number;
  parentId: string | null;
  type: "folder" | "file";
  name: string;
};

function buildTree(nodes: NodeItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  nodes.forEach((node) => {
    map.set(node.id, { ...node, children: [] });
  });

  nodes.forEach((node) => {
    const current = map.get(node.id)!;
    if (node.parentId) {
      map.get(node.parentId)?.children.push(current);
    } else {
      roots.push(current);
    }
  });

  const sortNodes = (items: TreeNode[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
    items.forEach((item) => sortNodes(item.children));
  };
  sortNodes(roots);
  return roots;
}

function flattenTree(tree: TreeNode[], expanded: Set<string>, depth = 0): VisibleNode[] {
  return tree.flatMap((node) => {
    const current: VisibleNode = {
      id: node.id,
      depth,
      parentId: node.parentId,
      type: node.type,
      name: node.name
    };
    if (node.type === "folder" && expanded.has(node.id)) {
      return [current, ...flattenTree(node.children, expanded, depth + 1)];
    }
    return [current];
  });
}

function findPath(nodes: NodeItem[], selectedId: string | null) {
  if (!selectedId) {
    return [];
  }
  const map = new Map(nodes.map((node) => [node.id, node]));
  const path: NodeItem[] = [];
  let cursor = map.get(selectedId) ?? null;
  while (cursor) {
    path.unshift(cursor);
    cursor = cursor.parentId ? map.get(cursor.parentId) ?? null : null;
  }
  return path;
}

function reorderWithinParent(nodes: NodeItem[], activeId: string, overId: string) {
  const cloned = [...nodes];
  const activeNode = cloned.find((node) => node.id === activeId);
  const overNode = cloned.find((node) => node.id === overId);
  if (!activeNode || !overNode) {
    return cloned;
  }

  const newParentId = overNode.type === "folder" ? overNode.id : overNode.parentId;
  activeNode.parentId = newParentId;

  const siblingIds = cloned
    .filter((node) => node.parentId === newParentId && node.id !== activeId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((node) => node.id);

  const targetIndex = overNode.type === "folder" ? siblingIds.length : siblingIds.indexOf(overId);
  siblingIds.splice(targetIndex < 0 ? siblingIds.length : targetIndex, 0, activeId);

  siblingIds.forEach((id, index) => {
    const node = cloned.find((item) => item.id === id);
    if (node) {
      node.sortOrder = index;
      node.parentId = newParentId;
    }
  });

  return cloned;
}

function isDescendant(nodes: NodeItem[], ancestorId: string, candidateParentId: string | null) {
  if (!candidateParentId) {
    return false;
  }
  const map = new Map(nodes.map((node) => [node.id, node]));
  let cursor = map.get(candidateParentId) ?? null;
  while (cursor) {
    if (cursor.id === ancestorId) {
      return true;
    }
    cursor = cursor.parentId ? map.get(cursor.parentId) ?? null : null;
  }
  return false;
}

function createEmptyTextBlock(): TextBlock {
  return {
    id: `text_${crypto.randomUUID()}`,
    type: "text",
    text: ""
  };
}

function createEmptyCodeBlock(): Extract<PageBlock, { type: "code" }> {
  return {
    id: `code_${crypto.randomUUID()}`,
    type: "code",
    language: "typescript",
    code: ""
  };
}

function prettyDateLabel(value: string | null) {
  if (!value) {
    return "まだ保存されていません";
  }
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

const LANGUAGE_OPTIONS = [
  { value: "plaintext", label: "Plain Text" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "tsx", label: "TSX" },
  { value: "jsx", label: "JSX" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "markdown", label: "Markdown" }
];

function SortableBlock({
  block,
  onChange
}: {
  block: PageBlock;
  onChange: (next: PageBlock) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  if (block.type === "text") {
    return (
      <article ref={setNodeRef} style={style} className={`block-card text-card ${isDragging ? "dragging" : ""}`}>
        <div className="block-toolbar">
          <button className="drag-handle" type="button" aria-label="テキストブロックを移動" {...attributes} {...listeners}>
            :::
          </button>
          <span className="block-badge">Text</span>
        </div>
        <textarea
          className="plain-editor"
          value={block.text}
          placeholder="ここに本文を書きます"
          onChange={(event) => onChange({ ...block, text: event.target.value })}
        />
      </article>
    );
  }

  const language = block.language || "typescript";
  const normalizedLanguage = language.toLowerCase();
  const prismLanguage =
    Prism.languages[normalizedLanguage] ?? Prism.languages[language] ?? Prism.languages.typescript;
  const preview = Prism.highlight(block.code || "", prismLanguage, normalizedLanguage);

  return (
    <article ref={setNodeRef} style={style} className={`block-card code-card ${isDragging ? "dragging" : ""}`}>
      <div className="block-toolbar">
        <button className="drag-handle" type="button" aria-label="コードブロックを移動" {...attributes} {...listeners}>
          :::
        </button>
        <span className="block-badge">Code</span>
        <select
          className="language-select"
          value={language}
          onChange={(event) => onChange({ ...block, language: event.target.value })}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="code-input"
        value={block.code}
        placeholder="const message = 'hello';"
        onChange={(event) => onChange({ ...block, code: event.target.value })}
      />
      <pre className="code-preview">
        <code dangerouslySetInnerHTML={{ __html: preview || "&nbsp;" }} />
      </pre>
    </article>
  );
}

function SortableSidebarItem({
  node,
  selectedId,
  editingId,
  expanded,
  onToggle,
  onSelect,
  onRename,
  onStartEditing
}: {
  node: VisibleNode;
  selectedId: string | null;
  editingId: string | null;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onStartEditing: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id
  });
  const [draftName, setDraftName] = useState(node.name);

  useEffect(() => {
    setDraftName(node.name);
  }, [node.name]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, paddingLeft: `${12 + node.depth * 18}px` }}
      className={`tree-row ${selectedId === node.id ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
    >
      <button className="drag-handle tree-handle" type="button" aria-label="項目を移動" {...attributes} {...listeners}>
        ::
      </button>
      {node.type === "folder" ? (
        <button className="toggle-button" type="button" onClick={() => onToggle(node.id)}>
          {expanded.has(node.id) ? "▾" : "▸"}
        </button>
      ) : (
        <span className="toggle-spacer" />
      )}
      <button className="tree-select" type="button" onClick={() => onSelect(node.id)}>
        <span className={`tree-icon ${node.type}`}>{node.type === "folder" ? "◫" : "◧"}</span>
      </button>
      {editingId === node.id ? (
        <input
          className="tree-input"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={() => onRename(node.id, draftName)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          autoFocus
        />
      ) : (
        <button
          className="tree-label"
          type="button"
          onClick={() => onSelect(node.id)}
          onDoubleClick={() => onStartEditing(node.id)}
        >
          {node.name}
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [pageUpdatedAt, setPageUpdatedAt] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const skipAutosave = useRef(true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;
  const tree = useMemo(() => buildTree(nodes), [nodes]);
  const visibleNodes = useMemo(() => flattenTree(tree, expanded), [tree, expanded]);
  const breadcrumb = useMemo(() => findPath(nodes, selectedId), [nodes, selectedId]);

  async function loadTree(preferredSelection?: string | null) {
    const data = await fetchTree();
    setNodes(data.nodes);
    setExpanded((prev) => {
      const next = new Set(prev);
      data.nodes.filter((node) => node.type === "folder").forEach((node) => next.add(node.id));
      return next;
    });

    const targetId =
      preferredSelection && data.nodes.some((node) => node.id === preferredSelection)
        ? preferredSelection
        : data.nodes.find((node) => node.type === "file")?.id ?? null;
    setSelectedId(targetId);
  }

  useEffect(() => {
    loadTree().catch((loadError: Error) => {
      setError(loadError.message);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedNode || selectedNode.type !== "file") {
      setBlocks([]);
      setPageUpdatedAt(null);
      skipAutosave.current = true;
      return;
    }

    fetchPage(selectedNode.id)
      .then((page) => {
        skipAutosave.current = true;
        setBlocks(page.blocks);
        setPageUpdatedAt(page.updatedAt);
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, [selectedNode?.id, selectedNode?.type]);

  useEffect(() => {
    if (!selectedNode || selectedNode.type !== "file") {
      return;
    }
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }

    setSaveState("saving");
    const timer = window.setTimeout(() => {
      savePage(selectedNode.id, blocks)
        .then((page) => {
          setPageUpdatedAt(page.updatedAt);
          setSaveState("saved");
        })
        .catch((saveError: Error) => setError(saveError.message));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [blocks, selectedNode]);

  async function handleCreate(type: "folder" | "file") {
    const parentId =
      selectedNode?.type === "folder" ? selectedNode.id : selectedNode?.parentId ?? null;
    const result = await createNode({ parentId, type });
    setEditingNodeId(result.node.id);
    await loadTree(result.node.id);
  }

  async function handleRename(id: string, name: string) {
    if (!name.trim()) {
      setEditingNodeId(null);
      return;
    }
    await updateNode(id, { name: name.trim() });
    setEditingNodeId(null);
    await loadTree(selectedId);
  }

  async function handleDeleteSelected() {
    if (!selectedNode) {
      return;
    }
    const deletingId = selectedNode.id;
    setSelectedId(null);
    setEditingNodeId(null);
    setBlocks([]);
    setPageUpdatedAt(null);
    await deleteNode(deletingId);
    const data = await fetchTree();
    setNodes(data.nodes);
    const fallbackId = data.nodes.find((node) => node.type === "file" && node.id !== deletingId)?.id ?? null;
    setSelectedId(fallbackId);
  }

  async function handleAddCodeBlock() {
    if (!selectedNode || selectedNode.type !== "file") {
      return;
    }
    setBlocks((prev) => [...prev, createEmptyCodeBlock()]);
    setSaveState("saving");
  }

  function handleBlockDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    setBlocks((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  async function handleTreeDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const reordered = reorderWithinParent(structuredClone(nodes), String(active.id), String(over.id));
    const activeNode = reordered.find((node) => node.id === active.id);
    if (!activeNode) {
      return;
    }
    if (isDescendant(reordered, activeNode.id, activeNode.parentId)) {
      await loadTree(selectedId);
      return;
    }
    setNodes(reordered);
    const siblingIds = reordered
      .filter((node) => node.parentId === activeNode.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((node) => node.id);
    await updateNode(activeNode.id, {
      parentId: activeNode.parentId,
      orderedIds: siblingIds
    });
    await loadTree(selectedId);
  }

  function updateBlock(nextBlock: PageBlock) {
    setBlocks((prev) => prev.map((block) => (block.id === nextBlock.id ? nextBlock : block)));
  }

  if (loading) {
    return <div className="shell centered">Loading workspace...</div>;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>Studio Notes</h1>
          </div>
          <p className="brand-copy">ページとコードをひとつの静かな作業台で管理します。</p>
        </div>
        <div className="sidebar-actions">
          <button type="button" className="primary-button" onClick={() => void handleCreate("file")}>
            新規ページ
          </button>
          <button type="button" className="secondary-button" onClick={() => void handleCreate("folder")}>
            新規フォルダー
          </button>
        </div>
        <div className="tree-panel">
          <div className="panel-header">
            <span>Studio Notes</span>
            {selectedNode ? (
              <button type="button" className="ghost-button" onClick={() => void handleDeleteSelected()}>
                削除
              </button>
            ) : null}
          </div>
          {visibleNodes.length === 0 ? (
            <div className="empty-state">
              <p>まだページがありません。</p>
              <p>「新規ページ」から最初のファイルを作成できます。</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTreeDragEnd}>
              <SortableContext items={visibleNodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
                <div className="tree-list">
                  {visibleNodes.map((node) => (
                    <SortableSidebarItem
                      key={node.id}
                      node={node}
                      selectedId={selectedId}
                      editingId={editingNodeId}
                      expanded={expanded}
                      onToggle={(id) =>
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(id)) {
                            next.delete(id);
                          } else {
                            next.add(id);
                          }
                          return next;
                        })
                      }
                      onSelect={setSelectedId}
                      onRename={(id, name) => void handleRename(id, name)}
                      onStartEditing={setEditingNodeId}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Path</p>
            <div className="breadcrumb">
              <span>..</span>
              {breadcrumb.map((node) => (
                <span key={node.id}>/{node.name}</span>
              ))}
            </div>
          </div>
          <div className="header-actions">
            <div className={`save-pill ${saveState}`}>{saveState === "saving" ? "Saving..." : "Auto saved"}</div>
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleAddCodeBlock()}
              disabled={!selectedNode || selectedNode.type !== "file"}
            >
              新規コードブロック
            </button>
          </div>
        </header>

        <section className="editor-frame">
          {error ? <div className="error-banner">{error}</div> : null}

          {!selectedNode ? (
            <div className="canvas-empty">
              <h2>ページを作成して始めましょう</h2>
              <p>左のサイドバーから新しいページやフォルダーを追加できます。</p>
            </div>
          ) : selectedNode.type === "folder" ? (
            <div className="canvas-empty">
              <h2>{selectedNode.name}</h2>
              <p>このフォルダーは本文を持ちません。配下にファイルを作成して内容を書けます。</p>
            </div>
          ) : (
            <>
              <div className="page-meta">
                <div>
                  <p className="eyebrow">Current File</p>
                  <h2>{selectedNode.name}</h2>
                </div>
                <span className="timestamp">Updated {prettyDateLabel(pageUpdatedAt)}</span>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd}>
                <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
                  <div className="block-stack">
                    {blocks.map((block) => (
                      <SortableBlock key={block.id} block={block} onChange={updateBlock} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <button
                type="button"
                className="secondary-button wide-button"
                onClick={() => setBlocks((prev) => [...prev, createEmptyTextBlock()])}
              >
                段落を追加
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
