import { useMemo } from 'react';
import type { PromptFormState } from '../types/form';
import { buildMarkdown } from '../lib/markdownBuilder';

export function useMarkdownGenerator(state: PromptFormState): string {
  return useMemo(() => buildMarkdown(state), [state]);
}
