/* ========================================
   菜老板记账APP - 核心逻辑
   ======================================== */

// ========== 蔬菜数据配置 ==========
const VEGGIES = {
    '白菜': { emoji: '🥬', threshold: 50 },
    '番茄': { emoji: '🍅', threshold: 30 },
    '土豆': { emoji: '🥔', threshold: 40 },
    '黄瓜': { emoji: '🥒', threshold: 30 },
    '辣椒': { emoji: '🌶️', threshold: 20 },
    '茄子': { emoji: '🍆', threshold: 25 },
    '胡萝卜': { emoji: '🥕', threshold: 30 },
    '洋葱': { emoji: '🧅', threshold: 35 },
    '西兰花': { emoji: '🥦', threshold: 20 },
    '蘑菇': { emoji: '🍄', threshold: 15 },
    '玉米': { emoji: '🌽', threshold: 25 },
    '其他': { emoji: '📝', threshold: 10 }
};

// 支出分类
const EXPENSE_CATEGORIES = {
    purchase: { label: '进货', icon: '🛒' },
    rent: { label: '摊位费', icon: '🏪' },
    transport: { label: '运费', icon: '🚛' },
    labor: { label: '人工', icon: '👷' },
    other: { label: '其他', icon: '📋' }
};

// 收款方式
const PAYMENT_METHODS = {
    cash: { label: '现金', icon: '💵' },
    wechat: { label: '微信', icon: '💚' },
    alipay: { label: '支付宝', icon: '💙' },
    transfer: { label: '转账', icon: '🏦' }
};

// ========== 数据管理 ==========
class DataStore {
    constructor() {
        this.loadData();
    }

    // 从LocalStorage加载数据
    loadData() {
        try {
            this.income = JSON.parse(localStorage.getItem('veggie_income') || '[]');
            this.expense = JSON.parse(localStorage.getItem('veggie_expense') || '[]');
            this.inventory = JSON.parse(localStorage.getItem('veggie_inventory') || '{}');
            this.losses = JSON.parse(localStorage.getItem('veggie_losses') || '[]');
            this.credits = JSON.parse(localStorage.getItem('veggie_credits') || '[]');
        } catch (e) {
            console.error('数据加载失败:', e);
            this.income = [];
            this.expense = [];
            this.inventory = {};
            this.losses = [];
            this.credits = [];
        }
    }

    // 保存数据到LocalStorage
    saveData() {
        localStorage.setItem('veggie_income', JSON.stringify(this.income));
        localStorage.setItem('veggie_expense', JSON.stringify(this.expense));
        localStorage.setItem('veggie_inventory', JSON.stringify(this.inventory));
        localStorage.setItem('veggie_losses', JSON.stringify(this.losses));
        localStorage.setItem('veggie_credits', JSON.stringify(this.credits));
    }

    // 添加收入记录
    addIncome(record) {
        record.id = Date.now();
        record.type = 'income';
        record.timestamp = new Date().toISOString();
        this.income.push(record);

        // 卖出时减少库存
        if (record.veggie && record.weight) {
            this.updateInventory(record.veggie, -record.weight);
        }
        this.saveData();
        return record;
    }

    // 添加支出记录
    addExpense(record) {
        record.id = Date.now();
        record.type = 'expense';
        record.timestamp = new Date().toISOString();
        this.expense.push(record);

        // 进货时增加库存
        if (record.category === 'purchase' && record.veggie && record.weight) {
            this.updateInventory(record.veggie, record.weight);
        }
        this.saveData();
        return record;
    }

    // 更新库存
    updateInventory(veggie, delta) {
        if (!this.inventory[veggie]) {
            this.inventory[veggie] = { stock: 0, maxStock: VEGGIES[veggie]?.threshold * 3 || 100 };
        }
        this.inventory[veggie].stock = Math.max(0, (this.inventory[veggie].stock || 0) + delta);
        this.saveData();
    }

    // 记录损耗
    addLoss(record) {
        record.id = Date.now();
        record.timestamp = new Date().toISOString();
        this.losses.push(record);
        this.updateInventory(record.veggie, -record.weight);
        this.saveData();
        return record;
    }

    // 增加赊欠/还款记录
    addCredit(record) {
        record.id = Date.now();
        record.timestamp = new Date().toISOString();
        this.credits.push(record);
        this.saveData();
    }

