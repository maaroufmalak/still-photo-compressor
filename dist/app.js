import {makeZip} from './zip.js';
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const state={files:[],target:2,format:'webp',busy:false,stop:false,nextId:1};
const icon=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const size=bytes=>bytes>=1_000_000?`${(bytes/1_000_000).toFixed(2)} MB`:`${Math.max(.1,bytes/1000).toFixed(1)} KB`;
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),5500);}
const outputName=(item)=>`${item.file.name.replace(/\.[^.]+$/,'')}-web.${item.result.format==='jpeg'?'jpg':'webp'}`;
function release(item){if(item.beforeURL)URL.revokeObjectURL(item.beforeURL);if(item.afterURL)URL.revokeObjectURL(item.afterURL);}
function settings(){return {target:state.target==='custom'?Number($('#custom-target').value):state.target,format:state.format,dimensions:Number($('#dimensions').value)};}
function updateControls(){
  const queued=state.files.filter(f=>f.status==='queued'||f.status==='error'),done=state.files.filter(f=>f.status==='done');
  $('#compress-button').disabled=state.busy||!queued.length;
  $('#compress-button').innerHTML=state.busy?'Working on your photos…':`${queued.length?`Compress ${queued.length} photo${queued.length===1?'':'s'}`:'Compress photos'} <span class="button-icon">${icon('arrow')}</span>`;
  $('#cancel-button').hidden=!state.busy;$('#cancel-button').disabled=state.stop;
  $('#cancel-button').textContent=state.stop?'Stopping after this photo…':'Stop after this photo';
  $('#clear-button').hidden=!state.files.length;$('#clear-button').disabled=state.busy;
  $('#download-all').hidden=!done.length;$('#photo-count').textContent=state.files.length;
  $('#empty-state').hidden=!!state.files.length;
  all('#settings button[data-target],#settings button[data-format],#settings select,#custom-target').forEach(el=>el.disabled=state.busy);
  $('#results-caption').textContent=state.busy?'Taking care of the details. Large RAW photos may take a moment.':state.files.length?`${done.length} ready${queued.length?` · ${queued.length} waiting`:''} · Originals are untouched.`:'A lighter version is just a drop away.';
  $('#summary').hidden=!done.length;
  if(done.length){const original=done.reduce((s,i)=>s+i.file.size,0),compressed=done.reduce((s,i)=>s+i.result.blob.size,0),saved=original-compressed;$('#summary').innerHTML=`<span>${icon('leaf')} <strong>${saved>0?`${size(saved)} lighter`:'Ready for the web'}</strong> · ${size(original)} → ${size(compressed)}</span><span>${saved>0?`${Math.round(100*saved/original)}% less weight. `:''}${done.length} photo${done.length===1?'':'s'}, ready to go.</span>`;}
}
function render(){
  $('#file-list').innerHTML=state.files.map(item=>{
    const result=item.result;
    let meta=`${size(item.file.size)} · ${item.file.name.split('.').pop().toUpperCase()} · Ready to compress`;
    let metaClass='';
    if(item.status==='processing')meta=item.stage||'Getting ready…';
    if(item.status==='error'){meta=item.error;metaClass='error';}
    if(result){meta=`${result.width.toLocaleString()} × ${result.height.toLocaleString()} · ${result.format==='jpeg'?'JPEG':'WebP'} · ${Math.round(result.quality*100)}% encoding quality${result.raw?' · Developed from RAW':''}`;if(result.overTarget){meta+=' · Above target: original dimensions preserved';metaClass='warning';}}
    const difference=result?Math.round(100*(1-result.blob.size/item.file.size)):0;
    return `<article class="file-row" data-id="${item.id}"><div class="file-thumbnail">${item.afterURL?`<img src="${item.afterURL}" alt="">`:item.status==='processing'?'<span class="spinner"></span>':icon('image')}</div><div class="file-info"><div class="file-name" title="${escapeHTML(item.file.name)}">${escapeHTML(item.file.name)}</div><div class="file-meta ${metaClass}" role="status">${escapeHTML(meta)}</div></div><div class="file-size">${result?size(result.blob.size):size(item.file.size)}<small>${result?(difference>0?`${difference}% smaller`:'Web export'):item.status==='error'?'Needs attention':item.status==='processing'?'In progress':'Original'}</small></div><div class="row-actions">${result?`<button data-action="preview" aria-label="Compare ${escapeHTML(item.file.name)}">${icon('image')}Compare</button><button data-action="download" aria-label="Download ${escapeHTML(item.file.name)}">${icon('download')}</button>`:''}${!state.busy?`<button data-action="remove" class="remove" aria-label="Remove ${escapeHTML(item.file.name)}">${icon('x')}</button>`:''}</div></article>`;
  }).join('');updateControls();
}
function addFiles(incoming){
  let added=0;const problems=[];
  for(const file of incoming){
    if(state.files.length>=30){problems.push('A batch can hold 30 photos. Download and clear this batch before adding more.');break;}
    if(!/\.(dng|raw|cr2|cr3|nef|arw|raf|rw2|orf|pef|heic|heif|jpe?g|png|webp|avif)$/i.test(file.name)){problems.push(`${file.name}: choose a supported photo format.`);continue;}
    if(!file.size){problems.push(`${file.name} is empty.`);continue;}
    if(file.size>200_000_000){problems.push(`${file.name} is over 200 MB. Export a smaller original first.`);continue;}
    if(state.files.some(i=>i.file.name===file.name&&i.file.size===file.size&&i.file.lastModified===file.lastModified)){problems.push(`${file.name} is already in this batch.`);continue;}
    state.files.push({id:state.nextId++,file,status:'queued'});added++;
  }
  render();if(problems.length)toast(problems[0]);else if(added)toast(`${added} photo${added===1?'':'s'} added. Choose your settings, then compress.`);
}
$('#browse-button').onclick=()=>$('#file-input').click();
$('#file-input').onchange=e=>{addFiles([...e.target.files]);e.target.value='';};
let dragDepth=0;
$('#dropzone').addEventListener('dragenter',e=>{e.preventDefault();dragDepth++;$('#dropzone').classList.add('dragging');});
$('#dropzone').addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';});
$('#dropzone').addEventListener('dragleave',e=>{e.preventDefault();if(--dragDepth<=0){dragDepth=0;$('#dropzone').classList.remove('dragging');}});
$('#dropzone').addEventListener('drop',e=>{e.preventDefault();dragDepth=0;$('#dropzone').classList.remove('dragging');addFiles([...e.dataTransfer.files]);});
window.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('drop',e=>e.preventDefault());
$('#sample-button').onclick=async()=>{const button=$('#sample-button');button.disabled=true;button.textContent='Getting the sample…';try{const response=await fetch('./sample.jpg');if(!response.ok)throw Error();addFiles([new File([await response.blob()],'alpine-moment.jpg',{type:'image/jpeg',lastModified:1})]);}catch{toast('The sample could not load. You can still add your own photos.');}finally{button.disabled=false;button.innerHTML=`Try a sample photo ${icon('arrow')}`;}};
all('[data-target]').forEach(button=>button.onclick=()=>{state.target=button.dataset.target==='custom'?'custom':Number(button.dataset.target);all('[data-target]').forEach(el=>{el.classList.toggle('selected',el===button);el.setAttribute('aria-pressed',el===button);});$('#custom-wrap').hidden=state.target!=='custom';if(state.target==='custom')$('#custom-target').focus();invalidate();});
all('[data-format]').forEach(button=>button.onclick=()=>{state.format=button.dataset.format;all('[data-format]').forEach(el=>{el.classList.toggle('selected',el===button);el.setAttribute('aria-pressed',el===button);});$('#format-help').textContent=state.format==='webp'?'Great detail. Even smaller files.':'The familiar format. Works almost everywhere.';invalidate();});
function invalidate(){let changed=false;for(const item of state.files){if(item.status==='done'){release(item);delete item.result;delete item.beforeURL;delete item.afterURL;item.status='queued';changed=true;}}render();if(changed)toast('Settings changed. Compress again to create updated exports.');}
$('#dimensions').onchange=invalidate;$('#custom-target').onchange=invalidate;
function process(item,config){return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./compressor.js',import.meta.url));
  const timer=setTimeout(()=>{worker.terminate();reject(new Error('This photo took too long for this device. Try a JPEG export from Photos, then add it.'));},240_000);
  const finish=(callback,value)=>{clearTimeout(timer);worker.terminate();callback(value);};
  worker.onmessage=({data})=>{if(data.type==='progress'){item.stage=data.stage;render();}else if(data.type==='done')finish(resolve,data);else if(data.type==='error')finish(reject,new Error(data.error));};
  worker.onerror=()=>finish(reject,new Error('The image worker could not finish. Try a smaller photo or the latest Chrome, Edge or Safari.'));
  worker.postMessage({file:item.file,settings:config});
});}
$('#settings').onsubmit=async e=>{
  e.preventDefault();if(state.busy)return;
  const config=settings();if(!Number.isFinite(config.target)||config.target<.1||config.target>20){toast('Choose a target between 0.1 and 20 MB.');$('#custom-target').focus();return;}
  const queue=state.files.filter(i=>i.status==='queued'||i.status==='error');if(!queue.length)return;
  state.busy=true;state.stop=false;render();
  try{for(const item of queue){if(state.stop)break;item.status='processing';item.stage='Getting ready…';delete item.error;render();try{item.result=await process(item,config);item.afterURL=URL.createObjectURL(item.result.blob);item.beforeURL=URL.createObjectURL(item.result.preview);item.status='done';}catch(error){item.status='error';item.error=error.message;}render();}}
  finally{state.busy=false;render();const done=state.files.filter(i=>i.status==='done').length;toast(state.stop?'Batch paused. Your completed exports are ready.':done?`${done} photo${done===1?' is':'s are'} ready. Compare the details, then download.`:'These photos could not be converted. See the details next to each file.');}
};
$('#cancel-button').onclick=()=>{state.stop=true;updateControls();};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60_000);}
$('#file-list').onclick=e=>{const button=e.target.closest('button[data-action]');if(!button)return;const item=state.files.find(i=>i.id===Number(button.closest('[data-id]').dataset.id));if(!item)return;
  if(button.dataset.action==='remove'&&!state.busy){release(item);state.files=state.files.filter(i=>i!==item);render();}
  if(button.dataset.action==='download'&&item.result)download(item.result.blob,outputName(item));
  if(button.dataset.action==='preview'&&item.result){$('#preview-name').textContent=item.file.name;$('#preview-before').src=item.beforeURL;$('#preview-after').src=item.afterURL;$('#compare-slider').value=50;$('#comparison').style.setProperty('--split','50%');$('#preview-details').textContent=`${size(item.file.size)} → ${size(item.result.blob.size)} · ${item.result.width.toLocaleString()} × ${item.result.height.toLocaleString()}`;$('#preview-dialog').showModal();}
};
$('#clear-button').onclick=()=>{if(state.busy)return;state.files.forEach(release);state.files=[];render();};
$('#download-all').onclick=async()=>{const button=$('#download-all');button.disabled=true;try{const used=new Set();const files=state.files.filter(i=>i.result).map(i=>{let name=outputName(i),n=2;while(used.has(name.toLowerCase()))name=outputName(i).replace(/(\.[^.]+)$/,`-${n++}$1`);used.add(name.toLowerCase());return {name,blob:i.result.blob};});download(await makeZip(files),'still-web-photos.zip');toast('Your ZIP download is ready.');}catch{toast('Could not prepare the ZIP. Download each photo using its download button.');}finally{button.disabled=false;}};
$('#compare-slider').oninput=e=>$('#comparison').style.setProperty('--split',`${e.target.value}%`);
$('#close-preview').onclick=()=>$('#preview-dialog').close();$('#close-info').onclick=()=>$('#info-dialog').close();
all('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}));
const content={
  help:`<h2>Big photos, a smaller footprint.</h2><h3>01 / Add your originals</h3><p>Choose or drop iPhone RAW / DNG, HEIC, JPEG, PNG or WebP photos. Add up to 30 photos, each up to 200 MB.</p><h3>02 / Pick a size and format</h3><p>2 MB is a good starting point for large website photos. WebP usually makes smaller files; JPEG is a familiar alternative. Set a longest edge for the size your website needs.</p><h3>03 / Compare, then download</h3><p>Still finds the highest encoding quality under your target, with an 82% quality floor. If needed, it reduces dimensions instead of pushing compression lower. “Original dimensions” preserves pixel dimensions and can exceed the size target.</p><p>Compare the decoded original and export, then download each image or the whole batch as a ZIP. Changing settings resets exports so you can make a fresh version.</p>`,
  privacy:`<h2>Your photos stay with you.</h2><p>All decoding, resizing and compression happens in your browser. Photo contents are never sent to a server, stored in an account, or used for training by this tool.</p><p>Original files stay untouched. Exports exist in this tab until you download them; clearing the batch or closing the tab releases them. Save your downloads before you leave.</p><p>The app loads its code and sample photo from its host, and fonts from Google Fonts. None of these requests include your photos.</p>`,
  quality:`<h2>Small files. Honest expectations.</h2><p>A 100 MB RAW file contains far more editing information than a website needs. Still develops it into a standard 8-bit web image, then compresses it while prioritizing visible detail.</p><p>WebP and JPEG exports are lossy. They cannot keep every bit of RAW data, HDR range or editing flexibility. RAW development may also look different from Apple Photos’ tone mapping. Keep your RAW originals as your master copies.</p><p>The comparison is scaled to fit the screen. For critical work, inspect your downloaded image at full size. “98% quality” is an encoder setting, not a measurement of how much original information remains.</p><p>RAW and HEIC support depends on the camera and compression variant. Newer iPhone ProRAW files using JPEG XL may need a full-quality JPEG export from Photos first. If a file cannot be decoded, Still shows an error. It never silently substitutes a small embedded thumbnail. Large RAW files work best in a desktop browser.</p><p>Exports remove original EXIF / GPS metadata. Web output is standard dynamic range; transparent images get a white background when exported as JPEG. File-size targets use decimal MB (1 MB = 1,000,000 bytes).</p><p>Powered by <a href="https://github.com/anthonygreco/rawconvert-wasm" target="_blank" rel="noreferrer">RawConvert / LibRaw</a> and <a href="https://github.com/hoppergee/heic-to" target="_blank" rel="noreferrer">heic-to / libheif</a>. <a href="./vendor/NOTICES.txt" target="_blank">Open-source notices</a>. Sample photograph via <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a>.</p>`
};
function info(kind){$('#info-content').innerHTML=content[kind];$('#info-dialog').showModal();}
$('#help-button').onclick=()=>info('help');$('#privacy-button').onclick=()=>info('privacy');$('#quality-button').onclick=()=>info('quality');
window.addEventListener('beforeunload',e=>{if(state.busy){e.preventDefault();e.returnValue='';}});
render();
