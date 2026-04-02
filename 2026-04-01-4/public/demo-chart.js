document.addEventListener('DOMContentLoaded', () => {
  const categorySelect = document.getElementById('chart-category');
  const fetchBtn = document.getElementById('chart-fetch');
  let chartInstance = null;

  fetchBtn.addEventListener('click', async () => {
    const cat = categorySelect.value;
    const url = cat ? `/api/sales?category=${encodeURIComponent(cat)}` : '/api/sales';
    const data = await demoFetch(url);

    showSteps(3, {
      request: { method: 'GET', url },
      response: data,
    });
    document.getElementById('step3-content').innerHTML =
      `<span style="color:var(--accent)">✓ ${data.length} 件のデータを下のグラフに反映しました</span>`;

    renderChart(data, cat);
    document.querySelector('.chart-area').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  function renderChart(data, selectedCategory) {
    const canvas = document.getElementById('sales-chart');
    if (chartInstance) chartInstance.destroy();

    if (selectedCategory) {
      // Single category: bar chart
      const labels = data.map(d => d.month);
      const values = data.map(d => d.amount);
      chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: selectedCategory + ' 売上',
            data: values,
            backgroundColor: '#2383E2',
            borderRadius: 4,
          }],
        },
        options: chartOptions('月別売上（円）'),
      });
    } else {
      // All categories: line chart
      const months = [...new Set(data.map(d => d.month))].sort();
      const categories = [...new Set(data.map(d => d.category))];
      const colors = ['#2383E2', '#EB5757', '#00A86B', '#F2994A'];
      const datasets = categories.map((cat, i) => ({
        label: cat,
        data: months.map(m => {
          const row = data.find(d => d.category === cat && d.month === m);
          return row ? row.amount : 0;
        }),
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length] + '22',
        fill: true,
        tension: 0.3,
      }));
      chartInstance = new Chart(canvas, {
        type: 'line',
        data: { labels: months, datasets },
        options: chartOptions('カテゴリ別月次売上（円）'),
      });
    }
  }

  function chartOptions(title) {
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: { display: true, text: title, font: { size: 14 } },
        legend: { position: 'bottom' },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => '¥' + v.toLocaleString(),
          },
        },
      },
    };
  }
});
