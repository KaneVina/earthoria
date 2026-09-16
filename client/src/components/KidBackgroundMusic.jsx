import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Volume2, Volume1, VolumeX } from "lucide-react";
import { isEmbeddedInIframe } from "../utils/embed";
import "./assets/css/KidBackgroundMusic.css";

const VIDEO_ID = "xxYJONmXE8w";

const STORAGE_KEY = "earthoria:kid-bgm";
const DEFAULT_VOLUME = 55;
const AUTO_CLOSE_MS = 4000;

function shouldPlayOnPath(pathname) {
  return pathname.startsWith("/e-kid/") || pathname.startsWith("/ebook/");
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { muted: false, volume: DEFAULT_VOLUME };
    const parsed = JSON.parse(raw);
    const volume = Number(parsed.volume);
    return {
      muted: Boolean(parsed.muted),
      volume: Number.isFinite(volume)
        ? Math.min(100, Math.max(0, volume))
        : DEFAULT_VOLUME,
    };
  } catch {
    return { muted: false, volume: DEFAULT_VOLUME };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage có thể bị chặn (chế độ ẩn danh...) - bỏ qua, không chặn nhạc
  }
}

// Tải script Youtube IFrame API đúng 1 lần cho cả app
let apiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === "function") prevReady();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export default function KidBackgroundMusic() {
  const location = useLocation();
  const embedded = isEmbeddedInIframe();
  const active = !embedded && shouldPlayOnPath(location.pathname);

  const slotRef = useRef(null);
  const playerRef = useRef(null);
  const initedRef = useRef(false);
  const prefsRef = useRef(loadPrefs());
  const closeTimerRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(() => loadPrefs().muted);
  const [volume, setVolume] = useState(() => loadPrefs().volume);
  const [panelOpen, setPanelOpen] = useState(false);

  const updatePrefs = useCallback((next) => {
    prefsRef.current = { ...prefsRef.current, ...next };
    savePrefs(prefsRef.current);
  }, []);

  useEffect(() => {
    if (!active || initedRef.current) return undefined;
    initedRef.current = true;

    loadYouTubeApi().then((YT) => {
      // Không dùng cờ "cancelled" theo cleanup ở đây: React StrictMode (dev)
      // chạy mount -> cleanup -> mount lại, và nếu huỷ theo cleanup thì
      // promise của lượt mount đầu sẽ bị chặn ngay trước khi kịp tạo player,
      // trong khi lượt mount thứ 2 lại bị initedRef chặn không tạo lại nữa
      // => player không bao giờ được khởi tạo, mất tiếng hoàn toàn.
      // Guard bằng playerRef để chỉ tạo player đúng 1 lần cho cả vòng đời app.
      if (playerRef.current || !slotRef.current) return;
      const prefs = prefsRef.current;
      playerRef.current = new YT.Player(slotRef.current, {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1, // bắt buộc tắt tiếng để trình duyệt cho tự phát - mở lại ở lượt chạm đầu tiên
          loop: 1,
          playlist: VIDEO_ID, // mẹo chính thức của Youtube để lặp lại đúng 1 video
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            e.target.setVolume(prefs.volume);
            setReady(true);
          },
          onStateChange: (e) => {
            // Lưới an toàn: phòng khi mẹo loop+playlist không ăn ở 1 vài trình
            // duyệt, video kết thúc thì tự tua lại từ đầu và phát tiếp.
            if (e.data === window.YT.PlayerState.ENDED) {
              e.target.seekTo(0);
              e.target.playVideo();
            }
          },
          onError: (e) => {
            // In lỗi ra console để dễ debug (ví dụ video bị chặn nhúng,
            // sai ID...) thay vì im lặng mất tiếng không rõ nguyên nhân.
            console.error("[KidBackgroundMusic] YouTube player error, code:", e.data);
          },
        },
      });
    });
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;
    const unlock = () => {
      const player = playerRef.current;
      if (
        player &&
        typeof player.unMute === "function" &&
        !prefsRef.current.muted
      ) {
        player.unMute();
        player.setVolume(prefsRef.current.volume);
      }
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [active]);

  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player || typeof player.playVideo !== "function") return;
    if (active) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [active, ready]);

  // Tự đóng bảng chỉnh âm lượng sau vài giây không thao tác, cho gọn gàng.
  const scheduleAutoClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(
      () => setPanelOpen(false),
      AUTO_CLOSE_MS,
    );
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const applyVolume = useCallback(
    (nextVolume, nextMuted) => {
      const player = playerRef.current;
      setVolume(nextVolume);
      setMuted(nextMuted);
      updatePrefs({ volume: nextVolume, muted: nextMuted });
      if (!player) return;
      player.setVolume(nextVolume);
      if (nextMuted) player.mute();
      else player.unMute();
    },
    [updatePrefs],
  );

  const handleSliderChange = (e) => {
    const v = Number(e.target.value);
    applyVolume(v, v === 0);
    scheduleAutoClose();
  };

  const handleToggleClick = () => {
    if (!panelOpen) {
      setPanelOpen(true);
      scheduleAutoClose();
      return;
    }
    // Bảng đang mở, bấm lại icon = chuyển nhanh tắt/mở tiếng (không đóng bảng)
    if (muted || volume === 0) {
      applyVolume(
        prefsRef.current.volume > 0 ? prefsRef.current.volume : DEFAULT_VOLUME,
        false,
      );
    } else {
      applyVolume(volume, true);
    }
    scheduleAutoClose();
  };

  if (!active) return null;

  const isSilent = muted || volume === 0;
  const Icon = isSilent ? VolumeX : volume < 55 ? Volume1 : Volume2;

  return (
    <div
      className={`kbm-root${panelOpen ? " kbm-root--open" : ""}`}
      onPointerEnter={() => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      }}
      onPointerLeave={scheduleAutoClose}
    >
      {/* Khung Youtube thật - giấu kín, chỉ dùng để phát âm thanh */}
      <div ref={slotRef} className="kbm-yt-slot" aria-hidden="true" />

      <div className="kbm-panel" role="group" aria-label="Âm lượng nhạc nền">
        <input
          type="range"
          className="kbm-slider"
          min={0}
          max={100}
          value={isSilent ? 0 : volume}
          onChange={handleSliderChange}
          style={{ "--kbm-val": isSilent ? 0 : volume }}
          aria-label="Âm lượng nhạc nền"
        />
      </div>

      <button
        type="button"
        className="kbm-toggle"
        onClick={handleToggleClick}
        aria-label={isSilent ? "Bật nhạc nền" : "Chỉnh âm lượng nhạc nền"}
        title={isSilent ? "Bật nhạc nền" : "Chỉnh âm lượng nhạc nền"}
      >
        <Icon size={19} />
      </button>
    </div>
  );
}
