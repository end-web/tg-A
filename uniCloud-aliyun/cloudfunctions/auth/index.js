'use strict';

const db = uniCloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
	const { action, code, role, name, phone } = event

	// 微信登录
	if (action === 'wxLogin') {
		if (!code) {
			return { code: 400, message: '缺少code参数' }
		}

		try {
			const appid = process.env.WX_APPID || 'wxe1ad102c8c75995e'
			const secret = process.env.WX_APPSECRET
			if (!secret) {
				return { code: 500, message: '云函数未配置 WX_APPSECRET 环境变量' }
			}

			// 调用微信登录接口获取 openid
			const res = await uniCloud.httpclient.request(
				'https://api.weixin.qq.com/sns/jscode2session',
				{
					method: 'GET',
					data: {
						appid,
						secret,
						js_code: code,
						grant_type: 'authorization_code'
					},
					dataType: 'json'
				}
			)

			if (res.status !== 200 || res.data.errcode) {
				return { code: 500, message: '微信登录失败', error: res.data }
			}

			const openid = res.data.openid

			// 查询用户是否已存在
			const userRes = await usersCollection.where({ openid }).get()

			if (userRes.data.length > 0) {
				// 用户已存在，直接返回
				const user = userRes.data[0]
				return {
					code: 200,
					message: '登录成功',
					data: {
						token: openid, // 简化版：直接用 openid 当 token
						userInfo: {
							id: user._id,
							role: user.role,
							name: user.name,
							phone: user.phone,
							avatar: user.avatar
						}
					}
				}
			} else {
				// 新用户，需要注册
				return {
					code: 201,
					message: '新用户，需要注册',
					data: { openid }
				}
			}
		} catch (err) {
			return { code: 500, message: '登录失败', error: err.message }
		}
	}

	// 注册/绑定角色
	if (action === 'register') {
		if (!event.openid || !role || !name) {
			return { code: 400, message: '缺少必要参数' }
		}

		try {
			const addRes = await usersCollection.add({
				openid: event.openid,
				role,
				name,
				phone: phone || '',
				avatar: ''
			})

			const user = await usersCollection.doc(addRes.id).get()

			return {
				code: 200,
				message: '注册成功',
				data: {
					token: event.openid,
					userInfo: {
						id: user.data[0]._id,
						role: user.data[0].role,
						name: user.data[0].name,
						phone: user.data[0].phone
					}
				}
			}
		} catch (err) {
			return { code: 500, message: '注册失败', error: err.message }
		}
	}

	// 获取用户信息
	if (action === 'getUserInfo') {
		const token = event.token || context.TOKEN
		if (!token) {
			return { code: 401, message: '未授权' }
		}

		try {
			const userRes = await usersCollection.where({ openid: token }).get()
			if (userRes.data.length === 0) {
				return { code: 404, message: '用户不存在' }
			}

			const user = userRes.data[0]
			return {
				code: 200,
				data: {
					id: user._id,
					role: user.role,
					name: user.name,
					phone: user.phone,
					avatar: user.avatar
				}
			}
		} catch (err) {
			return { code: 500, message: '查询失败', error: err.message }
		}
	}

	return { code: 400, message: '未知操作' }
}
