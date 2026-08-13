(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CostTraceModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var TYPES = ['expense', 'income'];
  var EXPENSE_CATEGORIES = ['衣', '食', '住', '行', '玩', '其他'];
  var INCOME_CATEGORIES = ['工资', '奖金', '一次性收入', '其他'];

  function pad(value) { return String(value).padStart(2, '0'); }
  function localDate(date) {
    var value = date || new Date();
    return value.getFullYear() + '-' + pad(value.getMonth() + 1) + '-' + pad(value.getDate());
  }
  function currentMonth(date) { return localDate(date).slice(0, 7); }
  function categoriesFor(type) { return type === 'income' ? INCOME_CATEGORIES.slice() : EXPENSE_CATEGORIES.slice(); }
  function isIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    var parts = value.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2];
  }
  function parseAmountToCents(value) {
    var text = String(value == null ? '' : value).trim();
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(text)) return null;
    var parts = text.split('.');
    var cents = Number(parts[0]) * 100 + Number((parts[1] || '').padEnd(2, '0'));
    return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
  }
  function validate(input, today) {
    var value = input || {};
    var type = value.type;
    var detail = String(value.detail || '').trim();
    var date = String(value.date || '');
    var amountCents = value.amountCents == null ? parseAmountToCents(value.amount) : Number(value.amountCents);
    if (TYPES.indexOf(type) === -1) return { valid: false, field: 'type', message: '请选择收入或支出。' };
    if (!isIsoDate(date)) return { valid: false, field: 'date', message: '请选择有效日期。' };
    if (date > (today || localDate())) return { valid: false, field: 'date', message: '记账日期不能晚于今天。' };
    if (!detail) return { valid: false, field: 'detail', message: '请填写收支明细。' };
    if (detail.length > 120) return { valid: false, field: 'detail', message: '明细不能超过 120 个字。' };
    if (categoriesFor(type).indexOf(value.category) === -1) return { valid: false, field: 'category', message: '请选择对应的类别。' };
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return { valid: false, field: 'amount', message: '请输入大于 0、最多两位小数的金额。' };
    return {
      valid: true,
      value: {
        id: String(value.id || ''),
        date: date,
        type: type,
        detail: detail,
        category: value.category,
        amountCents: amountCents
      }
    };
  }
  function normalizeRecord(record) {
    var result = validate(record, '9999-12-31');
    if (!result.valid || !result.value.id) return null;
    return result.value;
  }
  function sortRecords(records) {
    return records.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id));
    });
  }
  function recordsForMonth(records, month) {
    return records.filter(function (record) { return record.date.slice(0, 7) === month; });
  }
  function sum(records, type) {
    return records.reduce(function (total, record) { return total + (record.type === type ? record.amountCents : 0); }, 0);
  }
  function monthSummary(records, month) {
    var scoped = recordsForMonth(records, month);
    var expense = sum(scoped, 'expense');
    var income = sum(scoped, 'income');
    return { expense: expense, income: income, balance: income - expense, count: scoped.length };
  }
  function expenseComposition(records, month) {
    var scoped = recordsForMonth(records, month).filter(function (record) { return record.type === 'expense'; });
    var total = sum(scoped, 'expense');
    return EXPENSE_CATEGORIES.map(function (category, index) {
      var amountCents = scoped.reduce(function (amount, record) { return amount + (record.category === category ? record.amountCents : 0); }, 0);
      return { category: category, amountCents: amountCents, percent: total ? amountCents / total : 0, order: index };
    }).filter(function (item) { return item.amountCents > 0; });
  }
  function expenseRanking(records, month) {
    return expenseComposition(records, month).sort(function (a, b) { return b.amountCents - a.amountCents || a.order - b.order; });
  }
  function daysInMonth(month) {
    var parts = month.split('-').map(Number);
    return new Date(parts[0], parts[1], 0).getDate();
  }
  function dailyExpenses(records, month, today) {
    var todayValue = today || localDate();
    var limit = daysInMonth(month);
    if (month === todayValue.slice(0, 7)) limit = Number(todayValue.slice(8, 10));
    var values = Array.from({ length: limit }, function (_, index) { return { day: index + 1, amountCents: 0 }; });
    recordsForMonth(records, month).forEach(function (record) {
      if (record.type === 'expense') {
        var day = Number(record.date.slice(8, 10));
        if (day <= limit) values[day - 1].amountCents += record.amountCents;
      }
    });
    return values;
  }
  function yearlySeries(records, year) {
    var numericYear = Number(year);
    return Array.from({ length: 12 }, function (_, index) {
      var month = numericYear + '-' + pad(index + 1);
      var summary = monthSummary(records, month);
      return { month: index + 1, income: summary.income, expense: summary.expense, balance: summary.balance };
    });
  }
  function applyFilters(records, filters) {
    var value = filters || {};
    var query = String(value.query || '').trim().toLocaleLowerCase('zh-CN');
    return sortRecords(records.filter(function (record) {
      if (value.month && record.date.slice(0, 7) !== value.month) return false;
      if (value.startDate && record.date < value.startDate) return false;
      if (value.endDate && record.date > value.endDate) return false;
      if (value.type && record.type !== value.type) return false;
      if (value.category && record.category !== value.category) return false;
      return !query || record.detail.toLocaleLowerCase('zh-CN').indexOf(query) !== -1;
    }));
  }
  function formatCurrency(cents) {
    var amount = Number(cents) || 0;
    var sign = amount < 0 ? '-' : '';
    return sign + '¥' + (Math.abs(amount) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return {
    TYPES: TYPES.slice(),
    EXPENSE_CATEGORIES: EXPENSE_CATEGORIES.slice(),
    INCOME_CATEGORIES: INCOME_CATEGORIES.slice(),
    localDate: localDate,
    currentMonth: currentMonth,
    categoriesFor: categoriesFor,
    parseAmountToCents: parseAmountToCents,
    validate: validate,
    normalizeRecord: normalizeRecord,
    sortRecords: sortRecords,
    recordsForMonth: recordsForMonth,
    monthSummary: monthSummary,
    expenseComposition: expenseComposition,
    expenseRanking: expenseRanking,
    dailyExpenses: dailyExpenses,
    yearlySeries: yearlySeries,
    applyFilters: applyFilters,
    formatCurrency: formatCurrency
  };
});
