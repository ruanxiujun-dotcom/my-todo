/* ========================================
   菜老板记账APP - 收入记录逻辑
   ======================================== */

function refreshIncomeList() {
    const today = getDateStr();
    const monthStart = getMonthStart();

    const todayRecords = store.getTodayRecords('income');
    const monthRecords = store.getRecordsByRange('income', monthStart, today);

    // 更新汇总
    document.getElementById('incomeTodaySum').textContent = formatMoney(store.sumAmount(todayRecords));
    document.getElementById('incomeMonthSum').textContent = formatMoney(store.sumAmount(monthRecords));
    document.getElementById('incomeTodayCount').textContent = todayRecords.length;

    // 渲染列表（按时间倒序）
    const container = document.getElementById('incomeList');

    // 获取所有收入记录，按时间倒序
    const allRecords = [...store.income].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (allRecords.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <p class="empty-text">还没有收入记录，开始记账吧</p>
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
        <span class="date-total income-text">+${formatMoney(total)}</span>
      </div>`;

        records.forEach(r => {
            const emoji = VEGGIES[r.veggie]?.emoji || '💰';
            const payIcon = PAYMENT_METHODS[r.payment]?.icon || '💵';
            html += `
        <div class="record-item">
          <div class="record-icon income">${emoji}</div>
          <div class="record-info">
            <div class="record-name">${r.veggie || '其他收入'}</div>
            <div class="record-detail">${r.weight ? r.weight + '斤 × ¥' + r.price : ''} · ${payIcon} ${r.note || ''}</div>
          </div>
          <div class="record-amount income">+${formatMoney(r.amount)}</div>
        </div>`;
        });

        html += '</div>';
    });

    container.innerHTML = html;
}
