/* A fresh worker for each photo bounds memory use and keeps large RAW work off the UI. */
const progress = (stage) => self.postMessage({type:'progress',stage});
const rawExtensions = /\.(dng|raw|cr2|cr3|nef|arw|raf|rw2|orf|pef)$/i;
const canvasFor = (width,height) => {
  const canvas=new OffscreenCanvas(width,height);
  const ctx=canvas.getContext('2d',{colorSpace:'srgb'});
  if(!ctx)throw new Error('Your browser could not create an image canvas. Try the latest Chrome, Edge or Safari.');
  return {canvas,ctx};
};
async function decode(file){
  if(rawExtensions.test(file.name)){
    progress('Developing RAW photo…');
    const {RawConvert}=await import('./vendor/rawconvert/index.js');
    let raw;
    try{
      raw=await RawConvert.init({coreUrl:new URL('./vendor/rawconvert/rawconvert-core.js',self.location.href).href,wasmUrl:new URL('./vendor/rawconvert/rawconvert-core.wasm',self.location.href).href});
      const metadata=raw.load(await file.arrayBuffer(),file.name);
      if(metadata.width*metadata.height>110_000_000)throw new Error('This photo is too large to develop in this browser. Export a full-quality JPEG from Photos first.');
      const result=raw.process({colorSpace:'srgb',cameraWhiteBalance:true,outputBps:8,interpolation:'ahd',halfSize:false});
      const {width,height,colors,data}=result;
      if(!width||!height||data.length<width*height*colors)throw new Error('The RAW decoder returned an incomplete image.');
      const rgba=new Uint8ClampedArray(width*height*4);
      for(let i=0,j=0;i<rgba.length;i+=4,j+=colors){rgba[i]=data[j];rgba[i+1]=data[j+(colors>1?1:0)];rgba[i+2]=data[j+(colors>2?2:0)];rgba[i+3]=255;}
      const source=new ImageData(rgba,width,height,{colorSpace:'srgb'});
      const bitmap=await createImageBitmap(source);
      return {bitmap,raw:true};
    }catch(error){
      console.warn('RAW decode:',error.message);
      throw new Error('This RAW variant could not be developed here. Export a full-quality JPEG from Apple Photos or Lightroom, then add it. Your original is untouched.');
    }finally{raw?.dispose();}
  }
  progress('Reading photo…');
  try{return {bitmap:await createImageBitmap(file,{imageOrientation:'from-image'})};}
  catch(error){
    if(/\.(heic|heif)$/i.test(file.name)||/heic|heif/.test(file.type)){
      progress('Decoding iPhone HEIC…');
      const {heicTo}=await import('./vendor/heic-to.js');
      return {bitmap:await heicTo({blob:file,type:'bitmap'})};
    }
    throw new Error('This image could not be read. Try a valid DNG, HEIC, JPEG, PNG or WebP photo.');
  }
}
self.onmessage=async({data:{file,settings}})=>{
  let source;
  try{
    if(typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined')throw new Error('This browser is missing image tools. Open Still in the latest Chrome, Edge or Safari.');
    const decoded=await decode(file);source=decoded.bitmap;
    const originalWidth=source.width,originalHeight=source.height;
    if(!originalWidth||!originalHeight||originalWidth*originalHeight>110_000_000)throw new Error('This image exceeds the browser’s safe processing size. Please use a smaller export.');
    const mime=settings.format==='jpeg'?'image/jpeg':'image/webp';
    // A photo that is already below the ceiling should get lighter, too.
    const maxBytes=Math.floor(Math.min(settings.target*1_000_000,decoded.raw||/\.(heic|heif)$/i.test(file.name)?Infinity:file.size*.98));
    const limit=settings.dimensions||Math.max(originalWidth,originalHeight);
    let scale=Math.min(1,limit/Math.max(originalWidth,originalHeight));
    let width=Math.max(1,Math.round(originalWidth*scale)),height=Math.max(1,Math.round(originalHeight*scale));
    const {canvas,ctx}=canvasFor(width,height);
    function draw(){canvas.width=width;canvas.height=height;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(mime==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);}ctx.drawImage(source,0,0,width,height);}
    draw();progress('Finding the best quality…');
    const encode=async(quality)=>{const blob=await canvas.convertToBlob({type:mime,quality});if(blob.type!==mime)throw new Error('Your browser cannot export this format. Choose JPEG and try again.');return blob;};
    let quality=.98,blob=await encode(quality);
    if(blob.size>maxBytes){
      quality=.82;let floor=await encode(quality);
      if(floor.size>maxBytes&&settings.dimensions!==0){
        for(let step=0;step<12&&floor.size>maxBytes;step++){
          progress('Balancing size and detail…');
          const factor=Math.min(.92,Math.sqrt(maxBytes/floor.size)*.96);
          width=Math.max(1,Math.floor(width*factor));height=Math.max(1,Math.floor(height*factor));draw();floor=await encode(.82);
        }
      }
      if(floor.size<=maxBytes){
        let low=.82,high=.98;blob=floor;
        for(let i=0;i<7;i++){
          const mid=(low+high)/2,candidate=await encode(mid);
          if(candidate.size<=maxBytes){low=mid;quality=mid;blob=candidate;}else high=mid;
        }
      }else blob=floor;
    }
    progress('Preparing your comparison…');
    const previewScale=Math.min(1,2048/Math.max(originalWidth,originalHeight));
    const before=canvasFor(Math.max(1,Math.round(originalWidth*previewScale)),Math.max(1,Math.round(originalHeight*previewScale)));
    before.ctx.drawImage(source,0,0,before.canvas.width,before.canvas.height);
    const preview=await before.canvas.convertToBlob({type:'image/webp',quality:.98});
    self.postMessage({type:'done',blob,preview,width,height,originalWidth,originalHeight,quality,raw:!!decoded.raw,overTarget:blob.size>settings.target*1_000_000,format:settings.format});
  }catch(error){self.postMessage({type:'error',error:error.message||'Could not compress this photo. Try a smaller file or a different format.'});}
  finally{source?.close();}
};
