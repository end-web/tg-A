<template>
	<view class="login-page">
		<view class="login-header">
			<text class="app-title">托管作业</text>
			<text class="app-subtitle">记录每一天的进步</text>
		</view>

		<view class="login-body">
			<view class="welcome-card">
				<text class="welcome-icon">👩‍🏫</text>
				<text class="welcome-title">老师登录</text>
				<text class="welcome-desc">使用微信登录，开始记录学生作业</text>
			</view>

			<button class="wx-login-btn" :loading="loading" @click="handleLogin">
				<text class="wx-icon">✓</text>
				<text class="wx-text">微信登录</text>
			</button>

			<view class="tips">
				<text class="tips-text">首次登录将自动注册账号</text>
			</view>
		</view>

		<!-- 底部隐私确认（合规要求） -->
		<view class="agreement-bar">
			<view class="agreement-row" @click="agreed = !agreed">
				<view class="checkbox" :class="{ checked: agreed }">
					<text v-if="agreed" class="check-icon">✓</text>
				</view>
				<view class="agreement-text">
					<text class="agreement-plain">我已阅读并同意</text>
					<text class="agreement-link" @click.stop="openDoc('user')">《用户协议》</text>
					<text class="agreement-plain">和</text>
					<text class="agreement-link" @click.stop="openDoc('privacy')">《隐私政策》</text>
				</view>
			</view>
		</view>

		<!-- 协议详情弹窗 -->
		<view v-if="showDoc" class="doc-mask" @click="showDoc = false">
			<view class="doc-content" @click.stop>
				<text class="doc-title">{{ docType === 'user' ? '用户协议' : '隐私政策' }}</text>
				<scroll-view scroll-y class="doc-scroll">
					<text class="doc-text">{{ docContent }}</text>
				</scroll-view>
				<button class="doc-close" @click="showDoc = false">我知道了</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { setToken, setUserInfo } from '@/utils/auth.js'
import { wxLogin, register } from '@/utils/request.js'

const loading = ref(false)
const agreed = ref(false)
const showDoc = ref(false)
const docType = ref('user')

const USER_AGREEMENT = `欢迎使用「托管作业」小程序。

一、服务内容
本小程序为托管班老师提供学生作业记录、查询与统计服务。

二、用户行为
1. 您应妥善保管账号，因您主动泄露或被他人攻击造成的损失由您自行承担。
2. 您不得利用本服务从事违反法律法规的活动。

三、服务变更与终止
我们有权根据业务需要修改、暂停或终止部分或全部服务，并以站内通知方式告知。

四、免责声明
因不可抗力或非我方原因导致的服务中断、数据丢失，我们不承担责任。

五、协议修订
我们保留随时修改本协议的权利，修改后将在小程序内公示，继续使用即视为同意修订后的协议。`

const PRIVACY_POLICY = `我们非常重视您的个人信息和隐私保护。

一、收集的信息
1. 微信账号信息：登录时通过微信授权获取 openid，用于识别用户身份。
2. 用户填写信息：注册时填写的姓名、手机号等。
3. 业务信息：您在使用过程中创建的学生信息、作业记录。

二、信息用途
仅用于本小程序的功能实现（登录、数据展示、记录管理），不会用于其他用途。

三、信息存储
数据存储于 uniCloud 云数据库（阿里云），传输过程使用 HTTPS 加密。

四、信息共享
我们不会向任何第三方出售、出租或共享您的个人信息，法律法规要求除外。

五、您的权利
您有权随时查看、更正、删除您的个人信息，可联系开发者协助处理。

六、未成年人保护
若您是未成年人，请在监护人陪同下阅读本政策，并征得监护人同意后使用本服务。`

const docContent = computed(() => (docType.value === 'user' ? USER_AGREEMENT : PRIVACY_POLICY))

const openDoc = (type) => {
	docType.value = type
	showDoc.value = true
}

