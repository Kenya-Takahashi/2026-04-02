interface Props {
  onClose: () => void;
}

const steps = [
  {
    number: 1,
    title: "メモを取る",
    description: "発表を聞きながら、メモ欄に自由にメモを取る。",
    detail: "キーワード、気になった点、質問したいことなどを書き留める。",
    color: "blue",
  },
  {
    number: 2,
    title: "Claudeに評価を依頼",
    description: "メモと研究要素をClaudeに投げて、4段階で評価してもらう。",
    detail:
      "別タブでClaudeを開き、メモの内容をコピーして以下のように依頼する:",
    prompt: `以下は卒論ゼミでの発表メモです。研究要素を4段階（不足/要改善/良好/優秀）で評価してください。

【発表者】○○
【テーマ】○○
【メモ】
（ここにメモを貼り付け）

評価してほしい研究要素:
1. 研究の新規性
2. 問題設定の明確さ
3. 関連研究の調査
4. 手法の妥当性
5. 実験計画
6. 実現可能性
7. 社会的意義`,
    color: "purple",
  },
  {
    number: 3,
    title: "評価を記録",
    description: "Claudeの回答を参考に、研究要素評価パネルで各項目を選択する。",
    detail: "要注意項目が自動でハイライトされるので、コメントの方針が見える。",
    color: "amber",
  },
  {
    number: 4,
    title: "Claudeにフィードバックを依頼",
    description:
      "メモと評価結果をもとに、良い点・指摘事項・アクションプランを提案してもらう。",
    prompt: `上記の評価を踏まえ、以下の3点を提案してください:

1. 良い点（2〜3個）
2. 指摘事項（具体的に）
3. アクションプラン（優先度: 高/中/低をつけて）

正論だけでなく、次に何をすべきか具体的なアクションまで示してください。`,
    color: "green",
  },
  {
    number: 5,
    title: "フィードバックを記録",
    description:
      "Claudeの提案を参考に、良い点・指摘事項・アクションプランを入力する。",
    detail:
      "自分の言葉で調整しながら入力。アクションプランには優先度（高/中/低）をつける。",
    color: "rose",
  },
];

const stepColors: Record<string, { bg: string; border: string; badge: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-500" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-500" },
  green: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-500" },
  rose: { bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-500" },
};

export function WorkflowPage({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            ゼミコメントワークフロー
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500 mb-2">
            発表を聞きながら、以下の流れでメモ → Claude支援 → コメントを構築します。
          </p>

          {steps.map((step) => {
            const colors = stepColors[step.color];
            return (
              <div
                key={step.number}
                className={`${colors.bg} border ${colors.border} rounded-lg p-4`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`${colors.badge} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    {step.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                    {step.detail && (
                      <p className="text-xs text-gray-500 mt-1">{step.detail}</p>
                    )}
                    {step.prompt && (
                      <pre className="mt-2 p-3 bg-white/70 border border-gray-200 rounded text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {step.prompt}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