    // 获取今日记录
    getTodayRecords(type) {
        const today = new Date().toISOString().slice(0, 10);
        const records = type === 'income' ? this.income : this.expense;
        return records.filter(r => r.timestamp.slice(0, 10) === today);
    }

    // 获取指定日期范围记录
    getRecordsByRange(type, startDate, endDate) {
        const records = type === 'income' ? this.income : this.expense;
        return records.filter(r => {
            const d = r.timestamp.slice(0, 10);
            return d >= startDate && d <= endDate;
        });
    }

    // 计算总金额
    sumAmount(records) {
        return records.reduce((sum, r) => sum + (r.amount || 0), 0);
    }

    // 获取库存预警列表
    getLowStockItems() {
        const items = [];
        for (const [name, data] of Object.entries(this.inventory)) {
            const threshold = VEGGIES[name]?.threshold || 10;
            if (data.stock <= threshold) {
                items.push({ name, ...data, threshold, emoji: VEGGIES[name]?.emoji || '🥬' });
            }
        }
        return items;
    }

    // 获取蔬菜利润排行
    getVeggieProfitRank(startDate, endDate) {
        const incomes = this.getRecordsByRange('income', startDate, endDate);
        const expenses = this.getRecordsByRange('expense', startDate, endDate)
            .filter(e => e.category === 'purchase');

        const profitMap = {};

        incomes.forEach(r => {
            if (!profitMap[r.veggie]) profitMap[r.veggie] = { income: 0, expense: 0 };
            profitMap[r.veggie].income += r.amount || 0;
        });

        expenses.forEach(r => {
            if (!profitMap[r.veggie]) profitMap[r.veggie] = { income: 0, expense: 0 };
            profitMap[r.veggie].expense += r.amount || 0;
        });

        return Object.entries(profitMap)
            .map(([name, data]) => ({
                name,
                emoji: VEGGIES[name]?.emoji || '🥬',
                income: data.income,
                expense: data.expense,
                profit: data.income - data.expense
            }))
            .sort((a, b) => b.profit - a.profit);
    }
}

// ========== 示例数据生成 ==========
function generateSampleData(store) {
    // 检查是否已有数据
    if (store.income.length > 0 || store.expense.length > 0) return;

    const veggieNames = Object.keys(VEGGIES).filter(v => v !== '其他');
    const today = new Date();

    // 生成最近7天的示例数据
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const date = new Date(today);
        date.setDate(date.getDate() - dayOffset);
        const dateStr = date.toISOString().slice(0, 10);

        // 每天3-6笔进货
        const purchaseCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < purchaseCount; i++) {
            const veggie = veggieNames[Math.floor(Math.random() * veggieNames.length)];
            const weight = Math.round((20 + Math.random() * 80) * 10) / 10;
            const price = Math.round((1 + Math.random() * 4) * 100) / 100;
            store.expense.push({
                id: Date.now() - dayOffset * 86400000 - i * 1000,
                type: 'expense',
                category: 'purchase',
                veggie,
                weight,
                price,
                amount: Math.round(weight * price * 100) / 100,
                note: '供应商A',
                timestamp: `${dateStr}T0${5 + i}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00.000Z`
            });
        }

        // 每天5-10笔收入
        const saleCount = 5 + Math.floor(Math.random() * 6);
        for (let i = 0; i < saleCount; i++) {
            const veggie = veggieNames[Math.floor(Math.random() * veggieNames.length)];
            const weight = Math.round((5 + Math.random() * 40) * 10) / 10;
            const price = Math.round((2 + Math.random() * 6) * 100) / 100;
            const payMethods = ['cash', 'wechat', 'alipay', 'transfer'];
            store.income.push({
                id: Date.now() - dayOffset * 86400000 - i * 2000,
                type: 'income',
                veggie,
                weight,
                price,
                amount: Math.round(weight * price * 100) / 100,
                payment: payMethods[Math.floor(Math.random() * payMethods.length)],
                note: i % 3 === 0 ? '张老板' : '',
                timestamp: `${dateStr}T${String(8 + i).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00.000Z`
            });
        }

        // 其他支出（摊位费、运费等）
        if (dayOffset % 2 === 0) {
            store.expense.push({
                id: Date.now() - dayOffset * 86400000 - 99000,
                type: 'expense',
                category: 'rent',
                veggie: '',
                weight: 0,
                price: 0,
                amount: 150,
                note: '日租金',
                timestamp: `${dateStr}T06:00:00.000Z`
            });
        }
        store.expense.push({
            id: Date.now() - dayOffset * 86400000 - 98000,
            type: 'expense',
            category: 'transport',
            veggie: '',
            weight: 0,
            price: 0,
            amount: Math.round(50 + Math.random() * 100),
            note: '运费',
            timestamp: `${dateStr}T05:30:00.000Z`
        });
    }

    // 设置库存
    veggieNames.forEach(veggie => {
        const threshold = VEGGIES[veggie].threshold;
        store.inventory[veggie] = {
            stock: Math.round(threshold * (0.3 + Math.random() * 2.5)),
            maxStock: threshold * 3
        };
    });

    // 让几个蔬菜库存偏低以触发预警
    store.inventory['蘑菇'].stock = 8;
    store.inventory['西兰花'].stock = 12;
    store.inventory['辣椒'].stock = 10;

    store.saveData();
}

