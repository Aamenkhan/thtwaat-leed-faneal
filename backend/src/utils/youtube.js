export function parseYoutubeId(input) {
  const val = String(input || '').trim();
  if (!val) return '';

  const match = val.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  if (/^[a-zA-Z0-9_-]{11}$/.test(val)) return val;

  return '';
}

export function buildYoutubeEmbedUrl(videoId, { autoplay = false } = {}) {
  if (!videoId) return '';
  return `https://www.youtube.com/embed/${videoId}?rel=0${autoplay ? '&autoplay=1' : ''}`;
}
