/* ==========================================
   Pet Community - 领养中心模块
   领养宠物列表、详情、申请
   ========================================== */

const AdoptionModule = {
    currentFilter: 'all',

    init() {
        this.renderAdoptGrid();
        this.bindFilters();
    },

    // ========== 渲染领养宠物网格 ==========
    renderAdoptGrid(filter = 'all') {
        const container = document.getElementById('adoptGrid');
        let adoptions = App.getData('pc_adoptions');

        // 分类筛选
        if (filter !== 'all') {
            adoptions = adoptions.filter(a => a.type === filter);
        }

        if (adoptions.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: span 2;">
                    <div class="empty-icon">💕</div>
                    <h3>暂无待领养宠物</h3>
                    <p>请关注其他分类</p>
                </div>
            `;
            return;
        }

        container.innerHTML = adoptions.map(pet => {
            // 根据宠物类型设置不同背景色
            const bgColors = {
                dog: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))',
                cat: 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(167,139,250,0.2))',
                rabbit: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(96,165,250,0.2))',
                other: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(244,114,182,0.2))'
            };
            const bg = bgColors[pet.type] || bgColors.other;

            return `
                <div class="adopt-card" data-adopt-id="${pet.id}">
                    <div class="adopt-card-img" style="background:${bg}">
                        ${pet.emoji}
                        ${pet.badge ? `<span class="adopt-badge ${pet.badge}">${pet.badgeText}</span>` : ''}
                    </div>
                    <div class="adopt-card-body">
                        <h4>${pet.name}</h4>
                        <div class="adopt-breed">${pet.breed}</div>
                        <div class="adopt-card-meta">
                            <span>${pet.age}</span>
                            <span class="adopt-gender ${pet.gender === 'male' ? 'gender-male' : 'gender-female'}">
                                ${pet.gender === 'male' ? '♂' : '♀'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 绑定卡片点击 -> 展示详情
        container.querySelectorAll('.adopt-card').forEach(card => {
            card.addEventListener('click', () => {
                const adoptId = card.dataset.adoptId;
                this.showAdoptDetail(adoptId);
            });
        });
    },

    // ========== 展示领养详情 ==========
    showAdoptDetail(id) {
        const adoptions = App.getData('pc_adoptions');
        const pet = adoptions.find(a => a.id === id);
        if (!pet) return;

        const bgColors = {
            dog: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))',
            cat: 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(167,139,250,0.2))',
            rabbit: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(96,165,250,0.2))',
            other: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(244,114,182,0.2))'
        };
        const bg = bgColors[pet.type] || bgColors.other;

        const container = document.getElementById('adoptDetailContent');
        container.innerHTML = `
            <div class="adopt-detail-img" style="background:${bg}">${pet.emoji}</div>

            <div class="adopt-info-row">
                <span class="label">名字</span>
                <span class="value">${pet.name}</span>
            </div>
            <div class="adopt-info-row">
                <span class="label">品种</span>
                <span class="value">${pet.breed}</span>
            </div>
            <div class="adopt-info-row">
                <span class="label">年龄</span>
                <span class="value">${pet.age}</span>
            </div>
            <div class="adopt-info-row">
                <span class="label">性别</span>
                <span class="value">${pet.gender === 'male' ? '♂ 公' : '♀ 母'}</span>
            </div>

            <div class="adopt-story">
                <h4>📖 TA的故事</h4>
                <p>${pet.story}</p>
            </div>

            <button class="submit-btn" style="margin-top:20px;" onclick="AdoptionModule.applyAdopt('${pet.id}')">
                💕 申请领养
            </button>
        `;

        App.openModal('adoptDetailModal');
    },

    // ========== 申请领养 ==========
    applyAdopt(id) {
        App.closeModal('adoptDetailModal');
        App.showToast('💕 领养申请已提交，请等待审核！');
    },

    // ========== 分类筛选 ==========
    bindFilters() {
        document.getElementById('adoptFilters').addEventListener('click', (e) => {
            const tag = e.target.closest('.filter-tag');
            if (!tag) return;

            document.querySelectorAll('#adoptFilters .filter-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');

            this.currentFilter = tag.dataset.filter;
            this.renderAdoptGrid(this.currentFilter);
        });
    }
};
