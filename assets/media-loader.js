(async function(){
  try{
    const names=['media-small-1.txt','media-small-2.txt','media-small-3.txt'];
    const parts=await Promise.all(names.map(async name=>{
      const r=await fetch(`assets/${name}?v=5`,{cache:'no-store'});
      if(!r.ok) throw new Error(`${name}: ${r.status}`);
      return (await r.text()).trim();
    }));
    document.documentElement.style.setProperty('--media',`url("data:image/jpeg;base64,${parts.join('')}")`);
    document.documentElement.classList.add('media-ready');
  }catch(e){
    console.error('Mercer media load failed',e);
    document.documentElement.classList.add('media-error');
  }
})();