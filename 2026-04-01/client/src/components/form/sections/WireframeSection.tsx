import { FormField } from '../FormField';
import type { Wireframe, Screen } from '../../../types/form';

interface Props {
  wireframes: Wireframe[];
  screens: Screen[];
  onChange: (wireframes: Wireframe[]) => void;
}

export function WireframeSection({ wireframes, screens, onChange }: Props) {
  // Sync wireframes with screens
  const filledScreens = screens.filter((s) => s.name);

  const getWireframe = (screenName: string): Wireframe => {
    return (
      wireframes.find((w) => w.screenName === screenName) || {
        screenName,
        components: '',
        userFlow: '',
        stateNotes: '',
      }
    );
  };

  const updateWireframe = (screenName: string, field: keyof Wireframe, value: string) => {
    const existing = wireframes.find((w) => w.screenName === screenName);
    if (existing) {
      onChange(
        wireframes.map((w) =>
          w.screenName === screenName ? { ...w, [field]: value } : w
        )
      );
    } else {
      onChange([
        ...wireframes,
        { screenName, components: '', userFlow: '', stateNotes: '', [field]: value },
      ]);
    }
  };

  if (filledScreens.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        画面構成セクションで画面名を入力すると、ここに詳細入力欄が表示されます。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {filledScreens.map((screen) => {
        const wf = getWireframe(screen.name);
        return (
          <div key={screen.name} className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50/50">
            <span className="text-xs font-semibold text-gray-600">{screen.name}</span>
            <FormField
              label="主要コンポーネント一覧"
              value={wf.components}
              onChange={(v) => updateWireframe(screen.name, 'components', v)}
              type="textarea"
              placeholder="ヘッダー、検索バー、カード一覧..."
              rows={2}
            />
            <FormField
              label="ユーザー操作フロー"
              value={wf.userFlow}
              onChange={(v) => updateWireframe(screen.name, 'userFlow', v)}
              type="textarea"
              placeholder="検索バーにキーワード入力 → 結果表示 → カードクリック → 詳細画面へ"
              rows={2}
            />
            <FormField
              label="状態管理メモ"
              value={wf.stateNotes}
              onChange={(v) => updateWireframe(screen.name, 'stateNotes', v)}
              type="textarea"
              placeholder="ローカルステートで管理、APIからのフェッチ結果をキャッシュ..."
              rows={2}
            />
          </div>
        );
      })}
    </div>
  );
}