// ========== 应用初始化 ==========
const store = new DataStore();
generateSampleData(store);

// ========== Tab 导航切换 ==========
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item:not(.center-btn)');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.dataset.page;
            switchPage(pageId, item, navItems, pages);
        });
    });

    // 中间记账按钮
    document.getElementById('centerAddBtn').addEventListener('click', () => {
        openRecordModal('income');
    });

    // 快捷操作按钮
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action === 'addIncome') openRecordModal('income');
            else if (action === 'addExpense') openRecordModal('expense');
            else if (action === 'checkInventory') switchToPage('pageInventory');
            else if (action === 'viewStats') switchToPage('pageStats');
            else if (action === 'manageProducts') openProductsModal();
            else if (action === 'manageBuyers') openBuyersModal();
            else if (action === 'manageSuppliers') openSuppliersModal();
        });
    });
}

function switchPage(pageId, activeItem, navItems, pages) {
    navItems.forEach(n => n.classList.remove('active'));
    pages.forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });

    if (activeItem) activeItem.classList.add('active');
    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = 'block';
        // 触发重绘以启动动画
        requestAnimationFrame(() => {
            page.classList.add('active');
        });
    }

    // 刷新页面数据
    if (pageId === 'pageDashboard') refreshDashboard();
    else if (pageId === 'pageIncome') refreshIncomeList();
    else if (pageId === 'pageExpense') refreshExpenseList();
    else if (pageId === 'pageInventory') refreshInventoryList();
    else if (pageId === 'pageStats') refreshStats();
}

function switchToPage(pageId) {
    const navItems = document.querySelectorAll('.nav-item:not(.center-btn)');
    const pages = document.querySelectorAll('.page');
    const activeItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    switchPage(pageId, activeItem, navItems, pages);
}

// ========== 记账弹窗 ==========
let currentRecordType = 'income';
let selectedVeggie = '白菜';
let selectedPayment = 'cash';
let selectedCategory = 'purchase';
let selectedBuyerId = null; // 记账关联买家ID

