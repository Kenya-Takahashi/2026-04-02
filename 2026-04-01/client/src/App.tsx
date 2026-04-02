import { useState } from 'react';
import { Header } from './components/layout/Header';
import { FormPanel } from './components/form/FormPanel';
import { MarkdownPreview } from './components/preview/MarkdownPreview';
import { TemplateSaveDialog } from './components/templates/TemplateSaveDialog';
import { TemplateLoadDialog } from './components/templates/TemplateLoadDialog';
import { useFormState } from './hooks/useFormState';
import { useMarkdownGenerator } from './hooks/useMarkdownGenerator';
import { useTemplates } from './hooks/useTemplates';

export default function App() {
  const { state, dispatch } = useFormState();
  const markdown = useMarkdownGenerator(state);
  const {
    templates,
    currentTemplateId,
    save,
    saveAs,
    load,
    remove,
  } = useTemplates();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  const handleSave = (name: string) => {
    save(name, state, markdown);
  };

  const handleSaveAs = (name: string) => {
    saveAs(name, state, markdown);
  };

  const handleLoad = async (id: number) => {
    const loaded = await load(id);
    dispatch({ type: 'LOAD_TEMPLATE', payload: loaded });
  };

  const handleReset = () => {
    if (confirm('フォームをリセットしますか？入力内容がすべて消去されます。')) {
      dispatch({ type: 'RESET' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        mode={state.mode}
        onModeChange={(mode) => dispatch({ type: 'SET_MODE', payload: mode })}
        onSave={() => setSaveDialogOpen(true)}
        onLoad={() => setLoadDialogOpen(true)}
        onReset={handleReset}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div>
            <FormPanel state={state} dispatch={dispatch} />
          </div>

          {/* Right: Preview */}
          <div className="lg:sticky lg:top-[65px] lg:self-start lg:max-h-[calc(100vh-89px)]">
            <MarkdownPreview markdown={markdown} />
          </div>
        </div>
      </main>

      <TemplateSaveDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        currentTemplateId={currentTemplateId}
        defaultName={state.appOverview.appName}
      />

      <TemplateLoadDialog
        isOpen={loadDialogOpen}
        onClose={() => setLoadDialogOpen(false)}
        templates={templates}
        onLoad={handleLoad}
        onDelete={remove}
      />
    </div>
  );
}
