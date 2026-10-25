// ZIP store: JPEG and WebP are already compressed, so an additional pass adds little value.
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
function record(length){const bytes=new Uint8Array(length);return {bytes,view:new DataView(bytes.buffer)};}
export async function makeZip(files){
  const body=[],central=[];let offset=0,centralSize=0;
  for(const {name,blob} of files){
    const data=new Uint8Array(await blob.arrayBuffer()),filename=new TextEncoder().encode(name),crc=crc32(data);
    const local=record(30+filename.length),v=local.view;
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,filename.length,true);local.bytes.set(filename,30);
    body.push(local.bytes,data);
    const entry=record(46+filename.length),c=entry.view;
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,filename.length,true);c.setUint32(42,offset,true);entry.bytes.set(filename,46);central.push(entry.bytes);centralSize+=entry.bytes.length;offset+=local.bytes.length+data.length;
  }
  const end=record(22),v=end.view;v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,centralSize,true);v.setUint32(16,offset,true);
  return new Blob([...body,...central,end.bytes],{type:'application/zip'});
}