function initRecordModal() {
    const modal = document.getElementById('addRecordModal');
    const closeBtn = document.getElementById('closeModal');

    // 关闭弹窗
    closeBtn.addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });

    // 收入/支出切换
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentRecordType = tab.dataset.type;
            toggleRecordType(currentRecordType);
        });
    });

    // 蔬菜选择
    document.querySelectorAll('.veggie-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.veggie-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedVeggie = btn.dataset.veggie;
        });
    });

    // 收款方式选择（含赊账联动）
    document.querySelectorAll('#paymentGroup .pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#paymentGroup .pay-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedPayment = btn.dataset.pay;
            // 赊账：显示买家选择器；其他：隐藏
            const buyerGroup = document.getElementById('buyerSelectorGroup');
            if (selectedPayment === 'credit') {
                buyerGroup.classList.remove('hidden');
                renderBuyerPicker('');
            } else {
                buyerGroup.classList.add('hidden');
                selectedBuyerId = null;
                document.getElementById('creditWarning').classList.add('hidden');
            }
        });
    });

    // 买家搜索过滤
    document.getElementById('buyerFilterInput').addEventListener('input', e => {
        renderBuyerPicker(e.target.value);
    });

    // 快速新增买家（从记账Modal跳转）
    document.getElementById('addBuyerQuickBtn').addEventListener('click', () => {
        openEditBuyerModal(null);
    });

    // 支出分类选择（含供应商联动）
    document.querySelectorAll('#expenseCategoryGroup .pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#expenseCategoryGroup .pay-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCategory = btn.dataset.category;
            // 进货类：显示供应商选择器；其他类：隐藏
            const supplierGroup = document.getElementById('supplierSelectorGroup');
            if (selectedCategory === 'purchase') {
                supplierGroup.classList.remove('hidden');
                renderSupplierPicker('');
            } else {
                supplierGroup.classList.add('hidden');
                selectedSupplierId = null;
            }
        });
    });

    // 供应商搜索过滤
    document.getElementById('supplierFilterInput').addEventListener('input', e => {
        renderSupplierPicker(e.target.value);
    });

    // 快速新增供应商（从记账Modal跳转）
    document.getElementById('addSupplierQuickBtn').addEventListener('click', () => {
        openEditSupplierModal(null);
    });

    // 自动计算金额
    const weightInput = document.getElementById('inputWeight');
    const priceInput = document.getElementById('inputPrice');
    const autoAmount = document.getElementById('autoAmount');

    function calcAmount() {
        const w = parseFloat(weightInput.value) || 0;
        const p = parseFloat(priceInput.value) || 0;
        const amount = Math.round(w * p * 100) / 100;
        autoAmount.textContent = `¥ ${amount.toFixed(2)}`;
    }

    weightInput.addEventListener('input', calcAmount);
    priceInput.addEventListener('input', calcAmount);

    // 提交表单
    document.getElementById('recordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const weight = parseFloat(weightInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const amount = Math.round(weight * price * 100) / 100;
        const note = document.getElementById('inputNote').value;

        if (amount <= 0) {
            showToast('请输入正确的重量和单价');
            return;
        }

        const record = {
            veggie: selectedVeggie,
            weight,
            price,
            amount,
            note
        };

        if (currentRecordType === 'income') {
            record.payment = selectedPayment;
            // 赊账：关联买家并更新欠款
            if (selectedPayment === 'credit') {
                if (!selectedBuyerId) {
                    showToast('⚠️ 赊账请先选择买家');
                    return;
                }
                record.buyerId = selectedBuyerId;
                const buyer = buyerManager.getBuyer(selectedBuyerId);
                if (buyer) {
                    const newCredit = (buyer.totalCredit || 0) + amount;
                    // 超额拦截提示（但不阻止）
                    if (buyer.creditLimit > 0 && newCredit > buyer.creditLimit) {
                        showToast(`⚠️ 注意：${buyer.name} 赊欠已超限额！`);
                    }
                    buyerManager.updateBuyer(selectedBuyerId, { totalCredit: Math.round(newCredit * 100) / 100 });
                    // 添加赊欠明细流水
                    store.addCredit({
                        buyerId: selectedBuyerId,
                        type: 'borrow', // borrow(借出赊账) 或 repay(还款)
                        amount: amount,
                        note: record.veggie ? `购买${record.veggie}${record.weight}斤` : '赊账购买'
                    });
                }
            }
            store.addIncome(record);
            showToast('✅ 收入记录成功！');
        } else {
            record.category = selectedCategory;
            // 进货：关联供应商并更新待付货款
            if (selectedCategory === 'purchase' && selectedSupplierId) {
                record.supplierId = selectedSupplierId;
                const supplier = supplierManager.getSupplier(selectedSupplierId);
                if (supplier) {
                    const newPayable = (supplier.totalPayable || 0) + amount;
                    supplierManager.updateSupplier(selectedSupplierId, { totalPayable: Math.round(newPayable * 100) / 100 });
                    showToast(`✅ 支出已记录，已关联供应商「${supplier.name}」`);
                } else {
                    showToast('✅ 支出记录成功！');
                }
            } else {
                showToast('✅ 支出记录成功！');
            }
            store.addExpense(record);
        }

        // 重置表单
        weightInput.value = '';
        priceInput.value = '';
        document.getElementById('inputNote').value = '';
        autoAmount.textContent = '¥ 0.00';
        // 重置买家选择
        selectedBuyerId = null;
        document.getElementById('buyerSelectorGroup').classList.add('hidden');
        document.getElementById('buyerFilterInput').value = '';
        document.getElementById('creditWarning').classList.add('hidden');
        // 重置供应商选择
        selectedSupplierId = null;
        document.getElementById('supplierSelectorGroup').classList.add('hidden');
        document.getElementById('supplierFilterInput').value = '';
        // 重置收款方式为现金
        document.querySelectorAll('#paymentGroup .pay-btn').forEach(b => b.classList.remove('selected'));
        document.querySelector('#paymentGroup .pay-btn[data-pay="cash"]').classList.add('selected');
        selectedPayment = 'cash';
        // 重置支出分类为进货
        document.querySelectorAll('#expenseCategoryGroup .pay-btn').forEach(b => b.classList.remove('selected'));
        document.querySelector('#expenseCategoryGroup .pay-btn[data-category="purchase"]').classList.add('selected');
        selectedCategory = 'purchase';

        closeModal(modal);

        // 刷新当前页面
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id;
            if (pageId === 'pageDashboard') refreshDashboard();
            else if (pageId === 'pageIncome') refreshIncomeList();
            else if (pageId === 'pageExpense') refreshExpenseList();
            else if (pageId === 'pageInventory') refreshInventoryList();
        }
    });

    // 收入/支出页面的新增按钮
    document.getElementById('addIncomeBtn').addEventListener('click', () => openRecordModal('income'));
    document.getElementById('addExpenseBtn').addEventListener('click', () => openRecordModal('expense'));
}

