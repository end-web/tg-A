<template>
	<view class="page">
		<!-- 顶部区域 -->
		<view class="header">
			<view class="header-top">
				<view>
					<text class="greeting">我的学生们 🎒</text>
					<text class="date-text">{{ todayStr }}</text>
				</view>
				<view class="header-badge">
					<text class="badge-num">{{ students.length }}</text>
					<text class="badge-label">人</text>
				</view>
			</view>
			<!-- 未登录体验提示条 -->
			<view v-if="!loggedIn" class="guest-banner" @click="goLogin">
				<text class="guest-icon">👋</text>
				<text class="guest-text">体验模式：登录后可保存数据</text>
				<text class="guest-link">去登录 ›</text>
			</view>
			<!-- 搜索栏 -->
			<view class="search-wrap">
				<text class="search-icon">🔍</text>
				<input class="search-input" placeholder="搜索学生姓名..." v-model="keyword" />
			</view>
		</view>

		<!-- 学生列表 -->
		<view class="list-container">
			<view
				class="student-card"
				v-for="(item, index) in filteredList"
				:key="item._id || item.id"
				@click="goRecord(item)"
				@longpress="showActions(item)"
			>
				<view class="card-left">
					<view class="avatar-wrap" :style="{ background: avatarColors[index % avatarColors.length] }">
						<text class="avatar-emoji">{{ getAnimal(index) }}</text>
					</view>
				</view>
				<view class="card-center">
					<text class="student-name">{{ item.name }}</text>
					<text class="student-meta">{{ item.grade || '未设置年级' }} {{ item.class ? '· ' + item.class : '' }}</text>
				</view>
				<view class="card-right">
					<text class="card-arrow">›</text>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-if="filteredList.length === 0 && !keyword" class="empty-state">
				<text class="empty-emoji">📚✨</text>
				<text class="empty-title">{{ loggedIn ? '还没有学生哦~' : '体验中：示例为空' }}</text>
				<text class="empty-desc">{{ loggedIn ? '点击下方按钮添加第一个学生吧' : '点击下方"+"按钮可添加学生（需先登录）' }}</text>
			</view>
			<view v-if="filteredList.length === 0 && keyword" class="empty-state">
				<text class="empty-emoji">🔍</text>
				<text class="empty-title">没有找到"{{ keyword }}"</text>
				<text class="empty-desc">换个关键词试试</text>
			</view>
		</view>

		<!-- 添加按钮 -->
		<view class="fab" @click="onClickAdd">
			<text class="fab-icon">＋</text>
		</view>

		<!-- 添加学生弹窗 -->
		<view v-if="showAddDialog" class="modal-mask" @click="showAddDialog = false">
			<view class="modal-content" @click.stop>
				<text class="modal-title">添加新学生 🎉</text>
				<view class="form-group">
					<text class="form-label">姓名</text>
					<input class="form-input" v-model="newStudent.name" placeholder="输入学生姓名" />
				</view>
				<view class="form-group">
					<text class="form-label">年级</text>
					<scroll-view scroll-x class="chip-scroll">
						<view class="chip-list">
							<view
								v-for="g in gradeOptions"
								:key="g"
								class="chip"
								:class="{ active: newStudent.grade === g }"
								@click="newStudent.grade = g"
							>
								<text class="chip-text">{{ g }}</text>
							</view>
						</view>
					</scroll-view>
				</view>
				<view class="form-group">
					<text class="form-label">班级</text>
					<view class="chip-list wrap">
						<view
							v-for="c in classOptions"
							:key="c"
							class="chip"
							:class="{ active: newStudent.class === c }"
							@click="newStudent.class = c"
						>
							<text class="chip-text">{{ c }}</text>
						</view>
					</view>
				</view>
				<view class="modal-actions">
					<button class="btn-cancel" @click="showAddDialog = false">取消</button>
					<button class="btn-confirm" @click="handleAddStudent">确定添加</button>
				</view>
			</view>
		</view>

		<!-- 底部 TabBar -->
		<view class="tab-bar">
			<view class="tab-item active" @click="goTo('/pages/teacher/home/home')">
				<text class="tab-icon">🏠</text>
				<text class="tab-label">首页</text>
				<view class="tab-dot"></view>
			</view>
			<view class="tab-item" @click="goTo('/pages/teacher/history/history')">
				<text class="tab-icon">📊</text>
				<text class="tab-label">历史</text>
			</view>
			<view class="tab-item" @click="goTo('/pages/teacher/profile/profile')">
				<text class="tab-icon">🌟</text>
				<text class="tab-label">我的</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getStudents, addStudent, deleteStudent } from '@/utils/request.js'
import { swr, clearCache } from '@/utils/cache.js'
import { isLoggedIn } from '@/utils/auth.js'

