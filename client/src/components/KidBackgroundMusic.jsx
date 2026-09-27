import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Volume2, Volume1, VolumeX } from "lucide-react";
import { isEmbeddedInIframe } from "../utils/embed";
import {
  registerKidBgmTrackSetter,
  useKidBgmTrackBridge,
  normalizeBgmTrackRequest,
} from "../hooks/useKidBgmTrack";
import "./assets/css/KidBackgroundMusic.css";

// Các bài nhạc nền PRESET theo từng "khung cảnh". "default" phát khi ở khu
// vực kid nói chung (đọc ebook, màn chờ...); "game"/"result" do GamePlay
// chủ động yêu cầu qua hook useKidBgmTrack() khi vào màn chơi / màn kết
// quả. Ngoài các preset cố định này, nơi gọi (vd ebook) còn có thể yêu cầu
// 1 video YouTube/1 file audio TUỲ Ý - xem xử lý "kind" bên dưới.
const TRACKS = {
  default: "xxYJONmXE8w",
  game: "gD-UgmCtggQ",
  result: "RV8s08clQi4",
};

const DEFAULT_TRACK_REQUEST = normalizeBgmTrackRequest("default");

const STORAGE_KEY = "earthoria:kid-bgm";
const DEFAULT_VOLUME = 55;
const AUTO_CLOSE_MS = 4000;

