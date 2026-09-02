(function () {
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };

  var THEME_KEY = 'resumate:theme';
  var root = document.documentElement;
  var savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (_) {}
  if (savedTheme === 'light' || savedTheme === 'dark') root.setAttribute('data-theme', savedTheme);

  var actions = $('.top-actions');
  if (actions) {
    var themeButton = document.createElement('button');
    themeButton.type = 'button';
    themeButton.className = 'theme-toggle';
    themeButton.setAttribute('data-theme-toggle', '');
    themeButton.setAttribute('aria-label', 'Changer de thème');
    themeButton.innerHTML = '<span class="theme-toggle__glyph" aria-hidden="true"></span><span class="theme-toggle__label"></span>';
    actions.insertBefore(themeButton, $('[data-menu]', actions));

    var paintTheme = function () {
      var current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      $('.theme-toggle__label', themeButton).textContent = current === 'light' ? 'Sombre' : 'Clair';
      themeButton.setAttribute('aria-pressed', String(current === 'light'));
      themeButton.title = current === 'light' ? 'Passer au thème sombre' : 'Passer au thème clair';
    };
    paintTheme();
    themeButton.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
      paintTheme();
    });
  }

  var menu = $('[data-menu]');
  var nav = $('[data-main-nav]');
  if (menu && nav) menu.addEventListener('click', function () {
    var open = nav.getAttribute('data-open') !== 'true';
    nav.setAttribute('data-open', String(open));
    menu.setAttribute('aria-expanded', String(open));
  });

  $$('[data-tabs]').forEach(function (tabs) {
    var buttons = $$('.tab', tabs);
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-selected', String(b === button)); });
        var scope = document;
        $$('[data-tab-panel]', scope).forEach(function (panel) {
          panel.hidden = panel.id !== button.getAttribute('aria-controls');
        });
      });
    });
  });

  $$('[data-switch]').forEach(function (button) {
    button.addEventListener('click', function () {
      button.setAttribute('aria-checked', String(button.getAttribute('aria-checked') !== 'true'));
    });
  });

  function toast(title, message) {
    var node = $('[data-toast]');
    if (!node) return;
    $('strong', node).textContent = title;
    $('p', node).textContent = message;
    node.setAttribute('data-open', 'true');
    window.clearTimeout(window.__finalToast);
    window.__finalToast = window.setTimeout(function () { node.setAttribute('data-open', 'false'); }, 2600);
  }

  $$('[data-toast-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      toast(button.getAttribute('data-toast-title') || 'Action enregistrée', button.getAttribute('data-toast-message') || 'La modification est prête à être synchronisée.');
    });
  });

  var search = $('[data-search]');
  if (search) search.addEventListener('input', function () {
    var query = search.value.toLowerCase().trim();
    $$('[data-search-item]').forEach(function (item) {
      item.hidden = item.textContent.toLowerCase().indexOf(query) === -1;
    });
  });

  $$('[data-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      var group = button.parentElement;
      $$('[data-filter]', group).forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
      var value = button.getAttribute('data-filter');
      $$('[data-filter-item]').forEach(function (item) {
        item.hidden = value !== 'all' && item.getAttribute('data-kind') !== value;
      });
    });
  });

  $$('[data-template-card]').forEach(function (card) {
    var select = $('[data-select-template]', card);
    if (!select) return;
    select.addEventListener('click', function () {
      $$('[data-template-card]').forEach(function (c) { c.setAttribute('aria-selected', String(c === card)); });
      toast('Modèle sélectionné', $('h3', card).textContent + ' sera utilisé pour le prochain aperçu.');
    });
  });

  var completion = $('[data-completion]');
  if (completion) {
    var fields = $$('input,textarea,select', $('[data-editor-form]'));
    var updateCompletion = function () {
      var filled = fields.filter(function (field) { return String(field.value || '').trim().length > 0; }).length;
      var value = Math.round((filled / Math.max(1, fields.length)) * 100);
      completion.textContent = value + '%';
      var bar = $('[data-completion-bar]');
      if (bar) bar.style.setProperty('--progress', value + '%');
    };
    fields.forEach(function (field) { field.addEventListener('input', updateCompletion); });
    updateCompletion();
  }
})();