const animals = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐮', '🐷']
const avatarColors = [
	'linear-gradient(135deg, #FF6B6B, #FF8E53)',
	'linear-gradient(135deg, #A78BFA, #818CF8)',
	'linear-gradient(135deg, #34D399, #6EE7B7)',
	'linear-gradient(135deg, #FBBF24, #F59E0B)',
	'linear-gradient(135deg, #60A5FA, #3B82F6)',
	'linear-gradient(135deg, #F472B6, #EC4899)',
]
const gradeOptions = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三']
const classOptions = ['1班', '2班', '3班', '4班', '5班', '6班']

const keyword = ref('')
const students = ref([])
const showAddDialog = ref(false)
const newStudent = ref({ name: '', grade: '', class: '' })
const loggedIn = ref(false)

const todayStr = computed(() => {
	const d = new Date()
	return `${d.getMonth() + 1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`
})

const getAnimal = (index) => animals[index % animals.length]

// 体验模式示例数据：审核员/未登录用户能看到完整 UI
const demoStudents = [
	{ id: 'demo-1', name: '示例·小明', grade: '三年级', class: '1班' },
	{ id: 'demo-2', name: '示例·小红', grade: '四年级', class: '2班' },
	{ id: 'demo-3', name: '示例·小刚', grade: '五年级', class: '1班' }
]

const refreshLoggedIn = () => { loggedIn.value = isLoggedIn() }

const loadStudents = async () => {
	refreshLoggedIn()
	if (!loggedIn.value) {
		students.value = demoStudents
		return
	}
	try {
		await swr(
			'cache_students',
			async () => {
				const res = await getStudents()
				return res.data || []
			},
			(data) => { students.value = data || [] }
		)
	} catch (err) {
		// 接口失败时若无缓存，保持空
	}
}

onMounted(() => { loadStudents() })
// 从登录页返回后刷新
onShow(() => { loadStudents() })

const filteredList = computed(() => {
	if (!students.value || students.value.length === 0) return []
	if (!keyword.value) return students.value
	return students.value.filter(s => s.name.includes(keyword.value))
})

const goLogin = () => {
	uni.navigateTo({ url: '/pages/login/login' })
}

const promptLogin = (action) => {
	uni.showModal({
		title: '请先登录',
		content: `登录后即可${action}并保存数据`,
		confirmText: '去登录',
		success: (res) => {
			if (res.confirm) goLogin()
		}
	})
}

const onClickAdd = () => {
	if (!loggedIn.value) {
		promptLogin('添加学生')
		return
	}
	showAddDialog.value = true
}

const handleAddStudent = async () => {
	if (!newStudent.value.name) {
		uni.showToast({ title: '请输入学生姓名', icon: 'none' })
		return
	}
	try {
		await addStudent(newStudent.value.name, newStudent.value.grade, newStudent.value.class)
		uni.showToast({ title: '添加成功 🎉', icon: 'none' })
		showAddDialog.value = false
		newStudent.value = { name: '', grade: '', class: '' }
		clearCache('cache_students')
		loadStudents()
	} catch (err) {
		uni.showToast({ title: '添加失败', icon: 'none' })
	}
}

const showActions = (student) => {
	if (!loggedIn.value) {
		promptLogin('管理学生')
		return
	}
	uni.showActionSheet({
		itemList: ['删除该学生'],
		success: (res) => {
			if (res.tapIndex === 0) handleDelete(student)
		}
	})
}

const handleDelete = (student) => {
	uni.showModal({
		title: '确认删除',
		content: `确定要删除"${student.name}"吗？`,
		success: async (res) => {
			if (res.confirm) {
				try {
					await deleteStudent(student._id || student.id)
					uni.showToast({ title: '已删除', icon: 'none' })
					clearCache('cache_students')
					loadStudents()
				} catch (err) {
					uni.showToast({ title: '删除失败', icon: 'none' })
				}
			}
		}
	})
}

const goRecord = (student) => {
	if (!loggedIn.value) {
		promptLogin('记录作业')
		return
	}
	uni.navigateTo({
		url: `/pages/teacher/record/record?id=${student._id || student.id}&name=${student.name}`
	})
}

