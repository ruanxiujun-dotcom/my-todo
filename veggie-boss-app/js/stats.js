/* ========================================
   菜老板记账APP - 统计分析逻辑
   ======================================== */

let currentRange = 'day';

function refreshStats(range = currentRange) {
    currentRange = range;

    let startDate, endDate;
    const today = getDateStr();

    switch (range) {
        case 'day':
            startDate = endDate = today;
            break;
        case 'week':
            startDate = getWeekStart();
            endDate = today;
            break;
        case 'month':
            startDate = getMonthStart();
            endDate = today;
            break;
    }

    const incomes = store.getRecordsByRange('income', startDate, endDate);
    const expenses = store.getRecordsByRange('expense', startDate, endDate);

    const totalIncome = store.sumAmount(incomes);
    const totalExpense = store.sumAmount(expenses);
    const totalProfit = totalIncome - totalExpense;

    // 更新汇总
    document.getElementById('statsTotalIncome').textContent = formatMoney(totalIncome);
    document.getElementById('statsTotalExpense').textContent = formatMoney(totalExpense);
    document.getElementById('statsTotalProfit').textContent = formatMoney(totalProfit);

    // 渲染柱状图
    renderBarChart(range, startDate, endDate);

    // 渲染利润排行
    renderProfitRank(startDate, endDate);

    // 渲染明细
    renderStatsDetail(incomes, expenses);
}

// ========== 柱状图 ==========
function renderBarChart(range, startDate, endDate) {
    const canvas = document.getElementById('barChart');
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 220 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '220px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 220;
    const padding = { top: 30, right: 20, bottom: 45, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    // 准备数据
    let labels = [];
    let incomeData = [];
    let expenseData = [];

    if (range === 'day') {
        // 按时段分组
        const hours = ['06-09', '09-12', '12-15', '15-18', '18-21'];
        const hourRanges = [[6, 9], [9, 12], [12, 15], [15, 18], [18, 21]];

        hours.forEach((label, i) => {
            labels.push(label);
            const [start, end] = hourRanges[i];
            let inc = 0, exp = 0;

            store.getRecordsByRange('income', startDate, endDate).forEach(r => {
                const h = new Date(r.timestamp).getHours();
                if (h >= start && h < end) inc += r.amount;
            });

            store.getRecordsByRange('expense', startDate, endDate).forEach(r => {
                const h = new Date(r.timestamp).getHours();
                if (h >= start && h < end) exp += r.amount;
            });

            incomeData.push(inc);
            expenseData.push(exp);
        });
    } else if (range === 'week') {
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const ds = d.toISOString().slice(0, 10);
            if (ds > endDate) break;

            labels.push(weekDays[i]);
            const dayInc = store.getRecordsByRange('income', ds, ds);
            const dayExp = store.getRecordsByRange('expense', ds, ds);
            incomeData.push(store.sumAmount(dayInc));
            expenseData.push(store.sumAmount(dayExp));
        }
    } else {
        // 按周分组
        const weeks = getMonthWeeks(startDate, endDate);
        weeks.forEach((week, i) => {
            labels.push(`第${i + 1}周`);
            const wInc = store.getRecordsByRange('income', week.start, week.end);
            const wExp = store.getRecordsByRange('expense', week.start, week.end);
            incomeData.push(store.sumAmount(wInc));
            expenseData.push(store.sumAmount(wExp));
        });
    }

    const maxVal = Math.max(...incomeData, ...expenseData, 100);
    const numBars = labels.length;
    const groupWidth = chartW / numBars;
    const barWidth = groupWidth * 0.3;
    const gap = groupWidth * 0.1;

    // 网格线
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px "Noto Sans SC"';
        ctx.textAlign = 'right';
        const val = Math.round(maxVal - (maxVal / 4) * i);
        ctx.fillText(val > 1000 ? (val / 1000).toFixed(1) + 'k' : val, padding.left - 8, y + 4);
    }

    // 绘制柱状图
    labels.forEach((label, i) => {
        const x = padding.left + groupWidth * i + groupWidth * 0.15;
        const incH = (incomeData[i] / maxVal) * chartH;
        const expH = (expenseData[i] / maxVal) * chartH;

        // 收入柱
        const incGradient = ctx.createLinearGradient(0, padding.top + chartH - incH, 0, padding.top + chartH);
        incGradient.addColorStop(0, '#22C55E');
        incGradient.addColorStop(1, '#86EFAC');
        ctx.fillStyle = incGradient;
        roundRect(ctx, x, padding.top + chartH - incH, barWidth, incH, 4);

        // 支出柱
        const expGradient = ctx.createLinearGradient(0, padding.top + chartH - expH, 0, padding.top + chartH);
        expGradient.addColorStop(0, '#EF4444');
        expGradient.addColorStop(1, '#FCA5A5');
        ctx.fillStyle = expGradient;
        roundRect(ctx, x + barWidth + gap, padding.top + chartH - expH, barWidth, expH, 4);

        // X轴标签
        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px "Noto Sans SC"';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth + gap / 2, height - 10);
    });

    // 图例
    ctx.font = '12px "Noto Sans SC"';
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(width - 130, 8, 12, 12);
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'left';
    ctx.fillText('收入', width - 114, 18);

    ctx.fillStyle = '#EF4444';
    ctx.fillRect(width - 70, 8, 12, 12);
    ctx.fillStyle = '#64748B';
    ctx.fillText('支出', width - 54, 18);
}

