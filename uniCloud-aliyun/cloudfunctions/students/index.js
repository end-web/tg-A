'use strict';

const db = uniCloud.database()
const studentsCollection = db.collection('students')
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
	const { action, token } = event

	// 简单鉴权：检查 token（实际就是 openid）
	if (!token) {
		return { code: 401, message: '未授权' }
	}

	const userRes = await usersCollection.where({ openid: token }).get()
	if (userRes.data.length === 0) {
		return { code: 401, message: '用户不存在' }
	}
	const currentUser = userRes.data[0]

	// 获取学生列表
	if (action === 'list') {
		try {
			let query = studentsCollection

			// 家长只能看自己绑定的学生
			if (currentUser.role === 'parent') {
				query = query.where({ parent_id: currentUser._id })
			}

			const res = await query.get()
			return { code: 200, data: res.data }
		} catch (err) {
			return { code: 500, message: '查询失败', error: err.message }
		}
	}

	// 添加学生（仅老师）
	if (action === 'add') {
		if (currentUser.role !== 'teacher') {
			return { code: 403, message: '无权限' }
		}

		const { name, grade, classname } = event
		if (!name) {
			return { code: 400, message: '缺少学生姓名' }
		}

		try {
			const addRes = await studentsCollection.add({
				name,
				grade: grade || '',
				class: classname || '',
				parent_id: '',
				avatar: ''
			})

			return { code: 200, message: '添加成功', data: { id: addRes.id } }
		} catch (err) {
			return { code: 500, message: '添加失败', error: err.message }
		}
	}

	// 更新学生信息（仅老师）
	if (action === 'update') {
		if (currentUser.role !== 'teacher') {
			return { code: 403, message: '无权限' }
		}

		const { id, name, grade, classname } = event
		if (!id) {
			return { code: 400, message: '缺少学生ID' }
		}

		try {
			await studentsCollection.doc(id).update({
				name,
				grade,
				class: classname
			})

			return { code: 200, message: '更新成功' }
		} catch (err) {
			return { code: 500, message: '更新失败', error: err.message }
		}
	}

	// 删除学生（仅老师）
	if (action === 'delete') {
		if (currentUser.role !== 'teacher') {
			return { code: 403, message: '无权限' }
		}

		const { id } = event
		if (!id) {
			return { code: 400, message: '缺少学生ID' }
		}

		try {
			await studentsCollection.doc(id).remove()
			return { code: 200, message: '删除成功' }
		} catch (err) {
			return { code: 500, message: '删除失败', error: err.message }
		}
	}

	return { code: 400, message: '未知操作' }
}
