import { SelectField } from '../SelectField';
import { FormField } from '../FormField';
import { CheckboxGroup } from '../CheckboxGroup';
import type { CiCd } from '../../../types/form';
import { CONTAINER_OPTIONS, DEPLOY_OPTIONS, CI_OPTIONS } from '../../../lib/constants';

interface Props {
  data: CiCd;
  onChange: (data: Partial<CiCd>) => void;
}

export function CiCdSection({ data, onChange }: Props) {
  return (
    <>
      <SelectField
        label="コンテナ構成"
        value={data.containerConfig}
        onChange={(v) => onChange({ containerConfig: v })}
        options={CONTAINER_OPTIONS}
      />
      {data.containerConfig === 'other' && (
        <FormField
          label="コンテナ構成（詳細）"
          value={data.containerCustom}
          onChange={(v) => onChange({ containerCustom: v })}
          placeholder="コンテナ構成の詳細"
        />
      )}
      <SelectField
        label="デプロイ先"
        value={data.deployTarget}
        onChange={(v) => onChange({ deployTarget: v })}
        options={DEPLOY_OPTIONS}
      />
      {data.deployTarget === 'other' && (
        <FormField
          label="デプロイ先（詳細）"
          value={data.deployCustom}
          onChange={(v) => onChange({ deployCustom: v })}
          placeholder="デプロイ先の詳細"
        />
      )}
      <CheckboxGroup
        label="CI/CDツール"
        options={CI_OPTIONS}
        selected={data.ciTools}
        onChange={(v) => onChange({ ciTools: v })}
      />
      {data.ciTools.includes('other') && (
        <FormField
          label="CI/CDツール（詳細）"
          value={data.ciCustom}
          onChange={(v) => onChange({ ciCustom: v })}
          placeholder="使用するCI/CDツール"
        />
      )}
    </>
  );
}
