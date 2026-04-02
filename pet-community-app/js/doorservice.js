/* ==========================================
   Pet Community - 上门服务模块
   任务发布、志愿者认领、状态管理
   服务类型：上门喂养、上门遛狗
   ========================================== */

const DoorServiceModule = {
    currentFilter: 'all',
    currentStatusFilter: 'all',

    init() {
        this.renderTaskStats();
        this.renderTaskList();
        this.bindFilters();
        this.bindPublishTaskForm();
        this.bindTaskDetailModal();
    },

    // ========== 渲染统计数据 ==========
    renderTaskStats() {
        const tasks = App.getData('pc_doortasks');
        const open = tasks.filter(t => t.status === 'open').length;
        const claimed = tasks.filter(t => t.status === 'claimed').length;
        const completed = tasks.filter(t => t.status === 'completed').length;

        const openEl = document.getElementById('doorTaskOpen');
        const claimedEl = document.getElementById('doorTaskClaimed');
        const completedEl = document.getElementById('doorTaskCompleted');
        if (openEl) openEl.textContent = open;
        if (claimedEl) claimedEl.textContent = claimed;
        if (completedEl) completedEl.textContent = completed;
    },

    // ========== 渲染任务列表 ==========
    renderTaskList(typeFilter = 'all', statusFilter = 'all') {
        const container = document.getElementById('doorTaskList');
        if (!container) return;

        let tasks = App.getData('pc_doortasks');

        // 类型筛选
        if (typeFilter !== 'all') {
            tasks = tasks.filter(t => t.type === typeFilter);
        }

        // 状态筛选
        if (statusFilter !== 'all') {
            tasks = tasks.filter(t => t.status === statusFilter);
        }

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏠</div>
                    <h3>暂无服务任务</h3>
                    <p>发布你的第一个上门服务需求吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => this.renderTaskCard(task)).join('');

        // 绑定卡片点击
        container.querySelectorAll('.door-task-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showTaskDetail(card.dataset.taskId);
            });
        });
    },

    // 渲染单个任务卡片
    renderTaskCard(task) {
        const typeConfig = {
            feeding: { label: '🍽️ 上门喂养', color: 'feeding' },
            walking: { label: '🦮 上门遛狗', color: 'walking' }
        };
        const type = typeConfig[task.type] || typeConfig.feeding;

        const statusConfig = {
            open: { label: '待认领', class: 'status-open' },
            claimed: { label: '进行中', class: 'status-claimed' },
            completed: { label: '已完成', class: 'status-completed' }
        };
        const status = statusConfig[task.status] || statusConfig.open;

        // 来源标识（从帖子转来的）
        const fromPostBadge = task.fromPostId
            ? '<span class="from-post-badge">📝 来自社区帖子</span>'
            : '';

        return `
            <div class="door-task-card animate-in" data-task-id="${task.id}">
                <div class="task-card-header">
                    <div class="task-type-badge ${type.color}">${type.label}</div>
                    <div class="task-status-badge ${status.class}">${status.label}</div>
                </div>
                <div class="task-card-body">
                    <div class="task-card-main">
                        <div class="task-pet-icon">${task.petEmoji || '🐾'}</div>
                        <div class="task-info">
                            <h4 class="task-title">${task.title}</h4>
                            <p class="task-desc">${task.desc}</p>
                            ${fromPostBadge}
                        </div>
                    </div>
                    <div class="task-meta-row">
                        <span class="task-meta-item">📍 ${task.address}</span>
                        <span class="task-meta-item">📅 ${task.dateRange}</span>
                    </div>
                    <div class="task-card-footer">
                        <div class="task-publisher">
                            <div class="task-pub-avatar">${task.publisherAvatar}</div>
                            <span>${task.publisherName}</span>
                        </div>
                        <div class="task-reward">${task.reward}</div>
                    </div>
                    ${task.status === 'claimed' && task.volunteerName ? `
                        <div class="task-volunteer-info">
                            <span>🙋 志愿者：</span>
                            <div class="task-pub-avatar">${task.volunteerAvatar}</div>
                            <span class="volunteer-name">${task.volunteerName}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // ========== 显示任务详情 ==========
    showTaskDetail(taskId) {
        const tasks = App.getData('pc_doortasks');
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const container = document.getElementById('taskDetailContent');
        if (!container) return;

        const typeConfig = {
            feeding: { label: '🍽️ 上门喂养', color: 'feeding' },
            walking: { label: '🦮 上门遛狗', color: 'walking' }
        };
        const type = typeConfig[task.type] || typeConfig.feeding;

        const statusConfig = {
            open: { label: '待认领', class: 'status-open' },
            claimed: { label: '进行中', class: 'status-claimed' },
            completed: { label: '已完成', class: 'status-completed' }
        };
        const status = statusConfig[task.status] || statusConfig.open;

        // 操作按钮根据状态不同
        let actionBtn = '';
        if (task.status === 'open') {
            actionBtn = `<button class="submit-btn volunteer-claim-btn" data-task-id="${task.id}">🙋 我来认领</button>`;
        } else if (task.status === 'claimed') {
            actionBtn = `<button class="submit-btn complete-task-btn" data-task-id="${task.id}" style="background:linear-gradient(135deg, #34d399, #60a5fa);">✅ 确认完成</button>`;
        } else {
            actionBtn = `<button class="submit-btn" disabled style="opacity:0.5;cursor:default;">✅ 任务已完成</button>`;
        }

        container.innerHTML = `
            <div class="task-detail-top">
                <div class="task-type-badge ${type.color}" style="font-size:15px;padding:8px 20px;">${type.label}</div>
                <div class="task-status-badge ${status.class}" style="font-size:13px;padding:6px 16px;">${status.label}</div>
            </div>

            <div class="task-detail-pet">
                <div class="task-detail-pet-icon">${task.petEmoji || '🐾'}</div>
                <div>
                    <h3 style="font-size:18px;font-weight:700;">${task.title}</h3>
                    ${task.petName ? `<span style="font-size:13px;color:var(--text-muted);">宠物：${task.petName}</span>` : ''}
                </div>
            </div>

            <div class="task-detail-desc glass-card">
                <p style="font-size:14px;line-height:1.7;color:var(--text-secondary);">${task.desc}</p>
            </div>

            <div class="adopt-info-row">
                <span class="label">📍 服务地址</span>
                <span class="value">${task.address}</span>
            </div>
            <div class="adopt-info-row">
                <span class="label">📅 服务时间</span>
                <span class="value">${task.dateRange}</span>
            </div>
            <div class="adopt-info-row">
                <span class="label">💰 报酬</span>
                <span class="value" style="color:var(--warning);font-weight:700;">${task.reward}</span>
            </div>
            <div class="adopt-info-row">
                <span class="label">👤 发布者</span>
                <span class="value" style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:18px;">${task.publisherAvatar}</span> ${task.publisherName}
                </span>
            </div>

            ${task.volunteerName ? `
                <div class="adopt-info-row">
                    <span class="label">🙋 志愿者</span>
                    <span class="value" style="display:flex;align-items:center;gap:6px;color:var(--success);">
                        <span style="font-size:18px;">${task.volunteerAvatar}</span> ${task.volunteerName}
                    </span>
                </div>
            ` : ''}

            ${task.fromPostId ? `
                <div style="margin-top:12px;padding:10px 14px;background:rgba(167,139,250,0.1);border-radius:var(--radius-sm);font-size:12px;color:var(--primary-light);">
                    📝 此任务来自社区动态帖子
                </div>
            ` : ''}

            <div style="margin-top:20px;">
                ${actionBtn}
            </div>
        `;

        App.openModal('taskDetailModal');

        // 绑定认领按钮
        const claimBtn = container.querySelector('.volunteer-claim-btn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.claimTask(claimBtn.dataset.taskId));
        }

        // 绑定完成按钮
        const completeBtn = container.querySelector('.complete-task-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeTask(completeBtn.dataset.taskId));
        }
    },

    // ========== 认领任务 ==========
    claimTask(taskId) {
        const tasks = App.getData('pc_doortasks');
        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'open') return;

        task.status = 'claimed';
        task.volunteerId = 'me';
        task.volunteerName = '宠物爱好者';
        task.volunteerAvatar = '😊';

        App.setData('pc_doortasks', tasks);
        App.closeModal('taskDetailModal');
        this.renderTaskStats();
        this.renderTaskList(this.currentFilter, this.currentStatusFilter);
        App.showToast('🎉 认领成功！请按时提供服务');
    },

    // ========== 完成任务 ==========
    completeTask(taskId) {
        const tasks = App.getData('pc_doortasks');
        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'claimed') return;

        task.status = 'completed';

        App.setData('pc_doortasks', tasks);
        App.closeModal('taskDetailModal');
        this.renderTaskStats();
        this.renderTaskList(this.currentFilter, this.currentStatusFilter);
        App.showToast('✅ 任务已完成！感谢你的服务 💖');
    },

    // ========== 筛选绑定 ==========
    bindFilters() {
        // 类型筛选
        const typeFilters = document.getElementById('doorTypeFilters');
        if (typeFilters) {
            typeFilters.addEventListener('click', (e) => {
                const tag = e.target.closest('.filter-tag');
                if (!tag) return;
                typeFilters.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
                this.currentFilter = tag.dataset.filter;
                this.renderTaskList(this.currentFilter, this.currentStatusFilter);
            });
        }

        // 状态筛选
        const statusFilters = document.getElementById('doorStatusFilters');
        if (statusFilters) {
            statusFilters.addEventListener('click', (e) => {
                const tag = e.target.closest('.filter-tag');
                if (!tag) return;
                statusFilters.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
                this.currentStatusFilter = tag.dataset.filter;
                this.renderTaskList(this.currentFilter, this.currentStatusFilter);
            });
        }
    },

    // ========== 发布任务表单 ==========
    bindPublishTaskForm() {
        const form = document.getElementById('publishTaskForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('taskTitleInput').value.trim();
            const desc = document.getElementById('taskDescInput').value.trim();
            const address = document.getElementById('taskAddressInput').value.trim();
            const dateRange = document.getElementById('taskDateInput').value.trim();
            const reward = document.getElementById('taskRewardInput').value.trim();

            if (!title || !desc || !address) {
                App.showToast('请填写必要信息', 'error');
                return;
            }

            const typeBtn = document.querySelector('#taskTypeSelect .option-btn.selected');
            const petBtn = document.querySelector('#taskPetSelect .option-btn.selected');
            const pets = App.getData('pc_pets');
            const selectedPet = petBtn ? pets.find(p => p.id === petBtn.dataset.petId) : null;

            const newTask = {
                id: App.genId('task'),
                type: typeBtn ? typeBtn.dataset.type : 'feeding',
                title: title,
                desc: desc,
                petEmoji: selectedPet ? selectedPet.emoji : '🐾',
                petName: selectedPet ? selectedPet.name : '',
                publisherId: 'me',
                publisherName: '宠物爱好者',
                publisherAvatar: '😊',
                address: address,
                dateRange: dateRange || '待定',
                reward: reward ? `¥${reward}` : '面议',
                status: 'open',
                volunteerId: null,
                volunteerName: null,
                volunteerAvatar: null,
                fromPostId: form.dataset.fromPostId || null,
                createdAt: Date.now(),
                time: '刚刚'
            };

            const tasks = App.getData('pc_doortasks');
            tasks.unshift(newTask);
            App.setData('pc_doortasks', tasks);

            // 重置表单
            form.reset();
            form.dataset.fromPostId = '';
            document.querySelectorAll('#taskTypeSelect .option-btn').forEach(b => b.classList.remove('selected'));
            document.querySelector('#taskTypeSelect .option-btn[data-type="feeding"]').classList.add('selected');

            App.closeModal('publishTaskModal');
            this.renderTaskStats();
            this.renderTaskList(this.currentFilter, this.currentStatusFilter);
            App.showToast('✅ 任务发布成功！等待志愿者认领');
        });
    },

    // ========== 任务详情弹窗关闭绑定 ==========
    bindTaskDetailModal() {
        // 由 app.js 的 initModals 统一管理
    },

    // ========== 打开发布任务弹窗 ==========
    openPublishTask(presetData = null) {
        // 更新宠物选择
        this.updateTaskPetSelect();

        if (presetData) {
            // 从帖子转来 - 预填数据
            const titleInput = document.getElementById('taskTitleInput');
            const descInput = document.getElementById('taskDescInput');
            if (titleInput && presetData.title) titleInput.value = presetData.title;
            if (descInput && presetData.desc) descInput.value = presetData.desc;

            // 保存来源帖子ID
            const form = document.getElementById('publishTaskForm');
            if (form) form.dataset.fromPostId = presetData.postId || '';
        }

        App.openModal('publishTaskModal');
    },

    // 更新宠物选择列表
    updateTaskPetSelect() {
        const container = document.getElementById('taskPetSelect');
        if (!container) return;
        const pets = App.getData('pc_pets');
        if (pets.length === 0) {
            container.innerHTML = '<span style="color:var(--text-muted);font-size:13px;">还没有添加宠物</span>';
            return;
        }
        container.innerHTML = pets.map((pet, idx) => `
            <button type="button" class="option-btn ${idx === 0 ? 'selected' : ''}" data-pet-id="${pet.id}">
                ${pet.emoji} ${pet.name}
            </button>
        `).join('');
    },

    // ========== 从帖子转为任务 ==========
    convertPostToTask(postId) {
        const posts = App.getData('pc_posts');
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        // 预填表单
        this.openPublishTask({
            title: post.text.substring(0, 30) + (post.text.length > 30 ? '...' : ''),
            desc: post.text,
            postId: postId
        });

        // 覆盖表单的submit事件中的fromPostId
        const form = document.getElementById('publishTaskForm');
        if (form) form.dataset.fromPostId = postId;
    }
};
