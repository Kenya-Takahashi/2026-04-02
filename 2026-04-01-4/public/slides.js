document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  const counter = document.getElementById('current-slide');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  let current = 0;

  function show(index) {
    slides.forEach((s, i) => s.style.display = i === index ? '' : 'none');
    counter.textContent = index + 1;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
    current = index;
  }

  prevBtn.addEventListener('click', () => { if (current > 0) show(current - 1); });
  nextBtn.addEventListener('click', () => { if (current < slides.length - 1) show(current + 1); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); if (current > 0) show(current - 1); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); if (current < slides.length - 1) show(current + 1); }
  });

  show(0);
});
