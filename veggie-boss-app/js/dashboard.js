/* ========================================
   菜老板记账APP - 首页仪表盘逻辑
   ======================================== */

function refreshDashboard() {
    const todayIncomes = store.getTodayRecords('income');
    const todayExpenses = store.getTodayRecords('expense');

    const incomeTotal = store.sumAmount(todayIncomes);
    const expenseTotal = store.sumAmount(todayExpenses);
    const profit = incomeTotal - expenseTotal;

    // 更新卡片数据
    document.getElementById('todayIncome').textContent = formatMoney(incomeTotal);
    document.getElementById('todayExpense').textContent = formatMoney(expenseTotal);
    document.getElementById('todayProfit').textContent = formatMoney(profit);

    // 渲染库存预警
    renderWarnings();

    // 渲染今日流水
    renderTodayTransactions(todayIncomes, todayExpenses);

    // 渲染趋势图
    renderTrendChart();
}

// ========== 库存预警 ==========
function renderWarnings() {
    const warnings = store.getLowStockItems();
    const container = document.getElementById('warningList');
    const badge = document.getElementById('warningCount');

    badge.textContent = warnings.length;

    if (warnings.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <p class="empty-text">库存充足，暂无预警</p>
      </div>
    `;
        return;
    }

    container.innerHTML = warnings.map(item => `
    <div class="warning-item">
      <span class="warning-emoji">${item.emoji}</span>
      <div class="warning-info">
        <div class="warning-name">${item.name}</div>
        <div class="warning-stock">剩余 ${item.stock} 斤 / 预警线 ${item.threshold} 斤</div>
      </div>
      <button class="warning-action" onclick="switchToPage('pageInventory')">去补货</button>
    </div>
  `).join('');
}

// ========== 今日流水 ==========
function renderTodayTransactions(incomes, expenses) {
    const container = document.getElementById('todayTransactions');

    // 合并并按时间倒序
    const all = [
        ...incomes.map(r => ({ ...r, displayType: 'income' })),
        ...expenses.map(r => ({ ...r, displayType: 'expense' }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (all.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">今日还没有记账哦，点击"+"开始记账</p>
      </div>
    `;
        return;
    }

    // 只显示最近5笔
    const recent = all.slice(0, 5);

    container.innerHTML = recent.map(r => {
        const isIncome = r.displayType === 'income';
        const emoji = VEGGIES[r.veggie]?.emoji || (isIncome ? '💰' : '📤');
        const name = r.veggie || EXPENSE_CATEGORIES[r.category]?.label || '其他';
        const detail = isIncome
            ? `${r.weight ? r.weight + '斤 × ¥' + r.price : ''} ${r.note || ''}`
            : `${EXPENSE_CATEGORIES[r.category]?.label || ''} ${r.note || ''}`;

        return `
      <div class="transaction-item">
        <div class="trans-icon ${r.displayType}">${emoji}</div>
        <div class="trans-info">
          <div class="trans-name">${name}</div>
          <div class="trans-detail">${formatTime(r.timestamp)} · ${detail.trim()}</div>
        </div>
        <div class="trans-amount ${r.displayType}">
          ${isIncome ? '+' : '-'}${formatMoney(r.amount)}
        </div>
      </div>
    `;
    }).join('');
}

// ========== 7天趋势图 ==========
function renderTrendChart() {
    const canvas = document.getElementById('trendChart');
    const ctx = canvas.getContext('2d');

    // 高清适配
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '200px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 200;
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // 获取数据
    const days = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 6; i >= 0; i--) {
        const dateStr = getDateStr(-i);
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(`${d.getMonth() + 1}/${d.getDate()}`);

        const dayIncome = store.getRecordsByRange('income', dateStr, dateStr);
        const dayExpense = store.getRecordsByRange('expense', dateStr, dateStr);
        incomeData.push(store.sumAmount(dayIncome));
        expenseData.push(store.sumAmount(dayExpense));
    }

    const maxVal = Math.max(...incomeData, ...expenseData, 100);

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    // 绘制网格线
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Y轴标签
        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px "Noto Sans SC"';
        ctx.textAlign = 'right';
        const val = Math.round(maxVal - (maxVal / 4) * i);
        ctx.fillText(val > 1000 ? (val / 1000).toFixed(1) + 'k' : val, padding.left - 8, y + 4);
    }

    // X轴标签
    const stepX = chartW / 6;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94A3B8';
    days.forEach((day, i) => {
        ctx.fillText(day, padding.left + stepX * i, height - 10);
    });

    // 绘制折线 - 收入
    drawLine(ctx, incomeData, maxVal, padding, chartW, chartH, stepX, '#22C55E', 'rgba(34,197,94,0.1)');
    // 绘制折线 - 支出
    drawLine(ctx, expenseData, maxVal, padding, chartW, chartH, stepX, '#EF4444', 'rgba(239,68,68,0.1)');

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

function drawLine(ctx, data, maxVal, padding, chartW, chartH, stepX, color, fillColor) {
    const points = data.map((val, i) => ({
        x: padding.left + stepX * i,
        y: padding.top + chartH - (val / maxVal) * chartH
    }));

    // 填充区域
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // 绘制线条
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 使用贝塞尔曲线平滑
    points.forEach((p, i) => {
        if (i === 0) {
            ctx.moveTo(p.x, p.y);
        } else {
            const prev = points[i - 1];
            const cpx = (prev.x + p.x) / 2;
            ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
        }
    });
    ctx.stroke();

    // 绘制数据点
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}
