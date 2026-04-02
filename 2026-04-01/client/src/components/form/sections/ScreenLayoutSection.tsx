import { SelectField } from '../SelectField';
import { FormField } from '../FormField';
import type { ScreenLayout, Screen } from '../../../types/form';
import { LAYOUT_PATTERNS } from '../../../lib/constants';

interface Props {
  data: ScreenLayout;
  onChange: (data: Partial<ScreenLayout>) => void;
  onSetScreens: (screens: Screen[]) => void;
}

export function ScreenLayoutSection({ data, onChange, onSetScreens }: Props) {
  const updateScreen = (index: number, field: keyof Screen, value: string) => {
    const newScreens = [...data.screens];
    newScreens[index] = { ...newScreens[index], [field]: value };
    onSetScreens(newScreens);
  };

  const addScreen = () => {
    onSetScreens([...data.screens, { name: '', description: '' }]);
  };

  const removeScreen = (index: number) => {
    if (data.screens.length <= 1) return;
    onSetScreens(data.screens.filter((_, i) => i !== index));
  };

  return (
    <>
      <SelectField
        label="レイアウトパターン"
        value={data.pattern}
        onChange={(v) => onChange({ pattern: v })}
        options={LAYOUT_PATTERNS}
      />
      {data.pattern === 'other' && (
        <FormField
          label="レイアウト詳細"
          value={data.patternCustom}
          onChange={(v) => onChange({ patternCustom: v })}
          placeholder="レイアウトの詳細を記述"
        />
      )}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">画面一覧</label>
        <div className="space-y-2">
          {data.screens.map((screen, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={screen.name}
                  onChange={(e) => updateScreen(i, 'name', e.target.value)}
                  placeholder="画面名"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
                />
                <input
                  type="text"
                  value={screen.description}
                  onChange={(e) => updateScreen(i, 'description', e.target.value)}
                  placeholder="概要"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
                />
              </div>
              <button
                onClick={() => removeScreen(i)}
                className="p-2 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                title="削除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addScreen}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          + 画面を追加
        </button>
      </div>
    </>
  );
}
