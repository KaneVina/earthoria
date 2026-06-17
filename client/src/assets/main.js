// Progress bar
window.addEventListener('scroll', () => {
  const winScroll = document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  document.getElementById('progress').style.width = (winScroll / height * 100) + '%';
  const btn = document.getElementById('back-top');
  if (winScroll > 600) btn.classList.add('visible');
  else btn.classList.remove('visible');
});

// Reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('in');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Counter — chỉ chạy khi scroll tới, chạy 1 lần
function animateStat(item) {
  if (item.classList.contains('counted')) return;
  item.classList.add('counted');
  const target = +item.dataset.target;
  if (target === 0) return;
  const countEl = item.querySelector('.stat-count');
  if (!countEl) return;
  const duration = 2200;
  const start = performance.now();
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease out quart — nhanh lúc đầu, chậm dần cuối
    const ease = 1 - Math.pow(1 - progress, 4);
    const value = Math.round(ease * target);
    countEl.textContent = target >= 100
      ? value.toLocaleString('vi-VN')
      : value;
    if (progress < 1) requestAnimationFrame(update);
    else countEl.textContent = target >= 100
      ? target.toLocaleString('vi-VN')
      : target;
  }
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      // delay nhỏ để reveal animation chạy trước
      setTimeout(() => {
        e.target.querySelectorAll('.stat-item[data-target]').forEach((item, i) => {
          setTimeout(() => {
            animateStat(item);
            item.classList.add('counted'); // kích hoạt bar
          }, i * 180); // mỗi stat cách nhau 180ms — lần lượt từng cái
        });
      }, 300);
      statsObserver.unobserve(e.target); // chỉ chạy 1 lần
    }
  });
}, { threshold: 0.3 }); // cần thấy 30% section mới kích hoạt

const statsSection = document.querySelector('.stats-section');
if (statsSection) statsObserver.observe(statsSection);

// Filter pills
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

// Nav shadow on scroll
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 60) {
    nav.style.boxShadow = '0 8px 32px rgba(13,43,30,0.06)';
  } else {
    nav.style.boxShadow = 'none';
  }
});
// Fireflies in CTA
(function() {
  const section = document.getElementById('cta-section');
  if (!section) return;

  const configs = [
    { x:'8%',  y:'20%', dx1:'40px',  dy1:'-30px', dx2:'20px',  dy2:'60px',  dx3:'-30px', dy3:'20px',  dur:'7s',  opacity:'0.9' },
    { x:'15%', y:'70%', dx1:'-20px', dy1:'-50px', dx2:'50px',  dy2:'-20px', dx3:'10px',  dy3:'40px',  dur:'9s',  opacity:'0.7' },
    { x:'25%', y:'40%', dx1:'30px',  dy1:'40px',  dx2:'-40px', dy2:'20px',  dx3:'20px',  dy3:'-50px', dur:'11s', opacity:'0.85'},
    { x:'40%', y:'15%', dx1:'-50px', dy1:'30px',  dx2:'30px',  dy2:'50px',  dx3:'-20px', dy3:'-30px', dur:'8s',  opacity:'0.6' },
    { x:'55%', y:'80%', dx1:'20px',  dy1:'-60px', dx2:'-30px', dy2:'-20px', dx3:'50px',  dy3:'30px',  dur:'13s', opacity:'0.8' },
    { x:'65%', y:'30%', dx1:'-40px', dy1:'50px',  dx2:'60px',  dy2:'-30px', dx3:'-20px', dy3:'40px',  dur:'10s', opacity:'0.75'},
    { x:'75%', y:'60%', dx1:'50px',  dy1:'-40px', dx2:'-20px', dy2:'50px',  dx3:'30px',  dy3:'-20px', dur:'12s', opacity:'0.9' },
    { x:'85%', y:'25%', dx1:'-30px', dy1:'-20px', dx2:'20px',  dy2:'-50px', dx3:'-50px', dy3:'30px',  dur:'9s',  opacity:'0.65'},
    { x:'90%', y:'75%', dx1:'20px',  dy1:'30px',  dx2:'-50px', dy2:'20px',  dx3:'30px',  dy3:'-40px', dur:'14s', opacity:'0.8' },
    { x:'50%', y:'50%', dx1:'-60px', dy1:'-40px', dx2:'40px',  dy2:'-60px', dx3:'60px',  dy3:'40px',  dur:'16s', opacity:'0.5' },
    { x:'33%', y:'85%', dx1:'40px',  dy1:'-20px', dx2:'-20px', dy2:'-40px', dx3:'10px',  dy3:'30px',  dur:'11s', opacity:'0.7' },
    { x:'70%', y:'10%', dx1:'-20px', dy1:'60px',  dx2:'40px',  dy2:'20px',  dx3:'-30px', dy3:'-40px', dur:'8s',  opacity:'0.85'},
  ];

  configs.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'firefly';
    el.style.cssText = `
      --x:${c.x}; --y:${c.y};
      --dx1:${c.dx1}; --dy1:${c.dy1};
      --dx2:${c.dx2}; --dy2:${c.dy2};
      --dx3:${c.dx3}; --dy3:${c.dy3};
      --dur:${c.dur};
      --max-opacity:${c.opacity};
      animation-delay:${(i * 1.3).toFixed(1)}s;
    `;
    section.appendChild(el);
  });
})();
// Dark mode
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.toggle('dark-mode');
  localStorage.setItem('earthoria-theme', isDark ? 'dark' : 'light');
  document.getElementById('icon-sun').style.display = isDark ? 'block' : 'none';
  document.getElementById('icon-moon').style.display = isDark ? 'none' : 'block';
}

