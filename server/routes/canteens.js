const express = require('express')
const router = express.Router()
const { getConnection } = require('../database/connection')

/**
 * Convert sql.js exec result to an array of plain objects.
 * @param {import('sql.js').QueryExecResult} result
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

/* GET /api/canteens */
router.get('/', async (_req, res) => {
  try {
    const db = await getConnection()
    const result = db.exec('SELECT * FROM canteens')
    const rows = rowsToObjects(result[0])

    // Parse tags from JSON string to array
    const data = rows.map((row) => ({
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
    }))

    res.json({ code: 200, data, message: 'success' })
  } catch (err) {
    console.error('数据库查询失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

module.exports = router