// 绘制圆角矩形
function roundRect(ctx, x, y, w, h, r) {
    if (h <= 0) return;
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

// 获取月内各周范围
function getMonthWeeks(startDate, endDate) {
    const weeks = [];
    let current = new Date(startDate);
    while (current.toISOString().slice(0, 10) <= endDate) {
        const weekStart = current.toISOString().slice(0, 10);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const end = weekEnd.toISOString().slice(0, 10) > endDate ? endDate : weekEnd.toISOString().slice(0, 10);
        weeks.push({ start: weekStart, end });
        current.setDate(current.getDate() + 7);
    }
    return weeks;
}

// ========== 利润排行 ==========
function renderProfitRank(startDate, endDate) {
    const rankData = store.getVeggieProfitRank(startDate, endDate);
    const container = document.getElementById('profitRank');

    if (rankData.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <p class="empty-text">暂无排行数据</p>
      </div>
    `;
        return;
    }

    const maxProfit = Math.max(...rankData.map(d => d.profit), 1);

    container.innerHTML = rankData.slice(0, 8).map((item, i) => {
        let rankClass = '';
        if (i === 0) rankClass = 'gold';
        else if (i === 1) rankClass = 'silver';
        else if (i === 2) rankClass = 'bronze';

        const barPercent = Math.max(5, (item.profit / maxProfit) * 100);

        return `
      <div class="rank-item">
        <span class="rank-num ${rankClass}">${i + 1}</span>
        <span style="font-size:20px">${item.emoji}</span>
        <span class="rank-name">${item.name}</span>
        <div class="rank-bar-container">
          <div class="rank-bar-fill" style="width: ${barPercent}%"></div>
        </div>
        <span class="rank-profit">${formatMoney(item.profit)}</span>
      </div>
    `;
    }).join('');
}

// ========== 收支明细 ==========
function renderStatsDetail(incomes, expenses) {
    const container = document.getElementById('statsDetail');

    const all = [
        ...incomes.map(r => ({ ...r, displayType: 'income' })),
        ...expenses.map(r => ({ ...r, displayType: 'expense' }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (all.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-text">暂无收支明细</p>
      </div>
    `;
        return;
    }

    // 显示前20条
    container.innerHTML = all.slice(0, 20).map(r => {
        const isIncome = r.displayType === 'income';
        const emoji = r.veggie ? (VEGGIES[r.veggie]?.emoji || '🥬') : (EXPENSE_CATEGORIES[r.category]?.icon || '📋');
        const name = r.veggie || EXPENSE_CATEGORIES[r.category]?.label || '其他';

        return `
      <div class="detail-item">
        <div class="trans-icon ${r.displayType}">${emoji}</div>
        <div class="trans-info">
          <div class="trans-name">${name}</div>
          <div class="trans-detail">${formatDate(r.timestamp)}</div>
        </div>
        <div class="trans-amount ${r.displayType}">
          ${isIncome ? '+' : '-'}${formatMoney(r.amount)}
        </div>
      </div>
    `;
    }).join('');
}
