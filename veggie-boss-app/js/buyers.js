/* ========================================
   菜老板记账APP - 买家管理逻辑
   ======================================== */

// ========== 买家分类配置 ==========
const BUYER_CATEGORIES = {
    restaurant: { label: '餐馆', icon: '🍽️', color: '#F59E0B' },
    hotel: { label: '酒店', icon: '🏨', color: '#8B5CF6' },
    canteen: { label: '食堂', icon: '🏫', color: '#3B82F6' },
    market: { label: '零售商', icon: '🏪', color: '#22C55E' },
    supermarket: { label: '超市', icon: '🛒', color: '#06B6D4' },
    personal: { label: '个人', icon: '👤', color: '#64748B' },
    other: { label: '其他', icon: '📋', color: '#94A3B8' }
};

// ========== 买家管理类 ==========
class BuyerManager {
    constructor() {
        this.loadBuyers();
    }

    // 加载买家数据
    loadBuyers() {
        try {
            this.buyers = JSON.parse(localStorage.getItem('veggie_buyers') || '[]');
        } catch (e) {
            console.error('买家数据加载失败:', e);
            this.buyers = [];
        }

        // 如果没有数据，生成一些示例数据
        if (this.buyers.length === 0) {
            this.initSampleBuyers();
        }
    }

