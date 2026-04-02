/* ==========================================
   Pet Community - 附近服务模块
   服务列表展示和分类筛选
   ========================================== */

const ServicesModule = {
    currentFilter: 'all',

    init() {
        this.renderServices();
        this.bindFilters();
        this.bindSearch();
    },

    // ========== 渲染服务列表 ==========
    renderServices(filter = 'all', keyword = '') {
        const container = document.getElementById('serviceList');
        let services = App.getData('pc_services');

        // 分类筛选
        if (filter !== 'all') {
            services = services.filter(s => s.type === filter);
        }

        // 关键词搜索
        if (keyword) {
            const kw = keyword.toLowerCase();
            services = services.filter(s =>
                s.name.toLowerCase().includes(kw) ||
                s.desc.toLowerCase().includes(kw)
            );
        }

        if (services.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>未找到相关服务</h3>
                    <p>试试其他分类或搜索词</p>
                </div>
            `;
            return;
        }

        container.innerHTML = services.map(service => `
            <div class="service-card animate-in" data-service-id="${service.id}">
                <div class="service-icon ${service.type}">${service.icon}</div>
                <div class="service-info">
                    <h4>${service.name}</h4>
                    <div class="service-desc">${service.desc}</div>
                    <div class="service-meta">
                        <span class="service-rating">⭐ ${service.rating}</span>
                        <span class="service-distance">📍 ${service.distance}</span>
                        ${service.price ? `<span class="service-price">${service.price}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // 绑定卡片点击
        container.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', () => {
                const serviceId = card.dataset.serviceId;
                const serviceName = card.querySelector('h4').textContent;
                if (typeof AppointmentModule !== 'undefined') {
                    AppointmentModule.openForm(serviceId, serviceName);
                } else {
                    App.showToast('📞 拨打电话预约...');
                }
            });
        });
    },

    // ========== 分类筛选 ==========
    bindFilters() {
        document.getElementById('serviceFilters').addEventListener('click', (e) => {
            const tag = e.target.closest('.filter-tag');
            if (!tag) return;

            document.querySelectorAll('#serviceFilters .filter-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');

            this.currentFilter = tag.dataset.filter;
            const keyword = document.getElementById('serviceSearch').value.trim();
            this.renderServices(this.currentFilter, keyword);
        });
    },

    // ========== 搜索 ==========
    bindSearch() {
        const input = document.getElementById('serviceSearch');
        let timeout;
        input.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.renderServices(this.currentFilter, input.value.trim());
            }, 300);
        });
    }
};
