/* ==========================================
   Pet Community - 社区动态模块
   帖子渲染、发布、点赞、评论
   ========================================== */

const CommunityModule = {
    init() {
        this.renderStories();
        this.renderPosts();
        this.bindPublishForm();
    },

    // ========== 故事/头像横滑 ==========
    renderStories() {
        const container = document.getElementById('storiesScroll');
        const pets = App.getData('pc_pets');

        let html = `
            <div class="story-item add-story" id="addStoryBtn">
                <div class="story-avatar">
                    <span>+</span>
                </div>
                <span class="story-name">添加</span>
            </div>
        `;

        // 示例故事用户
        const storyUsers = [
            { name: '旺财', emoji: '🐕' },
            { name: '咪咪', emoji: '🐱' },
            { name: '柴柴', emoji: '🐕' },
            { name: '小白', emoji: '🐰' },
            { name: '球球', emoji: '🐹' },
            { name: '大橘', emoji: '🐱' }
        ];

        storyUsers.forEach(user => {
            html += `
                <div class="story-item">
                    <div class="story-avatar">
                        <div class="avatar-placeholder">${user.emoji}</div>
                    </div>
                    <span class="story-name">${user.name}</span>
                </div>
            `;
        });

        container.innerHTML = html;

        // 添加故事点击
        document.getElementById('addStoryBtn').addEventListener('click', () => {
            App.showToast('📸 故事功能开发中...');
        });
    },

    // ========== 渲染帖子列表 ==========
    renderPosts() {
        const container = document.getElementById('postList');
        const posts = App.getData('pc_posts');

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>还没有动态</h3>
                    <p>发布你的第一条动态吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(post => this.renderPostCard(post)).join('');
        this.bindPostActions();
    },

    // 渲染单个帖子
    renderPostCard(post) {
        const commentsHtml = post.comments.length > 0 ? `
            <div class="comments-section">
                ${post.comments.slice(0, 2).map(c => `
                    <div class="comment-item">
                        <div class="comment-avatar">${c.avatar}</div>
                        <div class="comment-body">
                            <span class="comment-user">${c.user}</span>
                            <span class="comment-text">${c.text}</span>
                        </div>
                    </div>
                `).join('')}
                ${post.comments.length > 2 ? `<div style="font-size:12px;color:var(--text-muted);padding-left:38px;margin-top:4px;cursor:pointer;">查看全部 ${post.comments.length} 条评论</div>` : ''}
            </div>
        ` : '';

        const tagsHtml = post.tags.map(t => `<span class="post-tag">#${t}</span>`).join('');

        return `
            <div class="post-card animate-in" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-user">
                        <div class="post-avatar">${post.userAvatar}</div>
                        <div class="post-user-info">
                            <h4>${post.userName}</h4>
                            <span>${post.time}</span>
                        </div>
                    </div>
                    <button class="post-more">⋯</button>
                </div>
                <div class="post-content">
                    <div class="post-text">${post.text.replace(/\n/g, '<br>')}</div>
                    ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
                </div>
                <div class="post-actions">
                    <button class="post-action-btn like-btn ${post.liked ? 'liked' : ''}" data-post-id="${post.id}">
                        <svg class="heart-icon" viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>${post.likes}</span>
                    </button>
                    <button class="post-action-btn comment-btn" data-post-id="${post.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>${post.comments.length}</span>
                    </button>
                    <button class="post-action-btn share-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        <span>分享</span>
                    </button>
                    <button class="post-action-btn convert-task-btn" data-post-id="${post.id}" title="转为上门服务任务">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <path d="M9 22V12h6v10"></path>
                        </svg>
                        <span>转任务</span>
                    </button>
                </div>
                ${commentsHtml}
            </div>
        `;
    },

    // ========== 帖子交互绑定 ==========
    bindPostActions() {
        // 点赞
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postId;
                this.toggleLike(postId, btn);
            });
        });

        // 评论
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                App.showToast('💬 评论功能开发中...');
            });
        });

        // 分享
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                App.showToast('📤 已复制链接');
            });
        });

        // 转为上门服务任务
        document.querySelectorAll('.convert-task-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postId;
                if (typeof DoorServiceModule !== 'undefined') {
                    DoorServiceModule.convertPostToTask(postId);
                    App.showToast('📝 请填写任务信息');
                }
            });
        });
    },

    // 切换点赞
    toggleLike(postId, btn) {
        const posts = App.getData('pc_posts');
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
        App.setData('pc_posts', posts);

        // 更新UI
        btn.classList.toggle('liked');
        const heartIcon = btn.querySelector('.heart-icon');
        heartIcon.setAttribute('fill', post.liked ? 'currentColor' : 'none');
        btn.querySelector('span').textContent = post.likes;
    },

    // ========== 发布动态 ==========
    bindPublishForm() {
        document.getElementById('publishForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const text = document.getElementById('publishText').value.trim();
            if (!text) {
                App.showToast('请输入内容', 'error');
                return;
            }

            // 获取选中的标签
            const selectedTags = [];
            document.querySelectorAll('#publishTagSelect .option-btn.selected').forEach(btn => {
                selectedTags.push(btn.dataset.tag);
            });

            const posts = App.getData('pc_posts');
            const newPost = {
                id: App.genId('post'),
                userId: 'me',
                userName: '宠物爱好者',
                userAvatar: '😊',
                text: text,
                petEmoji: '🐾',
                tags: selectedTags,
                likes: 0,
                liked: false,
                comments: [],
                time: '刚刚'
            };

            posts.unshift(newPost);
            App.setData('pc_posts', posts);

            // 重置表单
            document.getElementById('publishText').value = '';
            document.querySelectorAll('#publishTagSelect .option-btn').forEach(b => b.classList.remove('selected'));

            App.closeModal('publishModal');
            this.renderPosts();
            App.showToast('✅ 发布成功！');
        });
    }
};
