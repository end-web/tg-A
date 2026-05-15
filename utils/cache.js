/**
 * 缓存优先策略：先返回缓存数据，再请求接口更新
 * @param {string} key 缓存键
 * @param {Function} fetcher 实际请求函数
 * @param {Function} onUpdate 数据更新时的回调（用于刷新 UI）
 * @param {number} maxAge 缓存有效期（毫秒），默认 5 分钟
 */
export const swr = async (key, fetcher, onUpdate, maxAge = 5 * 60 * 1000) => {
	const cached = uni.getStorageSync(key)
	let cachedData = null

	if (cached && cached.time && (Date.now() - cached.time < maxAge)) {
		cachedData = cached.data
		onUpdate(cachedData, true)
	}

	try {
		const fresh = await fetcher()
		uni.setStorageSync(key, { data: fresh, time: Date.now() })
		onUpdate(fresh, false)
		return fresh
	} catch (err) {
		if (!cachedData) onUpdate([], false)
		throw err
	}
}

export const clearCache = (key) => {
	if (key) uni.removeStorageSync(key)
}
