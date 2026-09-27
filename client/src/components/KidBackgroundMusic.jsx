import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { isEmbeddedInIframe } from "../utils/embed";
import {
  registerKidBgmTrackSetter,
  useKidBgmTrackBridge,
  normalizeBgmTrackRequest,
} from "../hooks/useKidBgmTrack";
import { useBgmPrefs } from "../hooks/useKidBgmVolume";
import "./assets/css/KidBackgroundMusic.css";

const SITE_BGM = {
  videoId: "wZkpXDJ_Vs4",
  audioUrl: "",
};
const KID_BGM = {
  videoId: "gIC2sIGWCQM",
  audioUrl: "",
};

function pickDefaultTrack(cfg, fallback) {
  if (cfg?.videoId) return cfg.videoId;
  if (cfg?.audioUrl) return { audioUrl: cfg.audioUrl };
  return fallback ?? null;
}

// `erroredIds` (Set videoId đã biết lỗi, vd bị chặn nhúng) là tuỳ chọn -
// khi có, hàm sẽ bỏ qua bài đã lỗi và thử lùi về phương án còn lại thay vì
// cứ đưa lại đúng video vừa lỗi (gây mất nhạc mãi mỗi khi đổi trang trong
// cùng vùng). Không ảnh hưởng gì khi chưa có lỗi nào (erroredIds rỗng/undefined).
function defaultTrackForPath(pathname, erroredIds) {
  const isKidRegion = pathname.startsWith("/e-kid/");
  const primary = isKidRegion ? KID_BGM : SITE_BGM;
  const secondary = isKidRegion ? SITE_BGM : KID_BGM;

  const primaryTrack = pickDefaultTrack(primary, null);
  const primaryId = typeof primaryTrack === "string" ? primaryTrack : null;
  if (primaryTrack && !(primaryId && erroredIds?.has(primaryId))) {
    return primaryTrack;
  }

  const secondaryTrack = pickDefaultTrack(secondary, null);
  const secondaryId =
    typeof secondaryTrack === "string" ? secondaryTrack : null;
  if (secondaryTrack && !(secondaryId && erroredIds?.has(secondaryId))) {
    return secondaryTrack;
  }

  return null;
}

const SITE_DEFAULT_TRACK = pickDefaultTrack(SITE_BGM, null);

const TRACKS = {
  default: typeof SITE_DEFAULT_TRACK === "string" ? SITE_DEFAULT_TRACK : null,
  game: "gD-UgmCtggQ",
  result: "RV8s08clQi4",
};

const DEFAULT_TRACK_REQUEST = normalizeBgmTrackRequest(
  SITE_BGM.videoId
    ? "default"
    : SITE_BGM.audioUrl
      ? { audioUrl: SITE_BGM.audioUrl }
      : { silent: true },
);

