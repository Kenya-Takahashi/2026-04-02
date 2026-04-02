import { SelectField } from '../SelectField';
import { FormField } from '../FormField';
import type { DesignTaste } from '../../../types/form';
import { DESIGN_STYLE_OPTIONS, COLOR_THEME_OPTIONS } from '../../../lib/constants';

interface Props {
  data: DesignTaste;
  onChange: (data: Partial<DesignTaste>) => void;
}

export function DesignTasteSection({ data, onChange }: Props) {
  return (
    <>
      <SelectField
        label="ベーステイスト"
        value={data.baseStyle}
        onChange={(v) => onChange({ baseStyle: v })}
        options={DESIGN_STYLE_OPTIONS}
      />
      {data.baseStyle === 'other' && (
        <FormField
          label="デザインテイスト（詳細）"
          value={data.baseStyleCustom}
          onChange={(v) => onChange({ baseStyleCustom: v })}
          placeholder="デザインの方向性を記述"
        />
      )}
      <SelectField
        label="カラーテーマ"
        value={data.colorTheme}
        onChange={(v) => onChange({ colorTheme: v })}
        options={COLOR_THEME_OPTIONS}
      />
      <FormField
        label="追加のデザイン指示"
        value={data.additionalNotes}
        onChange={(v) => onChange({ additionalNotes: v })}
        type="textarea"
        placeholder="フォントサイズ、角丸の大きさなど、追加の指示があれば"
        rows={2}
      />
    </>
  );
}
