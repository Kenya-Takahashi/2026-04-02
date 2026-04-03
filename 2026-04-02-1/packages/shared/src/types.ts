export type RatingLevel = 0 | 1 | 2 | 3 | 4;

export type Priority = "高" | "中" | "低";

export interface ActionPlan {
  text: string;
  priority: Priority;
}

export interface Ratings {
  [key: string]: RatingLevel;
}

export interface Session {
  id: number;
  date: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Presentation {
  id: number;
  sessionId: number;
  studentName: string;
  thesisTitle: string;
  displayOrder: number;
  notes: string;
  ratings: Ratings;
  goodPoints: string[];
  issues: string[];
  actionPlans: ActionPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionWithPresentations extends Session {
  presentations: Presentation[];
}

export interface RatingKey {
  key: string;
  labelJa: string;
  labelEn: string;
}

export interface RatingLabelInfo {
  value: RatingLevel;
  label: string;
  color: string;
}
