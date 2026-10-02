/*
 * RB Glazy – Mix Checklist
 * Version: 1.0.0
 *
 * Read-only recipe-page helper for Glazy.
 *
 * Behaviour intentionally preserved from the latest working bookmarklet:
 * - Finds the ingredient table on an individual Glazy recipe page.
 * - Reorders ingredients into Ronald's established mixing order.
 * - Optionally gives possibly hard-panning materials their own section.
 * - Adds a large checkbox to every ingredient.
 * - Clicking anywhere on an ingredient row checks/unchecks it.
 * - Keeps checked state when Glazy refreshes the displayed table.
 * - Never writes recipe data back to Glazy.
 *
 * Styling lives in mix-checklist.css.
 */

(function () {
  'use strict';

  /* Keep all runtime state behind one deliberately namespaced global. */
  var GLOBAL_NAME = 'RBGlazyMixChecklist';

  /* The tool only makes sense on an individual recipe page. */
  var section = document.querySelector('#recipe-section');
  if (!section) {
    alert('Open a Glazy recipe page first.');
    return;
  }

  /*
   * Re-running the launcher on the same recipe should refresh the existing
   * instance rather than create duplicate tables, listeners or observers.
   */
  if (window[GLOBAL_NAME] && window[GLOBAL_NAME].section === section) {
    window[GLOBAL_NAME].refresh();
    return;
  }

  /* If an old instance belongs to another page/section, tear it down first. */
  if (window[GLOBAL_NAME]) {
    window[GLOBAL_NAME].stop();
  }

  var includeHardpanning = confirm(
    'Include a separate Hardpanning section?\n\n' +
    'Cancel places those materials under Other Materials.'
  );

  /* Checked rows remain checked while Glazy updates the recipe display. */
  var checked = new Map();

  var panel = document.createElement('div');
  panel.id = 'rb-glazy-mix-checklist';

  var hiddenWrapper = null;
  var oldDisplay = '';
  var pending = false;

  /*
   * Find the recipe table by its headings rather than depending on a brittle
   * position in the page.
   */
  function recipeTable() {
    return Array.from(
      section.querySelectorAll('table[data-slot="table"]')
    ).find(function (table) {
      var headings = Array.from(table.querySelectorAll('thead th')).map(
        function (heading) {
          return heading.textContent.trim().toLowerCase();
        }
      );

      return headings[0] === 'material' && headings.indexOf('amount') !== -1;
    });
  }

  function label(row) {
    return (row.cells[0] ? row.cells[0].textContent : '').trim();
  }

  function sectionRow(title, columns) {
    var row = document.createElement('tr');
    row.className = 'rb-mix-section';

    var cell = document.createElement('td');
    cell.colSpan = columns;
    cell.textContent = title;

    row.appendChild(cell);
    return row;
  }

  /*
   * Rebuild the read-only checklist view from Glazy's current recipe table.
   * The original Glazy table is hidden rather than altered.
   */
  function refresh() {
    var source = recipeTable();
    if (!source || !source.tBodies[0]) {
      return;
    }

    var wrapper =
      source.closest('[data-slot="table-container"]') || source;

    /*
     * If Glazy replaced the table wrapper during a page update, restore the
     * previous wrapper before hiding the new one.
     */
    if (hiddenWrapper !== wrapper) {
      if (hiddenWrapper) {
        hiddenWrapper.style.display = oldDisplay;
      }

      hiddenWrapper = wrapper;
      oldDisplay = wrapper.style.display;
    }

    var rows = Array.from(source.tBodies[0].rows);

    var baseIndex = rows.findIndex(function (row) {
      return label(row).toLowerCase() === 'total base';
    });

    var totalIndex = rows.findIndex(function (row) {
      return label(row).toLowerCase() === 'total';
    });

    var baseTotal = baseIndex >= 0 ? rows[baseIndex] : null;
    var grandTotal = totalIndex >= 0 ? rows[totalIndex] : null;

    /*
     * "Add Water" is deliberately omitted from the mixing-order checklist.
     * Totals are retained separately and inserted in their usual positions.
     */
    var isMaterialRow = function (row) {
      var name = label(row).toLowerCase();

      return (
        row.cells.length &&
        name &&
        name !== 'total base' &&
        name !== 'total' &&
        name !== 'add water'
      );
    };

    var base = (
      baseIndex >= 0 ? rows.slice(0, baseIndex) : rows
    ).filter(isMaterialRow);

    var additives = (
      baseIndex >= 0
        ? rows.slice(
            baseIndex + 1,
            totalIndex >= 0 ? totalIndex : rows.length
          )
        : []
    ).filter(isMaterialRow);

    var nameOf = function (row) {
      return label(row).toLowerCase();
    };

    /*
     * Bentonite is always pulled out first, even if Glazy lists it among
     * additives rather than the base recipe.
     */
    var bentonite = base.concat(additives).filter(function (row) {
      return nameOf(row).includes('bentonite');
    });

    var withoutBentonite = function (row) {
      return bentonite.indexOf(row) === -1;
    };

    base = base.filter(withoutBentonite);
    additives = additives.filter(withoutBentonite);

    /*
     * Classification order matters:
     * hard-panning terms are collected before flocculating terms, so a material
     * such as calcined kaolin is classified as hard-panning.
     */
    var hardWords = [
      'silica',
      'frit',
      'spar',
      'neph',
      'calcined'
    ];

    var flocWords = [
      'kaolin',
      'china clay',
      'ball clay',
      'gerstley',
      'borate',
      'zinc',
      'talc',
      'magnesium'
    ];

    var used = new Set();

    function collect(words) {
      var found = [];

      words.forEach(function (word) {
        base.forEach(function (row) {
          if (!used.has(row) && nameOf(row).includes(word)) {
            found.push(row);
            used.add(row);
          }
        });
      });

      return found;
    }

    var hard = collect(hardWords);
    var floc = collect(flocWords);

    var other = base.filter(function (row) {
      return !used.has(row);
    });

    /*
     * If the user declines the separate hard-panning section, those rows return
     * to Other Materials and are sorted there alphabetically.
     */
    if (!includeHardpanning) {
      other = other.concat(hard);
      hard = [];
    }

    var alphabetical = function (a, b) {
      return label(a).localeCompare(label(b));
    };

    other.sort(alphabetical);
    additives.sort(alphabetical);

    /*
     * Build a fresh display table so Glazy's own source table and data remain
     * untouched.
     */
    var view = document.createElement('table');
    view.className = source.className;
    view.classList.add('rb-mix-table');
    view.appendChild(source.tHead.cloneNode(true));

    var body = view.createTBody();

    /*
     * A material can theoretically appear more than once. Include an occurrence
     * counter so each checkbox has a stable identity within the displayed recipe.
     */
    var occurrences = Object.create(null);

    function appendIngredient(row) {
      var copy = row.cloneNode(true);

      var link = row.cells[0].querySelector(
        'a[href*="/materials/"],a[href*="/recipes/"]'
      );

      var identity =
        (link ? link.getAttribute('href') : label(row)) +
        '|' +
        label(row);

      occurrences[identity] = (occurrences[identity] || 0) + 1;

      var key =
        identity +
        '|' +
        occurrences[identity];

      var box = document.createElement('input');
      box.type = 'checkbox';
      box.className = 'rb-mix-checkbox';
      box.checked = checked.get(key) || false;
      box.setAttribute('aria-label', 'Added ' + label(row));

      copy.classList.add('rb-mix-ingredient-row');

      /*
       * Dirty-hand/"sausage finger" behaviour:
       * clicking anywhere on the ingredient row toggles its checkbox.
       * Ingredient links do not navigate while the checklist is active.
       */
      copy.addEventListener('click', function (event) {
        if (event.target === box) {
          return;
        }

        if (event.target.closest('a')) {
          event.preventDefault();
        }

        box.click();
      });

      box.addEventListener('change', function () {
        checked.set(key, box.checked);
        copy.classList.toggle('rb-mix-done', box.checked);
      });

      copy.classList.toggle('rb-mix-done', box.checked);

      var target =
        copy.cells[0].firstElementChild ||
        copy.cells[0];

      target.insertBefore(box, target.firstChild);
      body.appendChild(copy);
    }

    function appendGroup(title, group) {
      if (!group.length) {
        return;
      }

      body.appendChild(
        sectionRow(
          title,
          view.tHead.rows[0].cells.length
        )
      );

      group.forEach(appendIngredient);
    }

    appendGroup('Bentonite ALWAYS first', bentonite);
    appendGroup('Flocculating Materials', floc);
    appendGroup('Other Materials', other);
    appendGroup('Possibly Hardpanning Materials', hard);

    if (baseTotal) {
      body.appendChild(baseTotal.cloneNode(true));
    }

    appendGroup('Additives/Colourants', additives);

    if (grandTotal) {
      body.appendChild(grandTotal.cloneNode(true));
    }

    panel.replaceChildren(view);

    if (
      panel.parentNode !== wrapper.parentNode ||
      panel.nextSibling !== wrapper
    ) {
      wrapper.parentNode.insertBefore(panel, wrapper);
    }

    wrapper.style.display = 'none';
  }

  /*
   * Glazy can redraw the recipe table when amounts or other display state
   * change. Watch the recipe section and rebuild the checklist when necessary.
   */
  var observer = new MutationObserver(function (changes) {
    var checklistOnlyChanges = changes.every(function (change) {
      return (
        panel.contains(change.target) ||
        (
          change.addedNodes.length + change.removedNodes.length > 0 &&
          Array.from(change.addedNodes)
            .concat(Array.from(change.removedNodes))
            .every(function (node) {
              return node === panel || panel.contains(node);
            })
        )
      );
    });

    if (checklistOnlyChanges || pending) {
      return;
    }

    pending = true;

    requestAnimationFrame(function () {
      pending = false;
      refresh();
    });
  });

  observer.observe(section, {
    subtree: true,
    childList: true,
    characterData: true
  });

  window[GLOBAL_NAME] = {
    section: section,
    refresh: refresh,

    /*
     * Restore Glazy's original table and remove only DOM/runtime state owned by
     * this plugin. The externally loaded stylesheet is intentionally left alone;
     * the shared loader is responsible for preventing duplicate CSS loads.
     */
    stop: function () {
      observer.disconnect();
      panel.remove();

      if (hiddenWrapper) {
        hiddenWrapper.style.display = oldDisplay;
      }

      delete window[GLOBAL_NAME];
    }
  };

  refresh();
})();
