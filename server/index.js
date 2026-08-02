require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { initDatabase } = require('./database/init')

const canteensRouter = require('./routes/canteens')
const itemsRouter = require('./routes/items')
const lostFoundRouter = require('./routes/lost-found')
const reviewsRouter = require('./routes/reviews')
const authRouter = require('./routes/auth')
const favoritesRouter = require('./routes/favorites')
const aiRouter = require('./routes/ai')

const app = express()

/* ── Middleware ── */
app.use(cors())
app.use(express.json())

// Logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`)
  next()
})

/* ── Routes ── */
app.use('/api/canteens', canteensRouter)
app.use('/api/items', itemsRouter)
app.use('/api/lost-found', lostFoundRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/auth', authRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/ai', aiRouter)

/* ── Start server ── */
/* Railway 部署会注入 PORT 环境变量，本地默认 3001 */
const PORT = process.env.PORT || 3001

initDatabase()
  .then((db) => {
    app.set('db', db)
    console.log('数据库初始化成功')
    app.listen(PORT, () => {
      console.log(`后端服务器运行在 http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('数据库初始化失败:', err)
  })
