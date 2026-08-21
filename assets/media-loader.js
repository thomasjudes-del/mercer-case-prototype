(async function(){
  try{
    const names=['mercer-sprite.part1','mercer-sprite.part2','mercer-sprite.part3','mercer-sprite.part4'];
    const chunks=await Promise.all(names.map(async name=>{
      const r=await fetch(`assets/${name}?v=6`,{cache:'no-store'});
      if(!r.ok) throw new Error(`${name}: ${r.status}`);
      return new Uint8Array(await r.arrayBuffer());
    }));
    const total=chunks.reduce((n,c)=>n+c.length,0);
    const bytes=new Uint8Array(total);
    let offset=0;
    chunks.forEach(c=>{bytes.set(c,offset);offset+=c.length});
    const mediaUrl=URL.createObjectURL(new Blob([bytes],{type:'image/jpeg'}));
    document.documentElement.style.setProperty('--media',`url("${mediaUrl}")`);
    window.__mercerMediaUrl=mediaUrl;
    document.documentElement.classList.add('media-ready');
  }catch(e){
    console.error('Mercer media load failed',e);
    document.documentElement.classList.add('media-error');
  }
})();