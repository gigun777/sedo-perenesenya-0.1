import { createTemplateDraft, loadTemplates, saveTemplates } from '../storage/templates_store.js';
import { openTemplateEditorModal } from './templateEditorModal.js';

export async function renderTransferSettingsSection(container, api) {
  const { storageAdapter, listJournals, getSchema } = api;
  const templates = await loadTemplates(storageAdapter);

  const journalsRaw = await listJournals();
  const journals = await Promise.all(
    journalsRaw.map(async (journal) => ({
      ...journal,
      fields: (await getSchema(journal.id))?.fields ?? []
    }))
  );

  const render = async () => {
    container.innerHTML = '';

    const list = document.createElement('div');
    templates.forEach((template) => {
      const row = document.createElement('div');
      row.className = 'sdo-settings-row';

      const title = document.createElement('strong');
      title.textContent = template.title;

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Редагувати';
      editBtn.onclick = () =>
        openTemplateEditorModal({
          template,
          journals,
          onSave: async (nextTemplate) => {
            const idx = templates.findIndex((item) => item.id === nextTemplate.id);
            templates[idx] = nextTemplate;
            await saveTemplates(storageAdapter, templates);
            await render();
          }
        });

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Видалити';
      removeBtn.onclick = async () => {
        const idx = templates.findIndex((item) => item.id === template.id);
        templates.splice(idx, 1);
        await saveTemplates(storageAdapter, templates);
        await render();
      };

      row.append(title, editBtn, removeBtn);
      list.append(row);
    });

    const addBtn = document.createElement('button');
    addBtn.textContent = 'Створити шаблон';
    addBtn.onclick = () =>
      openTemplateEditorModal({
        template: createTemplateDraft(),
        journals,
        onSave: async (nextTemplate) => {
          templates.push(nextTemplate);
          await saveTemplates(storageAdapter, templates);
          await render();
        }
      });

    container.append(addBtn, list);
  };

  await render();
}
