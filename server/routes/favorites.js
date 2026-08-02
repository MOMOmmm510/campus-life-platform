const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const { saveDatabase } = require('../database/connection')

const router = express.Router()

function getFavoriteIds(db, userId) {
  const stmt = db.prepare('SELECT item_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC')
  stmt.bind([userId])

  const ids = []
  while (stmt.step()) {
    ids.push(stmt.getAsObject().item_id)
  }
  stmt.free()
  return ids
}

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const itemIds = getFavoriteIds(db, req.user.userId)
    res.json({ code: 200, data: { itemIds }, message: 'success' })
  } catch (err) {
    console.error('查询收藏失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

router.post('/:itemId', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const userId = req.user.userId
    const itemId = parseInt(req.params.itemId, 10)

    const itemStmt = db.prepare('SELECT id FROM items WHERE id = ?')
    itemStmt.bind([itemId])
    const itemExists = itemStmt.step()
    itemStmt.free()

    if (!itemExists) {
      return res.status(404).json({ code: 404, data: null, message: '商品不存在' })
    }

    const insertStmt = db.prepare(
      'INSERT OR IGNORE INTO favorites (user_id, item_id, created_at) VALUES (?, ?, ?)'
    )
    insertStmt.run([userId, itemId, new Date().toISOString()])
    insertStmt.free()
    saveDatabase()

    res.status(201).json({
      code: 201,
      data: { itemIds: getFavoriteIds(db, userId) },
      message: '收藏成功',
    })
  } catch (err) {
    console.error('收藏商品失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

router.delete('/:itemId', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const userId = req.user.userId
    const itemId = parseInt(req.params.itemId, 10)

    const deleteStmt = db.prepare('DELETE FROM favorites WHERE user_id = ? AND item_id = ?')
    deleteStmt.run([userId, itemId])
    deleteStmt.free()
    saveDatabase()

    res.json({
      code: 200,
      data: { itemIds: getFavoriteIds(db, userId) },
      message: '取消收藏成功',
    })
  } catch (err) {
    console.error('取消收藏失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

module.exports = router
