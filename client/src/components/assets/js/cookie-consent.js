(function () {
  "use strict";

  const STORAGE_KEY = "earthoria-cookie-consent";
  const CONSENT_VERSION = 1; // tăng số này khi thay đổi chính sách để hỏi lại người dùng
  const AUTO_DISMISS_SECONDS = null; // ví dụ: 20
  const COOKIE_GROUPS = [
    {
      key: "essential",
      title: "Cookie thiết yếu",
      badge: "Luôn bật",
      locked: true,
      desc: "Cần thiết để duy trì các chức năng cốt lõi của website. Các cookie này không thể tắt vì cần thiết để hệ thống vận hành chính xác và an toàn.",
    },
    {
      key: "analytics",
      title: "Cookie phân tích",
      badge: "Tuỳ chọn",
      locked: false,
      desc: "Giúp chúng tôi phân tích hành vi sử dụng và mức độ tương tác với Earthoria nhằm tối ưu hiệu suất và trải nghiệm người dùng.",
    },
    {
      key: "marketing",
      title: "Cookie tiếp thị",
      badge: "Tuỳ chọn",
      locked: false,
      desc: "Được sử dụng để cá nhân hoá nội dung quảng cáo, phân phối quảng cáo phù hợp và đo lường hiệu quả các chiến dịch tiếp thị trên nền tảng mạng xã hội và công cụ tìm kiếm.",
    },
    {
      key: "functional",
      title: "Cookie chức năng",
      badge: "Tuỳ chọn",
      locked: false,
      desc: "Ghi nhớ các tùy chọn và thiết lập cá nhân của bạn nhằm mang lại trải nghiệm nhất quán và thuận tiện trong các lần truy cập tiếp theo.",
    },
  ];

  /*  Helpers lưu trữ  */
  function loadConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.version !== CONSENT_VERSION) return null; // chính sách đổi → hỏi lại
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(choices) {
    const payload = {
      version: CONSENT_VERSION,
      choices: { ...choices, essential: true }, // essential luôn true, không phụ thuộc input
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }

  function applyConsent(payload) {
    document.dispatchEvent(
      new CustomEvent("earthoria:cookie-consent", { detail: payload }),
    );
  }

  function watchCrossTabSync(onExternalChange) {
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return;
      // e.newValue === null nghĩa là tab kia vừa gọi resetConsent()
      if (!e.newValue) {
        onExternalChange(null);
        return;
      }
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.version !== CONSENT_VERSION) return;
        onExternalChange(parsed);
      } catch (err) {
        /* dữ liệu hỏng — bỏ qua, không làm crash tab hiện tại */
      }
    });
  }

  /*  Xây dựng DOM  */
  function buildBanner() {
    const el = document.createElement("div");
    el.className = "cc-banner";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Thông báo cookie");
    el.innerHTML = `
      <div class="cc-banner-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="8.5" cy="10" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="14.5" cy="8.5" r="1" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="14" r="1.3" fill="currentColor" stroke="none"/>
          <circle cx="10" cy="15" r="0.9" fill="currentColor" stroke="none"/>
        </svg>
      </div>
      <div class="cc-banner-body">
        <div class="cc-banner-title">Chúng tôi dùng <em>cookie</em></div>
        <p class="cc-banner-text">
          Earthoria sử dụng cookie thiết yếu để trang hoạt động và cookie tuỳ chọn để cải thiện
          trải nghiệm của bạn. Bạn có thể chấp nhận tất cả, chỉ giữ cookie cần thiết,
          hoặc tự tuỳ chỉnh từng nhóm. Xem thêm tại
          <a href="/legal/cookies" id="cc-policy-link">Chính sách Cookie</a>.
        </p>
      </div>
      <div class="cc-banner-actions">
        <button class="cc-btn cc-btn-accept-all" id="cc-accept-all">Chấp nhận tất cả</button>
        <button class="cc-btn cc-btn-essential-only" id="cc-essential-only">Chỉ chấp nhận cần thiết</button>
        <button class="cc-btn cc-btn-customize" id="cc-customize">Tùy chỉnh</button>
      </div>
      ${
        AUTO_DISMISS_SECONDS
          ? `<div class="cc-banner-progress" aria-hidden="true"><div class="cc-banner-progress-fill" id="cc-progress-fill"></div></div>`
          : ""
      }
    `;
    return el;
  }

  function buildBannerBackdrop() {
    const el = document.createElement("div");
    el.className = "cc-banner-backdrop";
    return el;
  }

  function buildModalOverlay() {
    const el = document.createElement("div");
    el.className = "cc-modal-overlay";
    return el;
  }

  function buildModal(currentChoices) {
    const el = document.createElement("div");
    el.className = "cc-modal";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Tùy chỉnh cookie");

    const groupsHtml = COOKIE_GROUPS.map((g) => {
      const checked = g.locked ? true : !!currentChoices[g.key];
      return `
        <div class="cc-group" data-key="${g.key}">
          <div class="cc-group-head">
            <div class="cc-group-title-wrap">
              <span class="cc-group-title">${g.title}</span>
              <span class="cc-group-badge">${g.badge}</span>
            </div>
            <label class="cc-toggle ${g.locked ? "locked" : ""}">
              <input type="checkbox" data-cookie-key="${g.key}"
                ${checked ? "checked" : ""} ${g.locked ? "disabled" : ""}>
              <span class="cc-toggle-track"><span class="cc-toggle-thumb"></span></span>
            </label>
          </div>
          <p class="cc-group-desc">${g.desc}</p>
          ${
            g.locked
              ? `<div class="cc-group-locked-note">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                   </svg>
                   Luôn bật — cần thiết để website hoạt động
                 </div>`
              : ""
          }
        </div>
      `;
    }).join("");

    el.innerHTML = `
      <div class="cc-modal-header">
        <button class="cc-modal-close" id="cc-modal-close" aria-label="Đóng">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div class="cc-modal-eyebrow">
          <div class="cc-modal-eyebrow-line"></div>
          <span class="cc-modal-eyebrow-text">Tuỳ chỉnh</span>
        </div>
        <h3 class="cc-modal-title">Tùy Chỉnh <em>Cookie</em></h3>
        <p class="cc-modal-sub">Bật/tắt từng nhóm cookie theo ý muốn. Cookie thiết yếu luôn được bật vì website cần chúng để hoạt động bình thường.</p>
      </div>
      <div class="cc-modal-body">${groupsHtml}</div>
      <div class="cc-modal-footer">
        <button class="cc-btn cc-btn-essential-only" id="cc-modal-essential-only">Chỉ cần thiết</button>
        <button class="cc-btn cc-btn-accept-all" id="cc-modal-save">Lưu lựa chọn</button>
      </div>
    `;
    return el;
  }

  function buildReopenBtn() {
    const el = document.createElement("button");
    el.className = "cc-reopen-btn";
    el.id = "cc-reopen-btn";
    el.setAttribute("aria-label", "Cài đặt cookie");
    el.title = "Cài đặt cookie";
    el.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="8.5" cy="10" r="1.1" fill="currentColor" stroke="none"/>
        <circle cx="14.5" cy="8.5" r="0.9" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none"/>
      </svg>
    `;
    return el;
  }

  /*  Controller chính  */
  function init() {
    let banner, bannerBackdrop, overlay, modal, reopenBtn, countdownTimer;

    function defaultChoices(allTrue) {
      const c = {};
      COOKIE_GROUPS.forEach((g) => (c[g.key] = g.locked ? true : !!allTrue));
      return c;
    }

    function mountReopenBtn() {
      if (reopenBtn) return;
      reopenBtn = buildReopenBtn();
      document.body.appendChild(reopenBtn);
      requestAnimationFrame(() => reopenBtn.classList.add("show"));
      reopenBtn.addEventListener("click", openModal);
    }

    function stopCountdown() {
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }

    function startCountdown(onExpire) {
      if (!AUTO_DISMISS_SECONDS || !banner) return;
      const fill = banner.querySelector("#cc-progress-fill");
      if (!fill) return;
      let remaining = AUTO_DISMISS_SECONDS;
      fill.style.transition = `width ${AUTO_DISMISS_SECONDS}s linear`;
      requestAnimationFrame(() => {
        fill.style.width = "0%";
      });
      countdownTimer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          stopCountdown();
          onExpire();
        }
      }, 1000);
    }

    function closeBanner() {
      stopCountdown();
      if (bannerBackdrop) {
        bannerBackdrop.classList.remove("show");
        const el = bannerBackdrop;
        setTimeout(() => el.remove(), 450);
        bannerBackdrop = null;
      }
      if (!banner) return;
      banner.classList.remove("show");
      const el = banner;
      setTimeout(() => el.remove(), 500);
      banner = null;
    }

    function finalize(choices) {
      const payload = saveConsent(choices);
      applyConsent(payload);
      closeBanner();
      closeModal();
      mountReopenBtn();
    }

    function openModal() {
      const current =
        (loadConsent() && loadConsent().choices) || defaultChoices(false);
      overlay = buildModalOverlay();
      modal = buildModal(current);
      document.body.appendChild(overlay);
      document.body.appendChild(modal);
      requestAnimationFrame(() => {
        overlay.classList.add("show");
        modal.classList.add("show");
      });

      overlay.addEventListener("click", closeModal);
      modal
        .querySelector("#cc-modal-close")
        .addEventListener("click", closeModal);

      modal
        .querySelector("#cc-modal-essential-only")
        .addEventListener("click", () => {
          finalize(defaultChoices(false));
        });

      modal.querySelector("#cc-modal-save").addEventListener("click", () => {
        const choices = {};
        modal.querySelectorAll("input[data-cookie-key]").forEach((input) => {
          choices[input.dataset.cookieKey] = input.checked;
        });
        finalize(choices);
      });
    }

    function closeModal() {
      if (!modal) return;
      overlay && overlay.classList.remove("show");
      modal.classList.remove("show");
      const ov = overlay,
        md = modal;
      setTimeout(() => {
        ov && ov.remove();
        md && md.remove();
      }, 400);
      overlay = null;
      modal = null;
    }

    // Nếu modal đang mở khi tab khác vừa lưu lựa chọn mới, cập nhật lại
    // trạng thái các toggle ngay tại chỗ thay vì để người dùng thấy dữ liệu
    // cũ rồi vô tình ghi đè lựa chọn mới hơn từ tab kia.
    function syncModalToggles(choices) {
      if (!modal) return;
      modal.querySelectorAll("input[data-cookie-key]").forEach((input) => {
        const key = input.dataset.cookieKey;
        if (key in choices) input.checked = choices[key];
      });
    }

    function showBanner() {
      banner = buildBanner();
      bannerBackdrop = buildBannerBackdrop();
      document.body.appendChild(bannerBackdrop);
      document.body.appendChild(banner);
      requestAnimationFrame(() => {
        bannerBackdrop.classList.add("show");
        banner.classList.add("show");
      });

      banner.querySelector("#cc-accept-all").addEventListener("click", () => {
        finalize(defaultChoices(true));
      });
      banner
        .querySelector("#cc-essential-only")
        .addEventListener("click", () => {
          finalize(defaultChoices(false));
        });
      banner.querySelector("#cc-customize").addEventListener("click", () => {
        stopCountdown(); // người dùng đã tương tác → không tự động hoá nữa
        openModal();
      });

      // Bấm vào backdrop KHÔNG tự đóng banner — khác với modal tùy chỉnh,
      // banner đầu tiên cần một lựa chọn rõ ràng, không nên tắt được bằng
      // cách click ra ngoài (đây là hành vi chuẩn theo GDPR: không được
      // ngầm coi "lơ banner" là đồng ý).
      startCountdown(() => finalize(defaultChoices(false)));
    }

    const existing = loadConsent();
    if (existing) {
      // Đã có lựa chọn từ trước → áp dụng ngay, chỉ hiện nút cài đặt nhỏ
      applyConsent(existing);
      mountReopenBtn();
    } else {
      // Chưa có lựa chọn → hiện banner
      showBanner();
    }

    //  Đồng bộ đa tab
    watchCrossTabSync((payload) => {
      if (payload === null) {
        // Tab khác vừa reset toàn bộ lựa chọn — quay lại trạng thái ban đầu
        closeBanner();
        closeModal();
        if (reopenBtn) {
          reopenBtn.classList.remove("show");
          const el = reopenBtn;
          setTimeout(() => el.remove(), 350);
          reopenBtn = null;
        }
        showBanner();
        return;
      }
      // Tab khác vừa lưu lựa chọn mới → áp dụng ngay tại tab này,
      // đóng banner nếu đang mở, đồng bộ modal nếu đang mở, không cần
      // reload trang.
      applyConsent(payload);
      if (banner) closeBanner();
      mountReopenBtn();
      syncModalToggles(payload.choices);
    });

    /*  API công khai để phần khác của site dùng  */
    window.EarthoriaCookies = {
      getConsent: () => loadConsent(),
      hasConsent: (key) => {
        const c = loadConsent();
        if (!c) return key === "essential"; // trước khi chọn: chỉ essential được coi là "có"
        return !!c.choices[key];
      },
      openSettings: openModal,
      resetConsent: () => {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
