const STORAGE_KEY = 'transfer_templates_v1';

export async function loadTemplates(storageAdapter) {
  const raw = (await storageAdapter.get(STORAGE_KEY)) ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function saveTemplates(storageAdapter, templates) {
  await storageAdapter.set(STORAGE_KEY, Array.isArray(templates) ? templates : []);
}

export function createTemplateDraft() {
  return {
    id: `tpl-${Date.now()}`,
    title: 'Новий шаблон',
    rules: []
  };
}