function openRecordModal(type) {
    currentRecordType = type;
    const modal = document.getElementById('addRecordModal');
    const tabs = document.querySelectorAll('.modal-tab');
    tabs.forEach(t => {
        t.classList.toggle('active', t.dataset.type === type);
    });
    toggleRecordType(type);
    modal.classList.add('active');
}

function toggleRecordType(type) {
    const paymentGroup = document.getElementById('paymentGroup');
    const categoryGroup = document.getElementById('expenseCategoryGroup');
    const buyerGroup = document.getElementById('buyerSelectorGroup');
    const supplierGroup = document.getElementById('supplierSelectorGroup');
    if (type === 'income') {
        paymentGroup.classList.remove('hidden');
        categoryGroup.classList.add('hidden');
        // 隐藏供应商选择器
        supplierGroup.classList.add('hidden');
        selectedSupplierId = null;
    } else {
        paymentGroup.classList.add('hidden');
        categoryGroup.classList.remove('hidden');
        // 切换到支出时隐藏买家选择器
        buyerGroup.classList.add('hidden');
        selectedBuyerId = null;
        // 默认进货类 → 显示供应商选择器
        if (selectedCategory === 'purchase') {
            supplierGroup.classList.remove('hidden');
            renderSupplierPicker('');
        }
    }
}

// ========== 买家选择器渲染（记账用）==========
function renderBuyerPicker(search) {
    const buyers = buyerManager.getBuyers(search);
    const container = document.getElementById('buyerPickerList');

    if (buyers.length === 0) {
        container.innerHTML = `<div class="buyer-picker-empty">没有找到匹配买家，可点击「+ 新增买家」</div>`;
        return;
    }

    container.innerHTML = buyers.map(buyer => {
        const cat = BUYER_CATEGORIES[buyer.category] || BUYER_CATEGORIES.other;
        const creditInfo = buyer.creditLimit > 0
            ? `已欠¥${(buyer.totalCredit || 0).toFixed(0)} / 限额¥${buyer.creditLimit}`
            : '无赊欠限额';
        const isSelected = buyer.id === selectedBuyerId;
        return `
            <div class="buyer-picker-item ${isSelected ? 'selected' : ''}" data-id="${buyer.id}" onclick="selectBuyerForRecord('${buyer.id}')">
                <span class="buyer-picker-avatar" style="background:${cat.color}15;color:${cat.color}">${cat.icon}</span>
                <div class="buyer-picker-info">
                    <span class="buyer-picker-name">${buyer.name}</span>
                    <span class="buyer-picker-credit">${creditInfo}</span>
                </div>
                ${isSelected ? '<span class="buyer-picker-check">✓</span>' : ''}
            </div>
        `;
    }).join('');
}

// ========== 选择买家（记账用）==========
function selectBuyerForRecord(buyerId) {
    selectedBuyerId = buyerId;
    const buyer = buyerManager.getBuyer(buyerId);
    // 刷新列表显示选中状态
    renderBuyerPicker(document.getElementById('buyerFilterInput').value);
    // 赊欠预警
    const warning = document.getElementById('creditWarning');
    const warningText = document.getElementById('creditWarningText');
    if (buyer && buyer.creditLimit > 0) {
        const ratio = (buyer.totalCredit || 0) / buyer.creditLimit;
        if (ratio >= 1) {
            warningText.textContent = `⛔ ${buyer.name} 赊欠已达上限 ¥${buyer.creditLimit}，无法继续赊账！`;
            warning.className = 'credit-warning danger';
            warning.classList.remove('hidden');
        } else if (ratio >= 0.8) {
            warningText.textContent = `⚠️ ${buyer.name} 赊欠已达 ${Math.round(ratio * 100)}%，请注意催款`;
            warning.className = 'credit-warning warn';
            warning.classList.remove('hidden');
        } else {
            warning.classList.add('hidden');
        }
    } else {
        warning.classList.add('hidden');
    }
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// ========== 损耗弹窗 ==========
function initLossModal() {
    const modal = document.getElementById('lossModal');
    const closeBtn = document.getElementById('closeLossModal');
    const select = document.getElementById('lossVeggie');
    let selectedLossReason = 'spoiled';

    // 填充蔬菜选项
    Object.entries(store.inventory).forEach(([name, data]) => {
        if (data.stock > 0) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = `${VEGGIES[name]?.emoji || '🥬'} ${name} (库存: ${data.stock}斤)`;
            select.appendChild(opt);
        }
    });

    document.getElementById('addLossBtn').addEventListener('click', () => {
        modal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // 损耗原因选择
    document.querySelectorAll('#lossModal .pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#lossModal .pay-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedLossReason = btn.dataset.reason;
        });
    });

    document.getElementById('lossForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const veggie = select.value;
        const weight = parseFloat(document.getElementById('lossWeight').value) || 0;
        if (!veggie || weight <= 0) {
            showToast('请选择蔬菜并输入损耗重量');
            return;
        }
        store.addLoss({ veggie, weight, reason: selectedLossReason });
        showToast('✅ 损耗记录成功');
        modal.classList.remove('active');
        refreshInventoryList();
    });
}

// ========== Toast 提示 ==========
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ========== 工具函数 ==========
function formatMoney(num) {
    return '¥' + (num || 0).toFixed(2);
}

function formatDate(isoStr) {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatTime(isoStr) {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getDateStr(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
}

function getWeekStart() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
}

function getMonthStart() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// ========== 设置日期显示 ==========
function setHeaderDate() {
    const now = new Date();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
    document.getElementById('headerDate').textContent = dateStr;
}

// ========== 应用启动 ==========
document.addEventListener('DOMContentLoaded', () => {
    setHeaderDate();
    initNavigation();
    initProductManager();     // 初始化商品管理（必须在initRecordModal之前）
    initBuyerManager();        // 初始化买家管理
    initSupplierManager();     // 初始化供应商管理
    initCreditManager();
    initRecordModal();
    initLossModal();
    initCategoryFilter();
    initTimeRange();
    initInventorySearch();
    initExport();

    // 用商品数据刷新蔬菜选择网格
    refreshVeggieGrid();

    // 初始化首页
    refreshDashboard();
});

// 分类筛选
function initCategoryFilter() {
    document.querySelectorAll('#expenseCategoryBar .cat-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('#expenseCategoryBar .cat-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            refreshExpenseList(item.dataset.filter);
        });
    });
}

// 时间范围
function initTimeRange() {
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            refreshStats(btn.dataset.range);
        });
    });
}

// 库存搜索
function initInventorySearch() {
    document.getElementById('inventorySearch').addEventListener('input', (e) => {
        refreshInventoryList(e.target.value);
    });
}

// 导出（模拟）
function initExport() {
    document.getElementById('exportBtn').addEventListener('click', () => {
        showToast('📤 报表导出功能开发中...');
    });
}
