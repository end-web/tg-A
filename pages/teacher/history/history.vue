<template>
	<view class="page">
		<!-- 顶部 -->
		<view class="header">
			<text class="page-title">历史记录 📊</text>
			<!-- 日期切换 -->
			<view class="date-switcher">
				<view class="date-arrow" @click="changeDate(-1)">
					<text class="arrow-text">‹</text>
				</view>
				<view class="date-display" @click="pickDate">
					<text class="date-main">{{ displayDate }}</text>
					<text class="date-week">{{ weekDay }}</text>
				</view>
				<view class="date-arrow" @click="changeDate(1)">
					<text class="arrow-text">›</text>
				</view>
			</view>
		</view>

		<!-- 记录列表 -->
		<view class="list-container">
			<view v-if="groupedRecords.length === 0" class="empty-state">
				<text class="empty-emoji">📭</text>
				<text class="empty-title">{{ loggedIn ? '这天还没有记录' : '登录后查看历史记录' }}</text>
				<text class="empty-desc" v-if="loggedIn">去首页选择学生记录作业吧</text>
				<text class="empty-link" v-else @click="goLogin">去登录 ›</text>
			</view>

			<view v-for="group in groupedRecords" :key="group.studentName" class="student-group">
				<view class="group-header">
					<text class="group-avatar">{{ getAnimal(group.studentName) }}</text>
					<text class="group-name">{{ group.studentName }}</text>
					<view class="group-badge">
						<text class="badge-text">{{ group.records.length }}条</text>
					</view>
				</view>

				<view v-for="item in group.records" :key="item._id" class="record-item">
					<view class="record-row">
						<view class="subject-tag">
							<text class="tag-icon">{{ getSubjectIcon(item.subject) }}</text>
							<text class="tag-text">{{ item.subject }}</text>
						</view>
						<view class="status-badge" :class="getStatusCls(item.status)">
							<text class="status-text">{{ item.status }}</text>
						</view>
					</view>
					<text v-if="item.content" class="record-content">{{ item.content }}</text>
					<view v-if="item.quality_score" class="record-stars">
						<text v-for="i in 5" :key="i" class="mini-star">{{ i <= item.quality_score ? '⭐' : '☆' }}</text>
						<text v-if="item.quality_comment" class="record-comment">{{ item.quality_comment }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部 TabBar -->
		<view class="tab-bar">
			<view class="tab-item" @click="goTo('/pages/teacher/home/home')">
				<text class="tab-icon">🏠</text>
				<text class="tab-label">首页</text>
			</view>
			<view class="tab-item active">
				<text class="tab-icon">📊</text>
				<text class="tab-label">历史</text>
				<view class="tab-dot"></view>
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
import { getHomework } from '@/utils/request.js'
import { swr } from '@/utils/cache.js'
import { isLoggedIn } from '@/utils/auth.js'

const currentDate = ref(new Date().toISOString().slice(0, 10))
const records = ref([])
const loggedIn = ref(false)

const subjectIcons = { '语文': '📖', '数学': '🔢', '英语': '🔤', '物理': '⚡', '化学': '🧪', '其他': '📦' }
const animalPool = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵']

const getSubjectIcon = (name) => subjectIcons[name] || '📦'
const getAnimal = (name) => animalPool[name.charCodeAt(0) % animalPool.length]
const getStatusCls = (st) => {
	if (st === '已完成') return 'st-done'
	if (st === '部分完成') return 'st-partial'
	return 'st-todo'
}

const displayDate = computed(() => {
	const [y, m, d] = currentDate.value.split('-')
	return `${parseInt(m)}月${parseInt(d)}日`
})

const weekDay = computed(() => {
	const d = new Date(currentDate.value)
	return '周' + '日一二三四五六'[d.getDay()]
})

const changeDate = (offset) => {
	const d = new Date(currentDate.value)
	d.setDate(d.getDate() + offset)
	currentDate.value = d.toISOString().slice(0, 10)
	loadRecords()
}

const pickDate = () => {
	// 微信小程序日期选择器暂不实现，用左右箭头切换即可
}

const loadRecords = async () => {
	loggedIn.value = isLoggedIn()
	if (!loggedIn.value) {
		records.value = []
		return
	}
	try {
		await swr(
			`cache_homework_${currentDate.value}`,
			async () => {
				const res = await getHomework(null, currentDate.value)
				return res.data || []
			},
			(data) => { records.value = data || [] },
			60 * 1000  // 历史记录缓存 1 分钟
		)
	} catch (err) {
		// 失败时若无缓存，保持空
	}
}

onMounted(() => { loadRecords() })

const groupedRecords = computed(() => {
	if (!records.value || records.value.length === 0) return []
	const groups = {}
	records.value.forEach(record => {
		const name = record.studentName || '未知'
		if (!groups[name]) groups[name] = { studentName: name, records: [] }
		groups[name].records.push(record)
	})
	return Object.values(groups).sort((a, b) => a.studentName.localeCompare(b.studentName, 'zh-CN'))
})

const goTo = (url) => { uni.reLaunch({ url }) }
const goLogin = () => { uni.navigateTo({ url: '/pages/login/login' }) }
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #FFF8F5;
}
.header {
	padding: calc(env(safe-area-inset-top) + 88px) 20px 20px;
	background: linear-gradient(180deg, #FFF0ED 0%, #FFF8F5 100%);
}
.page-title {
	display: block;
	font-size: 26px;
	font-weight: 700;
	color: #2D2D3A;
	margin-bottom: 16px;
}
.date-switcher {
	display: flex;
	align-items: center;
	background: #FFFFFF;
	border-radius: 16px;
	padding: 6px;
	box-shadow: 0 2px 12px rgba(255,107,107,0.06);
}
.date-arrow {
	width: 36px;
	height: 36px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #FFF0ED;
}
.date-arrow:active {
	background: #FEE2E2;
}
.arrow-text {
	font-size: 22px;
	color: #FF6B6B;
	font-weight: 600;
}
.date-display {
	flex: 1;
	text-align: center;
	padding: 4px 0;
}
.date-main {
	display: block;
	font-size: 17px;
	font-weight: 600;
	color: #2D2D3A;
}
.date-week {
	display: block;
	font-size: 12px;
	color: #9CA3AF;
	margin-top: 2px;
}
.list-container {
	padding: 12px 16px 120px;
}
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
.empty-link {
	display: inline-block;
	margin-top: 14px;
	font-size: 15px;
	color: #FF6B6B;
	font-weight: 600;
}
.student-group {
	margin-bottom: 16px;
	background: #FFFFFF;
	border-radius: 20px;
	overflow: hidden;
	box-shadow: 0 4px 20px rgba(255,107,107,0.06);
}
.group-header {
	display: flex;
	align-items: center;
	padding: 14px 16px;
	border-bottom: 1px solid #FEF2F2;
}
.group-avatar {
	font-size: 24px;
	margin-right: 10px;
}
.group-name {
	flex: 1;
	font-size: 16px;
	font-weight: 600;
	color: #2D2D3A;
}
.group-badge {
	background: #FFF0ED;
	border-radius: 10px;
	padding: 4px 10px;
}
.badge-text {
	font-size: 12px;
	color: #FF6B6B;
	font-weight: 500;
}
.record-item {
	padding: 14px 16px;
	border-bottom: 1px solid #FEF2F2;
}
.student-group .record-item:last-child {
	border-bottom: none;
}
.record-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 6px;
}
.subject-tag {
	display: flex;
	align-items: center;
	gap: 4px;
}
.tag-icon {
	font-size: 16px;
}
.tag-text {
	font-size: 14px;
	color: #6B7280;
	font-weight: 500;
}
.status-badge {
	padding: 3px 10px;
	border-radius: 10px;
	font-size: 12px;
}
.status-badge.st-done {
	background: #D1FAE5;
}
.status-badge.st-done .status-text {
	color: #059669;
}
.status-badge.st-partial {
	background: #FEF3C7;
}
.status-badge.st-partial .status-text {
	color: #D97706;
}
.status-badge.st-todo {
	background: #F3F4F6;
}
.status-badge.st-todo .status-text {
	color: #6B7280;
}
.status-text {
	font-size: 12px;
	font-weight: 500;
}
.record-content {
	display: block;
	font-size: 14px;
	color: #4B5563;
	line-height: 1.5;
}
.record-stars {
	display: flex;
	align-items: center;
	gap: 2px;
	margin-top: 8px;
	flex-wrap: wrap;
}
.mini-star {
	font-size: 14px;
}
.record-comment {
	font-size: 13px;
	color: #9CA3AF;
	margin-left: 6px;
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
