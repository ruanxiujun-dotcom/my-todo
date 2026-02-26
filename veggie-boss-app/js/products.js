/* ========================================
   菜老板记账APP - 商品管理逻辑
   ======================================== */

// ========== 默认包装类型配置 ==========
const DEFAULT_PACK_TYPES = [
    { id: 'jin', label: '斤', icon: '⚖️' },
    { id: 'box', label: '箱', icon: '📦' },
    { id: 'bag', label: '袋', icon: '🛍️' },
    { id: 'bundle', label: '捆', icon: '🪢' },
    { id: 'piece', label: '个', icon: '🔢' },
    { id: 'kg', label: '公斤', icon: '🏋️' },
];

// ========== 商品管理类 ==========
class ProductManager {
    constructor(store) {
        this.store = store;
        this.loadProducts();
    }

    // 加载商品数据
    loadProducts() {
        try {
            this.products = JSON.parse(localStorage.getItem('veggie_products') || '[]');
        } catch (e) {
            console.error('商品数据加载失败:', e);
            this.products = [];
        }

        // 如果没有任何商品数据，从VEGGIES初始化默认商品
        if (this.products.length === 0) {
            this.initDefaultProducts();
        }
    }

    // 初始化默认商品列表
    initDefaultProducts() {
        const defaultProducts = Object.entries(VEGGIES)
            .filter(([name]) => name !== '其他')
            .map(([name, config]) => ({
                id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                name: name,
                emoji: config.emoji,
                threshold: config.threshold,
                packages: [
                    { packType: 'jin', label: '斤', price: 0, isDefault: true }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

        this.products = defaultProducts;
        this.saveProducts();
    }

    // 保存商品数据
    saveProducts() {
        localStorage.setItem('veggie_products', JSON.stringify(this.products));
    }

    // 添加商品
    addProduct(product) {
        product.id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        product.createdAt = new Date().toISOString();
        product.updatedAt = new Date().toISOString();
        this.products.push(product);
        this.saveProducts();

        // 同步到VEGGIES配置
        this.syncToVeggies();
        return product;
    }

    // 更新商品
    updateProduct(id, updates) {
        const idx = this.products.findIndex(p => p.id === id);
        if (idx === -1) return null;

        this.products[idx] = { ...this.products[idx], ...updates, updatedAt: new Date().toISOString() };
        this.saveProducts();
        this.syncToVeggies();
        return this.products[idx];
    }

    // 删除商品
    deleteProduct(id) {
        const idx = this.products.findIndex(p => p.id === id);
        if (idx === -1) return false;

        const product = this.products[idx];
        this.products.splice(idx, 1);
        this.saveProducts();

        // 从VEGGIES中移除
        delete VEGGIES[product.name];
        return true;
    }

    // 获取商品列表
    getProducts(search = '') {
        if (!search) return this.products;
        return this.products.filter(p => p.name.includes(search));
    }

    // 获取指定商品
    getProduct(id) {
        return this.products.find(p => p.id === id);
    }

    // 根据商品名获取包装列表
    getPackagesByName(name) {
        const product = this.products.find(p => p.name === name);
        return product ? product.packages : [{ packType: 'jin', label: '斤', price: 0, isDefault: true }];
    }

    // 同步商品数据到VEGGIES全局配置
    syncToVeggies() {
        this.products.forEach(p => {
            VEGGIES[p.name] = {
                emoji: p.emoji,
                threshold: p.threshold || 10,
                packages: p.packages
            };
        });
    }
}

// ========== 全局商品管理器实例 ==========
let productManager;

// ========== 初始化商品管理 ==========
function initProductManager() {
    productManager = new ProductManager(store);

    // 绑定打开商品管理的按钮
    document.getElementById('openProductsBtn').addEventListener('click', () => {
        openProductsModal();
    });

    // 关闭商品管理弹窗
    document.getElementById('closeProductsModal').addEventListener('click', () => {
        closeModal(document.getElementById('productsModal'));
    });
    document.getElementById('productsModal').addEventListener('click', (e) => {
        if (e.target.id === 'productsModal') closeModal(document.getElementById('productsModal'));
    });

    // 关闭新增/编辑商品弹窗
    document.getElementById('closeEditProductModal').addEventListener('click', () => {
        closeModal(document.getElementById('editProductModal'));
    });
    document.getElementById('editProductModal').addEventListener('click', (e) => {
        if (e.target.id === 'editProductModal') closeModal(document.getElementById('editProductModal'));
    });

    // 新增商品按钮
    document.getElementById('addProductBtn').addEventListener('click', () => {
        openEditProductModal(null); // null = 新增模式
    });

    // 商品搜索
    document.getElementById('productSearch').addEventListener('input', (e) => {
        renderProductList(e.target.value);
    });

    // 添加包装按钮
    document.getElementById('addPackageBtn').addEventListener('click', () => {
        addPackageRow();
    });

    // 商品表单提交
    document.getElementById('productForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitProductForm();
    });

    // Emoji选择器
    initEmojiPicker();
}

// ========== 打开商品管理弹窗 ==========
function openProductsModal() {
    renderProductList();
    document.getElementById('productsModal').classList.add('active');
}

// ========== 渲染商品列表 ==========
function renderProductList(search = '') {
    const products = productManager.getProducts(search);
    const container = document.getElementById('productListContainer');

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🥬</div>
                <p class="empty-text">${search ? '没有找到匹配的商品' : '还没有添加任何商品'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const packLabels = product.packages.map(pkg => {
            const priceText = pkg.price > 0 ? `¥${pkg.price}/${pkg.label}` : pkg.label;
            return `<span class="pack-tag">${priceText}</span>`;
        }).join('');

        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-card-left">
                    <span class="product-emoji">${product.emoji}</span>
                    <div class="product-card-info">
                        <div class="product-card-name">${product.name}</div>
                        <div class="product-pack-tags">${packLabels}</div>
                    </div>
                </div>
                <div class="product-card-actions">
                    <button class="product-edit-btn" onclick="openEditProductModal('${product.id}')" title="编辑">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="product-delete-btn" onclick="deleteProductConfirm('${product.id}')" title="删除">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ========== 编辑商品ID追踪 ==========
let currentEditProductId = null;

// ========== 打开新增/编辑商品弹窗 ==========
function openEditProductModal(productId) {
    currentEditProductId = productId;
    const isEdit = !!productId;
    const product = isEdit ? productManager.getProduct(productId) : null;

    // 更新标题
    document.getElementById('editProductTitle').textContent = isEdit ? '编辑商品' : '新增商品';

    // 填充表单
    document.getElementById('productName').value = isEdit ? product.name : '';
    document.getElementById('productThreshold').value = isEdit ? (product.threshold || 10) : 10;

    // 设置emoji
    const selectedEmoji = isEdit ? product.emoji : '🥬';
    document.getElementById('selectedEmoji').textContent = selectedEmoji;
    document.getElementById('productEmojiValue').value = selectedEmoji;

    // 渲染包装列表
    const packContainer = document.getElementById('packageList');
    packContainer.innerHTML = '';

    if (isEdit && product.packages.length > 0) {
        product.packages.forEach((pkg, idx) => {
            addPackageRow(pkg);
        });
    } else {
        // 默认一个"斤"的包装
        addPackageRow({ packType: 'jin', label: '斤', price: 0, isDefault: true });
    }

    // 打开弹窗
    document.getElementById('editProductModal').classList.add('active');
}

// ========== 添加一行包装设置 ==========
function addPackageRow(pkg = null) {
    const container = document.getElementById('packageList');
    const index = container.children.length;

    const row = document.createElement('div');
    row.className = 'package-row';
    row.dataset.index = index;

    const packOptions = DEFAULT_PACK_TYPES.map(pt => {
        const selected = pkg && pkg.packType === pt.id ? 'selected' : '';
        return `<option value="${pt.id}" ${selected}>${pt.icon} ${pt.label}</option>`;
    }).join('');

    row.innerHTML = `
        <div class="package-row-main">
            <div class="package-type-select">
                <select class="form-select pack-type-sel" data-idx="${index}">
                    ${packOptions}
                    <option value="custom" ${pkg && !DEFAULT_PACK_TYPES.find(pt => pt.id === pkg.packType) ? 'selected' : ''}>✏️ 自定义</option>
                </select>
            </div>
            <div class="package-custom-name ${pkg && !DEFAULT_PACK_TYPES.find(pt => pt.id === pkg.packType) ? '' : 'hidden'}">
                <input type="text" class="form-input pack-custom-input" placeholder="包装名称" value="${pkg && !DEFAULT_PACK_TYPES.find(pt => pt.id === pkg.packType) ? (pkg.label || '') : ''}">
            </div>
            <div class="package-price-input">
                <input type="number" class="form-input pack-price-input" placeholder="单价" step="0.01" min="0" value="${pkg ? (pkg.price || '') : ''}">
                <span class="price-unit">元/<span class="price-unit-label">${pkg ? pkg.label : '斤'}</span></span>
            </div>
            <button type="button" class="package-remove-btn" onclick="removePackageRow(this)" title="删除此包装">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;

    container.appendChild(row);

    // 绑定包装类型切换事件
    const select = row.querySelector('.pack-type-sel');
    const customInput = row.querySelector('.package-custom-name');
    const priceUnitLabel = row.querySelector('.price-unit-label');

    select.addEventListener('change', () => {
        if (select.value === 'custom') {
            customInput.classList.remove('hidden');
            priceUnitLabel.textContent = '单位';
        } else {
            customInput.classList.add('hidden');
            const packType = DEFAULT_PACK_TYPES.find(pt => pt.id === select.value);
            priceUnitLabel.textContent = packType ? packType.label : '斤';
        }
    });
}

// ========== 删除一行包装 ==========
function removePackageRow(btn) {
    const row = btn.closest('.package-row');
    const container = document.getElementById('packageList');

    // 至少保留一个包装
    if (container.children.length <= 1) {
        showToast('⚠️ 至少需要一种包装类型');
        return;
    }

    row.style.animation = 'fadeOutRight 0.2s ease forwards';
    setTimeout(() => row.remove(), 200);
}

// ========== Emoji选择器 ==========
const EMOJI_LIST = [
    '🥬', '🍅', '🥔', '🥒', '🌶️', '🍆', '🥕', '🧅', '🥦', '🍄',
    '🌽', '🥗', '🥜', '🫘', '🧄', '🫑', '🥝', '🍎', '🍊', '🍋',
    '🍌', '🍉', '🍇', '🍓', '🫐', '🍑', '🥭', '🍍', '🥥', '🌰',
    '🥚', '🧃', '🫚', '🪴', '🌿', '☘️'
];

function initEmojiPicker() {
    const trigger = document.getElementById('emojiPickerTrigger');
    const picker = document.getElementById('emojiPickerDropdown');

    // 渲染emoji网格
    picker.innerHTML = EMOJI_LIST.map(emoji =>
        `<button type="button" class="emoji-option" data-emoji="${emoji}">${emoji}</button>`
    ).join('');

    // 切换emoji选择器显示
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        picker.classList.toggle('show');
    });

    // 选择emoji
    picker.addEventListener('click', (e) => {
        const btn = e.target.closest('.emoji-option');
        if (btn) {
            const emoji = btn.dataset.emoji;
            document.getElementById('selectedEmoji').textContent = emoji;
            document.getElementById('productEmojiValue').value = emoji;
            picker.classList.remove('show');
        }
    });

    // 点击外部关闭
    document.addEventListener('click', () => {
        picker.classList.remove('show');
    });
}

// ========== 提交商品表单 ==========
function submitProductForm() {
    const name = document.getElementById('productName').value.trim();
    const emoji = document.getElementById('productEmojiValue').value;
    const threshold = parseInt(document.getElementById('productThreshold').value) || 10;

    if (!name) {
        showToast('⚠️ 请输入商品名称');
        return;
    }

    // 检查名称是否重复（排除当前编辑的商品）
    const existing = productManager.products.find(p =>
        p.name === name && p.id !== currentEditProductId
    );
    if (existing) {
        showToast('⚠️ 该商品名称已存在');
        return;
    }

    // 收集包装数据
    const packageRows = document.querySelectorAll('#packageList .package-row');
    const packages = [];
    let hasError = false;

    packageRows.forEach(row => {
        const selectEl = row.querySelector('.pack-type-sel');
        const priceInput = row.querySelector('.pack-price-input');
        const customInput = row.querySelector('.pack-custom-input');

        const packTypeId = selectEl.value;
        let label, packType;

        if (packTypeId === 'custom') {
            label = customInput ? customInput.value.trim() : '';
            packType = 'custom_' + label;
            if (!label) {
                hasError = true;
                showToast('⚠️ 请填写自定义包装名称');
                return;
            }
        } else {
            const pt = DEFAULT_PACK_TYPES.find(t => t.id === packTypeId);
            label = pt ? pt.label : packTypeId;
            packType = packTypeId;
        }

        packages.push({
            packType,
            label,
            price: parseFloat(priceInput.value) || 0,
            isDefault: packages.length === 0
        });
    });

    if (hasError || packages.length === 0) return;

    const productData = { name, emoji, threshold, packages };

    if (currentEditProductId) {
        // 编辑模式
        productManager.updateProduct(currentEditProductId, productData);
        showToast('✅ 商品已更新');
    } else {
        // 新增模式
        productManager.addProduct(productData);
        showToast('✅ 商品添加成功');
    }

    // 关闭编辑弹窗，刷新列表
    closeModal(document.getElementById('editProductModal'));
    renderProductList();

    // 同步更新记账弹窗中的蔬菜选择网格
    refreshVeggieGrid();
}

// ========== 删除商品确认 ==========
function deleteProductConfirm(productId) {
    const product = productManager.getProduct(productId);
    if (!product) return;

    if (confirm(`确定要删除「${product.emoji} ${product.name}」吗？`)) {
        productManager.deleteProduct(productId);
        showToast('🗑️ 商品已删除');
        renderProductList();
        refreshVeggieGrid();
    }
}

// ========== 刷新记账弹窗中的蔬菜选择网格 ==========
function refreshVeggieGrid() {
    const grid = document.getElementById('veggieGrid');
    const products = productManager.getProducts();

    grid.innerHTML = products.map((p, i) =>
        `<button type="button" class="veggie-btn ${i === 0 ? 'selected' : ''}" data-veggie="${p.name}">${p.emoji} ${p.name}</button>`
    ).join('') + `<button type="button" class="veggie-btn" data-veggie="其他">📝 其他</button>`;

    // 重新绑定点击事件
    grid.querySelectorAll('.veggie-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            grid.querySelectorAll('.veggie-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedVeggie = btn.dataset.veggie;

            // 如果该商品有包装配置，显示包装选择
            updatePackageSelector(btn.dataset.veggie);
        });
    });

    // 默认选中第一个
    if (products.length > 0) {
        selectedVeggie = products[0].name;
    }
}

// ========== 根据选中的蔬菜更新包装选择器 ==========
function updatePackageSelector(veggieName) {
    const packages = productManager ? productManager.getPackagesByName(veggieName) : [];
    const container = document.getElementById('packageSelectorGroup');

    if (!container) return;

    if (packages.length <= 1) {
        container.classList.add('hidden');
        // 如果只有一个包装且有价格，自动填充单价
        if (packages.length === 1 && packages[0].price > 0) {
            document.getElementById('inputPrice').value = packages[0].price;
            // 触发金额计算
            document.getElementById('inputPrice').dispatchEvent(new Event('input'));
        }
        return;
    }

    container.classList.remove('hidden');
    const btnsContainer = container.querySelector('.package-selector-btns');
    btnsContainer.innerHTML = packages.map((pkg, i) =>
        `<button type="button" class="pay-btn ${i === 0 ? 'selected' : ''}" data-pack-idx="${i}" data-pack-price="${pkg.price}" data-pack-label="${pkg.label}">
            ${pkg.label}${pkg.price > 0 ? ' ¥' + pkg.price : ''}
        </button>`
    ).join('');

    // 绑定包装选择事件
    btnsContainer.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btnsContainer.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // 如果有预设单价，自动填充
            const price = parseFloat(btn.dataset.packPrice);
            if (price > 0) {
                document.getElementById('inputPrice').value = price;
                document.getElementById('inputPrice').dispatchEvent(new Event('input'));
            }

            // 更新单位显示
            const label = btn.dataset.packLabel;
            const weightLabel = document.querySelector('label[for="inputWeight"], .form-label');
        });
    });

    // 默认选择第一个包装，自动填充价格
    if (packages[0] && packages[0].price > 0) {
        document.getElementById('inputPrice').value = packages[0].price;
        document.getElementById('inputPrice').dispatchEvent(new Event('input'));
    }
}
