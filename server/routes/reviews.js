const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const router = express.Router()

/**
 * Convert sql.js exec result to an array of plain objects.
 * @param {import('sql.js').QueryExecResult} [result]
 * @returns {Record<string, any>[]}
 */
function rowsToObjects(result) {
  if (!result || !result.columns || !result.values || result.values.length === 0) {
    return []
  }
  const { columns, values } = result
  return values.map((row) => {
    const obj = {}
    columns.forEach((col, i) => {
      obj[col] = row[i]
    })
    return obj
  })
}

/**
 * Fetch a single review by id using a prepared statement.
 * @param {import('sql.js').Database} db
 * @param {number} id
 * @returns {Record<string, any> | null}
 */
function findReviewById(db, id) {
  const stmt = db.prepare(`
    SELECT r.*, COALESCE(u.username, '用户') AS username
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `)
  stmt.bind([id])
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return null
}

/* ══════════════════════════════════════════════
   1. GET / —— 获取评价列表（支持分页 & 筛选）
   ══════════════════════════════════════════════ */
router.get('/', (req, res, next) => {
  /* 访问 mine=1 时先解析登录态 */
  if (req.query.mine === '1') {
    return authMiddleware(req, res, next)
  }
  next()
}, (req, res) => {
  try {
    const db = req.app.get('db')
    const { canteen_id, page = '1', limit = '10', mine } = req.query
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)
    const offset = (pageNum - 1) * limitNum

    /* ── Build WHERE clause ── */
    let countWhere = ''
    let queryWhere = ''
    const countParams = []
    const queryParams = []

    if (canteen_id) {
      countWhere = 'WHERE canteen_id = ?'
      queryWhere = 'WHERE r.canteen_id = ?'
      const id = parseInt(canteen_id, 10)
      countParams.push(id)
      queryParams.push(id)
    }

    /* ── 我的评价：按当前登录用户过滤 ── */
    if (mine === '1') {
      if (!req.user) {
        return res.status(401).json({ code: 401, data: null, message: '请先登录' })
      }
      if (countWhere) {
        countWhere += ' AND user_id = ?'
        queryWhere += ' AND r.user_id = ?'
      } else {
        countWhere = 'WHERE user_id = ?'
        queryWhere = 'WHERE r.user_id = ?'
      }
      countParams.push(req.user.userId)
      queryParams.push(req.user.userId)
    }

    /* ── Count total ── */
    const countResult = db.exec(
      `SELECT COUNT(*) AS total FROM reviews ${countWhere}`,
      countParams
    )
    const total = countResult[0].values[0][0]

    /* ── Query reviews with username ── */
    const querySql = `
      SELECT r.*, COALESCE(u.username, '用户') AS username
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      ${queryWhere}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `
    const queryStmt = db.prepare(querySql)
    queryStmt.bind([...queryParams, limitNum, offset])

    const reviews = []
    while (queryStmt.step()) {
      reviews.push(queryStmt.getAsObject())
    }
    queryStmt.free()

    res.json({
      code: 200,
      data: { reviews, total, page: pageNum, limit: limitNum },
      message: 'success',
    })
  } catch (err) {
    console.error('查询评价列表失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   2. GET /:id —— 获取单条评价详情
   ══════════════════════════════════════════════ */
router.get('/:id', (req, res) => {
  try {
    const db = req.app.get('db')
    const id = parseInt(req.params.id, 10)
    const review = findReviewById(db, id)

    if (!review) {
      return res.status(404).json({ code: 404, data: null, message: '评价不存在' })
    }

    res.json({ code: 200, data: review, message: 'success' })
  } catch (err) {
    console.error('查询评价详情失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   3. POST / —— 提交新评价（需登录）
   ══════════════════════════════════════════════ */
router.post('/', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const { canteen_id, content, rating } = req.body

    /* ── Validation ── */
    if (!canteen_id) {
      return res.status(400).json({ code: 400, data: null, message: 'canteen_id 必填' })
    }
    if (!content || typeof content !== 'string' || content.length < 1 || content.length > 500) {
      return res.status(400).json({ code: 400, data: null, message: 'content 必填，1-500字' })
    }
    if (rating === undefined || rating === null || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ code: 400, data: null, message: 'rating 必填，1-5的整数' })
    }

    /* ── Insert ── */
    const user_id = req.user.userId
    const created_at = new Date().toISOString()

    const insertStmt = db.prepare(
      'INSERT INTO reviews (canteen_id, user_id, content, rating, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    insertStmt.run([canteen_id, user_id, content, rating, created_at])
    insertStmt.free()

    /* ── Fetch the newly created record ── */
    const lastIdResult = db.exec('SELECT last_insert_rowid() AS id')
    const newId = lastIdResult[0].values[0][0]
    const newReview = findReviewById(db, newId)

    /* ── Persist to disk ── */
    const { saveDatabase } = require('../database/connection')
    saveDatabase()

    res.status(201).json({ code: 201, data: newReview, message: '评价成功' })
  } catch (err) {
    console.error('提交评价失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   4. PUT /:id —— 修改评价（需登录）
   ══════════════════════════════════════════════ */
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const id = parseInt(req.params.id, 10)
    const { content, rating } = req.body

    /* ── Check existence ── */
    const existing = findReviewById(db, id)
    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '评价不存在' })
    }

    /* ── Check permission ── */
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权修改此评价' })
    }

    /* ── Validate and build SET clause ── */
    const setClauses = []
    const params = []

    if (content !== undefined) {
      if (typeof content !== 'string' || content.length < 1 || content.length > 500) {
        return res.status(400).json({ code: 400, data: null, message: 'content 1-500字' })
      }
      setClauses.push('content = ?')
      params.push(content)
    }

    if (rating !== undefined) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ code: 400, data: null, message: 'rating 1-5的整数' })
      }
      setClauses.push('rating = ?')
      params.push(rating)
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '没有需要更新的字段' })
    }

    /* ── Update ── */
    params.push(id)
    const updateStmt = db.prepare(
      `UPDATE reviews SET ${setClauses.join(', ')} WHERE id = ?`
    )
    updateStmt.run(params)
    updateStmt.free()

    /* ── Fetch updated record ── */
    const updated = findReviewById(db, id)

    /* ── Persist to disk ── */
    const { saveDatabase } = require('../database/connection')
    saveDatabase()

    res.json({ code: 200, data: updated, message: '修改成功' })
  } catch (err) {
    console.error('修改评价失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   5. DELETE /:id —— 删除评价（需登录）
   ══════════════════════════════════════════════ */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const id = parseInt(req.params.id, 10)

    /* ── Check existence ── */
    const existing = findReviewById(db, id)
    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '评价不存在' })
    }

    /* ── Check permission ── */
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权删除此评价' })
    }

    /* ── Delete ── */
    const deleteStmt = db.prepare('DELETE FROM reviews WHERE id = ?')
    deleteStmt.run([id])
    deleteStmt.free()

    /* ── Persist to disk ── */
    const { saveDatabase } = require('../database/connection')
    saveDatabase()

    res.json({ code: 200, data: null, message: '删除成功' })
  } catch (err) {
    console.error('删除评价失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

module.exports = router