const handleLogin = async () => {
	if (loading.value) return

	if (!agreed.value) {
		uni.showToast({ title: '请先阅读并勾选协议', icon: 'none' })
		return
	}

	loading.value = true

	try {
		// 调用微信登录获取 code
		uni.login({
			provider: 'weixin',
			success: async (loginRes) => {
				if (!loginRes.code) {
					uni.showToast({ title: '微信登录失败', icon: 'none' })
					loading.value = false
					return
				}

				const code = loginRes.code

				try {
					// 调用云函数验证 code 并获取 openid
					const authRes = await wxLogin(code)

					if (authRes.code === 200) {
						// 老用户，直接登录
						setToken(authRes.data.token)
						setUserInfo(authRes.data.userInfo)
						uni.reLaunch({ url: '/pages/teacher/home/home' })
					} else if (authRes.code === 201) {
						// 新用户，注册为老师
						const openid = authRes.data.openid
						const regRes = await register(openid, 'teacher', '新老师', '')

						setToken(regRes.data.token)
						setUserInfo(regRes.data.userInfo)
						uni.reLaunch({ url: '/pages/teacher/home/home' })
					}
				} catch (err) {
					console.error('登录失败:', err)
					uni.showToast({ title: '登录失败，请重试', icon: 'none' })
					loading.value = false
				}
			},
			fail: (err) => {
				console.error('微信登录失败:', err)
				uni.showToast({ title: '微信登录失败', icon: 'none' })
				loading.value = false
			}
		})
	} catch (err) {
		console.error('登录异常:', err)
		uni.showToast({ title: '登录失败，请重试', icon: 'none' })
		loading.value = false
	}
}
</script>

<style scoped>
.login-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #007AFF 0%, #5856D6 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0 32px;
}
.login-header {
	padding-top: 120px;
	text-align: center;
	margin-bottom: 80px;
}
.app-title {
	display: block;
	font-size: 36px;
	font-weight: 700;
	color: #FFFFFF;
	margin-bottom: 8px;
}
.app-subtitle {
	font-size: 16px;
	color: rgba(255, 255, 255, 0.8);
}
.login-body {
	width: 100%;
	padding-bottom: 100px;
}
.welcome-card {
	background: rgba(255, 255, 255, 0.15);
	border-radius: 20px;
	padding: 32px 24px;
	text-align: center;
	margin-bottom: 32px;
	backdrop-filter: blur(10px);
}
.welcome-icon {
	font-size: 48px;
	display: block;
	margin-bottom: 16px;
}
.welcome-title {
	display: block;
	font-size: 20px;
	font-weight: 600;
	color: #FFFFFF;
	margin-bottom: 8px;
}
.welcome-desc {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.8);
}
.wx-login-btn {
	width: 100%;
	height: 50px;
	background: #07C160;
	color: #FFFFFF;
	font-size: 17px;
	font-weight: 600;
	border-radius: 12px;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
}
.wx-login-btn:active {
	opacity: 0.9;
}
.wx-icon {
	font-size: 20px;
	margin-right: 8px;
}
.wx-text {
	font-size: 17px;
}
.tips {
	text-align: center;
	margin-top: 24px;
}
.tips-text {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.7);
}
/* 隐私确认 */
.agreement-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 16px 24px calc(env(safe-area-inset-bottom) + 16px);
	background: transparent;
	z-index: 10;
}
.agreement-row {
	display: flex;
	align-items: flex-start;
	gap: 8px;
}
.checkbox {
	width: 18px;
	height: 18px;
	border-radius: 50%;
	border: 1.5px solid rgba(255, 255, 255, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	margin-top: 2px;
	background: transparent;
}
.checkbox.checked {
	background: #07C160;
	border-color: #07C160;
}
.check-icon {
	font-size: 12px;
	color: #FFFFFF;
	font-weight: 700;
	line-height: 1;
}
.agreement-text {
	flex: 1;
	font-size: 12px;
	line-height: 1.6;
	color: rgba(255, 255, 255, 0.85);
}
.agreement-plain {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.85);
}
.agreement-link {
	font-size: 12px;
	color: #FFFFFF;
	text-decoration: underline;
}
/* 协议弹窗 */
.doc-mask {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}
.doc-content {
	width: 86%;
	max-height: 70vh;
	background: #FFFFFF;
	border-radius: 20px;
	padding: 24px 20px 20px;
	display: flex;
	flex-direction: column;
}
.doc-title {
	font-size: 18px;
	font-weight: 700;
	color: #2D2D3A;
	text-align: center;
	display: block;
	margin-bottom: 16px;
}
.doc-scroll {
	flex: 1;
	max-height: 50vh;
	margin-bottom: 16px;
}
.doc-text {
	font-size: 14px;
	line-height: 1.7;
	color: #4B5563;
	white-space: pre-wrap;
	display: block;
}
.doc-close {
	height: 44px;
	line-height: 44px;
	border-radius: 12px;
	background: linear-gradient(135deg, #007AFF, #5856D6);
	color: #FFFFFF;
	font-size: 15px;
	font-weight: 600;
	border: none;
}
</style>
