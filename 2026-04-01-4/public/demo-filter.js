document.addEventListener('DOMContentLoaded', () => {
  const categorySelect = document.getElementById('filter-category');
  const priceSlider = document.getElementById('filter-price');
  const priceLabel = document.getElementById('price-label');
  const qInput = document.getElementById('filter-q');
  const searchBtn = document.getElementById('filter-search');

  priceSlider.addEventListener('input', () => {
    priceLabel.textContent = Number(priceSlider.value).toLocaleString();
    updatePreview();
  });
  categorySelect.addEventListener('change', updatePreview);
  qInput.addEventListener('input', updatePreview);

  function buildUrl() {
    const params = new URLSearchParams();
    if (categorySelect.value) params.set('category', categorySelect.value);
    if (Number(priceSlider.value) < 50000) params.set('price_max', priceSlider.value);
    if (qInput.value.trim()) params.set('q', qInput.value.trim());
    const qs = params.toString();
    return '/api/products' + (qs ? '?' + qs : '');
  }

  function updatePreview() {
    const url = buildUrl();
    showSteps(1, { request: { method: 'GET', url } });
  }

  searchBtn.addEventListener('click', async () => {
    const url = buildUrl();
    const data = await demoFetch(url);
    showSteps(3, {
      request: { method: 'GET', url },
      response: data,
    });

    const el = document.getElementById('step3-content');
    if (data.length === 0) {
      el.innerHTML = '<p style="color:var(--text-sub)">該当する商品がありません</p>';
    } else {
      el.innerHTML = `
        <p style="color:var(--text-sub);margin-bottom:12px">${data.length} 件の商品が見つかりました</p>
        <div class="product-grid">
          ${data.map(p => `
            <div class="product-card">
              <div class="product-card-name">${esc(p.name)}</div>
              <span class="product-card-category">${esc(p.category)}</span>
              <div class="product-card-price">&yen;${p.price.toLocaleString()}</div>
              ${p.description ? `<div class="product-card-desc">${esc(p.description)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }
  });

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  updatePreview();
});
