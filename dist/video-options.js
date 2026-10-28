export const MAX_VIDEO_BYTES = 200_000_000;
export const VIDEO_EXTENSIONS = /\.(avi|mov|mp4|m4v|webm|mkv)$/i;

export function videoProblem(file) {
  if (!VIDEO_EXTENSIONS.test(file.name)) return 'Choose an AVI, MOV, MP4, M4V, WebM or MKV video.';
  if (!file.size) return 'This file is empty. Choose another video.';
  if (file.size > MAX_VIDEO_BYTES) return 'Choose a video under 200 MB. For a larger video, trim it into shorter clips first.';
  return '';
}

export function conversionArgs(input, {quality, edge, fps, audio}) {
  if (![18, 23, 28].includes(quality) || ![0, 1920, 1280, 854].includes(edge) || ![0, 24, 30].includes(fps) || !['keep', 'mute'].includes(audio)) {
    throw new Error('Choose one of the available video settings.');
  }
  // Keep the aspect ratio, round to even pixels for H.264 and never upscale.
  const factor = edge ? `min(1,${edge}/max(iw,ih))` : '1';
  const filter = `scale=w='max(2,trunc(iw*${factor}/2)*2)':h='max(2,trunc(ih*${factor}/2)*2)'`;
  return ['-i', input, '-map', '0:V:0', ...(audio === 'keep' ? ['-map', '0:a:0?'] : []),
    '-vf', filter, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(quality),
    '-pix_fmt', 'yuv420p', '-threads', '1', ...(fps ? ['-r', String(fps)] : []),
    ...(audio === 'keep' ? ['-c:a', 'aac', '-b:a', '128k', '-ac', '2'] : ['-an']),
    '-map_metadata', '-1', '-map_chapters', '-1', '-sn', '-dn', '-movflags', '+faststart', 'output.mp4'];
}
