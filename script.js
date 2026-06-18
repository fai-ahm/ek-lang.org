document.querySelectorAll('input[name=codetype]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.code-block').forEach(b => b.classList.remove('active'));
    document.getElementById('block-' + radio.value).classList.add('active');
  });
});
