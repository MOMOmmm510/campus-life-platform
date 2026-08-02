const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'campus.db')

let db = null

/**
 * Get the singleton database connection.
 * If the database file exists, load it from disk; otherwise create a new one.
 * @returns {Promise<import('sql.js').Database>}
 */
async function getConnection() {
  if (db) return db

  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  return db
}

/**
 * Persist the current in-memory database to disk.
 */
function saveDatabase() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

/**
 * Close the database connection and save changes.
 */
function closeConnection() {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}

module.exports = { getConnection, saveDatabase, closeConnection }