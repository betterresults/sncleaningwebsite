/* Deep cleaning checklist. Ticks and notes stay in this browser. No secrets. */
(function () {
  var root = document.getElementById('deep-cleaning-checklist');
  if (!root) return;
  var KEY = root.getAttribute('data-storage') || 'sn-deep-cleaning-checklist-v1';

  var total = root.querySelectorAll('input[data-kind="done"]').length;
  var progressText = document.getElementById('dcc-progress-text');
  var progressBar = document.getElementById('dcc-progress-bar');

  function readStore() {
    try {
      var raw = localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : null;
      if (!data || typeof data !== 'object') return { tasks: {}, notes: {} };
      return { tasks: data.tasks || {}, notes: data.notes || {} };
    } catch (e) {
      return { tasks: {}, notes: {} };
    }
  }

  function writeStore() {
    var tasks = {};
    root.querySelectorAll('.dcc-task').forEach(function (row) {
      var id = row.getAttribute('data-task');
      if (!id) return;
      var box = row.querySelector('input[data-kind="done"]');
      tasks[id] = { done: !!(box && box.checked) };
    });
    var notes = {};
    root.querySelectorAll('textarea[data-section]').forEach(function (el) {
      notes[el.getAttribute('data-section')] = el.value;
    });
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, tasks: tasks, notes: notes })); } catch (e) {}
  }

  function paint() {
    var done = root.querySelectorAll('input[data-kind="done"]:checked').length;
    if (progressText) progressText.textContent = done + ' of ' + total + ' done';
    if (progressBar) {
      progressBar.style.width = (total ? Math.round((done / total) * 100) : 0) + '%';
      var bar = progressBar.parentNode;
      if (bar) bar.setAttribute('aria-valuenow', String(done));
    }
  }

  var saved = readStore();
  root.querySelectorAll('.dcc-task').forEach(function (row) {
    var id = row.getAttribute('data-task');
    var state = saved.tasks[id] || {};
    var box = row.querySelector('input[data-kind="done"]');
    if (box) box.checked = !!state.done;
  });
  root.querySelectorAll('textarea[data-section]').forEach(function (el) {
    var note = saved.notes[el.getAttribute('data-section')];
    if (typeof note === 'string') el.value = note;
  });
  paint();

  root.addEventListener('change', function (e) {
    if (e.target && (e.target.matches('input[type="checkbox"]') || e.target.matches('textarea'))) {
      writeStore();
      paint();
    }
  });
  root.addEventListener('input', function (e) {
    if (e.target && e.target.matches('textarea')) writeStore();
  });

  function printPage() { window.print(); }
  var printBtn = document.getElementById('dcc-print');
  if (printBtn) printBtn.addEventListener('click', printPage);
  var printBtn2 = document.getElementById('dcc-print-2');
  if (printBtn2) printBtn2.addEventListener('click', printPage);

  var resetBtn = document.getElementById('dcc-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      root.querySelectorAll('input[data-kind="done"]').forEach(function (box) { box.checked = false; });
      root.querySelectorAll('textarea[data-section]').forEach(function (el) { el.value = ''; });
      writeStore();
      paint();
    });
  }
})();
