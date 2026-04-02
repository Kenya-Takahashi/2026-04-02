import { CheckboxGroup } from '../CheckboxGroup';
import { FormField } from '../FormField';
import type { AuthApi, ExternalApi } from '../../../types/form';
import { AUTH_OPTIONS } from '../../../lib/constants';

interface Props {
  data: AuthApi;
  onChange: (data: Partial<AuthApi>) => void;
  onSetApis: (apis: ExternalApi[]) => void;
}

export function AuthApiSection({ data, onChange, onSetApis }: Props) {
  const updateApi = (index: number, field: keyof ExternalApi, value: string) => {
    const newApis = [...data.externalApis];
    newApis[index] = { ...newApis[index], [field]: value };
    onSetApis(newApis);
  };

  const addApi = () => {
    onSetApis([...data.externalApis, { name: '', usage: '' }]);
  };

  const removeApi = (index: number) => {
    onSetApis(data.externalApis.filter((_, i) => i !== index));
  };

  return (
    <>
      <CheckboxGroup
        label="認証方式"
        options={AUTH_OPTIONS}
        selected={data.authMethods}
        onChange={(v) => onChange({ authMethods: v })}
      />
      {data.authMethods.includes('other') && (
        <FormField
          label="認証方式（詳細）"
          value={data.authCustom}
          onChange={(v) => onChange({ authCustom: v })}
          placeholder="認証方式の詳細"
        />
      )}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">外部API連携</label>
        <div className="space-y-2">
          {data.externalApis.map((api, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={api.name}
                  onChange={(e) => updateApi(i, 'name', e.target.value)}
                  placeholder="API名"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
                />
                <input
                  type="text"
                  value={api.usage}
                  onChange={(e) => updateApi(i, 'usage', e.target.value)}
                  placeholder="用途"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
                />
              </div>
              <button
                onClick={() => removeApi(i)}
                className="p-2 text-gray-300 hover:text-red-400 transition-colors shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addApi}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          + API連携を追加
        </button>
      </div>
    </>
  );
}
