const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = process.env.GROQ_URL || 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

async function groqCompleteJSON({ system, user, temperature = 0.4, maxTokens = 700 }) {
  if (!GROQ_API_KEY) {
    const err = new Error('Thiếu GROQ_API_KEY trên server')
    err.code = 'CONFIG_MISSING'
    throw err
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body?.error?.message || `Groq HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  const data = await res.json()
  const raw = data?.choices?.[0]?.message?.content || '{}'
  try {
    return JSON.parse(raw)
  } catch {
    const err = new Error('Groq trả về JSON không hợp lệ')
    err.code = 'BAD_JSON'
    throw err
  }
}

module.exports = { GROQ_API_KEY, GROQ_URL, GROQ_MODEL, groqCompleteJSON }