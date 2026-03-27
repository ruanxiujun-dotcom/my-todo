/* ==========================================
   Pet Community - 核心应用逻辑
   页面路由、数据管理、通用工具
   ========================================== */

// ========== 全局数据管理 ==========
const App = {
    // 当前激活的页面
    currentPage: 'pageCommunity',

    // 初始化应用
    init() {
        this.initNavigation();
        this.initModals();
        this.initData();
        this.loadAllModules();
    },

    // ========== 页面导航 ==========
    initNavigation() {
        // 底部导航按钮点击
        document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const pageId = btn.dataset.page;
                this.switchPage(pageId);

                // 更新导航样式
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // 中间发布按钮
        document.getElementById('centerPublishBtn').addEventListener('click', () => {
            this.openModal('publishModal');
            // 更新宠物选择列表
            if (typeof PetsModule !== 'undefined') {
                PetsModule.updatePublishPetSelect();
            }
        });
    },

    // 切换页面
    switchPage(pageId) {
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        const target = document.getElementById(pageId);
        if (target) {
            target.classList.add('active');
            this.currentPage = pageId;
        }
    },

    // ========== 模态弹窗管理 ==========
    initModals() {
        // 关闭按钮绑定
        const modalMap = {
            'closePublishModal': 'publishModal',
            'closeAddPetModal': 'addPetModal',
            'closeHealthModal': 'addHealthModal',
            'closeAdoptDetailModal': 'adoptDetailModal'
        };

        Object.entries(modalMap).forEach(([btnId, modalId]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.closeModal(modalId));
            }
        });

        // 点击遮罩关闭
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(overlay.id);
                }
            });
        });
    },

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    },

    // ========== 数据管理 ==========
    initData() {
        // 如果没有数据则初始化示例数据
        if (!localStorage.getItem('pc_initialized')) {
            this.initSampleData();
            localStorage.setItem('pc_initialized', 'true');
        }
    },

    // 初始化示例数据
    initSampleData() {
        // 示例宠物数据
        const pets = [
            {
                id: 'pet_1',
                name: '旺财',
                type: 'dog',
                emoji: '🐕',
                breed: '金毛寻回犬',
                age: '3岁',
                gender: 'male',
                weight: 32,
                createdAt: Date.now()
            },
            {
                id: 'pet_2',
                name: '咪咪',
                type: 'cat',
                emoji: '🐱',
                breed: '布偶猫',
                age: '2岁',
                gender: 'female',
                weight: 4.5,
                createdAt: Date.now()
            }
        ];

        // 示例健康记录
        const healthRecords = [
            {
                id: 'h_1',
                petId: 'pet_1',
                type: 'vaccine',
                name: '狂犬疫苗第3针',
                date: '2026-03-15',
                note: '一切正常，下次注射一年后'
            },
            {
                id: 'h_2',
                petId: 'pet_1',
                type: 'deworm',
                name: '体内驱虫',
                date: '2026-03-01',
                note: '使用犬心保'
            },
            {
                id: 'h_3',
                petId: 'pet_2',
                type: 'checkup',
                name: '年度体检',
                date: '2026-02-20',
                note: '体重正常，牙齿需要清洁'
            },
            {
                id: 'h_4',
                petId: 'pet_2',
                type: 'vaccine',
                name: '猫三联疫苗',
                date: '2026-02-10',
                note: ''
            }
        ];

        // 示例社区动态
        const posts = [
            {
                id: 'post_1',
                userId: 'user_1',
                userName: '小明和旺财',
                userAvatar: '😊',
                text: '今天带旺财去公园玩了一下午，它开心得不得了！金毛真的是最阳光的狗狗了 ☀️',
                petEmoji: '🐕',
                tags: ['日常', '出行'],
                likes: 42,
                liked: false,
                comments: [
                    { user: '猫奴日记', avatar: '😺', text: '好可爱的金毛！' },
                    { user: '宠物达人', avatar: '🤩', text: '金毛真的超级治愈！' }
                ],
                time: '2小时前'
            },
            {
                id: 'post_2',
                userId: 'user_2',
                userName: '猫奴日记',
                userAvatar: '😺',
                text: '咪咪今天学会了新技能——握手！虽然只成功了一次就跑去睡觉了 😂 猫咪果然还是自由的灵魂~',
                petEmoji: '🐱',
                tags: ['萌宠', '训练'],
                likes: 89,
                liked: false,
                comments: [
                    { user: '铲屎官联盟', avatar: '🐾', text: '哈哈猫咪就是这样，想教就教不会' }
                ],
                time: '5小时前'
            },
            {
                id: 'post_3',
                userId: 'user_3',
                userName: '铲屎官联盟',
                userAvatar: '🐾',
                text: '分享一下我家布偶的自制猫饭食谱 🍽️\n\n鸡胸肉 100g + 南瓜 50g + 蛋黄 1个\n\n蒸熟后搅拌均匀，咪咪特别爱吃！',
                petEmoji: '🐱',
                tags: ['美食', '健康'],
                likes: 156,
                liked: false,
                comments: [
                    { user: '小明和旺财', avatar: '😊', text: '狗狗也能吃吗？' },
                    { user: '宠物营养师', avatar: '👩‍⚕️', text: '食谱很棒！建议可以加点鱼油' },
                    { user: '猫奴日记', avatar: '😺', text: '收藏了，改天试试！' }
                ],
                time: '昨天'
            },
            {
                id: 'post_4',
                userId: 'user_4',
                userName: '兔兔乐园',
                userAvatar: '🐰',
                text: '新来的小兔子太可爱了！软绵绵的像个小毛球，取名叫"棉花糖" 🍡',
                petEmoji: '🐰',
                tags: ['萌宠', '日常'],
                likes: 203,
                liked: false,
                comments: [],
                time: '昨天'
            }
        ];

        // 示例服务数据
        const services = [
            {
                id: 's_1',
                name: '宠爱宠物医院',
                type: 'hospital',
                icon: '🏥',
                desc: '24小时营业，专业外科手术、疫苗接种、体检',
                rating: 4.8,
                distance: '0.8km',
                price: '¥80起'
            },
            {
                id: 's_2',
                name: '萌宠美容SPA',
                type: 'grooming',
                icon: '✂️',
                desc: '洗澡、造型、SPA护理，专业美容师团队',
                rating: 4.6,
                distance: '1.2km',
                price: '¥120起'
            },
            {
                id: 's_3',
                name: '汪星人乐园',
                type: 'park',
                icon: '🌳',
                desc: '大型室外宠物乐园，设有游泳池和障碍训练场',
                rating: 4.9,
                distance: '2.5km',
                price: '¥30/次'
            },
            {
                id: 's_4',
                name: '宠物之家商城',
                type: 'shop',
                icon: '🛍️',
                desc: '进口猫粮狗粮、玩具、服饰应有尽有',
                rating: 4.5,
                distance: '0.5km',
                price: ''
            },
            {
                id: 's_5',
                name: '乖宠训练学校',
                type: 'training',
                icon: '🎓',
                desc: '专业训犬师一对一训练，纠正行为问题',
                rating: 4.7,
                distance: '3.0km',
                price: '¥200/课'
            },
            {
                id: 's_6',
                name: '仁爱动物诊所',
                type: 'hospital',
                icon: '🏥',
                desc: '内科、皮肤科、牙科，资深兽医坐诊',
                rating: 4.4,
                distance: '1.8km',
                price: '¥60起'
            },
            {
                id: 's_7',
                name: '喵星人美容馆',
                type: 'grooming',
                icon: '✂️',
                desc: '猫咪专属美容，温柔手法无应激',
                rating: 4.8,
                distance: '1.5km',
                price: '¥99起'
            },
            {
                id: 's_8',
                name: '宠物天堂游乐场',
                type: 'park',
                icon: '🌳',
                desc: '室内外结合，雨天也能玩，设有寄养服务',
                rating: 4.3,
                distance: '4.2km',
                price: '¥50/次'
            }
        ];

        // 示例领养数据
        const adoptions = [
            {
                id: 'a_1',
                name: '小黄',
                type: 'dog',
                emoji: '🐕',
                breed: '中华田园犬',
                age: '1岁',
                gender: 'male',
                badge: 'urgent',
                badgeText: '急需领养',
                story: '小黄是在街边被发现的流浪狗，性格温顺，很亲人。已做完疫苗和绝育，健康状况良好，急需一个温暖的家。'
            },
            {
                id: 'a_2',
                name: '橘子',
                type: 'cat',
                emoji: '🐱',
                breed: '橘猫',
                age: '6个月',
                gender: 'male',
                badge: 'new',
                badgeText: '新上线',
                story: '橘子是一只活泼可爱的橘猫，非常喜欢和人互动。之前的主人因为搬家无法继续养，希望找到新的家庭。'
            },
            {
                id: 'a_3',
                name: '雪球',
                type: 'rabbit',
                emoji: '🐰',
                breed: '荷兰垂耳兔',
                age: '8个月',
                gender: 'female',
                badge: '',
                badgeText: '',
                story: '雪球是一只纯白色的垂耳兔，安静乖巧，适合公寓饲养。已完成疫苗接种。'
            },
            {
                id: 'a_4',
                name: '黑豆',
                type: 'cat',
                emoji: '🐱',
                breed: '黑猫',
                age: '2岁',
                gender: 'female',
                badge: '',
                badgeText: '',
                story: '黑豆是一只优雅的黑猫，眼睛金色非常漂亮。性格独立但也会撒娇，已绝育。'
            },
            {
                id: 'a_5',
                name: '豆豆',
                type: 'dog',
                emoji: '🐕',
                breed: '泰迪犬',
                age: '3岁',
                gender: 'male',
                badge: 'urgent',
                badgeText: '急需领养',
                story: '豆豆是一只棕色泰迪，因主人生病无法继续照顾。性格活泼，会简单指令，非常聪明。'
            },
            {
                id: 'a_6',
                name: '仔仔',
                type: 'other',
                emoji: '🐹',
                breed: '金丝熊仓鼠',
                age: '4个月',
                gender: 'male',
                badge: 'new',
                badgeText: '新上线',
                story: '仔仔是一只金丝熊仓鼠，毛色金黄非常可爱。附赠笼子和用品。'
            }
        ];

        localStorage.setItem('pc_pets', JSON.stringify(pets));
        localStorage.setItem('pc_health', JSON.stringify(healthRecords));
        localStorage.setItem('pc_posts', JSON.stringify(posts));
        localStorage.setItem('pc_services', JSON.stringify(services));
        localStorage.setItem('pc_adoptions', JSON.stringify(adoptions));
    },

    // ========== 数据读写工具 ==========
    getData(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    },

    setData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // ========== 生成唯一ID ==========
    genId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    },

    // ========== Toast提示 ==========
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    },

    // ========== 加载所有模块 ==========
    loadAllModules() {
        if (typeof CommunityModule !== 'undefined') CommunityModule.init();
        if (typeof PetsModule !== 'undefined') PetsModule.init();
        if (typeof ServicesModule !== 'undefined') ServicesModule.init();
        if (typeof AdoptionModule !== 'undefined') AdoptionModule.init();
        if (typeof ProfileModule !== 'undefined') ProfileModule.init();
    }
};

// ========== 通用选项组交互 ==========
document.addEventListener('click', (e) => {
    const optionBtn = e.target.closest('.option-btn');
    if (optionBtn) {
        const group = optionBtn.closest('.option-group');
        if (group) {
            // 检查是否是标签选择（可多选）
            const isTagSelect = group.id === 'publishTagSelect';
            if (isTagSelect) {
                optionBtn.classList.toggle('selected');
            } else {
                group.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                optionBtn.classList.add('selected');
            }
        }
    }
});

// ========== 应用启动 ==========
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
