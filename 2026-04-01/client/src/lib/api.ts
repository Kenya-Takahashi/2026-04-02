const BASE = '/api/templates';

export interface TemplateSummary {
  id: number;
  name: string;
  tab_type: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateDetail extends TemplateSummary {
  form_data: string;
  generated_prompt: string;
}

export async function fetchTemplates(): Promise<TemplateSummary[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function fetchTemplate(id: number): Promise<TemplateDetail> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch template');
  return res.json();
}

export async function createTemplate(data: {
  name: string;
  tab_type: string;
  form_data: string;
  generated_prompt: string;
}): Promise<TemplateDetail> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create template');
  return res.json();
}

export async function updateTemplate(
  id: number,
  data: { name: string; tab_type: string; form_data: string; generated_prompt: string }
): Promise<TemplateDetail> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update template');
  return res.json();
}

export async function deleteTemplate(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete template');
}
