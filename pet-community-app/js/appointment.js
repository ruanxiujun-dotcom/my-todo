/* ==========================================
   Pet Community - 服务预约模块
   预约表单提交、历史记录展示
   ========================================== */

const AppointmentModule = {
    init() {
        this.bindAppointmentForm();
    },

    // ========== 打开预约表单 ==========
    openForm(serviceId, serviceName) {
        // 设置隐藏ID和标题
        const serviceNameEl = document.getElementById('aptServiceName');
        const form = document.getElementById('appointmentForm');
        
        if (serviceNameEl) serviceNameEl.textContent = serviceName;
        if (form) form.dataset.serviceId = serviceId;
        if (form) form.dataset.serviceName = serviceName;

        // 动态读取宠物列表
        this.updatePetSelect();

        // 打开弹窗
        App.openModal('appointmentModal');
    },

    // 更新宠物选项
    updatePetSelect() {
        const container = document.getElementById('aptPetSelect');
        if (!container) return;
        
        const pets = App.getData('pc_pets');
        if (pets.length === 0) {
            container.innerHTML = `
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">未添加宠物，手动输入动物类型：</div>
                <input type="text" class="form-input" id="aptAnimalType" placeholder="例如：金毛、布偶猫" required>
            `;
            return;
        }

        container.innerHTML = pets.map((pet, idx) => `
            <button type="button" class="option-btn ${idx === 0 ? 'selected' : ''}" data-pet-id="${pet.id}" data-pet-name="${pet.name}">
                ${pet.emoji} ${pet.name}
            </button>
        `).join('');
    },

    // ========== 绑定预约表单提交 ==========
    bindAppointmentForm() {
        const form = document.getElementById('appointmentForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const serviceId = form.dataset.serviceId;
            const serviceName = form.dataset.serviceName;
            
            const petBtn = document.querySelector('#aptPetSelect .option-btn.selected');
            const animalInput = document.getElementById('aptAnimalType');
            let animalType = '';
            
            if (petBtn) {
                animalType = petBtn.dataset.petName;
            } else if (animalInput) {
                animalType = animalInput.value.trim();
            }

            if (!animalType) {
                App.showToast('请提供宠物信息', 'error');
                return;
            }

            const aptDate = document.getElementById('aptDateInput').value;
            const aptTime = document.getElementById('aptTimeInput').value;
            if (!aptDate || !aptTime) {
                App.showToast('请选择预约时间和日期', 'error');
                return;
            }

            // 获取额外要求tags
            const reqTags = [];
            document.querySelectorAll('#aptReqSelect .option-btn.selected').forEach(btn => {
                reqTags.push(btn.textContent.trim());
            });

            const notes = document.getElementById('aptNotesInput').value.trim();

            const newApt = {
                id: App.genId('apt'),
                serviceId: serviceId,
                serviceName: serviceName,
                animalType: animalType,
                datetime: `${aptDate} ${aptTime}`,
                requirements: reqTags,
                notes: notes,
                status: 'pending', // pending, accepted, completed
                createdAt: Date.now()
            };

            const appointments = App.getData('pc_appointments');
            appointments.unshift(newApt);
            App.setData('pc_appointments', appointments);

            // 清理并关闭
            form.reset();
            document.querySelectorAll('#aptReqSelect .option-btn').forEach(b => b.classList.remove('selected'));
            App.closeModal('appointmentModal');
            App.showToast('✅ 预约提交成功！商家会尽快确认');
        });
    },

    // ========== 渲染预约记录 ==========
    showRecords() {
        const container = document.getElementById('aptRecordList');
        if (!container) return;

        const appointments = App.getData('pc_appointments');

        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <h3>暂无预约记录</h3>
                    <p>去附近服务看看吧</p>
                </div>
            `;
            App.openModal('appointmentRecordModal');
            return;
        }

        const statusMap = {
            'pending': { label: '待确认', class: 'status-open' },
            'accepted': { label: '已接受', class: 'status-claimed' },
            'completed': { label: '已完成', class: 'status-completed' }
        };

        container.innerHTML = appointments.map(apt => {
            const st = statusMap[apt.status] || statusMap.pending;
            const reqsHtml = apt.requirements.length ? `<div class="apt-item-reqs">${apt.requirements.map(r => `<span>${r}</span>`).join('')}</div>` : '';
            const notesHtml = apt.notes ? `<div class="apt-item-notes">📝 ${apt.notes}</div>` : '';
            
            return `
                <div class="glass-card apt-record-item" style="margin-bottom:12px;padding:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <h4 style="font-size:15px;color:var(--primary-light);">${apt.serviceName}</h4>
                        <span class="task-status-badge ${st.class}">${st.label}</span>
                    </div>
                    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:6px;">
                        🐶 宠物：${apt.animalType}
                    </div>
                    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">
                        📅 时间：${apt.datetime}
                    </div>
                    ${reqsHtml}
                    ${notesHtml}
                </div>
            `;
        }).join('');

        App.openModal('appointmentRecordModal');
    }
};
