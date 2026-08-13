(function () {
  'use strict';
  var Model = window.CostTraceModel;
  var STORAGE_KEY = 'costtrace.transactions.v1';
  var PAGE_SIZE = 20;
  var CATEGORY_COLORS = ['#6c78d4', '#ec7d88', '#48b59e', '#d99d55', '#8a67bd', '#8491a8'];
  var records = [];
  var selectedMonth = Model.currentMonth();
  var currentPage = 1;
  var toastTimer = 0;

  function one(selector, parent) { return (parent || document).querySelector(selector); }
  function all(selector, parent) { return Array.prototype.slice.call((parent || document).querySelectorAll(selector)); }
  function readRecords() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(value) ? Model.sortRecords(value.map(Model.normalizeRecord).filter(Boolean)) : [];
    } catch (_) { return []; }
  }
  function writeRecords(next) {
    records = Model.sortRecords(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
    catch (_) { showToast('此设备的本地存储空间不足，记录暂未保存。'); return false; }
    window.dispatchEvent(new CustomEvent('costtrace:local-change'));
    renderAll();
    return true;
  }
  function showToast(message) {
    var toast = one('[data-toast]');
    toast.textContent = message; toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 2600);
  }
  function switchView(name) {
    all('[data-view-target]').forEach(function (button) { button.setAttribute('aria-current', button.dataset.viewTarget === name ? 'page' : 'false'); });
    all('[data-view]').forEach(function (view) { var active = view.dataset.view === name; view.hidden = !active; view.classList.toggle('is-active', active); });
    if (name === 'record') window.setTimeout(function () { one('[data-record-detail]').focus(); }, 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function setCategoryOptions(select, categories, includeAll) {
    var previous = select.value;
    select.replaceChildren();
    if (includeAll) { var allOption = document.createElement('option'); allOption.value = ''; allOption.textContent = '全部类别'; select.appendChild(allOption); }
    categories.forEach(function (category) { var option = document.createElement('option'); option.value = category; option.textContent = category; select.appendChild(option); });
    select.value = categories.indexOf(previous) >= 0 || (includeAll && previous === '') ? previous : (includeAll ? '' : categories[0]);
  }
  function currentType() { return one('input[name="record-type"]:checked').value; }
  function updateRecordCategories() { setCategoryOptions(one('[data-record-category]'), Model.categoriesFor(currentType()), false); }
  function resetForm() {
    var form = one('[data-record-form]');
    form.reset();
    one('[data-record-id]').value = '';
    one('[data-record-date]').value = Model.localDate();
    one('[data-record-date]').max = Model.localDate();
    updateRecordCategories();
    one('[data-form-title]').textContent = '记一笔';
    one('[data-form-copy]').textContent = '把今天的每一笔收支清楚地记下来。';
    one('[data-save-record]').textContent = '保存记录';
    one('[data-cancel-edit]').hidden = true;
    var message = one('[data-form-message]'); message.textContent = ''; message.removeAttribute('data-state');
  }
  function id() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
  }
  function submitRecord(event) {
    event.preventDefault();
    var editingId = one('[data-record-id]').value;
    var result = Model.validate({ id: editingId || id(), date: one('[data-record-date]').value, type: currentType(), detail: one('[data-record-detail]').value, category: one('[data-record-category]').value, amount: one('[data-record-amount]').value });
    var message = one('[data-form-message]');
    if (!result.valid) {
      message.textContent = result.message; message.removeAttribute('data-state');
      var field = one('[data-record-' + result.field + ']') || one('input[name="record-type"]');
      if (field) field.focus();
      return;
    }
    var next = records.filter(function (record) { return record.id !== result.value.id; });
    next.push(result.value);
    if (!writeRecords(next)) return;
    resetForm();
    message = one('[data-form-message]'); message.textContent = editingId ? '记录已更新。' : '记录已保存。'; message.dataset.state = 'success';
    showToast(editingId ? '这笔记录已更新' : '已记下这笔收支');
  }
  function editRecord(recordId) {
    var record = records.find(function (item) { return item.id === recordId; });
    if (!record) return;
    switchView('record');
    one('[data-record-id]').value = record.id;
    one('input[name="record-type"][value="' + record.type + '"]').checked = true;
    updateRecordCategories();
    one('[data-record-date]').value = record.date;
    one('[data-record-category]').value = record.category;
    one('[data-record-detail]').value = record.detail;
    one('[data-record-amount]').value = (record.amountCents / 100).toFixed(2);
    one('[data-form-title]').textContent = '编辑记录';
    one('[data-form-copy]').textContent = '修改后会同步更新仪表盘与明细。';
    one('[data-save-record]').textContent = '保存修改';
    one('[data-cancel-edit]').hidden = false;
    one('[data-form-message]').textContent = '';
  }
  function deleteRecord(recordId) {
    var record = records.find(function (item) { return item.id === recordId; });
    if (!record || !window.confirm('确定删除“' + record.detail + '”这笔记录吗？此操作会同步到其他设备。')) return;
    if (writeRecords(records.filter(function (item) { return item.id !== recordId; }))) showToast('记录已删除');
  }
  function empty(message) { return '<div class="empty-chart"><span>⌁</span><div>' + message + '</div></div>'; }
  function formatCompact(cents) {
    var value = Math.abs(cents) / 100;
    if (value >= 10000) return '¥' + (value / 10000).toFixed(value >= 100000 ? 0 : 1) + '万';
    return '¥' + value.toLocaleString('zh-CN', { maximumFractionDigits: value >= 1000 ? 0 : 2 });
  }
  function renderMetrics() {
    var scoped = Model.recordsForMonth(records, selectedMonth);
    var summary = Model.monthSummary(records, selectedMonth);
    one('[data-total-expense]').textContent = Model.formatCurrency(summary.expense);
    one('[data-total-income]').textContent = Model.formatCurrency(summary.income);
    one('[data-total-balance]').textContent = Model.formatCurrency(summary.balance);
    one('[data-expense-count]').textContent = scoped.filter(function (record) { return record.type === 'expense'; }).length + ' 笔支出';
    one('[data-income-count]').textContent = scoped.filter(function (record) { return record.type === 'income'; }).length + ' 笔收入';
    one('[data-total-balance]').closest('.metric').classList.toggle('is-negative', summary.balance < 0);
  }
  function renderComposition() {
    var target = one('[data-composition]');
    var data = Model.expenseComposition(records, selectedMonth);
    var total = data.reduce(function (sum, item) { return sum + item.amountCents; }, 0);
    if (!data.length) { target.innerHTML = empty('这个月还没有支出记录'); return; }
    var circumference = 2 * Math.PI * 54, offset = 0;
    var circles = data.map(function (item, index) {
      var length = circumference * item.percent, circle = '<circle cx="70" cy="70" r="54" fill="none" stroke="' + CATEGORY_COLORS[index % CATEGORY_COLORS.length] + '" stroke-width="16" stroke-dasharray="' + length + ' ' + (circumference - length) + '" stroke-dashoffset="-' + offset + '"><title>' + item.category + ' ' + Model.formatCurrency(item.amountCents) + '</title></circle>';
      offset += length; return circle;
    }).join('');
    var legend = data.map(function (item, index) { return '<div class="legend-row"><i style="background:' + CATEGORY_COLORS[index % CATEGORY_COLORS.length] + '"></i><span>' + item.category + '</span><b>' + Math.round(item.percent * 100) + '% · ' + formatCompact(item.amountCents) + '</b></div>'; }).join('');
    target.innerHTML = '<div class="donut"><svg viewBox="0 0 140 140" role="img" aria-label="支出类型占比">' + circles + '</svg><div class="donut-center"><strong>' + formatCompact(total) + '</strong><span>总支出</span></div></div><div class="chart-legend">' + legend + '</div>';
  }
  function chartDimensions() { return { width: 640, height: 218, left: 42, right: 12, top: 18, bottom: 28 }; }
  function lineChart(data) {
    if (!data.some(function (item) { return item.amountCents > 0; })) return empty('这个月还没有每日支出变化');
    var d = chartDimensions(), innerW = d.width - d.left - d.right, innerH = d.height - d.top - d.bottom;
    var max = Math.max.apply(null, data.map(function (item) { return item.amountCents; }).concat([1]));
    var points = data.map(function (item, index) { var x = d.left + (data.length === 1 ? innerW / 2 : index * innerW / (data.length - 1)); var y = d.top + innerH - item.amountCents / max * innerH; return { x: x, y: y, value: item }; });
    var grid = [0, .5, 1].map(function (ratio) { var y = d.top + innerH * ratio; return '<line class="chart-grid" x1="' + d.left + '" x2="' + (d.width - d.right) + '" y1="' + y + '" y2="' + y + '"/><text class="chart-label" x="' + (d.left - 7) + '" y="' + (y + 3) + '" text-anchor="end">' + formatCompact(max * (1 - ratio)) + '</text>'; }).join('');
    var path = points.map(function (point, index) { return (index ? 'L' : 'M') + point.x.toFixed(1) + ',' + point.y.toFixed(1); }).join(' ');
    var area = path + ' L' + points[points.length - 1].x + ',' + (d.top + innerH) + ' L' + points[0].x + ',' + (d.top + innerH) + ' Z';
    var ticks = points.filter(function (_, index) { return index === 0 || index === points.length - 1 || index % Math.max(1, Math.ceil(points.length / 7)) === 0; }).map(function (point) { return '<text class="chart-label" x="' + point.x + '" y="' + (d.height - 5) + '" text-anchor="middle">' + point.value.day + '日</text>'; }).join('');
    var dots = points.filter(function (point) { return point.value.amountCents > 0; }).map(function (point) { return '<circle cx="' + point.x + '" cy="' + point.y + '" r="3.5" fill="#fff" stroke="#6875d0" stroke-width="2"><title>' + point.value.day + '日 ' + Model.formatCurrency(point.value.amountCents) + '</title></circle>'; }).join('');
    return '<svg viewBox="0 0 ' + d.width + ' ' + d.height + '" role="img" aria-label="每日支出折线图"><defs><linearGradient id="costtrace-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a86dc" stop-opacity=".32"/><stop offset="1" stop-color="#7a86dc" stop-opacity="0"/></linearGradient></defs>' + grid + '<path d="' + area + '" fill="url(#costtrace-area)"/><path d="' + path + '" fill="none" stroke="#6875d0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' + dots + ticks + '</svg>';
  }
  function renderDaily() { one('[data-daily-chart]').innerHTML = lineChart(Model.dailyExpenses(records, selectedMonth)); }
  function renderRanking() {
    var data = Model.expenseRanking(records, selectedMonth), target = one('[data-ranking]');
    if (!data.length) { target.innerHTML = empty('暂无可排行的支出类别'); return; }
    var max = data[0].amountCents;
    target.innerHTML = data.map(function (item, index) { return '<div class="rank-row"><span class="rank-number">' + String(index + 1).padStart(2, '0') + '</span><span class="rank-name">' + item.category + '</span><span class="rank-track"><i style="width:' + (item.amountCents / max * 100).toFixed(1) + '%"></i></span><span class="rank-value">' + formatCompact(item.amountCents) + '</span></div>'; }).join('');
  }
  function barChart(data, field, balance) {
    if (!data.some(function (item) { return item[field] !== 0; })) return empty(balance ? '本年度还没有可计算的月度结余' : '本年度还没有收入记录');
    var d = chartDimensions(), innerW = d.width - d.left - d.right, innerH = d.height - d.top - d.bottom, gap = 10, barW = (innerW - gap * 11) / 12;
    var values = data.map(function (item) { return item[field]; });
    var max = Math.max.apply(null, values.concat([0])), min = Math.min.apply(null, values.concat([0]));
    var span = max - min || 1, zeroY = d.top + max / span * innerH;
    var grid = '<line class="chart-grid" x1="' + d.left + '" x2="' + (d.width - d.right) + '" y1="' + zeroY + '" y2="' + zeroY + '"/>';
    var bars = data.map(function (item, index) {
      var value = item[field], x = d.left + index * (barW + gap), height = Math.abs(value) / span * innerH, y = value >= 0 ? zeroY - height : zeroY;
      var color = balance && value < 0 ? '#ee7e88' : (balance ? '#48b59e' : '#6c78d4');
      return '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + Math.max(height, value ? 2 : 0) + '" rx="4" fill="' + color + '" opacity=".88"><title>' + item.month + '月 ' + Model.formatCurrency(value) + '</title></rect><text class="chart-label" x="' + (x + barW / 2) + '" y="' + (d.height - 5) + '" text-anchor="middle">' + item.month + '月</text>';
    }).join('');
    return '<svg viewBox="0 0 ' + d.width + ' ' + d.height + '" role="img" aria-label="' + (balance ? '每月结余柱状图' : '月收入柱状图') + '">' + grid + bars + '</svg>';
  }
  function renderYearCharts() {
    var year = Number(selectedMonth.slice(0, 4)), series = Model.yearlySeries(records, year);
    one('[data-year-label]').textContent = year + ' 年自然月收入';
    one('[data-income-chart]').innerHTML = barChart(series, 'income', false);
    one('[data-balance-chart]').innerHTML = barChart(series, 'balance', true);
  }
  function filters() { return { month: one('[data-filter-month]').value, startDate: one('[data-filter-start]').value, endDate: one('[data-filter-end]').value, type: one('[data-filter-type]').value, category: one('[data-filter-category]').value, query: one('[data-filter-query]').value }; }
  function renderFilterCategories() {
    var type = one('[data-filter-type]').value;
    var categories = type ? Model.categoriesFor(type) : Array.from(new Set(Model.EXPENSE_CATEGORIES.concat(Model.INCOME_CATEGORIES)));
    setCategoryOptions(one('[data-filter-category]'), categories, true);
  }
  function createCell(text, className) { var cell = document.createElement('td'); cell.textContent = text; if (className) cell.className = className; return cell; }
  function rowFor(record) {
    var row = document.createElement('tr');
    row.appendChild(createCell(record.date));
    var type = document.createElement('td'), typeBadge = document.createElement('span'); typeBadge.className = 'type-badge ' + record.type; typeBadge.textContent = record.type === 'income' ? '收入' : '支出'; type.appendChild(typeBadge); row.appendChild(type);
    row.appendChild(createCell(record.detail, 'detail-cell'));
    var category = document.createElement('td'), categoryBadge = document.createElement('span'); categoryBadge.className = 'category-badge'; categoryBadge.textContent = record.category; category.appendChild(categoryBadge); row.appendChild(category);
    row.appendChild(createCell((record.type === 'expense' ? '-' : '+') + Model.formatCurrency(record.amountCents), 'amount-cell ' + record.type));
    var actions = document.createElement('td'), wrap = document.createElement('div'); wrap.className = 'row-actions';
    [['edit', '编辑', '<path d="m4 16-.5 4.5L8 20l10-10-4-4L4 16Zm8-8 4 4"/>'], ['delete', '删除', '<path d="M5 7h14M9 7V4h6v3m2 0-1 13H8L7 7m4 4v5m3-5v5"/>']].forEach(function (spec) { var button = document.createElement('button'); button.type = 'button'; button.className = 'icon-button ' + spec[0]; button.dataset[spec[0] + 'Record'] = record.id; button.setAttribute('aria-label', spec[1] + record.detail); button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + spec[2] + '</svg>'; wrap.appendChild(button); });
    actions.appendChild(wrap); row.appendChild(actions); return row;
  }
  function renderDetails() {
    var filtered = Model.applyFilters(records, filters());
    var pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); currentPage = Math.min(currentPage, pages);
    var pageRecords = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), body = one('[data-record-rows]'); body.replaceChildren(); pageRecords.forEach(function (record) { body.appendChild(rowFor(record)); });
    one('[data-result-summary]').textContent = '共 ' + filtered.length + ' 条记录' + (filtered.length ? ' · 收入 ' + Model.formatCurrency(filtered.filter(function (r) { return r.type === 'income'; }).reduce(function (sum, r) { return sum + r.amountCents; }, 0)) + ' · 支出 ' + Model.formatCurrency(filtered.filter(function (r) { return r.type === 'expense'; }).reduce(function (sum, r) { return sum + r.amountCents; }, 0)) : '');
    one('[data-table-empty]').hidden = filtered.length > 0; one('.table-scroll').hidden = filtered.length === 0;
    var pagination = one('[data-pagination]');
    if (!filtered.length) { pagination.innerHTML = ''; return; }
    var buttons = '<button type="button" data-page="' + (currentPage - 1) + '"' + (currentPage === 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>';
    for (var page = 1; page <= pages; page += 1) if (pages <= 7 || page === 1 || page === pages || Math.abs(page - currentPage) <= 1) buttons += '<button type="button" data-page="' + page + '"' + (page === currentPage ? ' aria-current="page"' : '') + '>' + page + '</button>';
    buttons += '<button type="button" data-page="' + (currentPage + 1) + '"' + (currentPage === pages ? ' disabled' : '') + ' aria-label="下一页">›</button>';
    pagination.innerHTML = '<span>第 ' + currentPage + ' / ' + pages + ' 页，每页 ' + PAGE_SIZE + ' 条</span><span class="page-buttons">' + buttons + '</span>';
  }
  function renderDashboard() { renderMetrics(); renderComposition(); renderDaily(); renderRanking(); renderYearCharts(); }
  function renderAll() { renderDashboard(); renderDetails(); }
  function exportExcel() {
    var filtered = Model.applyFilters(records, filters());
    if (!filtered.length) { showToast('当前筛选条件下没有可导出的记录'); return; }
    try { window.CostTraceXlsx.download(filtered, 'CostTrace_收支明细_' + Model.localDate().replace(/-/g, '') + '.xlsx'); showToast('Excel 已导出，共 ' + filtered.length + ' 条记录'); }
    catch (error) { console.warn('CostTrace export failed:', error); showToast('导出失败，请稍后重试'); }
  }
  function bind() {
    all('[data-view-target]').forEach(function (button) { button.addEventListener('click', function () { switchView(button.dataset.viewTarget); }); });
    all('[data-quick-add], [data-empty-add]').forEach(function (button) { button.addEventListener('click', function () { resetForm(); switchView('record'); }); });
    all('input[name="record-type"]').forEach(function (radio) { radio.addEventListener('change', updateRecordCategories); });
    one('[data-record-form]').addEventListener('submit', submitRecord);
    one('[data-cancel-edit]').addEventListener('click', function () { resetForm(); });
    one('[data-dashboard-month]').addEventListener('change', function (event) { if (!event.target.value) return; selectedMonth = event.target.value; renderDashboard(); });
    one('[data-filters]').addEventListener('input', function () { currentPage = 1; renderDetails(); });
    one('[data-filter-type]').addEventListener('change', function () { renderFilterCategories(); currentPage = 1; renderDetails(); });
    one('[data-clear-filters]').addEventListener('click', function () { one('[data-filters]').reset(); renderFilterCategories(); currentPage = 1; renderDetails(); });
    one('[data-record-rows]').addEventListener('click', function (event) { var edit = event.target.closest('[data-edit-record]'), remove = event.target.closest('[data-delete-record]'); if (edit) editRecord(edit.dataset.editRecord); if (remove) deleteRecord(remove.dataset.deleteRecord); });
    one('[data-pagination]').addEventListener('click', function (event) { var button = event.target.closest('[data-page]'); if (!button || button.disabled) return; currentPage = Number(button.dataset.page); renderDetails(); });
    one('[data-export]').addEventListener('click', exportExcel);
    window.addEventListener('hub:sync-status', function (event) { var detail = event.detail || {}; if (detail.app !== 'cost-trace') return; var target = one('[data-sync-status]'); target.dataset.state = detail.state; one('span', target).textContent = detail.message || '本地数据已就绪'; });
    window.addEventListener('costtrace:data-change', function () { records = readRecords(); renderAll(); });
  }
  function init() {
    records = readRecords();
    selectedMonth = Model.currentMonth();
    one('[data-dashboard-month]').value = selectedMonth;
    one('[data-dashboard-month]').max = selectedMonth;
    one('[data-filter-start]').max = Model.localDate(); one('[data-filter-end]').max = Model.localDate();
    resetForm(); renderFilterCategories(); bind(); renderAll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
