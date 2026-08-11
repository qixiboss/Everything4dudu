/* ============================================================
 * Module: StudyRecord
 * 按月展示“日期 × 词集栏目”完成表，记录交给 LearningProgress 保存。
 * ============================================================ */
WordTales.StudyRecord = (function() {
  var overlay = null;
  var panel = null;
  var activeMonth = null;
  var previousFocus = null;
  var previousBodyOverflow = '';
  var initialized = false;
  var weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function pad(value) { return ('0' + value).slice(-2); }
  function dateKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }
  function normalizeDate(value) {
    if (value == null) return new Date();
    if (Object.prototype.toString.call(value) === '[object Date]') return new Date(value.getTime());
    var match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Date(value);
  }
  function monthStart(value) {
    var date = normalizeDate(value);
    if (isNaN(date.getTime())) date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  function addMonths(date, offset) {
    return new Date(date.getFullYear(), date.getMonth() + offset, 1);
  }
  function monthDates(value) {
    var start = monthStart(value);
    var count = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    var dates = [];
    for (var day = 1; day <= count; day++) dates.push(new Date(start.getFullYear(), start.getMonth(), day));
    return dates;
  }
  function sameMonth(left, right) {
    return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
  }
  function sameDay(left, right) { return dateKey(left) === dateKey(right); }
  function isFuture(date) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() > today.getTime();
  }
  function formatMonth(date) { return date.getFullYear() + '年' + (date.getMonth() + 1) + '月'; }
  function formatFullDate(date) { return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日'; }

  function appendElement(parent, tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    parent.appendChild(element);
    return element;
  }
  function createButton(className, text, label) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    if (label) button.setAttribute('aria-label', label);
    return button;
  }
  function setBackgroundInert(inert) {
    document.querySelectorAll('.library-view').forEach(function(element) { element.inert = inert; });
  }
  function focusableElements() {
    if (!overlay) return [];
    return Array.prototype.filter.call(
      overlay.querySelectorAll('button, input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
      function(element) { return !element.disabled && element.getClientRects().length > 0; }
    );
  }
  function handleKeydown(event) {
    if (!overlay || !overlay.classList.contains('active')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusables = focusableElements();
    if (!focusables.length) { event.preventDefault(); overlay.focus(); return; }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function scrollTodayIntoView(container) {
    if (!sameMonth(activeMonth, new Date())) return;
    setTimeout(function() {
      if (!container || !overlay || !overlay.classList.contains('active')) return;
      var todayHeading = container.querySelector('.record-date-today');
      var rowHeading = container.querySelector('.record-row-label');
      if (!todayHeading) return;
      var stickyWidth = rowHeading ? rowHeading.offsetWidth : 0;
      var containerRect = container.getBoundingClientRect();
      var headingRect = todayHeading.getBoundingClientRect();
      var targetLeft = container.scrollLeft + headingRect.left - containerRect.left - stickyWidth - 10;
      container.scrollLeft = Math.max(0, targetLeft);
    }, 0);
  }
  function renderTable(focusAction) {
    panel.innerHTML = '';
    var today = new Date();
    var dates = monthDates(activeMonth);

    var header = appendElement(panel, 'div', 'record-panel-head');
    var heading = appendElement(header, 'div', 'record-heading');
    appendElement(heading, 'p', 'record-eyebrow', 'Study check-in');
    var title = appendElement(heading, 'h2', '', '学习记录表');
    title.id = 'studyRecordTitle';
    appendElement(heading, 'p', 'record-intro', '在已完成的栏目中打勾，记录会自动保存在当前浏览器。');
    var closeButton = createButton('record-close', '×', '关闭学习记录表');
    closeButton.addEventListener('click', close);
    header.appendChild(closeButton);

    var toolbar = appendElement(panel, 'div', 'record-toolbar');
    var monthControls = appendElement(toolbar, 'div', 'record-month-controls');
    monthControls.setAttribute('role', 'group');
    monthControls.setAttribute('aria-label', '切换记录月份');
    var previousButton = createButton('record-nav-button', '‹', '上一个月');
    previousButton.setAttribute('data-record-action', 'previous');
    previousButton.addEventListener('click', function() { activeMonth = addMonths(activeMonth, -1); renderTable('previous'); });
    monthControls.appendChild(previousButton);
    var currentButton = createButton('record-today-button', '本月');
    currentButton.setAttribute('data-record-action', 'current');
    currentButton.disabled = sameMonth(activeMonth, today);
    currentButton.addEventListener('click', function() { activeMonth = monthStart(today); renderTable('current'); });
    monthControls.appendChild(currentButton);
    var nextButton = createButton('record-nav-button', '›', '下一个月');
    nextButton.setAttribute('data-record-action', 'next');
    nextButton.disabled = sameMonth(activeMonth, today);
    nextButton.addEventListener('click', function() { activeMonth = addMonths(activeMonth, 1); renderTable('next'); });
    monthControls.appendChild(nextButton);
    var monthLabel = appendElement(toolbar, 'p', 'record-month-label', formatMonth(activeMonth));
    monthLabel.setAttribute('aria-live', 'polite');
    monthLabel.setAttribute('tabindex', '-1');
    var saveStatus = appendElement(toolbar, 'p', 'record-save-status', '未打勾表示当天未完成');
    saveStatus.setAttribute('role', 'status');
    saveStatus.setAttribute('aria-live', 'polite');

    var scroller = appendElement(panel, 'div', 'record-table-scroll');
    scroller.setAttribute('tabindex', '0');
    scroller.setAttribute('aria-label', '可横向滚动的学习记录表');
    var table = appendElement(scroller, 'table', 'record-table');
    var caption = appendElement(table, 'caption', 'visually-hidden', formatMonth(activeMonth) + '各词集栏目完成记录');
    caption.id = 'studyRecordCaption';
    var thead = appendElement(table, 'thead');
    var headingRow = appendElement(thead, 'tr');
    var corner = appendElement(headingRow, 'th', 'record-row-label record-corner', '词集·栏目');
    corner.scope = 'col';
    dates.forEach(function(date) {
      var dateHeading = appendElement(headingRow, 'th', 'record-date-heading');
      dateHeading.scope = 'col';
      dateHeading.setAttribute('data-date', dateKey(date));
      if (sameDay(date, today)) {
        dateHeading.classList.add('record-date-today');
        dateHeading.setAttribute('aria-current', 'date');
      }
      appendElement(dateHeading, 'span', 'record-weekday', weekdayLabels[date.getDay()]);
      appendElement(dateHeading, 'strong', 'record-day-number', String(date.getDate()));
    });

    var tbody = appendElement(table, 'tbody');
    WordTales.Data.sets.forEach(function(set) {
      set.columns.forEach(function(column, columnIndex) {
        var row = appendElement(tbody, 'tr', columnIndex === 0 ? 'record-set-start' : '');
        var rowHeading = appendElement(row, 'th', 'record-row-label');
        rowHeading.scope = 'row';
        var labelText = set.label + ' · ' + column.title;
        appendElement(rowHeading, 'span', 'record-row-number', labelText);
        appendElement(rowHeading, 'small', 'record-row-title', column.theme && column.theme.zh ? column.theme.zh : column.title);
        dates.forEach(function(date) {
          var key = dateKey(date);
          var cell = appendElement(row, 'td', 'record-date-cell');
          if (sameDay(date, today)) cell.classList.add('record-date-today');
          var checkLabel = appendElement(cell, 'label', 'record-check');
          var checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = WordTales.LearningProgress.isColumnCompleted(column.id, key);
          checkbox.disabled = isFuture(date);
          checkbox.setAttribute('aria-label', labelText + '，' + formatFullDate(date) + '完成学习');
          checkLabel.appendChild(checkbox);
          if (checkbox.disabled) checkLabel.classList.add('disabled');
          checkbox.addEventListener('change', function() {
            var requested = checkbox.checked;
            var restoreCheckboxFocus = document.activeElement === checkbox;
            checkbox.disabled = true;
            checkLabel.classList.add('saving');
            checkbox.setAttribute('aria-busy', 'true');
            saveStatus.textContent = '正在保存：' + labelText + ' · ' + formatFullDate(date);
            WordTales.LearningProgress.setColumnCompleted(column.id, key, requested).then(function(result) {
              checkbox.checked = result.completed;
              checkbox.disabled = false;
              checkbox.removeAttribute('aria-busy');
              checkLabel.classList.remove('saving');
              if (restoreCheckboxFocus && checkbox.isConnected) checkbox.focus();
              saveStatus.textContent = result.saved
                ? (result.completed ? '已记录：' : '已取消：') + labelText + ' · ' + formatFullDate(date)
                : '保存失败：' + labelText + ' · ' + formatFullDate(date) + '，请重试';
            }).catch(function() {
              checkbox.checked = !requested;
              checkbox.disabled = false;
              checkbox.removeAttribute('aria-busy');
              checkLabel.classList.remove('saving');
              if (restoreCheckboxFocus && checkbox.isConnected) checkbox.focus();
              saveStatus.textContent = '保存失败：' + labelText + ' · ' + formatFullDate(date) + '，请重试';
            });
          });
        });
      });
    });
    scrollTodayIntoView(scroller);
    if (focusAction) {
      setTimeout(function() {
        if (!overlay || !overlay.classList.contains('active')) return;
        var target = panel.querySelector('[data-record-action="' + focusAction + '"]');
        if (!target || target.disabled) target = panel.querySelector('.record-month-label');
        if (target) target.focus();
      }, 0);
    }
  }
  function build() {
    overlay = document.createElement('div');
    overlay.className = 'record-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'studyRecordTitle');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('tabindex', '-1');
    panel = document.createElement('div');
    panel.className = 'record-panel';
    overlay.appendChild(panel);
    overlay.addEventListener('click', function(event) { if (event.target === overlay) close(); });
    overlay.addEventListener('keydown', handleKeydown);
    document.body.appendChild(overlay);
  }
  function open() {
    if (!WordTales.LearningProgress || !WordTales.LearningProgress.isReady()) return;
    if (overlay && overlay.classList.contains('active')) return;
    if (!overlay) build();
    previousFocus = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    activeMonth = monthStart(new Date());
    renderTable();
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    setBackgroundInert(true);
    document.body.style.overflow = 'hidden';
    setTimeout(function() {
      if (!overlay || !overlay.classList.contains('active')) return;
      var closeButton = overlay.querySelector('.record-close');
      (closeButton || overlay).focus();
    }, 0);
  }
  function close() {
    if (!overlay || !overlay.classList.contains('active')) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    setBackgroundInert(false);
    document.body.style.overflow = previousBodyOverflow;
    var target = previousFocus;
    previousFocus = null;
    if (target && target.isConnected && typeof target.focus === 'function') target.focus();
  }
  function init() {
    if (initialized) return;
    var entry = document.getElementById('recordEntry');
    if (!entry || !WordTales.LearningProgress || !WordTales.LearningProgress.isReady()) return;
    initialized = true;
    entry.addEventListener('click', open);
    entry.disabled = false;
    entry.removeAttribute('aria-busy');
  }

  return {
    init: init,
    open: open,
    close: close,
    getMonthStartKey: function(value) { return dateKey(monthStart(value)); },
    getMonthDateKeys: function(value) { return monthDates(value).map(dateKey); }
  };
})();
