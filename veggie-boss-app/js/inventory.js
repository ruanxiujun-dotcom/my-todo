/* ========================================
   菜老板记账APP - 库存管理逻辑
   ======================================== */

function refreshInventoryList(searchQuery = '') {
    const inventory = store.inventory;
    const entries = Object.entries(inventory);

    // 更新总览数据
    let totalTypes = 0;
    let totalStock = 0;
    let lowCount = 0;

    entries.forEach(([name, data]) => {
        if (data.stock > 0) {
            totalTypes++;
            totalStock += data.stock;
            const threshold = VEGGIES[name]?.threshold || 10;
            if (data.stock <= threshold) lowCount++;
        }
    });

    document.getElementById('totalTypes').textContent = totalTypes;
    document.getElementById('totalStock').textContent = Math.round(totalStock);
    document.getElementById('lowStockCount').textContent = lowCount;

    // 过滤和搜索
    let filtered = entries.filter(([name, data]) => {
        if (searchQuery && !name.includes(searchQuery)) return false;
        return true;
    });

    // 按库存量排序（低库存优先）
    filtered.sort((a, b) => {
        const thresholdA = VEGGIES[a[0]]?.threshold || 10;
        const thresholdB = VEGGIES[b[0]]?.threshold || 10;
        const ratioA = a[1].stock / thresholdA;
        const ratioB = b[1].stock / thresholdB;
        return ratioA - ratioB;
    });

    const container = document.getElementById('inventoryList');

    if (filtered.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <p class="empty-text">${searchQuery ? '没有找到匹配的蔬菜' : '暂无库存数据'}</p>
      </div>
    `;
        return;
    }

    container.innerHTML = filtered.map(([name, data]) => {
        const emoji = VEGGIES[name]?.emoji || '🥬';
        const threshold = VEGGIES[name]?.threshold || 10;
        const maxStock = data.maxStock || threshold * 3;
        const isLow = data.stock <= threshold;
        const isDanger = data.stock <= threshold * 0.5;
        const stockPercent = Math.min(100, (data.stock / maxStock) * 100);

        let barClass = '';
        if (isDanger) barClass = 'danger';
        else if (isLow) barClass = 'low';

        return `
      <div class="inventory-item ${isLow ? 'low-stock' : ''}">
        <span class="inv-emoji">${emoji}</span>
        <div class="inv-info">
          <div class="inv-name">${name}</div>
          <div class="inv-detail">预警线：${threshold}斤 · 最大容量：${maxStock}斤</div>
          <div class="stock-bar">
            <div class="stock-fill ${barClass}" style="width: ${stockPercent}%"></div>
          </div>
        </div>
        <div class="inv-stock">
          <span class="inv-stock-value ${isLow ? 'warning' : ''}">${Math.round(data.stock * 10) / 10}</span>
          <span class="inv-stock-unit">斤</span>
        </div>
      </div>
    `;
    }).join('');
}
