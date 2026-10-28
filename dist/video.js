import {videoProblem, conversionArgs} from './video-options.js';

const $ = selector => document.querySelector(selector);
const formatSize = bytes => bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(2)} MB` : `${(bytes / 1000).toFixed(1)} KB`;
let file, resultURL, engine, busy = false, cancelled = false, timedOut = false;
let duration = 0, lastPercent = 0, progressLabel = 'Converting your video';

function message(text, error = false) {
  $('#video-status').textContent = text;
  $('#video-status').classList.toggle('error', error);
}
function clearResult() {
  $('#video-preview').pause();
  $('#video-preview').removeAttribute('src');
  $('#video-preview').load();
  if (resultURL) URL.revokeObjectURL(resultURL);
  resultURL = undefined;
  $('#video-result').hidden = true;
  $('#video-download').removeAttribute('href');
}
function controls() {
  $('#video-start').disabled = busy || !file;
  $('#video-start').textContent = busy ? 'Converting…' : 'Compress & convert to MP4';
  $('#video-cancel').hidden = !busy;
  $('#video-cancel').disabled = cancelled;
  $('#video-clear').hidden = !file;
  $('#video-clear').disabled = busy;
  $('#video-browse').disabled = busy;
  $('#video-input').disabled = busy;
  document.querySelectorAll('#video-settings select').forEach(el => el.disabled = busy);
  $('#video-workbench').setAttribute('aria-busy', String(busy));
}
function selectFiles(files) {
  if (busy) return;
  if (files.length !== 1) { message('Choose one video at a time. Download it before adding the next.', true); return; }
  const problem = videoProblem(files[0]);
  if (problem) { message(problem, true); return; }
  clearResult();
  file = files[0];
  $('#video-file-name').textContent = file.name;
  $('#video-file-size').textContent = `${formatSize(file.size)} · ${file.name.split('.').pop().toUpperCase()} · Original untouched`;
  $('#video-selection').hidden = false;
  $('#video-placeholder').hidden = true;
  $('#video-progress').hidden = true;
  message('Ready. Choose your settings, then convert.');
  controls();
}
$('#video-browse').onclick = () => $('#video-input').click();
$('#video-input').onchange = e => { if (e.target.files.length) selectFiles([...e.target.files]); e.target.value = ''; };
let dragDepth = 0;
const dropzone = $('#video-dropzone');
dropzone.addEventListener('dragenter', e => { e.preventDefault(); dragDepth++; if (!busy) dropzone.classList.add('dragging'); });
dropzone.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = busy ? 'none' : 'copy'; });
dropzone.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; dropzone.classList.remove('dragging'); } });
dropzone.addEventListener('drop', e => { e.preventDefault(); dragDepth = 0; dropzone.classList.remove('dragging'); selectFiles([...e.dataTransfer.files]); });
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());
$('#video-clear').onclick = () => {
  if (busy) return;
  clearResult(); file = undefined;
  $('#video-selection').hidden = true;
  $('#video-placeholder').hidden = false;
  $('#video-progress').hidden = true;
  message('Your video stays on this device.'); controls();
};
$('#video-settings').onchange = () => {
  if (busy) return;
  clearResult(); $('#video-progress').hidden = true;
  if (file) message('Settings updated. Convert again to create a new export.');
};

function reportProgress(percent) {
  if (!busy || cancelled) return;
  lastPercent = Math.max(lastPercent, Math.min(99, Math.round(percent)));
  $('#video-progress').value = lastPercent;
  // A live region for every frame is noisy. Only announce percentage changes.
  const label = `${progressLabel} · ${lastPercent}%`;
  if ($('#video-status').textContent !== label) message(label);
}
function stop(reason) {
  if (!busy || cancelled) return;
  cancelled = true;
  timedOut = reason === 'timeout';
  engine?.terminate();
  controls();
}
$('#video-cancel').onclick = () => stop('user');

$('#video-settings').onsubmit = async e => {
  e.preventDefault();
  if (busy || !file) return;
  const source = file;
  const config = {quality: Number($('#video-quality').value), edge: Number($('#video-resolution').value), fps: Number($('#video-fps').value), audio: $('#video-audio').value};
  const input = `input.${source.name.split('.').pop().toLowerCase()}`;
  const args = conversionArgs(input, config);
  clearResult(); busy = true; cancelled = false; timedOut = false; duration = 0; lastPercent = 0;
  controls();
  $('#video-progress').hidden = false;
  $('#video-progress').removeAttribute('value');
  message('Loading the video engine (about 32 MB on first use)…');
  // This also bounds worker-load failures, which some browsers do not report.
  let timer = setTimeout(() => stop('timeout'), 180_000);
  try {
    const {FFmpeg} = await import('./vendor/ffmpeg/wrapper/index.js');
    if (cancelled) throw new Error('Cancelled');
    engine = new FFmpeg();
    engine.on('log', ({message: line}) => {
      const match = line.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (match && !duration) duration = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
      if (/Output #0/.test(line)) { progressLabel = 'Compressing to MP4'; reportProgress(0); }
    });
    engine.on('progress', ({progress, time}) => {
      const fraction = duration ? time / 1_000_000 / duration : progress;
      if (Number.isFinite(fraction) && fraction >= 0) reportProgress(fraction * 100);
    });
    await engine.load({
      coreURL: new URL('./vendor/ffmpeg/core/ffmpeg-core.js', import.meta.url).href,
      wasmURL: new URL('./vendor/ffmpeg/core/ffmpeg-core.wasm', import.meta.url).href
    });
    clearTimeout(timer);
    timer = setTimeout(() => stop('timeout'), 30 * 60_000);
    message('Reading your video locally…');
    const bytes = new Uint8Array(await source.arrayBuffer());
    if (cancelled) throw new Error('Cancelled');
    await engine.writeFile(input, bytes);
    progressLabel = 'Converting your video';
    message('Converting your video. Keep this tab open…');
    const code = await engine.exec(args);
    if (code !== 0) throw new Error('Conversion failed');
    message('Preparing your MP4 download…');
    const data = await engine.readFile('output.mp4');
    if (!data.byteLength) throw new Error('Empty output');
    const blob = new Blob([data], {type: 'video/mp4'});
    resultURL = URL.createObjectURL(blob);
    $('#video-preview').src = resultURL;
    $('#video-download').href = resultURL;
    $('#video-download').download = `${source.name.replace(/\.[^.]+$/, '')}-still.mp4`;
    const saved = Math.round(100 * (1 - blob.size / source.size));
    $('#video-result-size').textContent = `${formatSize(source.size)} → ${formatSize(blob.size)}${saved > 0 ? ` · ${saved}% smaller` : ' · Converted to MP4'}`;
    $('#video-result-note').textContent = blob.size >= source.size
      ? 'This MP4 is not smaller than the original. Try Smaller file quality or a lower resolution.'
      : 'Ready to share. Play the preview to check picture and sound, then download.';
    $('#video-result').hidden = false;
    $('#video-progress').value = 100;
    message('Done. Your MP4 is ready to download.');
  } catch (error) {
    $('#video-progress').hidden = true;
    if (cancelled) message(timedOut ? 'Processing took too long. Try a shorter clip or a lower resolution on a desktop browser.' : 'Conversion cancelled. Your original is untouched. You can try again.', timedOut);
    else message('This video could not be converted. Its codec may be unsupported, the file may be damaged, or this device may be low on memory. Try a shorter clip in the latest Chrome or Edge.', true);
  } finally {
    clearTimeout(timer);
    engine?.terminate(); engine = undefined;
    busy = false; controls();
  }
};
window.addEventListener('beforeunload', e => { if (busy) { e.preventDefault(); e.returnValue = ''; } });
controls();
