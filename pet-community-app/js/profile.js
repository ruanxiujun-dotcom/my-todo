/* ==========================================
   Pet Community - 个人中心模块
   用户信息、菜单交互
   ========================================== */

const ProfileModule = {
    init() {
        this.updateStats();
        this.bindMenuActions();
    },

    // ========== 更新统计数据 ==========
    updateStats() {
        const posts = App.getData('pc_posts');
        const myPosts = posts.filter(p => p.userId === 'me');
        document.getElementById('profilePosts').textContent = myPosts.length || 12;
    },

    // ========== 菜单点击 ==========
    bindMenuActions() {
        document.querySelectorAll('.menu-item[data-action]').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                switch (action) {
                    case 'myPosts':
                        App.showToast('📝 我的帖子');
                        break;
                    case 'myFavorites':
                        App.showToast('⭐ 我的收藏');
                        break;
                    case 'myAlbum':
                        App.showToast('📸 宠物相册');
                        break;
                    case 'adoptRecord':
                        App.showToast('💕 领养记录');
                        break;
                    case 'appointment':
                        App.showToast('📅 预约记录');
                        break;
                    case 'orders':
                        App.showToast('📦 我的订单');
                        break;
                    case 'settings':
                        App.showToast('⚙️ 应用设置');
                        break;
                    case 'help':
                        App.showToast('❓ 帮助与反馈');
                        break;
                    case 'about':
                        App.showToast('Pet Community v1.0.0 🐾');
                        break;
                    default:
                        App.showToast('功能开发中...');
                }
            });
        });
    }
};
