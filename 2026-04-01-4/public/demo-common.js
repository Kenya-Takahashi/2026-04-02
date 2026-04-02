// --- Speed control ---
let demoSpeed = 1000; // default 1s

function getStepDelay() {
  return demoSpeed;
}

function initSpeedControl() {
  const container = document.querySelector('.demo-header');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'speed-control';
  wrapper.innerHTML = `
    <span class="speed-label">⏱ ステップ速度:</span>
    <button class="btn btn-sm speed-btn" data-speed="100">0.1秒</button>
    <button class="btn btn-sm speed-btn active" data-speed="1000">1秒</button>
    <button class="btn btn-sm speed-btn" data-speed="10000">10秒</button>
  `;
  container.appendChild(wrapper);

  wrapper.addEventListener('click', (e) => {
    const btn = e.target.closest('.speed-btn');
    if (!btn) return;
    demoSpeed = Number(btn.dataset.speed);
    wrapper.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', initSpeedControl);

// --- Step visualization ---
function showSteps(stepNum, opts = {}) {
  const container = document.getElementById('steps');
  container.style.display = '';

  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`step${i}`);
    el.classList.toggle('active', i === stepNum);
  }

  if (opts.request) {
    document.getElementById('step1-content').textContent =
      `${opts.request.method} ${opts.request.url}` +
      (opts.request.body ? `\n\n${JSON.stringify(opts.request.body, null, 2)}` : '');
  }

  if (opts.response !== undefined) {
    document.getElementById('step2-content').textContent =
      JSON.stringify(opts.response, null, 2);
  }
}

async function demoFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const reqInfo = { method, url };
  if (options.body) reqInfo.body = JSON.parse(options.body);

  showSteps(1, { request: reqInfo });
  await sleep(getStepDelay());

  const res = await fetch(url, options);
  const data = await res.json();

  showSteps(2, { request: reqInfo, response: data });
  await sleep(getStepDelay());

  return data;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
