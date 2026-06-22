import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, label: 'Email' },
  { id: 2, label: 'Xác thực' },
  { id: 3, label: 'Mật khẩu mới' },
]

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const [showPw, setShowPw] = useState({ new: false, confirm: false })
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [strength, setStrength] = useState(0)
  const [errors, setErrors] = useState({})
  const otpRefs = useRef([])

  // ── Resend OTP timer ──
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setInterval(() => setResendTimer(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendTimer])

  // ════════ Step 1: Send OTP ════════
  const sendOtpMutation = useMutation({
    mutationFn: (data) => authService.forgotPassword(data),
    onSuccess: () => {
      toast.success('Mã xác thực đã được gửi đến email của bạn!')
      setStep(2)
      setResendTimer(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Không tìm thấy tài khoản với email này.'
      setErrors({ email: msg })
      toast.error(msg)
    },
  })

  const handleSendOtp = (e) => {
    e.preventDefault()
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email.trim())) {
      setErrors({ email: 'Email không hợp lệ.' })
      return
    }
    setErrors({})
    sendOtpMutation.mutate({ email: email.trim() })
  }

  const handleResend = () => {
    if (resendTimer > 0) return
    sendOtpMutation.mutate({ email: email.trim() })
  }

  // ════════ Step 2: Verify OTP ════════
  const verifyOtpMutation = useMutation({
    mutationFn: (data) => authService.verifyOtp(data),
    onSuccess: () => {
      toast.success('Xác thực thành công!')
      setStep(3)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.'
      setErrors({ otp: msg })
      toast.error(msg)
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    },
  })

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    setErrors(e => ({ ...e, otp: null }))
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 6) {
      verifyOtpMutation.mutate({ email: email.trim(), otp: next.join('') })
    }
  }

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
    setOtp(next)
    if (pasted.length === 6) verifyOtpMutation.mutate({ email: email.trim(), otp: pasted })
    else otpRefs.current[pasted.length]?.focus()
  }

  // ════════ Step 3: Reset password ════════
  const checkStrength = (val) => {
    let score = 0
    if (val.length >= 8) score++
    if (/[A-Z]/.test(val)) score++
    if (/[0-9]/.test(val)) score++
    if (/[^A-Za-z0-9]/.test(val)) score++
    return score
  }

  const handlePwChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (field === 'newPassword') setStrength(checkStrength(val))
    setErrors(e => ({ ...e, [field]: null }))
  }

  const resetMutation = useMutation({
    mutationFn: (data) => authService.resetPassword(data),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công!')
      setTimeout(() => navigate('/login'), 1200)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.'
      toast.error(msg)
    },
  })

  const handleReset = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (form.newPassword.length < 8) newErrors.newPassword = 'Mật khẩu tối thiểu 8 ký tự.'
    if (form.newPassword !== form.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
    resetMutation.mutate({ email: email.trim(), otp: otp.join(''), newPassword: form.newPassword })
  }

  const strengthMeta = [
    { label: '', color: 'var(--border)' },
    { label: 'Yếu', color: '#c97a6e' },
    { label: 'Trung Bình', color: '#b8862e' },
    { label: 'Tốt', color: 'var(--sage)' },
    { label: 'Mạnh', color: 'var(--gold)' },
  ][strength]

  return (
    <main style={S.page}>

      {/* ══ LEFT — Visual panel ══ */}
      <div style={S.visual}>
        <div style={S.visualBg} />
        <div style={S.visualGrid} />
        <div style={{ ...S.orb, width: '240px', height: '240px', background: 'rgba(74,158,63,0.12)', top: '12%', right: '-70px', animation: 'orbFloat 9s ease-in-out infinite' }} />
        <div style={{ ...S.orb, width: '170px', height: '170px', background: 'rgba(45,122,110,0.15)', bottom: '20%', left: '-50px', animation: 'orbFloat 11s ease-in-out infinite -3s' }} />

        <Link to="/" style={S.logo}>
          <div style={S.logoMark}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 8L8 14L2 8L8 2Z" stroke="#4a9e3f" strokeWidth="1" fill="none"/>
              <path d="M8 5L11 8L8 11L5 8L8 5Z" fill="#4a9e3f"/>
            </svg>
          </div>
          <span style={S.logoWord}>EARTHORIA</span>
        </Link>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={S.tagline}>
            <div style={S.taglineLine} />
            Khôi phục truy cập
          </div>
          <h2 style={S.headline}>
            Đừng lo lắng,<br/>chúng tôi sẽ<br/><em>giúp bạn</em>
          </h2>
          <p style={S.sub}>
            Mật khẩu chỉ là một con số. Hành trình khám phá tri thức của bạn vẫn đang chờ — chỉ vài bước nữa thôi.
          </p>

          {/* Steps progress (visual side) */}
          <div style={S.stepsList}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={S.stepRow}>
                <div style={{ ...S.stepCircle, background: step > s.id ? 'var(--gold)' : step === s.id ? 'rgba(74,158,63,0.15)' : 'transparent', borderColor: step >= s.id ? 'var(--gold)' : 'rgba(255,255,255,0.15)' }}>
                  {step > s.id ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0a0e0c" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', color: step >= s.id ? 'var(--gold)' : 'rgba(255,255,255,0.3)' }}>{s.id}</span>
                  )}
                </div>
                <span style={{ fontSize: '13px', color: step >= s.id ? 'rgba(250,248,243,0.85)' : 'rgba(255,255,255,0.3)', fontWeight: step === s.id ? 500 : 300, transition: 'all 0.3s' }}>{s.label}</span>
                {i < STEPS.length - 1 && <div style={{ ...S.stepConnector, background: step > s.id ? 'var(--gold)' : 'rgba(255,255,255,0.1)' }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={S.quote}>
          <p style={S.quoteText}>An toàn thông tin là nền tảng của niềm tin — chúng tôi luôn xác thực cẩn trọng từng bước khôi phục tài khoản.</p>
          <p style={S.quoteAuthor}>Đội Ngũ Earthoria</p>
        </div>
      </div>

      {/* ══ RIGHT — Form panel ══ */}
      <div style={S.formPanel}>
        <div style={S.formWrap}>

          {/* Mobile step indicator */}
          <div style={S.mobileSteps}>
            {STEPS.map(s => (
              <div key={s.id} style={{ flex: 1, height: '2px', background: step >= s.id ? 'var(--gold)' : 'var(--border)', transition: 'background 0.4s' }} />
            ))}
          </div>

          {/* ─── STEP 1: Email ─── */}
          {step === 1 && (
            <div style={S.stepFade} key="step1">
              <div style={S.formHeader}>
                <div style={S.eyebrowRow}>
                  <div style={S.eyebrowLine} />
                  <span style={S.eyebrowText}>Bước 1 / 3</span>
                </div>
                <h1 style={S.title}>Quên<br/><em style={S.em}>Mật Khẩu</em>?</h1>
                <p style={S.subtitle}>Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác thực để giúp bạn lấy lại quyền truy cập.</p>
              </div>

              <form onSubmit={handleSendOtp}>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Địa Chỉ Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors({}) }}
                    placeholder="ten@example.com"
                    autoFocus
                    style={{ ...S.input, borderColor: errors.email ? '#b25450' : 'var(--border)' }}
                    onFocus={e => { if (!errors.email) { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(74,158,63,0.08)' } }}
                    onBlur={e => { if (!errors.email) { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' } }}
                  />
                  {errors.email && <div style={S.errorText}>{errors.email}</div>}
                </div>

                <button type="submit" disabled={sendOtpMutation.isPending} style={S.submitBtn}
                  onMouseEnter={e => { if (!sendOtpMutation.isPending) { e.currentTarget.style.background = 'var(--forest-mid)'; e.currentTarget.style.gap = '20px' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--forest)'; e.currentTarget.style.gap = '12px' }}
                >
                  {sendOtpMutation.isPending ? 'Đang gửi...' : <>Gửi Mã Xác Thực
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </>}
                </button>
              </form>

              <p style={S.backLink}>
                Đã nhớ mật khẩu? <Link to="/login" style={S.linkAccent}>Đăng nhập</Link>
              </p>
            </div>
          )}

          {/* ─── STEP 2: OTP ─── */}
          {step === 2 && (
            <div style={S.stepFade} key="step2">
              <div style={S.formHeader}>
                <div style={S.eyebrowRow}>
                  <div style={S.eyebrowLine} />
                  <span style={S.eyebrowText}>Bước 2 / 3</span>
                </div>
                <h1 style={S.title}>Nhập Mã<br/><em style={S.em}>Xác Thực</em></h1>
                <p style={S.subtitle}>
                  Chúng tôi đã gửi mã 6 chữ số đến <strong style={{ color: 'var(--forest)', fontWeight: 500 }}>{email}</strong>
                </p>
              </div>

              <div style={S.otpRow} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{ ...S.otpInput, borderColor: errors.otp ? '#b25450' : digit ? 'var(--gold)' : 'var(--border)' }}
                  />
                ))}
              </div>
              {errors.otp && <div style={{ ...S.errorText, textAlign: 'center', marginBottom: '8px' }}>{errors.otp}</div>}
              {verifyOtpMutation.isPending && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--gold)', marginBottom: '8px' }}>Đang xác thực...</div>
              )}

              <div style={S.resendRow}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Không nhận được mã?</span>
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  style={{ ...S.resendBtn, color: resendTimer > 0 ? 'var(--mist)' : 'var(--gold)', cursor: resendTimer > 0 ? 'default' : 'pointer' }}
                >
                  {resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : 'Gửi lại mã'}
                </button>
              </div>

              <button onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']) }} style={S.changeEmailBtn}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Đổi địa chỉ email khác
              </button>
            </div>
          )}

          {/* ─── STEP 3: New password ─── */}
          {step === 3 && (
            <div style={S.stepFade} key="step3">
              <div style={S.formHeader}>
                <div style={S.eyebrowRow}>
                  <div style={S.eyebrowLine} />
                  <span style={S.eyebrowText}>Bước 3 / 3</span>
                </div>
                <h1 style={S.title}>Tạo Mật Khẩu<br/><em style={S.em}>Mới</em></h1>
                <p style={S.subtitle}>Chọn một mật khẩu mạnh mà bạn chưa từng sử dụng ở nơi khác.</p>
              </div>

              <form onSubmit={handleReset}>
                <div style={S.fieldGroup}>
                  <PasswordField label="Mật Khẩu Mới" value={form.newPassword} onChange={v => handlePwChange('newPassword', v)} show={showPw.new} toggle={() => setShowPw(s => ({ ...s, new: !s.new }))} error={errors.newPassword} placeholder="Tối thiểu 8 ký tự" />
                  {form.newPassword && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} style={{ height: '2.5px', borderRadius: '2px', background: i < strength ? strengthMeta.color : 'var(--border)', transition: 'background 0.3s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: strengthMeta.color, marginTop: '7px', fontWeight: 500 }}>{strengthMeta.label}</div>
                    </div>
                  )}
                </div>

                <div style={S.fieldGroup}>
                  <PasswordField label="Xác Nhận Mật Khẩu" value={form.confirmPassword} onChange={v => handlePwChange('confirmPassword', v)} show={showPw.confirm} toggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} error={errors.confirmPassword} placeholder="Nhập lại mật khẩu mới" />
                </div>

                <button type="submit" disabled={resetMutation.isPending} style={S.submitBtn}
                  onMouseEnter={e => { if (!resetMutation.isPending) { e.currentTarget.style.background = 'var(--forest-mid)'; e.currentTarget.style.gap = '20px' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--forest)'; e.currentTarget.style.gap = '12px' }}
                >
                  {resetMutation.isPending ? 'Đang cập nhật...' : <>Đặt Lại Mật Khẩu
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </>}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes orbFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-24px); } }
        @keyframes stepFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 960px) {
          .fp-visual { display: none !important; }
        }
      `}</style>
    </main>
  )
}

function PasswordField({ label, value, onChange, show, toggle, error, placeholder }) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...S.input, paddingRight: '48px', borderColor: error ? '#b25450' : 'var(--border)' }}
          onFocus={e => { if (!error) { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(74,158,63,0.08)' } }}
          onBlur={e => { if (!error) { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' } }}
        />
        <button type="button" onClick={toggle} style={S.pwToggle}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--mist)'}
        >
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
      {error && <div style={S.errorText}>{error}</div>}
    </div>
  )
}

// ════════════════════ STYLES ════════════════════
const S = {
  em: { fontStyle: 'italic', color: 'var(--gold)' },

  page: { minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: "'Be Vietnam Pro', sans-serif" },

  // ── Visual panel ──
  visual: { background: 'var(--forest)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 60px', className: 'fp-visual' },
  visualBg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 20%, rgba(74,158,63,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(45,122,110,0.22) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(13,43,30,0.6) 0%, transparent 70%)', pointerEvents: 'none' },
  visualGrid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' },
  orb: { position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' },

  logo: { display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', position: 'relative', zIndex: 2 },
  logoMark: { width: '36px', height: '36px', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)', flexShrink: 0 },
  logoWord: { fontFamily: "'Playfair Display', serif", fontSize: '14px', letterSpacing: '0.22em', color: 'var(--ivory)', fontWeight: 400 },

  tagline: { display: 'flex', alignItems: 'center', gap: '14px', fontSize: '9px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '24px' },
  taglineLine: { width: '32px', height: '0.5px', background: 'var(--gold)' },
  headline: { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(34px, 3.2vw, 52px)', fontWeight: 300, color: 'var(--ivory)', lineHeight: 1.12, marginBottom: '24px', letterSpacing: '-0.01em' },
  sub: { fontSize: '14px', lineHeight: 1.8, color: 'rgba(250,248,243,0.55)', maxWidth: '380px', fontWeight: 300, marginBottom: '48px' },

  stepsList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  stepRow: { display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', paddingBottom: '28px' },
  stepCircle: { width: '26px', height: '26px', borderRadius: '50%', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.4s', zIndex: 1 },
  stepConnector: { position: 'absolute', left: '13px', top: '26px', width: '1px', height: '28px', transition: 'background 0.4s' },

  quote: { position: 'relative', padding: '24px 28px', border: '0.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', zIndex: 2 },
  quoteText: { fontFamily: "'Playfair Display', serif", fontSize: '14px', fontStyle: 'italic', color: 'rgba(250,248,243,0.65)', lineHeight: 1.7, marginBottom: '12px' },
  quoteAuthor: { fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.8 },

  // ── Form panel ──
  formPanel: { background: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', position: 'relative' },
  formWrap: { width: '100%', maxWidth: '420px' },
  mobileSteps: { display: 'flex', gap: '6px', marginBottom: '36px' },

  stepFade: { animation: 'stepFadeIn 0.4s cubic-bezier(0.16,1,0.3,1)' },
  formHeader: { marginBottom: '36px' },
  eyebrowRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  eyebrowLine: { width: '28px', height: '0.5px', background: 'var(--gold)' },
  eyebrowText: { fontSize: '9px', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 400 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 2.8vw, 42px)', fontWeight: 300, color: 'var(--forest)', lineHeight: 1.12, marginBottom: '14px', letterSpacing: '-0.01em' },
  subtitle: { fontSize: '13px', lineHeight: 1.8, color: 'var(--text-muted)', fontWeight: 300 },

  fieldGroup: { marginBottom: '24px' },
  label: { display: 'block', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '9px', fontWeight: 400 },
  input: { width: '100%', padding: '14px 18px', border: '0.5px solid var(--border)', background: 'var(--white)', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '14px', color: 'var(--text-body)', outline: 'none', transition: 'all 0.25s' },
  errorText: { fontSize: '10px', color: '#b25450', marginTop: '6px', letterSpacing: '0.03em' },

  pwToggle: { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mist)', display: 'flex', transition: 'color 0.2s' },

  submitBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px 32px', background: 'var(--forest)', color: 'var(--ivory)', border: 'none', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.35s' },

  backLink: { marginTop: '28px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 300 },
  linkAccent: { color: 'var(--gold)', textDecoration: 'none', fontWeight: 500, letterSpacing: '0.02em' },

  // OTP
  otpRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  otpInput: { width: '100%', height: '58px', textAlign: 'center', fontFamily: "'Playfair Display', serif", fontSize: '24px', color: 'var(--forest)', border: '0.5px solid var(--border)', background: 'var(--white)', outline: 'none', transition: 'all 0.25s' },
  resendRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' },
  resendBtn: { background: 'none', border: 'none', fontSize: '12px', fontWeight: 500, letterSpacing: '0.02em' },
  changeEmailBtn: { display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', fontFamily: "'Be Vietnam Pro', sans-serif" },
}