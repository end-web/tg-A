<template>
	<view class="page">
		<!-- 顶部 -->
		<view class="header">
			<view class="nav-row">
				<view class="back-btn" @click="goBack">
					<text class="back-arrow">‹</text>
				</view>
			</view>
			<view class="student-info">
				<text class="student-emoji">📝</text>
				<view>
					<text class="page-title">记录作业</text>
					<text class="student-name">{{ studentName }}</text>
				</view>
			</view>
		</view>

		<view class="form-container">
			<!-- 科目选择 -->
			<view class="section">
				<text class="section-label">选择科目</text>
				<scroll-view scroll-x class="subject-scroll">
					<view class="subject-list">
						<view
							v-for="s in subjects"
							:key="s.name"
							class="subject-chip"
							:class="{ active: form.subject === s.name }"
							@click="form.subject = s.name"
						>
							<text class="chip-emoji">{{ s.icon }}</text>
							<text class="chip-text">{{ s.name }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 作业内容 -->
			<view class="section">
				<text class="section-label">作业内容</text>
				<view class="textarea-wrap">
					<textarea
						class="content-textarea"
						v-model="form.content"
						placeholder="今天做了什么作业..."
						:maxlength="200"
					/>
				</view>
			</view>

			<!-- 完成状态 -->
			<view class="section">
				<text class="section-label">完成情况</text>
				<view class="status-row">
					<view
						v-for="st in statuses"
						:key="st.name"
						class="status-chip"
						:class="[st.cls, { active: form.status === st.name }]"
						@click="form.status = st.name"
					>
						<text class="status-icon">{{ st.icon }}</text>
						<text class="status-text">{{ st.name }}</text>
					</view>
				</view>
			</view>

			<!-- 质量评分 -->
			<view class="section">
				<text class="section-label">质量评分</text>
				<view class="star-row">
					<text
						v-for="i in 5"
						:key="i"
						class="star"
						:class="{ filled: i <= form.qualityScore }"
						@click="form.qualityScore = i"
					>{{ i <= form.qualityScore ? '⭐' : '☆' }}</text>
				</view>
			</view>

			<!-- 评价备注 -->
			<view class="section">
				<text class="section-label">老师评语</text>
				<view class="textarea-wrap small">
					<textarea
						class="content-textarea"
						v-model="form.qualityComment"
						placeholder="写点鼓励的话~"
						:maxlength="100"
					/>
				</view>
			</view>

			<!-- 保存按钮 -->
			<button class="save-btn" @click="handleSubmit">
				<text class="save-text">保存记录 ✓</text>
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createHomework } from '@/utils/request.js'
import { isLoggedIn } from '@/utils/auth.js'

const studentName = ref('')
const studentId = ref('')

const subjects = [
	{ name: '语文', icon: '📖' },
	{ name: '数学', icon: '🔢' },
	{ name: '英语', icon: '🔤' },
	{ name: '物理', icon: '⚡' },
	{ name: '化学', icon: '🧪' },
	{ name: '其他', icon: '📦' },
]

const statuses = [
	{ name: '已完成', icon: '✅', cls: 'st-done' },
	{ name: '部分完成', icon: '🔄', cls: 'st-partial' },
	{ name: '未完成', icon: '⏳', cls: 'st-todo' },
]

const form = reactive({
	subject: '',
	content: '',
	status: '',
	qualityScore: 0,
	qualityComment: ''
})

onLoad((options) => {
	studentName.value = options.name || ''
	studentId.value = options.id || ''
})

const goBack = () => uni.navigateBack()

