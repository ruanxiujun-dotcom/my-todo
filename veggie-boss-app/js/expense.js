/* ========================================
   菜老板记账APP - 支出记录逻辑
   ======================================== */

function refreshExpenseList(filter = 'all') {
    const today = getDateStr();
    const monthStart = getMonthStart();

    const todayRecords = store.getTodayRecords('expense');
    const monthRecords = store.getRecordsByRange('expense', monthStart, today);

    // 更新汇总
    document.getElementById('expenseTodaySum').textContent = formatMoney(store.sumAmount(todayRecords));
    document.getElementById('expenseMonthSum').textContent = formatMoney(store.sumAmount(monthRecords));
    document.getElementById('expenseTodayCount').textContent = todayRecords.length;

    // 过滤记录
    let allRecords = [...store.expense].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (filter !== 'all') {
        allRecords = allRecords.filter(r => r.category === filter);
    }

    const container = document.getElementById('expenseList');

    if (allRecords.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📤</div>
        <p class="empty-text">${filter !== 'all' ? '该分类下没有支出记录' : '还没有支出记录'}</p>
      </div>
    `;
        return;
    }

    // 按日期分组
    const grouped = {};
    allRecords.forEach(r => {
        const dateKey = r.timestamp.slice(0, 10);
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(r);
    });

    let html = '';
    Object.entries(grouped).forEach(([dateKey, records]) => {
        const d = new Date(dateKey);
        const total = store.sumAmount(records);
        const isToday = dateKey === today;
        const dateLabel = isToday ? '今天' : `${d.getMonth() + 1}月${d.getDate()}日`;

        html += `<div class="date-group">
      <div class="date-header">
        <span class="date-label">${dateLabel}</span>
        <span class="date-total expense-text">-${formatMoney(total)}</span>
      </div>`;

        records.forEach(r => {
            const catInfo = EXPENSE_CATEGORIES[r.category] || { icon: '📋', label: '其他' };
            const emoji = r.veggie ? (VEGGIES[r.veggie]?.emoji || '🥬') : catInfo.icon;
            const name = r.veggie ? `${catInfo.label} · ${r.veggie}` : catInfo.label;

            html += `
        <div class="record-item">
          <div class="record-icon expense">${emoji}</div>
          <div class="record-info">
            <div class="record-name">${name}</div>
            <div class="record-detail">${r.weight ? r.weight + '斤 × ¥' + r.price : ''} ${r.note || ''}</div>
          </div>
          <div class="record-amount expense">-${formatMoney(r.amount)}</div>
        </div>`;
        });

        html += '</div>';
    });

    container.innerHTML = html;
}
