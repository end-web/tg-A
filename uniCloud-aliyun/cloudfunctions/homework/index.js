'use strict';

const db = uniCloud.database()
const homeworkCollection = db.collection('homework_records')
const studentsCollection = db.collection('students')
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
	const { action, token } = event

	// 鉴权
	if (!token) {
		return { code: 401, message: '未授权' }
	}

	const userRes = await usersCollection.where({ openid: token }).get()
	if (userRes.data.length === 0) {
		return { code: 401, message: '用户不存在' }
	}
	const currentUser = userRes.data[0]

	// 获取作业记录列表
	if (action === 'list') {
		const { studentId, date } = event

		try {
			let query = homeworkCollection

			// 家长只能看自己孩子的作业
			if (currentUser.role === 'parent') {
				const studentRes = await studentsCollection
					.where({ parent_id: currentUser._id })
					.get()
				const studentIds = studentRes.data.map(s => s._id)
				query = query.where({
					student_id: db.command.in(studentIds)
				})
			}

			// 按学生筛选
			if (studentId) {
				query = query.where({ student_id: studentId })
			}

			// 按日期筛选
			if (date) {
				query = query.where({ record_date: date })
			}

			const res = await query.orderBy('create_date', 'desc').get()

			// 补充学生姓名
			const studentIds = [...new Set(res.data.map(r => r.student_id))]
			const studentsRes = await studentsCollection
				.where({ _id: db.command.in(studentIds) })
				.get()
			const studentMap = {}
			studentsRes.data.forEach(s => {
				studentMap[s._id] = s.name
			})

			res.data.forEach(r => {
				r.studentName = studentMap[r.student_id] || '未知'
			})

			return { code: 200, data: res.data }
		} catch (err) {
			return { code: 500, message: '查询失败', error: err.message }
		}
	}

	// 创建作业记录（仅老师）
	if (action === 'create') {
		if (currentUser.role !== 'teacher') {
			return { code: 403, message: '无权限' }
		}

		const { studentId, subject, content, status, qualityScore, qualityComment, recordDate } = event

		if (!studentId || !subject || !status || !recordDate) {
			return { code: 400, message: '缺少必要参数' }
		}

		try {
			const addRes = await homeworkCollection.add({
				student_id: studentId,
				teacher_id: currentUser._id,
				subject,
				content: content || '',
				status,
				quality_score: qualityScore || 0,
				quality_comment: qualityComment || '',
				record_date: recordDate
			})

			return { code: 200, message: '记录成功', data: { id: addRes.id } }
		} catch (err) {
			return { code: 500, message: '记录失败', error: err.message }
		}
	}

	// 更新作业记录（仅老师）
	if (action === 'update') {
		if (currentUser.role !== 'teacher') {
			return { code: 403, message: '无权限' }
		}

		const { id, subject, content, status, qualityScore, qualityComment } = event

		if (!id) {
			return { code: 400, message: '缺少记录ID' }
		}

		try {
			await homeworkCollection.doc(id).update({
				subject,
				content,
				status,
				quality_score: qualityScore,
				quality_comment: qualityComment
			})

			return { code: 200, message: '更新成功' }
		} catch (err) {
			return { code: 500, message: '更新失败', error: err.message }
		}
	}

	// 删除作业记录（仅老师）
	if (action === 'delete') {
		if (currentUser.role !== 'teacher') {
			return { code: 403, message: '无权限' }
		}

		const { id } = event

		if (!id) {
			return { code: 400, message: '缺少记录ID' }
		}

		try {
			await homeworkCollection.doc(id).remove()
			return { code: 200, message: '删除成功' }
		} catch (err) {
			return { code: 500, message: '删除失败', error: err.message }
		}
	}

	// 统计数据（家长）
	if (action === 'stats') {
		if (currentUser.role !== 'parent') {
			return { code: 403, message: '无权限' }
		}

		try {
			// 获取家长绑定的学生
			const studentRes = await studentsCollection
				.where({ parent_id: currentUser._id })
				.get()

			if (studentRes.data.length === 0) {
				return { code: 200, data: { totalDays: 0, completedRate: 0 } }
			}

			const studentIds = studentRes.data.map(s => s._id)

			// 获取近30天的作业记录
			const thirtyDaysAgo = new Date()
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
			const dateStr = thirtyDaysAgo.toISOString().slice(0, 10)

			const recordsRes = await homeworkCollection
				.where({
					student_id: db.command.in(studentIds),
					record_date: db.command.gte(dateStr)
				})
				.get()

			const total = recordsRes.data.length
			const completed = recordsRes.data.filter(r => r.status === '已完成').length
			const rate = total > 0 ? Math.round((completed / total) * 100) : 0

			return {
				code: 200,
				data: {
					totalDays: 30,
					completedRate: rate,
					totalRecords: total,
					completedRecords: completed
				}
			}
		} catch (err) {
			return { code: 500, message: '统计失败', error: err.message }
		}
	}

	return { code: 400, message: '未知操作' }
}
