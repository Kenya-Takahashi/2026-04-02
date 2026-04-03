export type ProjectStatus = "active" | "completed" | "archived";
export type TaskLevel = "epic" | "story" | "task";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type SprintStatus = "planning" | "active" | "review" | "completed";
export type ActivityType =
  | "task_done"
  | "note_created"
  | "inbox_processed"
  | "focus_completed"
  | "sprint_completed";
export type OAuthProvider = "google";

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface OAuthAccount {
  user_id: string;
  provider: OAuthProvider;
  provider_account_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  session_token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary extends Project {
  taskCount: number;
  openTaskCount: number;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string;
  parent_id: string | null;
  level: TaskLevel;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskTreeNode extends Task {
  children: TaskTreeNode[];
  project_name: string;
  is_in_daily_focus: boolean;
  note_count: number;
}

export interface TaskOption {
  id: string;
  title: string;
  level: TaskLevel;
  status: TaskStatus;
  project_id: string;
  project_name: string;
  parent_id: string | null;
  parent_title: string | null;
  parent_level: TaskLevel | null;
  ancestor_title: string | null;
  ancestor_level: TaskLevel | null;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface WikiLinkResolution {
  id: string;
  title: string;
}

export interface NoteSummary extends Note {
  preview: string;
  linked_task_count: number;
}

export interface NoteDetail extends NoteSummary {
  linked_tasks: TaskOption[];
  resolved_links: WikiLinkResolution[];
  unresolved_titles: string[];
}

export interface TagSummary {
  tag: string;
  count: number;
}

export interface InboxItem {
  id: string;
  user_id: string;
  content: string;
  source: string | null;
  processed: number;
  processed_to: "task" | "note" | "trash" | null;
  processed_ref: string | null;
  created_at: string;
}

export interface Sprint {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  goal: string | null;
  status: SprintStatus;
  retro_note: string | null;
  created_at: string;
}

export interface SprintSummary extends Sprint {
  total_tasks: number;
  done_tasks: number;
}

export interface SprintBoardCard extends TaskOption {
  priority: number;
  note_count: number;
  is_in_daily_focus: boolean;
}

export interface SprintBoardData {
  sprint: SprintSummary;
  todo: SprintBoardCard[];
  in_progress: SprintBoardCard[];
  done: SprintBoardCard[];
  unassigned_tasks: SprintBoardCard[];
}

export interface DailyFocusItem {
  id: string;
  user_id: string;
  date: string;
  task_id: string;
  sort_order: number;
  completed: number;
  reflection: string | null;
  task_title: string;
  task_status: TaskStatus;
  project_id: string;
  project_name: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  type: ActivityType;
  ref_id: string | null;
  description: string | null;
  created_at: string;
}

export interface ActivityByDay {
  date: string;
  total: number;
  task_done_count: number;
  note_created_count: number;
  inbox_processed_count: number;
  focus_completed_count: number;
  sprint_completed_count: number;
}

export interface ReviewSummary {
  sprint: SprintSummary | null;
  completed_task_count: number;
  note_count: number;
  inbox_processed_count: number;
  focus_completed_count: number;
  activity_by_day: ActivityByDay[];
}
