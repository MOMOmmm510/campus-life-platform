const express = require('express')
const router = express.Router()

/* ── DeepSeek API 配置 ── */
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_BASE = 'https://api.deepseek.com'

/* ══════════════════════════════════════════════
   POST /summarize-reviews —— 生成食堂评价的AI总结
   ══════════════════════════════════════════════ */
router.post('/summarize-reviews', async (req, res) => {
  try {
    const db = req.app.get('db')
    const { canteen_id } = req.body

    if (!canteen_id) {
      return res.status(400).json({ code: 400, data: null, message: 'canteen_id 必填' })
    }

    /* ── 查询该食堂最近20条评价 ── */
    const stmt = db.prepare(`
      SELECT content, rating FROM reviews
      WHERE canteen_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `)
    stmt.bind([canteen_id])

    const reviews = []
    while (stmt.step()) {
      reviews.push(stmt.getAsObject())
    }
    stmt.free()

    /* ── 无评价时直接返回 ── */
    if (reviews.length === 0) {
      return res.json({ code: 200, data: { summary: '该食堂暂无评价' }, message: 'success' })
    }

    /* ── 拼接评价文本 ── */
    const reviewText = reviews
      .map((r) => `评分${r.rating}星：${r.content}`)
      .join('\n')

    /* ── 调用 DeepSeek API ── */
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个校园生活助手。请根据以下食堂评价，用3句话总结：\n第1句：整体口碑如何（学生们普遍满意还是有怨言）\n第2句：最受欢迎或最常被提到的菜品是什么\n第3句：价格水平如何\n\n要求：\n- 每句话单独一行\n- 不要加标题和编号\n- 每句话不超过40字',
          },
          {
            role: 'user',
            content: `以下是食堂评价：\n${reviewText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('DeepSeek API 返回错误:', response.status, response.statusText)
      return res.status(500).json({ code: 500, data: null, message: 'AI服务暂时不可用，请稍后重试' })
    }

    const result = await response.json()
    const summary = result.choices?.[0]?.message?.content || ''

    res.json({ code: 200, data: { summary }, message: 'success' })
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(500).json({ code: 500, data: null, message: 'AI服务暂时不可用，请稍后重试' })
    }
    console.error('AI 总结失败:', err)
    res.status(500).json({ code: 500, data: null, message: 'AI服务暂时不可用，请稍后重试' })
  }
})

/* ══════════════════════════════════════════════
   POST /generate-description —— AI生成二手商品描述
   ══════════════════════════════════════════════ */
router.post('/generate-description', async (req, res) => {
  try {
    const { title, condition, price, usage } = req.body

    /* ── 验证必填字段 ── */
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ code: 400, data: null, message: 'title 必填' })
    }
    if (price === undefined || price === null || isNaN(Number(price))) {
      return res.status(400).json({ code: 400, data: null, message: 'price 必填且为数字' })
    }

    /* ── 组装用户输入 ── */
    const userContent = [
      `商品名称：${title.trim()}`,
      condition ? `成色：${condition}` : '',
      `售价：${Number(price)}元`,
      usage ? `使用情况：${usage}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    /* ── 调用 DeepSeek API ── */
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个校园二手交易平台的助手。请根据用户提供的商品信息，生成一段吸引人的商品描述。\n\n要求：\n- 语气活泼、亲切，符合大学生风格\n- 突出商品的核心卖点\n- 提到原价和现价的对比（如果价格合理的话）\n- 适当使用emoji\n- 长度控制在50-100字\n- 直接输出描述文案，不要加标题',
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('DeepSeek API 返回错误:', response.status, response.statusText)
      return res.status(500).json({ code: 500, data: null, message: 'AI服务暂时不可用，请稍后重试' })
    }

    const result = await response.json()
    const description = result.choices?.[0]?.message?.content || ''

    res.json({ code: 200, data: { description }, message: 'success' })
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(500).json({ code: 500, data: null, message: 'AI服务暂时不可用，请稍后重试' })
    }
    console.error('AI 生成商品描述失败:', err)
    res.status(500).json({ code: 500, data: null, message: 'AI服务暂时不可用，请稍后重试' })
  }
})

module.exports = router