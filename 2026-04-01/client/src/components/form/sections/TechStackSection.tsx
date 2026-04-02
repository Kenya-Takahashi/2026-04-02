import { SelectField } from '../SelectField';
import { FormField } from '../FormField';
import type { TechStack } from '../../../types/form';
import {
  FRONTEND_OPTIONS,
  BACKEND_OPTIONS,
  DATABASE_OPTIONS,
  LANGUAGE_OPTIONS,
} from '../../../lib/constants';

interface Props {
  data: TechStack;
  onChange: (data: Partial<TechStack>) => void;
}

export function TechStackSection({ data, onChange }: Props) {
  return (
    <>
      <SelectField
        label="フロントエンド"
        value={data.frontend}
        onChange={(v) => onChange({ frontend: v })}
        options={FRONTEND_OPTIONS}
      />
      {data.frontend === 'other' && (
        <FormField
          label="フロントエンド（詳細）"
          value={data.frontendCustom}
          onChange={(v) => onChange({ frontendCustom: v })}
          placeholder="使用するフレームワーク/ライブラリ"
        />
      )}
      <SelectField
        label="バックエンド"
        value={data.backend}
        onChange={(v) => onChange({ backend: v })}
        options={BACKEND_OPTIONS}
      />
      {data.backend === 'other' && (
        <FormField
          label="バックエンド（詳細）"
          value={data.backendCustom}
          onChange={(v) => onChange({ backendCustom: v })}
          placeholder="使用するフレームワーク"
        />
      )}
      <SelectField
        label="データベース"
        value={data.database}
        onChange={(v) => onChange({ database: v })}
        options={DATABASE_OPTIONS}
      />
      {data.database === 'other' && (
        <FormField
          label="データベース（詳細）"
          value={data.databaseCustom}
          onChange={(v) => onChange({ databaseCustom: v })}
          placeholder="使用するデータベース"
        />
      )}
      <SelectField
        label="言語"
        value={data.language}
        onChange={(v) => onChange({ language: v })}
        options={LANGUAGE_OPTIONS}
      />
    </>
  );
}