function shouldPlayOnPath(pathname) {
  return (
    pathname.startsWith("/e-kid/") ||
    pathname.startsWith("/ebook/") ||
    // /game/:slug/:code - GamePlay còn có thể mở độc lập, không nằm dưới
    // /e-kid/, nên phải liệt kê riêng thì nhạc lúc chơi game mới phát được.
    pathname.startsWith("/game/")
  );
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

// videoId cần phát cho 1 track request đã chuẩn hoá, ứng với player YouTube
// (preset hoặc "video" tuỳ ý) - null nếu track này không dùng YouTube.
function videoIdForTrack(track) {
  if (!track) return TRACKS.default;
  if (track.kind === "preset") return TRACKS[track.key] || TRACKS.default;
  if (track.kind === "video") return track.videoId;
  return null;
}

export default function KidBackgroundMusic() {
  const location = useLocation();
  const embedded = isEmbeddedInIframe();
  const active = !embedded && shouldPlayOnPath(location.pathname);

  const slotRef = useRef(null);
  const playerRef = useRef(null);
  const audioElRef = useRef(null);
  const initedRef = useRef(false);
  const prefsRef = useRef(loadPrefs());
  const closeTimerRef = useRef(null);
  const loadedYtIdRef = useRef(null);
  const loadedAudioUrlRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(() => loadPrefs().muted);
  const [volume, setVolume] = useState(() => loadPrefs().volume);
  const [panelOpen, setPanelOpen] = useState(false);
  const [track, setTrack] = useState(DEFAULT_TRACK_REQUEST);

  const updatePrefs = useCallback((next) => {
    prefsRef.current = { ...prefsRef.current, ...next };
    savePrefs(prefsRef.current);
  }, []);

  // Mở "cổng" cho useKidBgmTrack() ở nơi khác (vd GamePlay, ebook) gọi vào,
  // vì đây là component singleton duy nhất giữ player thật.
  useEffect(() => registerKidBgmTrackSetter(setTrack), []);

  // Nhận yêu cầu đổi bài gửi từ 1 iframe con nhúng ngay trên trang này (vd
  // khung chơi game nhúng trong ebook) - xem useKidBgmTrackBridge.
  useKidBgmTrackBridge(setTrack);

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
      loadedYtIdRef.current = TRACKS.default;
      playerRef.current = new YT.Player(slotRef.current, {
        videoId: TRACKS.default,
        playerVars: {
          autoplay: 1,
          mute: 1, // bắt buộc tắt tiếng để trình duyệt cho tự phát - mở lại ở lượt chạm đầu tiên
          loop: 1,
          playlist: TRACKS.default, // mẹo chính thức của Youtube để lặp lại đúng 1 video
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
            console.error(
              "[KidBackgroundMusic] YouTube player error, code:",
              e.data,
            );
          },
        },
      });
    });
  }, [active]);

  // Đổi bài phát theo `track` hiện tại - nhánh theo "kind": preset/video
  // (YouTube) dùng player ẩn có sẵn; "audio" (file tải lên) dùng thẻ
  // <audio> riêng chạy song song; "silent" dừng cả hai. Chỉ 1 trong 2 nguồn
  // phát ra tiếng tại 1 thời điểm.
  useEffect(() => {
    const player = playerRef.current;
    const audioEl = audioElRef.current;
    const prefs = prefsRef.current;

    const ytId = videoIdForTrack(track);
    const audioUrl = track?.kind === "audio" ? track.audioUrl : null;

    // Nhánh YouTube (preset hoặc video tuỳ ý)
    if (ytId) {
      if (audioEl && !audioEl.paused) audioEl.pause();
      if (ready && player && typeof player.loadVideoById === "function") {
        if (ytId !== loadedYtIdRef.current) {
          loadedYtIdRef.current = ytId;
          player.loadVideoById(ytId);
        }
        // loadVideoById thường giữ nguyên volume/mute hiện tại của player, áp
        // lại cho chắc để không bị "bật tiếng" ngoài ý muốn lúc đổi bài.
        player.setVolume(prefs.volume);
        if (prefs.muted) player.mute();
        else player.unMute();
        if (typeof player.playVideo === "function") player.playVideo();
      }
      return;
    }

    // Nhánh file audio tải lên
    if (audioUrl) {
      if (player && typeof player.pauseVideo === "function") {
        player.pauseVideo();
      }
      if (audioEl) {
        if (loadedAudioUrlRef.current !== audioUrl) {
          loadedAudioUrlRef.current = audioUrl;
          audioEl.src = audioUrl;
        }
        audioEl.volume = Math.min(1, Math.max(0, prefs.volume / 100));
        audioEl.muted = prefs.muted;
        if (!prefs.muted) {
          audioEl.play().catch(() => {
            // Trình duyệt chặn autoplay có tiếng - sẽ tự phát khi người
            // dùng chạm vào trang lần đầu (xem effect "unlock" bên dưới).
          });
        }
      }
      return;
    }

    // Nhánh silent: dừng hẳn cả 2 nguồn, không phát gì.
    if (track?.kind === "silent") {
      if (player && typeof player.pauseVideo === "function") {
        player.pauseVideo();
      }
      if (audioEl && !audioEl.paused) audioEl.pause();
    }
  }, [ready, track]);

  useEffect(() => {
    if (!active) return undefined;
    const unlock = () => {
      const player = playerRef.current;
      const audioEl = audioElRef.current;
      if (prefsRef.current.muted) return;
      if (player && typeof player.unMute === "function") {
        player.unMute();
        player.setVolume(prefsRef.current.volume);
      }
      if (audioEl && audioEl.src) {
        audioEl.muted = false;
        audioEl.play().catch(() => {});
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
    const audioEl = audioElRef.current;
    if (active) {
      if (
        ready &&
        player &&
        typeof player.playVideo === "function" &&
        videoIdForTrack(track)
      ) {
        player.playVideo();
      }
      if (audioEl && track?.kind === "audio" && !prefsRef.current.muted) {
        audioEl.play().catch(() => {});
      }
    } else {
      if (player && typeof player.pauseVideo === "function")
        player.pauseVideo();
      if (audioEl && !audioEl.paused) audioEl.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const audioEl = audioElRef.current;
      setVolume(nextVolume);
      setMuted(nextMuted);
      updatePrefs({ volume: nextVolume, muted: nextMuted });
      if (player) {
        player.setVolume(nextVolume);
        if (nextMuted) player.mute();
        else player.unMute();
      }
      if (audioEl) {
        audioEl.volume = Math.min(1, Math.max(0, nextVolume / 100));
        audioEl.muted = nextMuted;
        if (!nextMuted && audioEl.src && track?.kind === "audio") {
          audioEl.play().catch(() => {});
        }
      }
    },
    [updatePrefs, track],
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
      {/* File audio tải lên (nhạc nền tuỳ chỉnh của ebook) - chạy song song
          với player YouTube ở trên, chỉ 1 trong 2 thực sự phát ra tiếng. */}
      <audio ref={audioElRef} loop preload="auto" aria-hidden="true" />

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
