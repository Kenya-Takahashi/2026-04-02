export type NodeType = "folder" | "file";

export type NodeRow = {
  id: string;
  parent_id: string | null;
  type: NodeType;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PageBlock =
  | {
      id: string;
      type: "text";
      text: string;
    }
  | {
      id: string;
      type: "code";
      language: string;
      code: string;
    };

