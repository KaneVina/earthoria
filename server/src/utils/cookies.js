const REFRESH_COOKIE_NAME = 'refreshToken'
const REFRESH_COOKIE_PATH = '/'

function setRefreshCookie(res, rawToken, expiresAt) {
  res.cookie(REFRESH_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: expiresAt,
    path: REFRESH_COOKIE_PATH,
  })
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: REFRESH_COOKIE_PATH,
  })
}

module.exports = { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie }