/* ========================================
   菜老板记账APP - 供应商管理逻辑
   ======================================== */

// ========== 供应商分类配置 ==========
const SUPPLIER_CATEGORIES = {
    farm: { label: '农场/农户', icon: '🌾', color: '#22C55E' },
    wholesale: { label: '批发市场', icon: '🏭', color: '#3B82F6' },
    cooperative: { label: '合作社', icon: '🤝', color: '#8B5CF6' },
    importer: { label: '进口商', icon: '🚢', color: '#06B6D4' },
    broker: { label: '经纪人', icon: '🤵', color: '#F59E0B' },
    other: { label: '其他', icon: '📦', color: '#94A3B8' }
};

// ========== 付款方式配置 ==========
const SUPPLIER_PAYMENT_TERMS = {
    cash: '现付',
    monthly: '月结',
    weekly: '周结',
    prepaid: '预付款',
    credit30: '30天账期',
    credit60: '60天账期',
};

// ========== 供应商管理类 ==========
class SupplierManager {
    constructor() {
        this.loadSuppliers();
    }

    loadSuppliers() {
        try {
            this.suppliers = JSON.parse(localStorage.getItem('veggie_suppliers') || '[]');
        } catch (e) {
            console.error('供应商数据加载失败:', e);
            this.suppliers = [];
        }
        if (this.suppliers.length === 0) {
            this.initSampleSuppliers();
        }
    }

    initSampleSuppliers() {
        this.suppliers = [
            {
                id: 'sup_1',
                name: '绿源农场',
                phone: '13500001111',
                category: 'farm',
                address: '郊区绿源路88号',
                note: '有机蔬菜专供，品质稳定',
                paymentTerm: 'monthly',
                creditLimit: 0,
                contact: '王老板',
                totalPayable: 3200,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'sup_2',
                name: '城南批发市场',
                phone: '021-88889999',
                category: 'wholesale',
                address: '城南大道1号批发区',
                note: '蔬菜品种齐全，价格实惠',
                paymentTerm: 'cash',
                creditLimit: 0,
                contact: '李经理',
                totalPayable: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'sup_3',
                name: '农协合作社',
                phone: '13700002222',
                category: 'cooperative',
                address: '东郊农协基地',
                note: '季节性蔬菜，提前预订',
                paymentTerm: 'credit30',
                creditLimit: 0,
                contact: '张主任',
                totalPayable: 1500,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        this.saveSuppliers();
    }

    saveSuppliers() {
        localStorage.setItem('veggie_suppliers', JSON.stringify(this.suppliers));
    }

    addSupplier(supplier) {
        supplier.id = 'sup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        supplier.totalPayable = 0;
        supplier.createdAt = new Date().toISOString();
        supplier.updatedAt = new Date().toISOString();
        this.suppliers.push(supplier);
        this.saveSuppliers();
        return supplier;
    }

    updateSupplier(id, updates) {
        const idx = this.suppliers.findIndex(s => s.id === id);
        if (idx === -1) return null;
        this.suppliers[idx] = { ...this.suppliers[idx], ...updates, updatedAt: new Date().toISOString() };
        this.saveSuppliers();
        return this.suppliers[idx];
    }

    deleteSupplier(id) {
        const idx = this.suppliers.findIndex(s => s.id === id);
        if (idx === -1) return false;
        this.suppliers.splice(idx, 1);
        this.saveSuppliers();
        return true;
    }

    getSuppliers(search = '', categoryFilter = 'all') {
        let result = this.suppliers;
        if (categoryFilter !== 'all') {
            result = result.filter(s => s.category === categoryFilter);
        }
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.phone.includes(q) ||
                (s.contact && s.contact.toLowerCase().includes(q)) ||
                (s.note && s.note.toLowerCase().includes(q))
            );
        }
        return result;
    }

    getSupplier(id) {
        return this.suppliers.find(s => s.id === id);
    }

    getTotalPayable() {
        return this.suppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0);
    }
}

// ========== 全局供应商管理器 ==========
let supplierManager;
let currentSupplierFilter = 'all';
let currentEditSupplierId = null;

// ========== 初始化供应商管理 ==========
function initSupplierManager() {
    supplierManager = new SupplierManager();

    // 打开/关闭供应商管理弹窗
    document.getElementById('openSuppliersBtn').addEventListener('click', openSuppliersModal);
    document.getElementById('closeSuppliersModal').addEventListener('click', () =>
        closeModal(document.getElementById('suppliersModal')));
    document.getElementById('suppliersModal').addEventListener('click', e => {
        if (e.target.id === 'suppliersModal') closeModal(document.getElementById('suppliersModal'));
    });

    // 打开/关闭编辑弹窗
    document.getElementById('closeEditSupplierModal').addEventListener('click', () =>
        closeModal(document.getElementById('editSupplierModal')));
    document.getElementById('editSupplierModal').addEventListener('click', e => {
        if (e.target.id === 'editSupplierModal') closeModal(document.getElementById('editSupplierModal'));
    });

    // 新增按钮
    document.getElementById('addSupplierBtn').addEventListener('click', () => openEditSupplierModal(null));

    // 搜索
    document.getElementById('supplierSearch').addEventListener('input', e =>
        renderSupplierList(e.target.value, currentSupplierFilter));

    // 分类筛选
    document.querySelectorAll('#supplierCategoryBar .cat-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('#supplierCategoryBar .cat-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentSupplierFilter = item.dataset.filter;
            renderSupplierList(document.getElementById('supplierSearch').value, currentSupplierFilter);
        });
    });

    // 分类选择按钮
    document.querySelectorAll('#supplierCatSelector .pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#supplierCatSelector .pay-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // 付款方式选择
    document.querySelectorAll('#supplierPayTermSelector .pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#supplierPayTermSelector .pay-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // 表单提交
    document.getElementById('supplierForm').addEventListener('submit', e => {
        e.preventDefault();
        submitSupplierForm();
    });
}

// ========== 打开供应商管理弹窗 ==========
function openSuppliersModal() {
    renderSupplierOverview();
    renderSupplierList();
    document.getElementById('suppliersModal').classList.add('active');
}

// ========== 渲染总览数据 ==========
function renderSupplierOverview() {
    document.getElementById('supplierTotalCount').textContent = supplierManager.suppliers.length;
    document.getElementById('supplierTotalPayable').textContent =
        '¥' + supplierManager.getTotalPayable().toFixed(0);
    const pending = supplierManager.suppliers.filter(s => (s.totalPayable || 0) > 0).length;
    document.getElementById('supplierPendingCount').textContent = pending;
}

// ========== 渲染供应商列表 ==========
function renderSupplierList(search = '', categoryFilter = 'all') {
    const suppliers = supplierManager.getSuppliers(search, categoryFilter);
    const container = document.getElementById('supplierListContainer');

    if (suppliers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏭</div>
                <p class="empty-text">${search || categoryFilter !== 'all' ? '没有找到匹配的供应商' : '还没有添加任何供应商'}</p>
            </div>`;
        return;
    }

    container.innerHTML = suppliers.map(sup => {
        const cat = SUPPLIER_CATEGORIES[sup.category] || SUPPLIER_CATEGORIES.other;
        const termLabel = SUPPLIER_PAYMENT_TERMS[sup.paymentTerm] || '现付';
        const hasPayable = (sup.totalPayable || 0) > 0;

        return `
            <div class="buyer-card">
                <div class="buyer-card-top">
                    <div class="buyer-card-left">
                        <div class="buyer-avatar" style="background:${cat.color}15;color:${cat.color}">
                            ${cat.icon}
                        </div>
                        <div class="buyer-card-info">
                            <div class="buyer-card-name">${sup.name}</div>
                            <div class="buyer-card-meta">
                                <span class="buyer-cat-tag" style="background:${cat.color}15;color:${cat.color}">${cat.label}</span>
                                <span class="buyer-cat-tag" style="background:#F1F5F9;color:#64748B">🗓 ${termLabel}</span>
                                ${sup.phone ? `<span class="buyer-phone">📱 ${sup.phone}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="product-card-actions">
                        <button class="product-edit-btn" onclick="openEditSupplierModal('${sup.id}')" title="编辑">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="product-delete-btn" onclick="deleteSupplierConfirm('${sup.id}')" title="删除">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                ${hasPayable ? `
                <div class="buyer-credit-section">
                    <span class="supplier-payable-text">💳 待付货款：<strong>¥${(sup.totalPayable || 0).toFixed(0)}</strong></span>
                </div>` : ''}
                ${sup.contact ? `<div class="buyer-note-line">👤 联系人：${sup.contact}</div>` : ''}
                ${sup.address ? `<div class="buyer-note-line">📍 ${sup.address}</div>` : ''}
                ${sup.note ? `<div class="buyer-note-line">💬 ${sup.note}</div>` : ''}
            </div>`;
    }).join('');
}

// ========== 打开编辑供应商弹窗 ==========
function openEditSupplierModal(supplierId) {
    currentEditSupplierId = supplierId;
    const isEdit = !!supplierId;
    const sup = isEdit ? supplierManager.getSupplier(supplierId) : null;

    document.getElementById('editSupplierTitle').textContent = isEdit ? '编辑供应商' : '新增供应商';

    document.getElementById('supplierName').value = isEdit ? sup.name : '';
    document.getElementById('supplierPhone').value = isEdit ? (sup.phone || '') : '';
    document.getElementById('supplierContact').value = isEdit ? (sup.contact || '') : '';
    document.getElementById('supplierAddress').value = isEdit ? (sup.address || '') : '';
    document.getElementById('supplierNote').value = isEdit ? (sup.note || '') : '';

    const category = (isEdit ? sup.category : 'farm') || 'farm';
    document.querySelectorAll('#supplierCatSelector .pay-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.category === category);
    });

    const term = (isEdit ? sup.paymentTerm : 'cash') || 'cash';
    document.querySelectorAll('#supplierPayTermSelector .pay-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.term === term);
    });

    document.getElementById('editSupplierModal').classList.add('active');
}

