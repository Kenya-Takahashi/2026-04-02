document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('memo-title');
  const contentInput = document.getElementById('memo-content');
  const saveBtn = document.getElementById('memo-save');
  const cancelBtn = document.getElementById('memo-cancel');
  const editIdInput = document.getElementById('memo-edit-id');
  const memoList = document.getElementById('memo-list');

  async function loadMemos() {
    const memos = await demoFetch('/api/memos');
    renderMemos(memos);
  }

  function renderMemos(memos) {
    showSteps(3, {
      request: { method: 'GET', url: '/api/memos' },
      response: memos,
    });

    memoList.innerHTML = memos.length === 0
      ? '<p style="color:var(--text-sub)">メモがありません。上のフォームから作成してください。</p>'
      : memos.map(m => `
        <div class="memo-card" data-id="${m.id}">
          <div class="memo-card-title">${esc(m.title)}</div>
          <div class="memo-card-content">${esc(m.content)}</div>
          <div class="memo-card-meta">${m.updated_at}</div>
          <div class="memo-card-actions">
            <button class="btn btn-secondary btn-sm edit-btn" data-id="${m.id}">編集</button>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${m.id}">削除</button>
          </div>
        </div>
      `).join('');
  }

  saveBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    if (!title) return;
    const body = JSON.stringify({ title, content: contentInput.value });
    const editId = editIdInput.value;

    if (editId) {
      const data = await demoFetch(`/api/memos/${editId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body,
      });
      showSteps(3, {
        request: { method: 'PUT', url: `/api/memos/${editId}`, body: { title, content: contentInput.value } },
        response: data,
      });
    } else {
      const data = await demoFetch('/api/memos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      });
      showSteps(3, {
        request: { method: 'POST', url: '/api/memos', body: { title, content: contentInput.value } },
        response: data,
      });
    }

    titleInput.value = '';
    contentInput.value = '';
    editIdInput.value = '';
    cancelBtn.style.display = 'none';
    await sleep(300);
    await loadMemos();
  });

  cancelBtn.addEventListener('click', () => {
    titleInput.value = '';
    contentInput.value = '';
    editIdInput.value = '';
    cancelBtn.style.display = 'none';
  });

  memoList.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('edit-btn')) {
      const res = await fetch('/api/memos');
      const memos = await res.json();
      const memo = memos.find(m => m.id === Number(id));
      if (!memo) return;
      titleInput.value = memo.title;
      contentInput.value = memo.content;
      editIdInput.value = memo.id;
      cancelBtn.style.display = '';
      titleInput.focus();
    }

    if (e.target.classList.contains('delete-btn')) {
      const data = await demoFetch(`/api/memos/${id}`, { method: 'DELETE' });
      showSteps(3, {
        request: { method: 'DELETE', url: `/api/memos/${id}` },
        response: data,
      });
      await sleep(300);
      await loadMemos();
    }
  });

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  loadMemos();
});