const goTo = (url) => { uni.reLaunch({ url }) }
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #FFF8F5;
	position: relative;
}
.header {
	padding: calc(env(safe-area-inset-top) + 88px) 20px 20px;
	background: linear-gradient(180deg, #FFF0ED 0%, #FFF8F5 100%);
}
.header-top {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16px;
}
.greeting {
	display: block;
	font-size: 26px;
	font-weight: 700;
	color: #2D2D3A;
}
.date-text {
	display: block;
	font-size: 14px;
	color: #9CA3AF;
	margin-top: 4px;
}
.header-badge {
	background: linear-gradient(135deg, #FF6B6B, #FF8E53);
	border-radius: 16px;
	padding: 8px 14px;
	display: flex;
	align-items: baseline;
	gap: 2px;
}
.badge-num {
	font-size: 20px;
	font-weight: 700;
	color: #fff;
}
.badge-label {
	font-size: 12px;
	color: rgba(255,255,255,0.85);
}
.search-wrap {
	display: flex;
	align-items: center;
	background: #FFFFFF;
	border-radius: 14px;
	padding: 0 14px;
	height: 44px;
	box-shadow: 0 2px 12px rgba(255,107,107,0.06);
}
/* 未登录提示条 */
.guest-banner {
	display: flex;
	align-items: center;
	gap: 8px;
	background: #FFFFFF;
	border-radius: 14px;
	padding: 10px 14px;
	margin-bottom: 12px;
	box-shadow: 0 2px 12px rgba(255,107,107,0.06);
}
.guest-icon {
	font-size: 18px;
}
.guest-text {
	flex: 1;
	font-size: 13px;
	color: #6B7280;
}
.guest-link {
	font-size: 13px;
	color: #FF6B6B;
	font-weight: 600;
}
.search-icon {
	font-size: 16px;
	margin-right: 8px;
}
.search-input {
	flex: 1;
	font-size: 15px;
	height: 44px;
	color: #2D2D3A;
}
.list-container {
	padding: 8px 16px 120px;
}
.student-card {
	display: flex;
	align-items: center;
	background: #FFFFFF;
	border-radius: 20px;
	padding: 16px;
	margin-bottom: 12px;
	box-shadow: 0 4px 20px rgba(255,107,107,0.06);
	transition: transform 0.15s;
}
.student-card:active {
	transform: scale(0.98);
}
.card-left {
	margin-right: 14px;
}
.avatar-wrap {
	width: 50px;
	height: 50px;
	border-radius: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
}
.avatar-emoji {
	font-size: 26px;
}
.card-center {
	flex: 1;
}
.student-name {
	display: block;
	font-size: 17px;
	font-weight: 600;
	color: #2D2D3A;
}
.student-meta {
	display: block;
	font-size: 13px;
	color: #9CA3AF;
	margin-top: 3px;
}
.card-right {
	padding-left: 8px;
}
.card-arrow {
	font-size: 24px;
	color: #D1D5DB;
	font-weight: 300;
}
/* Empty state */
.empty-state {
	text-align: center;
	padding: 60px 20px;
}
.empty-emoji {
	font-size: 48px;
	display: block;
	margin-bottom: 12px;
}
.empty-title {
	display: block;
	font-size: 17px;
	font-weight: 600;
	color: #2D2D3A;
	margin-bottom: 6px;
}
.empty-desc {
	font-size: 14px;
	color: #9CA3AF;
}
/* FAB */
.fab {
	position: fixed;
	right: 24px;
	bottom: 110px;
	width: 56px;
	height: 56px;
	border-radius: 20px;
	background: linear-gradient(135deg, #FF6B6B, #FF8E53);
	box-shadow: 0 6px 20px rgba(255,107,107,0.35);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
}
.fab:active {
	transform: scale(0.92);
}
.fab-icon {
	font-size: 28px;
	color: #FFFFFF;
	font-weight: 300;
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
/* Modal */
.modal-mask {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.4);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}
.modal-content {
	width: 85%;
	background: #FFFFFF;
	border-radius: 24px;
	padding: 28px 24px;
}
.modal-title {
	font-size: 20px;
	font-weight: 700;
	color: #2D2D3A;
	text-align: center;
	display: block;
	margin-bottom: 24px;
}
.form-group {
	margin-bottom: 16px;
}
.form-label {
	font-size: 13px;
	color: #9CA3AF;
	display: block;
	margin-bottom: 6px;
	font-weight: 500;
}
.form-input {
	width: 100%;
	height: 46px;
	padding: 0 14px;
	border: 1.5px solid #FEE2E2;
	border-radius: 12px;
	font-size: 15px;
	background: #FFF8F5;
	color: #2D2D3A;
}
/* 年级/班级 chip 选择 */
.chip-scroll {
	white-space: nowrap;
}
.chip-list {
	display: inline-flex;
	gap: 8px;
	padding: 2px 0;
}
.chip-list.wrap {
	display: flex;
	flex-wrap: wrap;
}
.chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 8px 14px;
	border-radius: 12px;
	background: #FFF8F5;
	border: 1.5px solid #FEE2E2;
	flex-shrink: 0;
}
.chip.active {
	background: linear-gradient(135deg, #FF6B6B, #FF8E53);
	border-color: transparent;
}
.chip.active .chip-text {
	color: #FFFFFF;
}
.chip-text {
	font-size: 14px;
	color: #6B7280;
	font-weight: 500;
}
.modal-actions {
	display: flex;
	gap: 12px;
	margin-top: 24px;
}
.btn-cancel {
	flex: 1;
	height: 46px;
	line-height: 46px;
	border-radius: 14px;
	font-size: 15px;
	background: #F3F4F6;
	color: #6B7280;
	border: none;
	font-weight: 500;
}
.btn-confirm {
	flex: 1.2;
	height: 46px;
	line-height: 46px;
	border-radius: 14px;
	font-size: 15px;
	background: linear-gradient(135deg, #FF6B6B, #FF8E53);
	color: #FFFFFF;
	border: none;
	font-weight: 600;
	box-shadow: 0 4px 12px rgba(255,107,107,0.25);
}
</style>
