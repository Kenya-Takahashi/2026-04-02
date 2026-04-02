import { useState, useEffect, useCallback } from 'react';
import {
  fetchTemplates,
  fetchTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../lib/api';
import type { TemplateSummary } from '../lib/api';
import type { PromptFormState } from '../types/form';

export function useTemplates() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const list = await fetchTemplates();
      setTemplates(list);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async (
    name: string,
    state: PromptFormState,
    generatedPrompt: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const data = {
        name,
        tab_type: state.mode,
        form_data: JSON.stringify(state),
        generated_prompt: generatedPrompt,
      };
      if (currentTemplateId) {
        await updateTemplate(currentTemplateId, data);
      } else {
        const created = await createTemplate(data);
        setCurrentTemplateId(created.id);
      }
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const saveAs = async (
    name: string,
    state: PromptFormState,
    generatedPrompt: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const created = await createTemplate({
        name,
        tab_type: state.mode,
        form_data: JSON.stringify(state),
        generated_prompt: generatedPrompt,
      });
      setCurrentTemplateId(created.id);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const load = async (id: number): Promise<PromptFormState> => {
    setLoading(true);
    try {
      const detail = await fetchTemplate(id);
      setCurrentTemplateId(id);
      return JSON.parse(detail.form_data) as PromptFormState;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      await deleteTemplate(id);
      if (currentTemplateId === id) setCurrentTemplateId(null);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  return {
    templates,
    currentTemplateId,
    loading,
    save,
    saveAs,
    load,
    remove,
    refresh,
    setCurrentTemplateId,
  };
}