const handleSubmit = async () => {
	if (!isLoggedIn()) {
		uni.showModal({
			title: '请先登录',
			content: '登录后即可保存作业记录',
			confirmText: '去登录',
			success: (res) => {
				if (res.confirm) uni.navigateTo({ url: '/pages/login/login' })
			}
		})
		return
	}
	if (!form.subject) {
		uni.showToast({ title: '请选择科目', icon: 'none' })
		return
	}
	if (!form.status) {
		uni.showToast({ title: '请选择完成状态', icon: 'none' })
		return
	}
	try {
		const today = new Date().toISOString().slice(0, 10)
		await createHomework(
			studentId.value,
			form.subject,
			form.content,
			form.status,
			form.qualityScore,
			form.qualityComment,
			today
		)
		uni.showToast({ title: '保存成功 🎉', icon: 'none' })
		setTimeout(() => uni.navigateBack(), 1000)
	} catch (err) {
		uni.showToast({ title: '保存失败，请重试', icon: 'none' })
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #FFF8F5;
}
.header {
	padding: calc(env(safe-area-inset-top) + 80px) 20px 20px;
	background: linear-gradient(180deg, #FFF0ED 0%, #FFF8F5 100%);
}
.nav-row {
	margin-bottom: 16px;
}
.back-btn {
	display: inline-flex;
	align-items: center;
	padding: 4px 8px 4px 0;
}
.back-arrow {
	font-size: 32px;
	color: #FF6B6B;
	line-height: 1;
}
.student-info {
	display: flex;
	align-items: center;
	gap: 12px;
}
.student-emoji {
	font-size: 36px;
}
.page-title {
	display: block;
	font-size: 13px;
	color: #9CA3AF;
}
.student-name {
	display: block;
	font-size: 22px;
	font-weight: 700;
	color: #2D2D3A;
	margin-top: 2px;
}
.form-container {
	padding: 8px 16px 40px;
}
.section {
	margin-bottom: 20px;
}
.section-label {
	display: block;
	font-size: 14px;
	font-weight: 600;
	color: #6B7280;
	margin-bottom: 10px;
}
.subject-scroll {
	white-space: nowrap;
}
.subject-list {
	display: inline-flex;
	gap: 10px;
	padding: 4px 0;
}
.subject-chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 10px 16px;
	border-radius: 14px;
	background: #FFFFFF;
	border: 1.5px solid #FEE2E2;
	flex-shrink: 0;
}
.subject-chip.active {
	background: linear-gradient(135deg, #FF6B6B, #FF8E53);
	border-color: transparent;
}
.subject-chip.active .chip-text {
	color: #FFFFFF;
}
.chip-emoji {
	font-size: 18px;
}
.chip-text {
	font-size: 14px;
	color: #2D2D3A;
	font-weight: 500;
}
.textarea-wrap {
	background: #FFFFFF;
	border-radius: 16px;
	border: 1.5px solid #FEE2E2;
	padding: 14px;
}
.textarea-wrap.small {
	min-height: auto;
}
.content-textarea {
	width: 100%;
	min-height: 100px;
	font-size: 15px;
	color: #2D2D3A;
	line-height: 1.6;
}
.textarea-wrap.small .content-textarea {
	min-height: 60px;
}
.status-row {
	display: flex;
	gap: 10px;
}
.status-chip {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	padding: 14px 8px;
	border-radius: 16px;
	background: #FFFFFF;
	border: 1.5px solid #F3F4F6;
}
.status-chip.active.st-done {
	background: linear-gradient(135deg, #34D399, #6EE7B7);
	border-color: transparent;
}
.status-chip.active.st-partial {
	background: linear-gradient(135deg, #FBBF24, #F59E0B);
	border-color: transparent;
}
.status-chip.active.st-todo {
	background: linear-gradient(135deg, #9CA3AF, #6B7280);
	border-color: transparent;
}
.status-chip.active .status-text {
	color: #FFFFFF;
}
.status-icon {
	font-size: 22px;
}
.status-text {
	font-size: 13px;
	color: #6B7280;
	font-weight: 500;
}
.star-row {
	display: flex;
	gap: 8px;
}
.star {
	font-size: 32px;
	transition: transform 0.15s;
}
.star:active {
	transform: scale(1.2);
}
.save-btn {
	width: 100%;
	height: 52px;
	line-height: 52px;
	background: linear-gradient(135deg, #FF6B6B, #FF8E53);
	border-radius: 16px;
	border: none;
	margin-top: 28px;
	box-shadow: 0 6px 20px rgba(255,107,107,0.3);
}
.save-btn:active {
	transform: scale(0.98);
}
.save-text {
	font-size: 17px;
	font-weight: 600;
	color: #FFFFFF;
}
</style>
