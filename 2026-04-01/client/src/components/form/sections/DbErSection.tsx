import { FormField } from '../FormField';
import type { Table } from '../../../types/form';

interface Props {
  tables: Table[];
  onChange: (tables: Table[]) => void;
}

export function DbErSection({ tables, onChange }: Props) {
  const updateTable = (index: number, field: keyof Table, value: string) => {
    const newTables = [...tables];
    newTables[index] = { ...newTables[index], [field]: value };
    onChange(newTables);
  };

  const addTable = () => {
    onChange([...tables, { name: '', columns: '', relations: '' }]);
  };

  const removeTable = (index: number) => {
    onChange(tables.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {tables.map((table, i) => (
        <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">テーブル {i + 1}</span>
            <button
              onClick={() => removeTable(i)}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              削除
            </button>
          </div>
          <FormField
            label="テーブル名"
            value={table.name}
            onChange={(v) => updateTable(i, 'name', v)}
            placeholder="例: users"
          />
          <FormField
            label="カラム一覧（「カラム名: 型」を1行ずつ）"
            value={table.columns}
            onChange={(v) => updateTable(i, 'columns', v)}
            type="textarea"
            placeholder={"id: INTEGER PRIMARY KEY\nname: TEXT NOT NULL\nemail: TEXT UNIQUE"}
            rows={4}
          />
          <FormField
            label="主要リレーション"
            value={table.relations}
            onChange={(v) => updateTable(i, 'relations', v)}
            placeholder="例: users.id → posts.user_id"
          />
        </div>
      ))}
      <button
        onClick={addTable}
        className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        + テーブルを追加
      </button>
    </div>
  );
}
