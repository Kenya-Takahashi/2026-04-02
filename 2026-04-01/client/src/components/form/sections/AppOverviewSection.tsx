import { FormField } from '../FormField';
import type { AppOverview } from '../../../types/form';

interface Props {
  data: AppOverview;
  onChange: (data: Partial<AppOverview>) => void;
}

export function AppOverviewSection({ data, onChange }: Props) {
  return (
    <>
      <FormField
        label="アプリ名"
        value={data.appName}
        onChange={(v) => onChange({ appName: v })}
        placeholder="例: Prompt Forge"
      />
      <FormField
        label="一言説明"
        value={data.description}
        onChange={(v) => onChange({ description: v })}
        placeholder="例: 個人用の習慣トラッカー"
      />
      <FormField
        label="目的・ゴール"
        value={data.goals}
        onChange={(v) => onChange({ goals: v })}
        type="textarea"
        placeholder="このアプリで達成したいことを記述してください"
      />
    </>
  );
}
