export const getToken = () => uni.getStorageSync('token')
export const setToken = (token) => uni.setStorageSync('token', token)

export const getUserInfo = () => {
	const info = uni.getStorageSync('userInfo')
	return info ? JSON.parse(info) : null
}

export const setUserInfo = (info) => {
	uni.setStorageSync('userInfo', JSON.stringify(info))
}

export const getUserRole = () => {
	const info = getUserInfo()
	return info ? info.role : ''
}

export const isLoggedIn = () => !!getToken()

export const clearAuth = () => {
	uni.removeStorageSync('token')
	uni.removeStorageSync('userInfo')
}

export const checkLogin = () => {
	if (!isLoggedIn()) {
		uni.reLaunch({ url: '/pages/login/login' })
		return false
	}
	return true
}