function shouldPlayOnPath(pathname) {
  if (pathname.startsWith("/dashboard")) return false;
  if (pathname.startsWith("/admin/login")) return false;
  return true;
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

function resolveTrackAtPath(track, pathname, erroredIds) {
  if (!track || track.kind === "preset") {
    if (track?.key && track.key !== "default") {
      const ytId = TRACKS[track.key] || null;
      return ytId ? { videoId: ytId } : null;
    }
    const def = defaultTrackForPath(pathname, erroredIds);
    if (!def) return null;
    return typeof def === "string" ? { videoId: def } : def;
  }
  if (track.kind === "video") return { videoId: track.videoId };
  if (track.kind === "audio") return { audioUrl: track.audioUrl };
  return null;
}

// Component này KHÔNG còn hiển thị nút/thanh chỉnh âm lượng nổi trên
// trang nữa - việc chỉnh âm lượng/tắt-mở nhạc nền giờ nằm trong Hồ Sơ >
// Cài Đặt Hệ Thống (SettingsTab, chương VI). Component vẫn giữ nguyên
// player YouTube ẩn + thẻ <audio> để thực sự phát nhạc, chỉ đọc/ghi âm
// lượng qua useBgmPrefs() (state dùng chung, đồng bộ ngay với Settings).
export default function KidBackgroundMusic() {
  const location = useLocation();
  const embedded = isEmbeddedInIframe();
  const active = !embedded && shouldPlayOnPath(location.pathname);

  const slotRef = useRef(null);
  const playerRef = useRef(null);
  const audioElRef = useRef(null);
  const initedRef = useRef(false);
  const loadedYtIdRef = useRef(null);
  const loadedAudioUrlRef = useRef(null);
  // Ghi lại những videoId đã từng lỗi (vd bị chặn nhúng) để không lặp lại
  // vô ích, và để biết đường fallback sang bài khác thay vì im lặng luôn.
  const erroredIdsRef = useRef(new Set());

  const [ready, setReady] = useState(false);
  const [track, setTrack] = useState(DEFAULT_TRACK_REQUEST);
  const [prefs] = useBgmPrefs();
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  // Player YouTube chỉ khởi tạo 1 lần cho cả vòng đời app (xem initedRef ở
  // dưới), nên handler onError của nó không thể dựa vào `location` đóng
  // gói lúc tạo player (sẽ bị "đứng hình" ở trang lúc khởi tạo) - phải đọc
  // pathname mới nhất qua ref này mỗi lần có lỗi thật sự xảy ra.
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  useEffect(() => registerKidBgmTrackSetter(setTrack), []);
  useKidBgmTrackBridge(setTrack);

  // Xử lý lỗi phát video YouTube (vd bị chặn nhúng, video riêng tư, bị
  // xoá...). Thay vì im lặng luôn, thử lùi về 1 lựa chọn còn lại (nếu có)
  // để khu vực bé không mất nhạc chỉ vì đúng 1 video bị lỗi - đồng thời in
  // rõ nguyên nhân khả dĩ ra console để dễ chẩn đoán.
  const handleYtPlayerError = (e) => {
    const code = e.data;
    const failedId = loadedYtIdRef.current;
    const reasonMap = {
      2: "ID video không hợp lệ",
      5: "Trình phát HTML5 gặp lỗi",
      100: "Video không tồn tại, đã bị xoá, hoặc để Riêng tư",
      101: "Chủ sở hữu video đã TẮT quyền nhúng (Cho phép nhúng) cho video này",
      150: "Chủ sở hữu video đã TẮT quyền nhúng (Cho phép nhúng) cho video này",
    };
    console.error(
      `[KidBackgroundMusic] Lỗi phát video "${failedId}" (mã ${code}): ${
        reasonMap[code] || "Không rõ nguyên nhân"
      }. Kiểm tra lại chế độ hiển thị và mục "Cho phép nhúng" (Allow embedding) trong cài đặt nâng cao của video trên YouTube Studio.`,
    );
    if (failedId) erroredIdsRef.current.add(failedId);

    const player = playerRef.current;
    if (!player || typeof player.loadVideoById !== "function") return;

    // Chỉ tự fallback khi video lỗi là 1 trong 2 bài mặc định do hệ thống
    // tự chọn theo vùng (SITE_BGM/KID_BGM) - không đụng vào video riêng do
    // 1 ebook/trang chủ động yêu cầu, vì đó là lựa chọn có chủ đích.
    const isKidRegion = pathnameRef.current.startsWith("/e-kid/");
    const fallbackId = isKidRegion
      ? SITE_BGM.videoId // khu bé lỗi -> thử lùi về bài chung của site
      : KID_BGM.videoId; // (hiếm khi xảy ra) site lỗi -> thử bài khu bé
    if (
      fallbackId &&
      fallbackId !== failedId &&
      !erroredIdsRef.current.has(fallbackId)
    ) {
      loadedYtIdRef.current = fallbackId;
      player.loadVideoById(fallbackId);
      player.setVolume(prefsRef.current.volume);
      if (prefsRef.current.muted) player.mute();
      else player.unMute();
    }
  };

  useEffect(() => {
    if (!active || initedRef.current) return undefined;
    initedRef.current = true;

    loadYouTubeApi().then((YT) => {
      if (playerRef.current || !slotRef.current) return;
      const initialVideoId = TRACKS.default || TRACKS.game;
      loadedYtIdRef.current = initialVideoId;
      playerRef.current = new YT.Player(slotRef.current, {
        videoId: initialVideoId,
        playerVars: {
          autoplay: 1,
          mute: 1, // bắt buộc tắt tiếng để trình duyệt cho tự phát - mở lại ở lượt chạm đầu tiên
          loop: 1,
          playlist: initialVideoId, // mẹo chính thức của Youtube để lặp lại đúng 1 video
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
            e.target.setVolume(prefsRef.current.volume);
            setReady(true);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              e.target.seekTo(0);
              e.target.playVideo();
            }
          },
          onError: (e) => handleYtPlayerError(e),
        },
      });
    });
  }, [active]);

  // Đổi bài phát theo `track` hiện tại.
  useEffect(() => {
    const player = playerRef.current;
    const audioEl = audioElRef.current;
    const prefsNow = prefsRef.current;

    const resolved = resolveTrackAtPath(
      track,
      location.pathname,
      erroredIdsRef.current,
    );
    const ytId = resolved?.videoId || null;
    const audioUrl = resolved?.audioUrl || null;

    if (ytId) {
      if (audioEl && !audioEl.paused) audioEl.pause();
      if (ready && player && typeof player.loadVideoById === "function") {
        if (ytId !== loadedYtIdRef.current) {
          loadedYtIdRef.current = ytId;
          player.loadVideoById(ytId);
        }
        player.setVolume(prefsNow.volume);
        if (prefsNow.muted) player.mute();
        else player.unMute();
        if (typeof player.playVideo === "function") player.playVideo();
      }
      return;
    }

    if (audioUrl) {
      if (player && typeof player.pauseVideo === "function") {
        player.pauseVideo();
      }
      if (audioEl) {
        if (loadedAudioUrlRef.current !== audioUrl) {
          loadedAudioUrlRef.current = audioUrl;
          audioEl.src = audioUrl;
        }
        audioEl.volume = Math.min(1, Math.max(0, prefsNow.volume / 100));
        audioEl.muted = prefsNow.muted;
        if (!prefsNow.muted) {
          audioEl.play().catch(() => {
            // Trình duyệt chặn autoplay có tiếng - sẽ tự phát khi người
            // dùng chạm vào trang lần đầu (xem effect "unlock" bên dưới).
          });
        }
      }
      return;
    }

    if (track?.kind === "silent") {
      if (player && typeof player.pauseVideo === "function") {
        player.pauseVideo();
      }
      if (audioEl && !audioEl.paused) audioEl.pause();
    }
  }, [ready, track, location.pathname]);

  // Áp lại âm lượng/tắt-mở ngay khi được đổi từ nơi khác (vd tab Cài Đặt).
  useEffect(() => {
    const player = playerRef.current;
    const audioEl = audioElRef.current;
    if (player) {
      player.setVolume(prefs.volume);
      if (prefs.muted) player.mute();
      else player.unMute();
    }
    if (audioEl) {
      audioEl.volume = Math.min(1, Math.max(0, prefs.volume / 100));
      audioEl.muted = prefs.muted;
      if (!prefs.muted && audioEl.src && track?.kind === "audio") {
        audioEl.play().catch(() => {});
      }
    }
  }, [prefs, track]);

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
      const resolved = resolveTrackAtPath(
        track,
        location.pathname,
        erroredIdsRef.current,
      );
      if (
        ready &&
        player &&
        typeof player.playVideo === "function" &&
        resolved?.videoId
      ) {
        player.playVideo();
      }
      if (audioEl && resolved?.audioUrl && !prefsRef.current.muted) {
        audioEl.play().catch(() => {});
      }
    } else {
      if (player && typeof player.pauseVideo === "function")
        player.pauseVideo();
      if (audioEl && !audioEl.paused) audioEl.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ready]);

  if (embedded) return null;

  // Chỉ còn khung YouTube ẩn + thẻ audio ẩn để thực sự phát âm thanh -
  // không còn nút/panel nổi trên giao diện nữa.
  return (
    <div className="kbm-root" aria-hidden="true">
      <div ref={slotRef} className="kbm-yt-slot" />
      <audio ref={audioElRef} loop preload="auto" />
    </div>
  );
}