// Load saved theme
(function() {
  const saved = localStorage.getItem('earthoria-theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('icon-sun').style.display = 'block';
    document.getElementById('icon-moon').style.display = 'none';
  }
})();

// About-us value sticky number update
(function() {
  const rows = document.querySelectorAll('.about-value-row[data-val-num]');
  const stickyNum = document.getElementById('about-val-num');
  if (!rows.length || !stickyNum) return;
  const valObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const num = e.target.dataset.valNum;
        if (num) stickyNum.textContent = num;
      }
    });
  }, { threshold: 0.6 });
  rows.forEach(r => valObserver.observe(r));
})();

// Contact form submit handler
function handleFormSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit');
  const original = btn.innerHTML;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg> Đã gửi thành công!';
  btn.style.background = 'var(--forest-mid)';
  setTimeout(() => {
    btn.innerHTML = original;
    btn.style.background = '';
    e.target.reset();
  }, 3200);
}
/* ── Password show/hide ── */
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.innerHTML = isText
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
}

/* ── Password strength ── */
function checkStrength(val) {
  const segs = [
    document.getElementById('seg-1'),
    document.getElementById('seg-2'),
    document.getElementById('seg-3'),
    document.getElementById('seg-4'),
  ];
  const label = document.getElementById('strength-label');
  segs.forEach(s => s.className = 'auth-strength-seg');

  if (!val) { label.textContent = ''; return; }

  let score = 0;
  if (val.length >= 8)  score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = ['weak','fair','good','strong'];
  const labels = ['Yếu', 'Trung bình', 'Tốt', 'Mạnh'];
  const colors = ['#e07070','#e0a840', 'var(--sage)','var(--gold)'];

  for (let i = 0; i < score; i++) segs[i].classList.add(levels[score - 1]);
  label.textContent = labels[score - 1] || '';
  label.style.color = colors[score - 1] || 'var(--text-muted)';
}

/* ── Submit ── */
function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('reg-submit');
  const labelEl = document.getElementById('submit-label');

  if (!document.getElementById('reg-terms').checked) {
    alert('Vui lòng đồng ý với điều khoản dịch vụ.');
    return;
  }

  const pw  = document.getElementById('reg-password').value;
  const pw2 = document.getElementById('reg-password2').value;
  if (pw !== pw2) {
    document.getElementById('reg-password2').style.borderColor = '#e07070';
    return;
  }

  // Loading state
  btn.disabled = true;
  labelEl.textContent = 'Đang tạo tài khoản…';
  btn.style.opacity = '0.75';

  // Simulate API call
  setTimeout(() => {
    labelEl.textContent = 'Thành công! Kiểm tra email của bạn';
    btn.style.opacity = '1';
    btn.style.background = 'var(--forest-mid)';
    btn.querySelector('.auth-submit-arrow').style.display = 'none';
    // Redirect after delay
    setTimeout(() => {
      btn.disabled = false;
      labelEl.textContent = 'Tạo tài khoản miễn phí';
      btn.style.background = '';
      btn.querySelector('.auth-submit-arrow').style.display = '';
      e.target.reset();
      checkStrength('');
    }, 3500);
  }, 1600);
}