    // 初始化示例买家
    initSampleBuyers() {
        this.buyers = [
            {
                id: 'buyer_1',
                name: '张记饭店',
                phone: '13800001111',
                category: 'restaurant',
                note: '老客户，每周进货3次',
                invoiceTitle: '张记餐饮有限公司',
                invoiceDesc: '增值税普通发票',
                creditLimit: 5000,
                creditDays: 30,
                totalCredit: 1200,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'buyer_2',
                name: '李阿姨',
                phone: '13900002222',
                category: 'personal',
                note: '每天早上来',
                invoiceTitle: '',
                invoiceDesc: '',
                creditLimit: 0,
                creditDays: 0,
                totalCredit: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'buyer_3',
                name: '阳光超市',
                phone: '021-55556666',
                category: 'supermarket',
                note: '大客户，需要配送',
                invoiceTitle: '阳光连锁超市有限公司',
                invoiceDesc: '增值税专用发票',
                creditLimit: 20000,
                creditDays: 45,
                totalCredit: 8500,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'buyer_4',
                name: '第一中学食堂',
                phone: '13700003333',
                category: 'canteen',
                note: '学期内每工作日配送',
                invoiceTitle: '市第一中学',
                invoiceDesc: '增值税普通发票',
                creditLimit: 10000,
                creditDays: 30,
                totalCredit: 3200,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        this.saveBuyers();
    }

    // 保存买家数据
    saveBuyers() {
        localStorage.setItem('veggie_buyers', JSON.stringify(this.buyers));
    }

    // 添加买家
    addBuyer(buyer) {
        buyer.id = 'buyer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        buyer.totalCredit = 0;
        buyer.createdAt = new Date().toISOString();
        buyer.updatedAt = new Date().toISOString();
        this.buyers.push(buyer);
        this.saveBuyers();
        return buyer;
    }

    // 更新买家
    updateBuyer(id, updates) {
        const idx = this.buyers.findIndex(b => b.id === id);
        if (idx === -1) return null;
        this.buyers[idx] = { ...this.buyers[idx], ...updates, updatedAt: new Date().toISOString() };
        this.saveBuyers();
        return this.buyers[idx];
    }

    // 删除买家
    deleteBuyer(id) {
        const idx = this.buyers.findIndex(b => b.id === id);
        if (idx === -1) return false;
        this.buyers.splice(idx, 1);
        this.saveBuyers();
        return true;
    }

    // 获取买家列表
    getBuyers(search = '', categoryFilter = 'all') {
        let result = this.buyers;
        if (categoryFilter !== 'all') {
            result = result.filter(b => b.category === categoryFilter);
        }
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(b =>
                b.name.toLowerCase().includes(q) ||
                b.phone.includes(q) ||
                (b.note && b.note.toLowerCase().includes(q))
            );
        }
        return result;
    }

    // 获取指定买家
    getBuyer(id) {
        return this.buyers.find(b => b.id === id);
    }

    // 获取各分类买家数量
    getCategoryStats() {
        const stats = {};
        this.buyers.forEach(b => {
            stats[b.category] = (stats[b.category] || 0) + 1;
        });
        return stats;
    }

    // 获取赊欠总额
    getTotalCredit() {
        return this.buyers.reduce((sum, b) => sum + (b.totalCredit || 0), 0);
    }

    // 获取超额赊欠的买家
    getOverCreditBuyers() {
        return this.buyers.filter(b =>
            b.creditLimit > 0 && b.totalCredit >= b.creditLimit * 0.8
        );
    }
}

// ========== 全局买家管理器 ==========
let buyerManager;

// ========== 初始化买家管理 ==========
function initBuyerManager() {
    buyerManager = new BuyerManager();

    // 打开买家管理弹窗
    document.getElementById('openBuyersBtn').addEventListener('click', () => {
        openBuyersModal();
    });

    // 关闭买家管理弹窗
    document.getElementById('closeBuyersModal').addEventListener('click', () => {
        closeModal(document.getElementById('buyersModal'));
    });
    document.getElementById('buyersModal').addEventListener('click', (e) => {
        if (e.target.id === 'buyersModal') closeModal(document.getElementById('buyersModal'));
    });

    // 关闭编辑买家弹窗
    document.getElementById('closeEditBuyerModal').addEventListener('click', () => {
        closeModal(document.getElementById('editBuyerModal'));
    });
    document.getElementById('editBuyerModal').addEventListener('click', (e) => {
        if (e.target.id === 'editBuyerModal') closeModal(document.getElementById('editBuyerModal'));
    });

    // 新增买家按钮
    document.getElementById('addBuyerBtn').addEventListener('click', () => {
        openEditBuyerModal(null);
    });

    // 买家搜索
    document.getElementById('buyerSearch').addEventListener('input', (e) => {
        renderBuyerList(e.target.value, currentBuyerFilter);
    });

    // 分类筛选
    document.querySelectorAll('#buyerCategoryBar .cat-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('#buyerCategoryBar .cat-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentBuyerFilter = item.dataset.filter;
            renderBuyerList(document.getElementById('buyerSearch').value, currentBuyerFilter);
        });
    });

    // 买家表单提交
    document.getElementById('buyerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitBuyerForm();
    });

    // 分类选择按钮
    document.querySelectorAll('#buyerCatSelector .pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#buyerCatSelector .pay-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}

let currentBuyerFilter = 'all';
let currentEditBuyerId = null;

// ========== 打开买家管理弹窗 ==========
function openBuyersModal() {
    renderBuyerOverview();
    renderBuyerList();
    document.getElementById('buyersModal').classList.add('active');
}

// ========== 渲染买家概览 ==========
function renderBuyerOverview() {
    document.getElementById('buyerTotalCount').textContent = buyerManager.buyers.length;
    document.getElementById('buyerTotalCredit').textContent =
        '¥' + buyerManager.getTotalCredit().toFixed(0);
    const overCredit = buyerManager.getOverCreditBuyers();
    document.getElementById('buyerOverCredit').textContent = overCredit.length;
}

// ========== 渲染买家列表 ==========
function renderBuyerList(search = '', categoryFilter = 'all') {
    const buyers = buyerManager.getBuyers(search, categoryFilter);
    const container = document.getElementById('buyerListContainer');

    if (buyers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <p class="empty-text">${search || categoryFilter !== 'all' ? '没有找到匹配的买家' : '还没有添加任何买家'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = buyers.map(buyer => {
        const cat = BUYER_CATEGORIES[buyer.category] || BUYER_CATEGORIES.other;
        const creditPercent = buyer.creditLimit > 0
            ? Math.min(100, (buyer.totalCredit / buyer.creditLimit) * 100)
            : 0;
        const isOverCredit = buyer.creditLimit > 0 && buyer.totalCredit >= buyer.creditLimit * 0.8;

        // 赊欠信息
        let creditHtml = '';
        if (buyer.creditLimit > 0) {
            creditHtml = `
                <div class="buyer-credit-bar">
                    <div class="buyer-credit-fill ${isOverCredit ? 'danger' : ''}" style="width: ${creditPercent}%"></div>
                </div>
                <span class="buyer-credit-text ${isOverCredit ? 'danger-text' : ''}">
                    欠¥${(buyer.totalCredit || 0).toFixed(0)} / 限额¥${buyer.creditLimit}
                </span>
            `;
        }

        return `
            <div class="buyer-card" data-id="${buyer.id}">
                <div class="buyer-card-top">
                    <div class="buyer-card-left">
                        <div class="buyer-avatar" style="background: ${cat.color}15; color: ${cat.color}">
                            ${cat.icon}
                        </div>
                        <div class="buyer-card-info">
                            <div class="buyer-card-name">${buyer.name}</div>
                            <div class="buyer-card-meta">
                                <span class="buyer-cat-tag" style="background: ${cat.color}15; color: ${cat.color}">${cat.label}</span>
                                ${buyer.phone ? `<span class="buyer-phone">📱 ${buyer.phone}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="product-card-actions">
                        <button class="product-edit-btn" onclick="openEditBuyerModal('${buyer.id}')" title="编辑">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="product-delete-btn" onclick="deleteBuyerConfirm('${buyer.id}')" title="删除">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                ${creditHtml ? `<div class="buyer-credit-section">${creditHtml}</div>` : ''}
                ${buyer.note ? `<div class="buyer-note-line">💬 ${buyer.note}</div>` : ''}
            </div>
        `;
    }).join('');
}

// ========== 打开编辑买家弹窗 ==========
function openEditBuyerModal(buyerId) {
    currentEditBuyerId = buyerId;
    const isEdit = !!buyerId;
    const buyer = isEdit ? buyerManager.getBuyer(buyerId) : null;

    document.getElementById('editBuyerTitle').textContent = isEdit ? '编辑买家' : '新增买家';

    // 填充表单
    document.getElementById('buyerName').value = isEdit ? buyer.name : '';
    document.getElementById('buyerPhone').value = isEdit ? buyer.phone : '';
    document.getElementById('buyerNote').value = isEdit ? (buyer.note || '') : '';
    document.getElementById('buyerInvoiceTitle').value = isEdit ? (buyer.invoiceTitle || '') : '';
    document.getElementById('buyerInvoiceDesc').value = isEdit ? (buyer.invoiceDesc || '') : '';
    document.getElementById('buyerCreditLimit').value = isEdit ? (buyer.creditLimit || '') : '';
    document.getElementById('buyerCreditDays').value = isEdit ? (buyer.creditDays || '') : '';

    // 设置分类
    const category = isEdit ? buyer.category : 'restaurant';
    document.querySelectorAll('#buyerCatSelector .pay-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.category === category);
    });

    document.getElementById('editBuyerModal').classList.add('active');
}

// ========== 提交买家表单 ==========
function submitBuyerForm() {
    const name = document.getElementById('buyerName').value.trim();
    const phone = document.getElementById('buyerPhone').value.trim();
    const note = document.getElementById('buyerNote').value.trim();
    const invoiceTitle = document.getElementById('buyerInvoiceTitle').value.trim();
    const invoiceDesc = document.getElementById('buyerInvoiceDesc').value.trim();
    const creditLimit = parseFloat(document.getElementById('buyerCreditLimit').value) || 0;
    const creditDays = parseInt(document.getElementById('buyerCreditDays').value) || 0;

    // 获取选中的分类
    const selectedCatBtn = document.querySelector('#buyerCatSelector .pay-btn.selected');
    const category = selectedCatBtn ? selectedCatBtn.dataset.category : 'other';

    if (!name) {
        showToast('⚠️ 请输入买家名称');
        return;
    }

    const buyerData = {
        name, phone, category, note,
        invoiceTitle, invoiceDesc,
        creditLimit, creditDays
    };

    if (currentEditBuyerId) {
        buyerManager.updateBuyer(currentEditBuyerId, buyerData);
        showToast('✅ 买家信息已更新');
    } else {
        buyerManager.addBuyer(buyerData);
        showToast('✅ 买家添加成功');
    }

    closeModal(document.getElementById('editBuyerModal'));
    renderBuyerOverview();
    renderBuyerList(document.getElementById('buyerSearch').value, currentBuyerFilter);
}

// ========== 删除买家确认 ==========
function deleteBuyerConfirm(buyerId) {
    const buyer = buyerManager.getBuyer(buyerId);
    if (!buyer) return;

    if (confirm(`确定要删除买家「${buyer.name}」吗？`)) {
        buyerManager.deleteBuyer(buyerId);
        showToast('🗑️ 买家已删除');
        renderBuyerOverview();
        renderBuyerList(document.getElementById('buyerSearch').value, currentBuyerFilter);
    }
}
