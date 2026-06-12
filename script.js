//theme changer
(function () {
  var sel = document.getElementById('mode-selector');
  if (!sel) return;   // pages without the nav won't error

  var label = document.getElementById('mode-label');

  function syncSelector() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    label.textContent = dark ? 'STOP' : 'RUN';
    sel.setAttribute('aria-pressed', String(dark));
  }
  syncSelector();

  sel.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncSelector();
  });
})();

// h2/h3 anchors
document.querySelectorAll('h2[id], h3[id]').forEach(function (h) {
  var a = document.createElement('a');
  a.className = 'anchor';
  a.href = '#' + h.id;
  a.textContent = '#';
  a.setAttribute('aria-label', 'Link to this section');
  h.appendChild(a);
});