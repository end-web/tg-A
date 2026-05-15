// uniCloud 云函数调用封装

const callFunction = (name, data) => {
	return new Promise((resolve, reject) => {
		const token = uni.getStorageSync('token')

		uniCloud.callFunction({
			name,
			data: {
				...data,
				token
			},
			success: (res) => {
				if (res.result.code === 200 || res.result.code === 201) {
					resolve(res.result)
				} else if (res.result.code === 401) {
					// 未登录：清缓存交给调用方处理（如引导登录），不再强制跳页
					uni.removeStorageSync('token')
					uni.removeStorageSync('userInfo')
					reject(res.result)
				} else {
					uni.showToast({
						title: res.result.message || '请求失败',
						icon: 'none'
					})
					reject(res.result)
				}
			},
			fail: (err) => {
				uni.showToast({ title: '网络错误', icon: 'none' })
				reject(err)
			}
		})
	})
}

// 认证相关
export const wxLogin = (code) => callFunction('auth', { action: 'wxLogin', code })
export const register = (openid, role, name, phone) =>
	callFunction('auth', { action: 'register', openid, role, name, phone })
export const getUserInfo = () => callFunction('auth', { action: 'getUserInfo' })

// 学生管理
export const getStudents = () => callFunction('students', { action: 'list' })
export const addStudent = (name, grade, classname) =>
	callFunction('students', { action: 'add', name, grade, classname })
export const updateStudent = (id, name, grade, classname) =>
	callFunction('students', { action: 'update', id, name, grade, classname })
export const deleteStudent = (id) => callFunction('students', { action: 'delete', id })

// 作业记录
export const getHomework = (studentId, date) =>
	callFunction('homework', { action: 'list', studentId, date })
export const createHomework = (studentId, subject, content, status, qualityScore, qualityComment, recordDate) =>
	callFunction('homework', {
		action: 'create',
		studentId,
		subject,
		content,
		status,
		qualityScore,
		qualityComment,
		recordDate
	})
export const updateHomework = (id, subject, content, status, qualityScore, qualityComment) =>
	callFunction('homework', {
		action: 'update',
		id,
		subject,
		content,
		status,
		qualityScore,
		qualityComment
	})
export const deleteHomework = (id) => callFunction('homework', { action: 'delete', id })
export const getStats = () => callFunction('homework', { action: 'stats' })

export default callFunction
