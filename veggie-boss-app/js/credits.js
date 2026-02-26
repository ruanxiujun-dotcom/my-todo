/* ========================================
   菜老板记账APP - 赊欠账本逻辑
   ======================================== */

// ========== 全局变量 ==========
let currentCreditBuyerId = null;

// ========== 初始化账本 ==========
function initCreditManager() {
    // 绑定入口按钮（在UI上寻找，这里假设加在买家管理里或者首页）
    const openCreditsBtn = document.getElementById('openCreditsBtn');
    if (openCreditsBtn) {
        openCreditsBtn.addEventListener('click', () => openCreditsModal());
    }

    // 关闭账本大弹窗
    const closeCreditsModalBtn = document.getElementById('closeCreditsModal');
    if (closeCreditsModalBtn) {
        closeCreditsModalBtn.addEventListener('click', () => closeModal(document.getElementById('creditsModal')));
    }
    document.getElementById('creditsModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'creditsModal') closeModal(document.getElementById('creditsModal'));
    });

    // 搜索过滤账本
    const creditSearchInput = document.getElementById('creditSearchInput');
    if (creditSearchInput) {
        creditSearchInput.addEventListener('input', (e) => renderCreditList(e.target.value));
    }

    // 关闭还款弹窗
    const closeRepayBtn = document.getElementById('closeRepayModal');
    if (closeRepayBtn) {
        closeRepayBtn.addEventListener('click', () => closeModal(document.getElementById('repayModal')));
    }
    document.getElementById('repayModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'repayModal') closeModal(document.getElementById('repayModal'));
    });

    // 提交还款表单
    const repayForm = document.getElementById('repayForm');
    if (repayForm) {
        repayForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitRepayment();
        });
    }

    // 还款方式选择
    document.querySelectorAll('#repayMethodGroup .pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#repayMethodGroup .pay-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}

// ========== 打开账本大弹窗 ==========
function openCreditsModal(buyerId = null) {
    if (buyerId) {
        document.getElementById('creditSearchInput').value = buyerManager.getBuyer(buyerId)?.name || '';
    } else {
        document.getElementById('creditSearchInput').value = '';
    }

    // 初始化时，如果没数据，尝试从现有的买家totalCredit生成一条初始借款记录（只做一次兼容）
    migrateLegacyCredits();

    renderCreditOverview();
    renderCreditList(document.getElementById('creditSearchInput').value);
    document.getElementById('creditsModal').classList.add('active');
}

// ========== 兼容旧的仅改 totalCredit 没改 store.credits 的情况 ==========
function migrateLegacyCredits() {
    if (store.credits.length > 0) return; // 已经有流水就不做全量迁移了

    let hasMigrated = false;
    buyerManager.buyers.forEach(b => {
        if (b.totalCredit > 0) {
            store.addCredit({
                buyerId: b.id,
                type: 'borrow',
                amount: Math.round(b.totalCredit * 100) / 100,
                note: '期初赊欠结转',
                timestamp: b.updatedAt
            });
            hasMigrated = true;
        }
    });
    if (hasMigrated) console.log('已自动生成历史赊欠流水明细');
}

// ========== 渲染账本概览 ==========
function renderCreditOverview() {
    const totalCredit = buyerManager.getTotalCredit();
    document.getElementById('creditTotalAmount').textContent = '¥' + totalCredit.toFixed(0);

    // 统计有多少人正在欠钱
    const debtorCount = buyerManager.buyers.filter(b => b.totalCredit > 0).length;
    document.getElementById('creditDebtorCount').textContent = debtorCount;
}

// ========== 渲染账本流水列表 ==========
function renderCreditList(searchQuery = '') {
    const container = document.getElementById('creditListContainer');
    if (!container) return;

    // 获取所有相关买家
    let matchedBuyers = buyerManager.buyers;
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        matchedBuyers = matchedBuyers.filter(b => b.name.toLowerCase().includes(q));
    }

    // 生成买家卡片视图，里面包含流水
    if (matchedBuyers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📒</div>
                <p class="empty-text">没有找到该买家的账本信息</p>
            </div>`;
        return;
    }

    container.innerHTML = matchedBuyers.map(buyer => {
        // 只显示有欠款 或 有历史记录的买家
        const buyerCredits = store.credits.filter(c => c.buyerId === buyer.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (buyer.totalCredit <= 0 && buyerCredits.length === 0) return ''; // 没有任何交集

        const theStoreCreditsHtml = buyerCredits.slice(0, 5).map(c => {
            const isBorrow = c.type === 'borrow';
            return `
                <div class="credit-timeline-row">
                    <span class="credit-time">${c.timestamp.slice(5, 16).replace('T', ' ')}</span>
                    <span class="credit-note">${c.note || (isBorrow ? '赊购' : '还款')} ${!isBorrow && c.paymentMethod ? '(' + PAYMENT_METHODS[c.paymentMethod].label + ')' : ''}</span>
                    <span class="credit-amount ${isBorrow ? 'warn' : 'primary'}">${isBorrow ? '+' : '-'}¥${c.amount.toFixed(2)}</span>
                </div>
            `;
        }).join('');

        const moreHtml = buyerCredits.length > 5 ? `<div class="credit-timeline-more">仅显示最近5条记录，共有 ${buyerCredits.length} 条</div>` : '';

        return `
            <div class="credit-buyer-card">
                <div class="credit-card-header">
                    <div class="credit-buyer-info">
                        <strong>${buyer.name}</strong>
                        <span class="credit-buyer-phone">📱 ${buyer.phone || '无'}</span>
                    </div>
                    <div class="credit-buyer-balance">
                        当前欠款: <span class="warn">¥${(buyer.totalCredit || 0).toFixed(2)}</span>
                    </div>
                </div>
                
                ${buyerCredits.length > 0 ? `
                    <div class="credit-timeline">
                        ${theStoreCreditsHtml}
                        ${moreHtml}
                    </div>
                ` : '<div class="credit-timeline-more">暂无流水记录</div>'}
                
                <div class="credit-card-actions">
                    <button class="submit-btn outline-btn short-btn" onclick="openRepayModal('${buyer.id}')" ${buyer.totalCredit <= 0 ? 'disabled' : ''}>
                        销账 / 收款
                    </button>
                    <button class="submit-btn outline-btn short-btn warning-btn" onclick="openCreditsModal('${buyer.id}')">
                        查看详情
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (container.innerHTML.trim() === '') {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <p class="empty-text">目前没有正在赊欠的账单</p>
            </div>`;
    }
}

// ========== 打开还款弹窗 ==========
function openRepayModal(buyerId) {
    currentCreditBuyerId = buyerId;
    const buyer = buyerManager.getBuyer(buyerId);
    if (!buyer) return;

    document.getElementById('repayBuyerName').textContent = buyer.name;
    document.getElementById('repayDebtAmount').textContent = '¥' + (buyer.totalCredit || 0).toFixed(2);

    // 默认全额还款
    const amountInput = document.getElementById('repayAmountInput');
    amountInput.value = (buyer.totalCredit || 0).toFixed(2);
    amountInput.max = buyer.totalCredit;

    document.getElementById('repayNoteInput').value = '';

    // 重置付款方式为微信
    document.querySelectorAll('#repayMethodGroup .pay-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector('#repayMethodGroup .pay-btn[data-pay="wechat"]').classList.add('selected');

    document.getElementById('repayModal').classList.add('active');
}

// ========== 提交还款 ==========
function submitRepayment() {
    const buyer = buyerManager.getBuyer(currentCreditBuyerId);
    if (!buyer) return;

    const amount = parseFloat(document.getElementById('repayAmountInput').value) || 0;
    if (amount <= 0 || amount > buyer.totalCredit) {
        showToast('⚠️ 填写的还款金额无效');
        return;
    }

    const note = document.getElementById('repayNoteInput').value.trim();
    const payMethodBtn = document.querySelector('#repayMethodGroup .pay-btn.selected');
    const paymentMethod = payMethodBtn ? payMethodBtn.dataset.pay : 'cash';

    // 1. 更新买家总欠款
    const newCredit = (buyer.totalCredit || 0) - amount;
    buyerManager.updateBuyer(currentCreditBuyerId, { totalCredit: Math.round(newCredit * 100) / 100 });

    // 2. 增加一条还款流水
    store.addCredit({
        buyerId: currentCreditBuyerId,
        type: 'repay',
        amount: amount,
        paymentMethod: paymentMethod,
        note: note || '结清欠款'
    });

    // 3. 将还款转化为APP真实收入
    store.addIncome({
        veggie: '赊账还款', // 特殊类别
        weight: 0,
        price: 0,
        amount: amount,
        payment: paymentMethod,
        note: `收回[${buyer.name}]欠款 - ${note}`,
        buyerId: currentCreditBuyerId
    });

    showToast('✅ 收款成功，账本已更新');
    closeModal(document.getElementById('repayModal'));

    // 刷新相关视图
    renderCreditOverview();
    renderCreditList(document.getElementById('creditSearchInput').value);

    // 反向刷新可能在背景的界面
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === 'pageDashboard') {
        refreshDashboard();
    }
}
