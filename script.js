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
document.querySelectorAll('.post-content h2[id], .post-content h3[id]').forEach(function (h) {
  var a = document.createElement('a');
  a.className = 'anchor';
  a.href = '#' + h.id;
  a.textContent = '#';
  a.setAttribute('aria-label', 'Link to this section');
  h.appendChild(a);
});

//code copy button
document.addEventListener('DOMContentLoaded', function () {
  var copyIcon = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
  var tickIcon = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5l10-10"/></svg>';

  document.querySelectorAll('.highlight').forEach(function (block) {
    var code = block.querySelector('pre code') || block.querySelector('pre');
    if (!code) return;

    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.innerHTML = copyIcon;
    btn.setAttribute('aria-label', 'Copy code to clipboard');

    btn.addEventListener('click', function () {
      var text = code.textContent.replace(/\n+$/, '');   // drop trailing newline
      navigator.clipboard.writeText(text).then(function () {
        btn.innerHTML = tickIcon;
        btn.classList.add('copied');
        btn.setAttribute('aria-label', 'Copied');
        setTimeout(function () {
          btn.innerHTML = copyIcon;
          btn.classList.remove('copied');
          btn.setAttribute('aria-label', 'Copy code to clipboard');
        }, 1500);
      }).catch(function () { btn.setAttribute('aria-label', 'Copy failed'); });
    });

    block.appendChild(btn);
  });
});