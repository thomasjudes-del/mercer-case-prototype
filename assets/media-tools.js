(function(){
  let activeUrl=null;
  const defs={
    burn:{kind:'evidence',index:0,title:{en:'Burned Vehicle - Scene Photo',fr:'Vehicule incendie - photo de scene'},file:'mercer-burned-vehicle-2016.jpg'},
    plate:{kind:'evidence',index:1,title:{en:'Vehicle - Plate Close-up',fr:'Vehicule - gros plan de la plaque'},file:'mercer-plate-482-LZK.jpg'},
    parking:{kind:'evidence',index:2,title:{en:'Parking Lot - Vehicle Photo',fr:'Parking - photo du vehicule'},file:'mercer-westway-vehicle-2026.jpg'},
    emily:{kind:'portrait',index:0,title:{en:'Emily Mercer',fr:'Emily Mercer'},file:'emily-mercer.jpg'},
    daniel:{kind:'portrait',index:1,title:{en:'Daniel Reyes',fr:'Daniel Reyes'},file:'daniel-reyes.jpg'},
    harris:{kind:'portrait',index:2,title:{en:'Officer Mark Harris',fr:'Officer Mark Harris'},file:'officer-mark-harris.jpg'},
    chloe:{kind:'portrait',index:3,title:{en:'Chloe Mercer',fr:'Chloe Mercer'},file:'chloe-mercer.jpg'}
  };
  const lang=()=>typeof S!=='undefined'&&S.lang==='fr'?'fr':'en';
  const text=(en,fr)=>lang()==='fr'?fr:en;

  async function waitForMedia(){
    for(let i=0;i<120;i++){
      if(window.__mercerMediaUrl)return window.__mercerMediaUrl;
      await new Promise(r=>setTimeout(r,50));
    }
    throw new Error('Media source is not ready');
  }

  async function loadSprite(){
    const url=await waitForMedia();
    const img=new Image();
    img.src=url;
    if(img.decode)await img.decode();
    else await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
    return img;
  }

  function targetDef(el){
    if(el.classList.contains('evidenceImg')){
      for(const id of ['burn','plate','parking'])if(el.classList.contains(id))return defs[id];
    }
    if(el.classList.contains('portrait')){
      const owner=el.closest('.emily,.daniel,.harris,.chloe');
      if(owner){
        for(const id of ['emily','daniel','harris','chloe'])if(owner.classList.contains(id))return defs[id];
      }
    }
    return null;
  }

  async function crop(def){
    const img=await loadSprite();
    const half=img.naturalHeight/2;
    let sx,sy,sw,sh;
    if(def.kind==='portrait'){
      sw=img.naturalWidth/4;sh=half;sx=def.index*sw;sy=0;
    }else{
      sw=img.naturalWidth/3;sh=half;sx=def.index*sw;sy=half;
    }
    const canvas=document.createElement('canvas');
    canvas.width=Math.round(sw);canvas.height=Math.round(sh);
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(img,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));
    if(!blob)throw new Error('Could not create image');
    return {blob,width:canvas.width,height:canvas.height};
  }

  function modal(){
    let m=document.getElementById('mediaViewer');
    if(m)return m;
    m=document.createElement('div');
    m.id='mediaViewer';m.className='mediaViewer';m.setAttribute('aria-hidden','true');
    m.innerHTML=`<div class="mvTop"><div><div class="mvEy">${text('EVIDENCE VIEWER','VISIONNEUSE')}</div><div class="mvTitle"></div><div class="mvMeta"></div></div><button class="mvClose" aria-label="Close">×</button></div><div class="mvStage"><img class="mvImage" alt=""></div><div class="mvActions"><a class="mvAction mvOpen" target="_blank" rel="noopener">${text('OPEN ORIGINAL','OUVRIR L ORIGINAL')}</a><a class="mvAction mvDownload">${text('DOWNLOAD','TELECHARGER')}</a></div>`;
    document.body.appendChild(m);
    m.querySelector('.mvClose').onclick=close;
    m.addEventListener('click',e=>{if(e.target===m)close()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&m.classList.contains('show'))close()});
    return m;
  }

  function close(){
    const m=document.getElementById('mediaViewer');
    if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true');document.body.classList.remove('mediaViewerOpen')}
    if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl=null}
  }

  async function openDef(def){
    const m=modal();
    m.querySelector('.mvTitle').textContent=def.title[lang()];
    m.querySelector('.mvMeta').textContent=text('Loading original pixels...','Chargement des pixels source...');
    m.querySelector('.mvImage').removeAttribute('src');
    m.classList.add('show');m.setAttribute('aria-hidden','false');document.body.classList.add('mediaViewerOpen');
    try{
      const out=await crop(def);
      if(activeUrl)URL.revokeObjectURL(activeUrl);
      activeUrl=URL.createObjectURL(out.blob);
      const im=m.querySelector('.mvImage');im.src=activeUrl;im.alt=def.title[lang()];
      m.querySelector('.mvMeta').textContent=`${out.width} × ${out.height} px · ${text('source resolution','resolution source')}`;
      const open=m.querySelector('.mvOpen');open.href=activeUrl;
      const dl=m.querySelector('.mvDownload');dl.href=activeUrl;dl.download=def.file;
    }catch(err){
      console.error(err);
      m.querySelector('.mvMeta').textContent=text('Image unavailable','Image indisponible');
    }
  }

  function decorate(root=document){
    root.querySelectorAll('.evidenceImg:not([data-inspect]),.portrait:not([data-inspect])').forEach(el=>{
      el.dataset.inspect='1';el.classList.add('mediaInspectable');el.setAttribute('role','button');el.setAttribute('tabindex','0');
      el.setAttribute('aria-label',el.classList.contains('portrait')?text('Open portrait full screen','Ouvrir le portrait en plein ecran'):text('Open image full screen','Ouvrir l image en plein ecran'));
    });
  }

  document.addEventListener('click',e=>{
    const el=e.target.closest('.evidenceImg.mediaInspectable,.portrait.mediaInspectable');
    if(!el)return;
    const def=targetDef(el);if(!def)return;
    e.preventDefault();e.stopPropagation();openDef(def);
  });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    const el=e.target.closest('.evidenceImg.mediaInspectable,.portrait.mediaInspectable');
    if(!el)return;
    const def=targetDef(el);if(!def)return;
    e.preventDefault();e.stopPropagation();openDef(def);
  });
  const observer=new MutationObserver(()=>decorate());
  observer.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>decorate());else decorate();
})();
