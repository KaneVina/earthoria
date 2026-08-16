const { formatResponse } = require('../utils/helpers')
const { getChatReply } = require('../services/aiChatService')

const MAX_MESSAGE_LEN = 500
const MAX_HISTORY_ITEMS = 22

const sendMessage = async (req, res) => {
  try {
    const { message, history } = req.body || {}

    if (typeof message !== 'string' || !message.trim()) {
      return formatResponse(res, 400, 'Nội dung tin nhắn không hợp lệ')
    }
    if (message.length > MAX_MESSAGE_LEN) {
      return formatResponse(res, 400, `Tin nhắn quá dài (tối đa ${MAX_MESSAGE_LEN} ký tự)`)
    }
    if (history !== undefined) {
      if (!Array.isArray(history) || history.length > MAX_HISTORY_ITEMS) {
        return formatResponse(res, 400, 'Lịch sử hội thoại không hợp lệ')
      }
      for (const item of history) {
        if (
          !item ||
          typeof item.content !== 'string' ||
          item.content.length > MAX_MESSAGE_LEN ||
          !['user', 'assistant'].includes(item.role)
        ) {
          return formatResponse(res, 400, 'Lịch sử hội thoại không hợp lệ')
        }
      }
    }

    const reply = await getChatReply({ message, history })
    return formatResponse(res, 200, 'OK', { reply })
  } catch (err) {
    if (err.code === 'CONFIG_MISSING') {
      console.error('[aiChat] Missing server config:', err.message)
      return formatResponse(res, 503, 'Trợ lý AI đang tạm gián đoạn, vui lòng thử lại sau.')
    }
    if (err.name === 'AbortError') {
      return formatResponse(res, 504, 'Kết nối AI mất quá nhiều thời gian, vui lòng thử lại.')
    }
    console.error('[aiChat] Error:', err.message)
    return formatResponse(res, 502, 'Không thể lấy phản hồi từ trợ lý AI lúc này, vui lòng thử lại sau.')
  }
}

module.exports = { sendMessage }