import type { RatingKey, RatingLabelInfo } from "./types.js";

export const RESEARCH_ELEMENTS: RatingKey[] = [
  { key: "novelty", labelJa: "研究の新規性", labelEn: "Novelty" },
  { key: "problemClarity", labelJa: "問題設定の明確さ", labelEn: "Problem clarity" },
  { key: "literatureReview", labelJa: "関連研究の調査", labelEn: "Literature review" },
  { key: "methodology", labelJa: "手法の妥当性", labelEn: "Methodology validity" },
  { key: "experimentDesign", labelJa: "実験計画", labelEn: "Experiment design" },
  { key: "feasibility", labelJa: "実現可能性", labelEn: "Feasibility" },
  { key: "socialSignificance", labelJa: "社会的意義", labelEn: "Social significance" },
];

export const RATING_LABELS: RatingLabelInfo[] = [
  { value: 0, label: "未評価", color: "gray" },
  { value: 1, label: "不足", color: "red" },
  { value: 2, label: "要改善", color: "yellow" },
  { value: 3, label: "良好", color: "blue" },
  { value: 4, label: "優秀", color: "green" },
];
