import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {videoProblem, conversionArgs, MAX_VIDEO_BYTES} from '../dist/video-options.js';

test('video validation rejects empty, oversized and unsupported inputs', () => {
  assert.equal(videoProblem({name:'holiday.MOV', size:MAX_VIDEO_BYTES}), '');
  assert.ok(videoProblem({name:'holiday.mov', size:MAX_VIDEO_BYTES + 1}));
  assert.ok(videoProblem({name:'holiday.avi', size:0}));
  assert.ok(videoProblem({name:'notes.txt', size:10}));
  assert.throws(() => conversionArgs('input.mov', {quality:0, edge:1920, fps:0, audio:'keep'}));
});

// The browser wrapper is UI-tested separately. This test drives the same
// shipped WASM codec to check the actual media output, not just argument text.
const coreURL = new URL('../dist/vendor/ffmpeg/core/ffmpeg-core.js', import.meta.url);
globalThis.self = {location:{href:coreURL.href}};
const {default:createCore} = await import(`data:text/javascript;base64,${(await readFile(coreURL)).toString('base64')}`);
const wasmBinary = await readFile(new URL('../dist/vendor/ffmpeg/core/ffmpeg-core.wasm', import.meta.url));

for (const scenario of [
  {name:'AVI → MP4 preserves audio and avoids upscaling', extension:'avi', width:320, height:180, quality:23, edge:1920, fps:0, audio:'keep', expectedWidth:320, expectedHeight:180, expectedFps:'30/1'},
  {name:'Portrait MOV → MP4 resizes, changes frame rate and removes audio', extension:'mov', width:540, height:960, quality:28, edge:854, fps:24, audio:'mute', expectedWidth:480, expectedHeight:854, expectedFps:'24/1'}
]) {
  test(scenario.name, async () => {
    const core = await createCore({wasmBinary});
    const logs=[];
    core.setLogger(({message}) => logs.push(message));
    const input = `input.${scenario.extension}`;
    core.exec('-f','lavfi','-i',`testsrc2=size=${scenario.width}x${scenario.height}:rate=30`,
      '-f','lavfi','-i','sine=frequency=440:sample_rate=44100','-t','0.4','-threads','1',
      '-c:v','mpeg4','-q:v','3','-c:a','pcm_s16le',input);
    assert.equal(core.ret, 0, logs.slice(-10).join('\n'));
    core.reset();
    core.exec(...conversionArgs(input, scenario));
    assert.equal(core.ret, 0, logs.slice(-10).join('\n'));
    core.reset();
    core.ffprobe('-v','error','-show_streams','-show_format','-of','json','output.mp4','-o','probe.json');
    const probe=JSON.parse(new TextDecoder().decode(core.FS.readFile('probe.json')));
    const video=probe.streams.find(s => s.codec_type === 'video');
    const audio=probe.streams.find(s => s.codec_type === 'audio');
    assert.equal(video.codec_name,'h264');
    assert.equal(video.pix_fmt,'yuv420p');
    assert.equal(video.width,scenario.expectedWidth);
    assert.equal(video.height,scenario.expectedHeight);
    assert.equal(video.r_frame_rate,scenario.expectedFps);
    if (scenario.audio === 'keep') assert.equal(audio.codec_name,'aac');
    else assert.equal(audio,undefined);
    assert.ok(Number(probe.format.duration) >= .4 && Number(probe.format.duration) < .6);
    const output=Buffer.from(core.FS.readFile('output.mp4'));
    assert.ok(output.indexOf('moov') > 0 && output.indexOf('moov') < output.indexOf('mdat'), 'MP4 should start playing before full download');
  });
}