// ========== 提交供应商表单 ==========
function submitSupplierForm() {
    const name = document.getElementById('supplierName').value.trim();
    const phone = document.getElementById('supplierPhone').value.trim();
    const contact = document.getElementById('supplierContact').value.trim();
    const address = document.getElementById('supplierAddress').value.trim();
    const note = document.getElementById('supplierNote').value.trim();

    const selectedCatBtn = document.querySelector('#supplierCatSelector .pay-btn.selected');
    const category = selectedCatBtn ? selectedCatBtn.dataset.category : 'other';
    const selectedTermBtn = document.querySelector('#supplierPayTermSelector .pay-btn.selected');
    const paymentTerm = selectedTermBtn ? selectedTermBtn.dataset.term : 'cash';

    if (!name) { showToast('⚠️ 请输入供应商名称'); return; }

    const data = { name, phone, contact, address, note, category, paymentTerm };

    if (currentEditSupplierId) {
        supplierManager.updateSupplier(currentEditSupplierId, data);
        showToast('✅ 供应商信息已更新');
    } else {
        supplierManager.addSupplier(data);
        showToast('✅ 供应商添加成功');
    }

    closeModal(document.getElementById('editSupplierModal'));
    renderSupplierOverview();
    renderSupplierList(document.getElementById('supplierSearch').value, currentSupplierFilter);
}

// ========== 删除供应商 ==========
function deleteSupplierConfirm(supplierId) {
    const sup = supplierManager.getSupplier(supplierId);
    if (!sup) return;
    if (confirm(`确定要删除供应商「${sup.name}」吗？`)) {
        supplierManager.deleteSupplier(supplierId);
        showToast('🗑️ 供应商已删除');
        renderSupplierOverview();
        renderSupplierList(document.getElementById('supplierSearch').value, currentSupplierFilter);
    }
}

// ========== 供应商选择器（记账用）==========
let selectedSupplierId = null;

function renderSupplierPicker(search) {
    const suppliers = supplierManager.getSuppliers(search);
    const container = document.getElementById('supplierPickerList');
    if (!container) return;

    if (suppliers.length === 0) {
        container.innerHTML = `<div class="buyer-picker-empty">没有找到匹配供应商，可点击「+ 新增供应商」</div>`;
        return;
    }

    container.innerHTML = suppliers.map(sup => {
        const cat = SUPPLIER_CATEGORIES[sup.category] || SUPPLIER_CATEGORIES.other;
        const term = SUPPLIER_PAYMENT_TERMS[sup.paymentTerm] || '现付';
        const isSelected = sup.id === selectedSupplierId;
        return `
            <div class="buyer-picker-item ${isSelected ? 'selected' : ''}" data-id="${sup.id}" onclick="selectSupplierForRecord('${sup.id}')">
                <span class="buyer-picker-avatar" style="background:${cat.color}15;color:${cat.color}">${cat.icon}</span>
                <div class="buyer-picker-info">
                    <span class="buyer-picker-name">${sup.name}</span>
                    <span class="buyer-picker-credit">🗓 ${term}${sup.contact ? ' · 联系人：' + sup.contact : ''}</span>
                </div>
                ${isSelected ? '<span class="buyer-picker-check">✓</span>' : ''}
            </div>`;
    }).join('');
}

function selectSupplierForRecord(supplierId) {
    selectedSupplierId = supplierId;
    renderSupplierPicker(document.getElementById('supplierFilterInput')?.value || '');
}
