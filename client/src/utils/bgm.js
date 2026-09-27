// Tiện ích dùng chung cho nhạc nền / âm thanh của ebook
const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function extractYoutubeVideoId(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (YT_ID_RE.test(trimmed)) return trimmed;

  let url;
  try {
    url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
  } catch {
    url = null;
  }

  if (url) {
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id && YT_ID_RE.test(id)) return id;
    } else if (
      host === "youtube.com" ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube.com")
    ) {
      const vParam = url.searchParams.get("v");
      if (vParam && YT_ID_RE.test(vParam)) return vParam;

      const parts = url.pathname.split("/").filter(Boolean);
      const markers = ["embed", "shorts", "live", "v"];
      for (let i = 0; i < parts.length - 1; i++) {
        if (markers.includes(parts[i]) && YT_ID_RE.test(parts[i + 1])) {
          return parts[i + 1];
        }
      }
    }
  }

  const match = trimmed.match(/[a-zA-Z0-9_-]{11}(?![a-zA-Z0-9_-])/);
  return match ? match[0] : null;
}

export function looksLikeYoutubeUrl(input) {
  if (!input || typeof input !== "string") return false;
  return /youtu\.?be/i.test(input);
}

function hasSource(src) {
  return !!(src && (src.videoId || src.audioUrl));
}

function pickSource(src) {
  if (!src) return null;
  if (src.videoId) return { videoId: src.videoId };
  if (src.audioUrl) return { audioUrl: src.audioUrl };
  return null;
}

export function resolvePageBgmTrack(pageMusic, bookMusic) {
  const ambient = pageMusic?.ambient;

  if (ambient?.mode === "off") return { silent: true };

  if (ambient?.mode === "custom") {
    const picked = pickSource(ambient);
    if (picked) return picked;
  }

  if (bookMusic?.enabled) {
    const picked = pickSource(bookMusic);
    if (picked) return picked;
  }

  return null;
}

export function resolvePageClickSound(pageMusic) {
  const click = pageMusic?.click;
  if (!click?.enabled) return null;
  const picked = pickSource(click);
  if (!picked) return null;
  return { ...picked, label: click.label || "" };
}

export function musicSourceHasContent(src) {
  return hasSource(src);
}
