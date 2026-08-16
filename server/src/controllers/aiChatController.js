const { formatResponse } = require('../utils/helpers')
const { runChatTurn } = require('../services/aiChatService')

const MAX_MESSAGE_LEN = 500
const MAX_HISTORY_ITEMS = 22

function validateBody(body) {
  const { message, history } = body || {}

  if (typeof message !== 'string' || !message.trim()) {
    return 'Nội dung tin nhắn không hợp lệ'
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return `Tin nhắn quá dài (tối đa ${MAX_MESSAGE_LEN} ký tự)`
  }
  if (history !== undefined) {
    if (!Array.isArray(history) || history.length > MAX_HISTORY_ITEMS) {
      return 'Lịch sử hội thoại không hợp lệ'
    }
    for (const item of history) {
      if (
        !item ||
        typeof item.content !== 'string' ||
        item.content.length > MAX_MESSAGE_LEN ||
        !['user', 'assistant'].includes(item.role)
      ) {
        return 'Lịch sử hội thoại không hợp lệ'
      }
    }
  }
  return null
}

const sendMessage = async (req, res) => {
  const validationError = validateBody(req.body)
  if (validationError) return formatResponse(res, 400, validationError)

  const { message, history } = req.body

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // tắt buffering ở nginx nếu có, để token ra ngay
  })

  const emit = (event, data) => {
    if (res.writableEnded) return
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  // Hủy gọi Groq giữa chừng nếu khách đóng tab/mất kết nối, tránh tốn quota vô ích.
  const controller = new AbortController()
  req.on('close', () => controller.abort())

  try {
    const reply = await runChatTurn({
      message,
      history,
      user: req.user || null,
      emit,
      signal: controller.signal,
    })
    emit('done', { reply })
  } catch (err) {
    if (err.name === 'AbortError') {
      // Khách đã rời trang, không cần gửi gì thêm.
    } else if (err.code === 'CONFIG_MISSING') {
      console.error('[aiChat] Missing server config:', err.message)
      emit('error', { message: 'Trợ lý AI đang tạm gián đoạn, vui lòng thử lại sau.' })
    } else {
      console.error('[aiChat] Error:', err.message)
      emit('error', { message: 'Không thể lấy phản hồi từ trợ lý AI lúc này, vui lòng thử lại sau.' })
    }
  } finally {
    if (!res.writableEnded) res.end()
  }
}

module.exports = { sendMessage }