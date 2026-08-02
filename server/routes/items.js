const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const router = express.Router()

const VALID_CATEGORIES = ['教材', '电子', '生活', '其他']
const VALID_STATUSES = ['在售', '已售出']

/**
 * Fetch a single item by id using a prepared statement,
 * with a left join to get the publisher's username.
 * @param {import('sql.js').Database} db
 * @param {number} id
 * @returns {Record<string, any> | null}
 */
function findItemById(db, id) {
  const stmt = db.prepare(`
    SELECT i.*, COALESCE(u.username, '用户') AS username
    FROM items i
    LEFT JOIN users u ON i.user_id = u.id
    WHERE i.id = ?
  `)
  stmt.bind([id])
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()

    // Parse images JSON string → array
    if (typeof row.images === 'string') {
      try { row.images = JSON.parse(row.images) } catch { row.images = [] }
    }

    return row
  }
  stmt.free()
  return null
}

/* ══════════════════════════════════════════════
   1. GET / —— 获取商品列表（搜索 & 筛选 & 分页）
   ══════════════════════════════════════════════ */
router.get('/', (req, res, next) => {
  /* 访问 mine=1 时先解析登录态（解析失败也继续走 401 逻辑） */
  if (req.query.mine === '1') {
    return authMiddleware(req, res, next)
  }
  next()
}, (req, res) => {
  try {
    const db = req.app.get('db')
    const { keyword, category, status = '在售', page = '1', limit = '10', mine } = req.query
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)
    const offset = (pageNum - 1) * limitNum

    /* ── Build WHERE clause ── */
    const whereClauses = []
    const params = []

    if (status && VALID_STATUSES.includes(status)) {
      whereClauses.push('i.status = ?')
      params.push(status)
    } else {
      whereClauses.push("i.status = '在售'")
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      whereClauses.push('i.category = ?')
      params.push(category)
    }

    if (keyword && keyword.trim()) {
      whereClauses.push('(i.title LIKE ? OR i.description LIKE ?)')
      const kw = `%${keyword.trim()}%`
      params.push(kw, kw)
    }

    /* ── 我的发布：按当前登录用户过滤 ── */
    if (mine === '1') {
      if (!req.user) {
        return res.status(401).json({ code: 401, data: null, message: '请先登录' })
      }
      whereClauses.push('i.user_id = ?')
      params.push(req.user.userId)
      /* 我的发布不限制状态 */
      const statusIdx = whereClauses.findIndex((w) => w.includes('i.status'))
      if (statusIdx >= 0) {
        whereClauses.splice(statusIdx, 1)
        params.splice(statusIdx, 1)
      }
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

    /* ── Count total ── */
    const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM items i ${whereSQL}`)
    countStmt.bind(params)
    let total = 0
    if (countStmt.step()) {
      total = countStmt.getAsObject().total
    }
    countStmt.free()

    /* ── Query items with username ── */
    const querySql = `
      SELECT i.*, COALESCE(u.username, '用户') AS username
      FROM items i
      LEFT JOIN users u ON i.user_id = u.id
      ${whereSQL}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `
    const queryStmt = db.prepare(querySql)
    queryStmt.bind([...params, limitNum, offset])

    const items = []
    while (queryStmt.step()) {
      const row = queryStmt.getAsObject()
      // Parse images JSON string → array
      if (typeof row.images === 'string') {
        try { row.images = JSON.parse(row.images) } catch { row.images = [] }
      }
      items.push(row)
    }
    queryStmt.free()

    res.json({
      code: 200,
      data: { items, total, page: pageNum, limit: limitNum },
      message: 'success',
    })
  } catch (err) {
    console.error('查询商品列表失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})
/* ══════════════════════════════════════════════
   2. GET /:id —— 获取商品详情
   ══════════════════════════════════════════════ */
router.get('/:id', (req, res) => {
  try {
    const db = req.app.get('db')
    const id = parseInt(req.params.id, 10)
    const item = findItemById(db, id)

    if (!item) {
      return res.status(404).json({ code: 404, data: null, message: '商品不存在' })
    }

    res.json({ code: 200, data: item, message: 'success' })
  } catch (err) {
    console.error('查询商品详情失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   3. POST / —— 发布新商品（需登录）
   ══════════════════════════════════════════════ */
router.post('/', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const { title, description, price, category, images, contact } = req.body

    /* ── Validation ── */
    if (!title || typeof title !== 'string' || title.length < 2 || title.length > 30) {
      return res.status(400).json({ code: 400, data: null, message: 'title 必填，2-30字' })
    }
    if (price === undefined || price === null || Number(price) <= 0) {
      return res.status(400).json({ code: 400, data: null, message: 'price 必填，大于0' })
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ code: 400, data: null, message: 'category 必填，须为教材/电子/生活/其他之一' })
    }

    /* ── Insert ── */
    const user_id = req.user.userId
    const created_at = new Date().toISOString()
    const imagesStr = Array.isArray(images) ? JSON.stringify(images) : (images || '[]')
    const descStr = description || ''
    const contactStr = contact || ''

    const insertStmt = db.prepare(`
      INSERT INTO items (title, description, price, category, images, contact, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertStmt.run([title, descStr, Number(price), category, imagesStr, contactStr, user_id, created_at])
    insertStmt.free()

    /* ── Fetch newly created record ── */
    const lastIdResult = db.exec('SELECT last_insert_rowid() AS id')
    const newId = lastIdResult[0].values[0][0]
    const newItem = findItemById(db, newId)

    /* ── Persist to disk ── */
    const { saveDatabase } = require('../database/connection')
    saveDatabase()

    res.status(201).json({ code: 201, data: newItem, message: '发布成功' })
  } catch (err) {
    console.error('发布商品失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   4. PUT /:id —— 修改商品（需登录）
   ══════════════════════════════════════════════ */
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const id = parseInt(req.params.id, 10)
    const { title, description, price, category, status, images, contact } = req.body

    /* ── Check existence ── */
    const existing = findItemById(db, id)
    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '商品不存在' })
    }

    /* ── Check permission ── */
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权修改此商品' })
    }

    /* ── Validate and build SET clause ── */
    const setClauses = []
    const params = []

    if (title !== undefined) {
      if (typeof title !== 'string' || title.length < 2 || title.length > 30) {
        return res.status(400).json({ code: 400, data: null, message: 'title 2-30字' })
      }
      setClauses.push('title = ?')
      params.push(title)
    }

    if (description !== undefined) {
      setClauses.push('description = ?')
      params.push(description)
    }

    if (price !== undefined) {
      if (Number(price) <= 0) {
        return res.status(400).json({ code: 400, data: null, message: 'price 须大于0' })
      }
      setClauses.push('price = ?')
      params.push(Number(price))
    }

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ code: 400, data: null, message: 'category 须为教材/电子/生活/其他之一' })
      }
      setClauses.push('category = ?')
      params.push(category)
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ code: 400, data: null, message: 'status 须为在售/已售出之一' })
      }
      setClauses.push('status = ?')
      params.push(status)
    }

    if (images !== undefined) {
      setClauses.push('images = ?')
      params.push(Array.isArray(images) ? JSON.stringify(images) : images)
    }

    if (contact !== undefined) {
      setClauses.push('contact = ?')
      params.push(contact)
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '没有需要更新的字段' })
    }

    /* ── Update ── */
    params.push(id)
    const updateStmt = db.prepare(
      `UPDATE items SET ${setClauses.join(', ')} WHERE id = ?`
    )
    updateStmt.run(params)
    updateStmt.free()

    /* ── Fetch updated record ── */
    const updated = findItemById(db, id)

    /* ── Persist to disk ── */
    const { saveDatabase } = require('../database/connection')
    saveDatabase()

    res.json({ code: 200, data: updated, message: '修改成功' })
  } catch (err) {
    console.error('修改商品失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   5. DELETE /:id —— 下架商品（需登录，软删除）
   ══════════════════════════════════════════════ */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const id = parseInt(req.params.id, 10)

    /* ── Check existence ── */
    const existing = findItemById(db, id)
    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '商品不存在' })
    }

    /* ── Check permission ── */
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权下架此商品' })
    }

    /* ── Soft delete: set status to 已售出 ── */
    const deleteStmt = db.prepare("UPDATE items SET status = '已售出' WHERE id = ?")
    deleteStmt.run([id])
    deleteStmt.free()

    /* ── Persist to disk ── */
    const { saveDatabase } = require('../database/connection')
    saveDatabase()

    res.json({ code: 200, data: null, message: '下架成功' })
  } catch (err) {
    console.error('下架商品失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

module.exports = router