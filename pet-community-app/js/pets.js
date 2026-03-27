/* ==========================================
   Pet Community - 宠物档案模块
   宠物列表、详情、健康记录
   ========================================== */

const PetsModule = {
    selectedPetId: null,

    init() {
        this.renderMyPets();
        this.bindAddPetForm();
        this.bindHealthForm();
        this.bindAddHealthBtn();
    },

    // ========== 渲染我的宠物列表 ==========
    renderMyPets() {
        const container = document.getElementById('myPetsScroll');
        const pets = App.getData('pc_pets');

        let html = `
            <div class="pet-card add-pet" id="addPetCardBtn">
                <span class="add-icon">➕</span>
                <span>添加宠物</span>
            </div>
        `;

        pets.forEach((pet, idx) => {
            html += `
                <div class="pet-card ${idx === 0 && !this.selectedPetId ? 'selected' : ''}" data-pet-id="${pet.id}">
                    <div class="pet-avatar-lg">${pet.emoji}</div>
                    <h4>${pet.name}</h4>
                    <div class="pet-breed">${pet.breed}</div>
                    <div class="pet-age">${pet.age}</div>
                </div>
            `;
        });

        container.innerHTML = html;

        // 绑定添加按钮
        document.getElementById('addPetCardBtn').addEventListener('click', () => {
            App.openModal('addPetModal');
        });

        // 绑定宠物卡片点击
        container.querySelectorAll('.pet-card[data-pet-id]').forEach(card => {
            card.addEventListener('click', () => {
                container.querySelectorAll('.pet-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedPetId = card.dataset.petId;
                this.renderPetDetail(this.selectedPetId);
                this.renderHealthRecords(this.selectedPetId);
            });
        });

        // 默认选中第一个
        if (pets.length > 0) {
            this.selectedPetId = this.selectedPetId || pets[0].id;
            this.renderPetDetail(this.selectedPetId);
            this.renderHealthRecords(this.selectedPetId);
        } else {
            document.getElementById('petDetailSection').innerHTML = '';
            document.getElementById('healthTimeline').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🐾</div>
                    <h3>还没有宠物</h3>
                    <p>添加你的第一只宠物吧！</p>
                </div>
            `;
        }
    },

    // ========== 渲染宠物详情 ==========
    renderPetDetail(petId) {
        const container = document.getElementById('petDetailSection');
        const pets = App.getData('pc_pets');
        const pet = pets.find(p => p.id === petId);
        if (!pet) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="glass-card" style="margin-top:20px;">
                <div class="pet-detail-header">
                    <div class="pet-detail-avatar">${pet.emoji}</div>
                    <div class="pet-detail-name">${pet.name}</div>
                    <div class="pet-detail-breed">${pet.breed}</div>
                </div>
                <div class="pet-info-grid">
                    <div class="pet-info-item">
                        <div class="label">年龄</div>
                        <div class="value">${pet.age}</div>
                    </div>
                    <div class="pet-info-item">
                        <div class="label">性别</div>
                        <div class="value">${pet.gender === 'male' ? '♂ 公' : '♀ 母'}</div>
                    </div>
                    <div class="pet-info-item">
                        <div class="label">体重</div>
                        <div class="value">${pet.weight ? pet.weight + 'kg' : '未记录'}</div>
                    </div>
                    <div class="pet-info-item">
                        <div class="label">类型</div>
                        <div class="value">${this.getTypeName(pet.type)}</div>
                    </div>
                </div>
            </div>
        `;
    },

    getTypeName(type) {
        const map = {
            dog: '🐕 狗狗',
            cat: '🐱 猫咪',
            rabbit: '🐰 兔子',
            bird: '🐦 鸟类',
            fish: '🐟 鱼类',
            hamster: '🐹 仓鼠'
        };
        return map[type] || '🐾 其他';
    },

    // ========== 渲染健康记录 ==========
    renderHealthRecords(petId) {
        const container = document.getElementById('healthTimeline');
        const records = App.getData('pc_health').filter(r => r.petId === petId);

        if (records.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 20px 0;">
                    <div class="empty-icon" style="font-size:40px;">📋</div>
                    <p style="font-size:13px;">暂无健康记录</p>
                </div>
            `;
            return;
        }

        // 按日期降序排列
        records.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = records.map(r => {
            const iconMap = {
                vaccine: { class: 'vaccine', emoji: '💉' },
                deworm: { class: 'deworm', emoji: '💊' },
                checkup: { class: 'checkup', emoji: '🩺' }
            };
            const icon = iconMap[r.type] || iconMap.checkup;

            return `
                <div class="health-item">
                    <div class="health-icon ${icon.class}">${icon.emoji}</div>
                    <div class="health-info">
                        <h5>${r.name}</h5>
                        <p>${r.note || '无备注'}</p>
                        <div class="health-date">📅 ${r.date}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ========== 添加健康记录按钮 ==========
    bindAddHealthBtn() {
        document.getElementById('addHealthBtn').addEventListener('click', () => {
            const pets = App.getData('pc_pets');
            if (pets.length === 0) {
                App.showToast('请先添加宠物', 'error');
                return;
            }
            this.updateHealthPetSelect();
            // 设置默认日期为今天
            document.getElementById('healthDate').value = new Date().toISOString().split('T')[0];
            App.openModal('addHealthModal');
        });
    },

    // 更新健康记录弹窗中的宠物选择
    updateHealthPetSelect() {
        const container = document.getElementById('healthPetSelect');
        const pets = App.getData('pc_pets');
        container.innerHTML = pets.map((pet, idx) => `
            <button type="button" class="option-btn ${(pet.id === this.selectedPetId || (idx === 0 && !this.selectedPetId)) ? 'selected' : ''}" data-pet-id="${pet.id}">
                ${pet.emoji} ${pet.name}
            </button>
        `).join('');
    },

    // 更新发布弹窗中的宠物选择
    updatePublishPetSelect() {
        const container = document.getElementById('publishPetSelect');
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

    // ========== 添加宠物表单 ==========
    bindAddPetForm() {
        document.getElementById('addPetForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('petNameInput').value.trim();
            if (!name) {
                App.showToast('请输入宠物名称', 'error');
                return;
            }

            const typeBtn = document.querySelector('#petTypeSelect .option-btn.selected');
            const genderBtn = document.querySelector('#petGenderSelect .option-btn.selected');

            const newPet = {
                id: App.genId('pet'),
                name: name,
                type: typeBtn ? typeBtn.dataset.type : 'dog',
                emoji: typeBtn ? typeBtn.dataset.emoji : '🐕',
                breed: document.getElementById('petBreedInput').value.trim() || '未知品种',
                age: document.getElementById('petAgeInput').value.trim() || '未知',
                gender: genderBtn ? genderBtn.dataset.gender : 'male',
                weight: parseFloat(document.getElementById('petWeightInput').value) || 0,
                createdAt: Date.now()
            };

            const pets = App.getData('pc_pets');
            pets.push(newPet);
            App.setData('pc_pets', pets);

            // 重置表单
            document.getElementById('addPetForm').reset();
            document.querySelectorAll('#petTypeSelect .option-btn').forEach(b => b.classList.remove('selected'));
            document.querySelector('#petTypeSelect .option-btn[data-type="dog"]').classList.add('selected');
            document.querySelectorAll('#petGenderSelect .option-btn').forEach(b => b.classList.remove('selected'));
            document.querySelector('#petGenderSelect .option-btn[data-gender="male"]').classList.add('selected');

            App.closeModal('addPetModal');
            this.selectedPetId = newPet.id;
            this.renderMyPets();
            App.showToast(`✅ ${newPet.name} 添加成功！`);
        });
    },

    // ========== 健康记录表单 ==========
    bindHealthForm() {
        document.getElementById('healthForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('healthName').value.trim();
            if (!name) {
                App.showToast('请输入记录名称', 'error');
                return;
            }

            const typeBtn = document.querySelector('#healthTypeSelect .option-btn.selected');
            const petBtn = document.querySelector('#healthPetSelect .option-btn.selected');

            const newRecord = {
                id: App.genId('h'),
                petId: petBtn ? petBtn.dataset.petId : this.selectedPetId,
                type: typeBtn ? typeBtn.dataset.type : 'vaccine',
                name: name,
                date: document.getElementById('healthDate').value || new Date().toISOString().split('T')[0],
                note: document.getElementById('healthNote').value.trim()
            };

            const records = App.getData('pc_health');
            records.push(newRecord);
            App.setData('pc_health', records);

            // 重置表单
            document.getElementById('healthForm').reset();
            document.querySelectorAll('#healthTypeSelect .option-btn').forEach(b => b.classList.remove('selected'));
            document.querySelector('#healthTypeSelect .option-btn[data-type="vaccine"]').classList.add('selected');

            App.closeModal('addHealthModal');
            this.renderHealthRecords(newRecord.petId);
            App.showToast('✅ 健康记录已添加！');
        });
    }
};
