const { getConnection, saveDatabase, closeConnection } = require('./connection')

/**
 * Initialize the database: create tables and seed data.
 * This function is idempotent — it will not re-insert data if it already exists.
 */
async function initDatabase() {
  const db = await getConnection()

  console.log('📦 Initializing database...')

  /* ── Create tables ── */

  db.run(`
    CREATE TABLE IF NOT EXISTS canteens (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]'
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Migration: add columns if upgrading from old schema
  try { db.run("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT ''") } catch (_) {}
  try { db.run("ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'))") } catch (_) {}
  try { db.run("ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT ''") } catch (_) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      category TEXT NOT NULL CHECK(category IN ('教材', '电子', '生活', '其他')),
      images TEXT NOT NULL DEFAULT '[]',
      contact TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '在售' CHECK(status IN ('在售', '已售出')),
      user_id INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS lost_found (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('丢失', '捡到')),
      title TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      time TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      user_id INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Migration: add columns if upgrading from old schema
  try { db.run("ALTER TABLE lost_found ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1") } catch (_) {}
  try { db.run("ALTER TABLE lost_found ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'))") } catch (_) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      canteen_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL DEFAULT 1,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (canteen_id) REFERENCES canteens(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, item_id)
    )
  `)

  /* ── Seed data (only if empty) ── */

  const canteenCount = db.exec('SELECT COUNT(*) AS count FROM canteens')
  if (canteenCount.length === 0 || canteenCount[0].values[0][0] === 0) {
    console.log('  Seeding canteens...')
    const insertCanteen = db.prepare(
      'INSERT INTO canteens (id, name, location, rating, tags) VALUES (?, ?, ?, ?, ?)'
    )
    insertCanteen.run([1, '第一食堂', '东校区', 4.2, JSON.stringify(['自选', '快餐'])])
    insertCanteen.run([2, '第二食堂', '西校区', 4.0, JSON.stringify(['面食', '小炒'])])
    insertCanteen.run([3, '第三食堂', '北校区', 3.8, JSON.stringify(['麻辣烫', '盖饭'])])
    insertCanteen.run([4, '教工食堂', '中心区', 4.5, JSON.stringify(['自助', '点菜'])])
    insertCanteen.free()
  }

  const userCount = db.exec('SELECT COUNT(*) AS count FROM users')
  if (userCount.length === 0 || userCount[0].values[0][0] === 0) {
    console.log('  Seeding users...')
    const insertUser = db.prepare('INSERT INTO users (id, username, avatar) VALUES (?, ?, ?)')
    insertUser.run([1, '学长A', ''])
    insertUser.run([2, '同学B', ''])
    insertUser.run([3, '学姐C', ''])
    insertUser.run([4, '学长D', ''])
    insertUser.run([5, '同学E', ''])
    insertUser.run([6, '学姐F', ''])
    insertUser.run([7, '小明', ''])
    insertUser.run([8, '小红', ''])
    insertUser.run([9, '小刚', ''])
    insertUser.run([10, '小丽', ''])
    insertUser.run([11, '小强', ''])
    insertUser.run([12, '小芳', ''])
    insertUser.run([13, '小军', ''])
    insertUser.run([14, '小华', ''])
    insertUser.run([15, '小美', ''])
    insertUser.free()
  }

  const itemCount = db.exec('SELECT COUNT(*) AS count FROM items')
  if (itemCount.length === 0 || itemCount[0].values[0][0] === 0) {
    console.log('  Seeding items...')
    const insertItem = db.prepare(
      `INSERT INTO items (title, description, price, category, images, contact, status, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    insertItem.run(['高等数学（第七版）', '第七版，九成新，无笔记划线', 25, '教材', '[]', '微信: zhang123', '在售', 1, '2025-01-10T10:00:00.000Z'])
    insertItem.run(['机械键盘 Cherry MX', '红轴，87键，使用半年', 150, '电子', '[]', 'QQ: 12345678', '在售', 2, '2025-01-15T14:30:00.000Z'])
    insertItem.run(['台灯 LED 护眼', '三档调光，USB充电', 45, '生活', '[]', '宿舍3号楼', '在售', 3, '2025-01-20T09:00:00.000Z'])
    insertItem.run(['Python编程从入门到实践', '第2版，附赠电子资源', 30, '教材', '[]', '微信: python_fan', '在售', 4, '2025-02-01T16:00:00.000Z'])
    insertItem.run(['蓝牙耳机 AirPods', '二代，仅拆封未使用', 200, '电子', '[]', '电话: 13800138000', '在售', 5, '2025-02-10T11:00:00.000Z'])
    insertItem.run(['床上小桌板', '可折叠，带杯槽', 35, '生活', '[]', '6号楼205', '在售', 6, '2025-02-15T08:30:00.000Z'])
    insertItem.free()
  }

  const lostFoundCount = db.exec('SELECT COUNT(*) AS count FROM lost_found')
  if (lostFoundCount.length === 0 || lostFoundCount[0].values[0][0] === 0) {
    console.log('  Seeding lost_found...')
    const insertLostFound = db.prepare(
      'INSERT INTO lost_found (type, title, location, time, description, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    insertLostFound.run(['丢失', '黑色钱包', '图书馆', '2025-01-10', '内有学生证和现金', 1, '2025-01-10T10:00:00.000Z'])
    insertLostFound.run(['捡到', 'U盘 金士顿32G', '教学楼A301', '2025-01-11', '蓝色外壳', 2, '2025-01-11T14:30:00.000Z'])
    insertLostFound.run(['丢失', '校园卡', '食堂二楼', '2025-01-12', '学号2024开头', 3, '2025-01-12T08:00:00.000Z'])
    insertLostFound.run(['捡到', '雨伞 黑色折叠', '图书馆门口', '2025-01-12', '', 4, '2025-01-12T17:00:00.000Z'])
    insertLostFound.free()
  }

  const reviewCount = db.exec('SELECT COUNT(*) AS count FROM reviews')
  if (reviewCount.length === 0 || reviewCount[0].values[0][0] === 0) {
    console.log('  Seeding reviews...')
    const insertReview = db.prepare(
      'INSERT INTO reviews (canteen_id, user_id, content, rating, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    insertReview.run([1, 7, '第一食堂的红烧肉很好吃，价格实惠！', 5, '2025-03-10T12:30:00.000Z'])
    insertReview.run([1, 8, '面食窗口的牛肉面分量足，就是排队太久了。', 4, '2025-03-11T18:00:00.000Z'])
    insertReview.run([2, 9, '麻辣烫味道很正，价格也便宜，每次来都吃。', 5, '2025-03-12T12:00:00.000Z'])
    insertReview.run([2, 10, '米粉窗口的酸辣粉不错，推荐！', 4, '2025-03-13T17:30:00.000Z'])
    insertReview.run([2, 11, '小炒窗口的菜品经常换，很有新鲜感。', 5, '2025-03-14T11:45:00.000Z'])
    insertReview.run([3, 12, '自助餐种类挺多的，就是价格偏贵。', 4, '2025-03-15T18:20:00.000Z'])
    insertReview.run([3, 13, '西餐窗口的意面味道一般，有待改进。', 3, '2025-03-16T12:15:00.000Z'])
    insertReview.run([4, 14, '教工食堂的炖汤很养生，味道清淡适合我。', 4, '2025-03-17T12:10:00.000Z'])
    insertReview.run([4, 15, '小碗菜的分量刚好，不浪费，价格也合理。', 4, '2025-03-18T18:05:00.000Z'])
    insertReview.free()
  }

  /* ── Persist to disk ── */
  saveDatabase()
  console.log('✅ Database initialized successfully')

  return db
}

/* Run directly */
if (require.main === module) {
  initDatabase()
    .then(() => {
      const { closeConnection } = require('./connection')
      closeConnection()
      process.exit(0)
    })
    .catch((err) => {
      console.error('❌ Database initialization failed:', err)
      process.exit(1)
    })
}

module.exports = { initDatabase }
