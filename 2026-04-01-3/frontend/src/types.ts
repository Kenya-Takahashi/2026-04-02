export type NodeType = "folder" | "file";

export type NodeItem = {
  id: string;
  parentId: string | null;
  type: NodeType;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TreeNode = NodeItem & {
  children: TreeNode[];
};

export type TextBlock = {
  id: string;
  type: "text";
  text: string;
};

export type CodeBlock = {
  id: string;
  type: "code";
  language: string;
  code: string;
};

export type PageBlock = TextBlock | CodeBlock;

export type PageData = {
  nodeId: string;
  blocks: PageBlock[];
  updatedAt: string | null;
};

