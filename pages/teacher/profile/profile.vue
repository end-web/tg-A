<template>
	<view class="page">
		<!-- 顶部个人信息 -->
		<view class="header">
			<text class="page-title">我的 🌟</text>
			<view class="profile-card">
				<view class="avatar-wrap">
					<text class="avatar-emoji">👩‍🏫</text>
				</view>
				<view class="profile-info">
					<text class="profile-name">{{ userName }}</text>
					<view class="role-tag">
						<text class="role-text">{{ loggedIn ? '老师' : '游客' }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-container">
			<view class="menu-card">
				<view class="menu-item" @click="goTo('/pages/teacher/home/home')">
					<text class="menu-icon">👨‍👩‍👧‍👦</text>
					<text class="menu-text">学生管理</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @click="goTo('/pages/teacher/history/history')">
					<text class="menu-icon">📈</text>
					<text class="menu-text">数据统计</text>
					<text class="menu-arrow">›</text>
				</view>
			</view>

			<view class="menu-card">
				<view class="menu-item">
					<text class="menu-icon">💬</text>
					<text class="menu-text">意见反馈</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item">
					<text class="menu-icon">ℹ️</text>
					<text class="menu-text">关于我们</text>
					<text class="menu-arrow">›</text>
				</view>
			</view>

			<button v-if="loggedIn" class="logout-btn" @click="handleLogout">退出登录</button>
			<button v-else class="login-btn" @click="goLogin">微信登录</button>
		</view>

		<!-- 底部 TabBar -->
		<view class="tab-bar">
			<view class="tab-item" @click="goTo('/pages/teacher/home/home')">
				<text class="tab-icon">🏠</text>
				<text class="tab-label">首页</text>
			</view>
			<view class="tab-item" @click="goTo('/pages/teacher/history/history')">
				<text class="tab-icon">📊</text>
				<text class="tab-label">历史</text>
			</view>
			<view class="tab-item active">
				<text class="tab-icon">🌟</text>
				<text class="tab-label">我的</text>
				<view class="tab-dot"></view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getUserInfo, isLoggedIn } from '@/utils/auth.js'
import { clearAuth } from '@/utils/auth.js'

const userName = ref('游客')
const loggedIn = ref(false)

const refresh = () => {
	loggedIn.value = isLoggedIn()
	if (loggedIn.value) {
		const info = getUserInfo()
		userName.value = (info && info.name) || '老师'
	} else {
		userName.value = '游客'
	}
}

onMounted(refresh)
onShow(refresh)

const goTo = (url) => uni.reLaunch({ url })
const goLogin = () => uni.navigateTo({ url: '/pages/login/login' })

const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '确定退出登录？',
		success: (res) => {
			if (res.confirm) {
				clearAuth()
				refresh()
				uni.reLaunch({ url: '/pages/teacher/home/home' })
			}
		}
	})
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #FFF8F5;
}
.header {
	padding: calc(env(safe-area-inset-top) + 88px) 20px 24px;
	background: linear-gradient(180deg, #FFF0ED 0%, #FFF8F5 100%);
}
.page-title {
	display: block;
	font-size: 26px;
	font-weight: 700;
	color: #2D2D3A;
	margin-bottom: 20px;
}
.profile-card {
	display: flex;
	align-items: center;
	background: #FFFFFF;
	border-radius: 20px;
	padding: 20px;
	box-shadow: 0 4px 20px rgba(255,107,107,0.08);
}
.avatar-wrap {
	width: 60px;
	height: 60px;
	border-radius: 20px;
	background: linear-gradient(135deg, #FF6B6B, #FF8E53);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16px;
}
.avatar-emoji {
	font-size: 32px;
}
.profile-info {
	flex: 1;
}
.profile-name {
	display: block;
	font-size: 20px;
	font-weight: 700;
	color: #2D2D3A;
}
.role-tag {
	display: inline-flex;
	margin-top: 6px;
	background: #FFF0ED;
	border-radius: 8px;
	padding: 3px 10px;
}
.role-text {
	font-size: 12px;
	color: #FF6B6B;
	font-weight: 500;
}
.menu-container {
	padding: 12px 16px 120px;
}
.menu-card {
	background: #FFFFFF;
	border-radius: 20px;
	overflow: hidden;
	margin-bottom: 14px;
	box-shadow: 0 4px 20px rgba(255,107,107,0.06);
}
.menu-item {
	display: flex;
	align-items: center;
	padding: 16px 18px;
	border-bottom: 1px solid #FEF2F2;
}
.menu-item:last-child {
	border-bottom: none;
}
.menu-item:active {
	background: #FFF8F5;
}
.menu-icon {
	font-size: 22px;
	margin-right: 14px;
}
.menu-text {
	flex: 1;
	font-size: 16px;
	color: #2D2D3A;
	font-weight: 500;
}
.menu-arrow {
	font-size: 22px;
	color: #D1D5DB;
}
.logout-btn {
	width: 100%;
	height: 50px;
	line-height: 50px;
	background: #FFFFFF;
	color: #F87171;
	font-size: 16px;
	font-weight: 500;
	border-radius: 16px;
	border: none;
	margin-top: 12px;
	box-shadow: 0 4px 20px rgba(255,107,107,0.06);
}
.logout-btn:active {
	background: #FEF2F2;
}
.login-btn {
	width: 100%;
	height: 50px;
	line-height: 50px;
	background: linear-gradient(135deg, #FF6B6B, #FF8E53);
	color: #FFFFFF;
	font-size: 16px;
	font-weight: 600;
	border-radius: 16px;
	border: none;
	margin-top: 12px;
	box-shadow: 0 6px 20px rgba(255,107,107,0.25);
}
.login-btn:active {
	transform: scale(0.98);
}
/* TabBar */
.tab-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: rgba(255,255,255,0.92);
	backdrop-filter: blur(12px);
	display: flex;
	align-items: center;
	justify-content: space-around;
	padding-top: 8px;
	padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
	border-top: 1px solid rgba(255,107,107,0.08);
	z-index: 99;
}
.tab-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	position: relative;
	padding: 4px 16px;
}
.tab-icon {
	font-size: 24px;
}
.tab-label {
	font-size: 11px;
	color: #9CA3AF;
}
.tab-item.active .tab-label {
	color: #FF6B6B;
	font-weight: 600;
}
.tab-dot {
	position: absolute;
	bottom: -4px;
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: #FF6B6B;
}
</style>
