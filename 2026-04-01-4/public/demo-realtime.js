document.addEventListener('DOMContentLoaded', () => {
  let intervalId = null;

  async function poll() {
    try {
      // Fetch status
      const statusUrl = '/api/server/status';
      showSteps(1, { request: { method: 'GET', url: statusUrl } });
      await sleep(getStepDelay());

      const status = await fetch(statusUrl).then(r => r.json());
      const requests = await fetch('/api/server/requests').then(r => r.json());

      const combined = { status, requests };
      showSteps(2, {
        request: { method: 'GET', url: statusUrl },
        response: combined,
      });
      await sleep(getStepDelay());

      // Render Step 3
      showSteps(3, {
        request: { method: 'GET', url: statusUrl },
        response: combined,
      });

      const statusEl = document.getElementById('server-status');
      const upHours = Math.floor(status.uptime_seconds / 3600);
      const upMins = Math.floor((status.uptime_seconds % 3600) / 60);
      const upSecs = status.uptime_seconds % 60;

      statusEl.innerHTML = `
        <div class="status-grid">
          <div class="status-card">
            <div class="status-card-label">稼働時間</div>
            <div class="status-card-value">${upHours}h ${upMins}m ${upSecs}s</div>
          </div>
          <div class="status-card">
            <div class="status-card-label">メモリ (RSS)</div>
            <div class="status-card-value">${status.memory_mb} MB</div>
          </div>
          <div class="status-card">
            <div class="status-card-label">Heap 使用量</div>
            <div class="status-card-value">${status.heap_used_mb} MB</div>
          </div>
          <div class="status-card">
            <div class="status-card-label">Node.js</div>
            <div class="status-card-value">${status.node_version}</div>
          </div>
          <div class="status-card">
            <div class="status-card-label">総リクエスト数</div>
            <div class="status-card-value">${requests.total}</div>
          </div>
          <div class="status-card">
            <div class="status-card-label">プラットフォーム</div>
            <div class="status-card-value">${status.platform}</div>
          </div>
        </div>
        <h3 style="font-size:1rem;margin-bottom:8px">エンドポイント別リクエスト数</h3>
        <table class="request-table">
          <thead><tr><th>メソッド</th><th>パス</th><th>回数</th></tr></thead>
          <tbody>
            ${requests.by_endpoint.map(r => `
              <tr><td>${r.method}</td><td>${r.path}</td><td>${r.count}</td></tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      console.error('Poll error:', e);
    }
  }

  function scheduleNext() {
    // Poll interval = step delay * 2 (for step1 + step2) + 1s buffer
    const interval = getStepDelay() * 2 + 1000;
    intervalId = setTimeout(async () => {
      await poll();
      scheduleNext();
    }, interval);
  }

  poll().then(scheduleNext);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(intervalId);
    } else {
      poll().then(scheduleNext);
    }
  });
});
