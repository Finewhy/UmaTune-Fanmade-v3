(()=>{
const LS=localStorage,B=document.body,$$=s=>document.querySelectorAll(s);
const dbp=new Promise(r=>{try{const q=indexedDB.open("umatune",1);q.onupgradeneeded=()=>q.result.createObjectStore("audio");q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch{r(null)}});
const idb=async(m,fn)=>{const db=await dbp;if(!db)return;return new Promise(res=>{const rq=fn(db.transaction("audio",m).objectStore("audio"));rq.onsuccess=()=>res(rq.result);rq.onerror=()=>res()})};
const pick=(acc,cb)=>{const i=document.createElement("input");i.type="file";i.accept=acc;i.onchange=()=>i.files[0]&&cb(i.files[0]);i.click()};
const parseLRC=t=>{const o=[];t.split(/\r?\n/).forEach(l=>{const x=l.replace(/\[[^\]]*\]/g,"").trim();if(x)[...l.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)].forEach(a=>o.push({time:+a[1]*60+ +a[2],text:x}))});return o.sort((a,b)=>a.time-b.time)};
// ---- wrappers (highlight lagu aktif, state playing)
const _r=renderTracks;renderTracks=function(){_r();$$(".track-row").forEach((r,i)=>{r.style.setProperty("--i",i);r.classList.toggle("is-current",current?.id===+r.dataset.id)})};
const _p=playTrack;playTrack=function(id,q){_p(id,q);$$(".track-row").forEach(r=>r.classList.toggle("is-current",+r.dataset.id===current?.id))};
const _s=setPlayingState;setPlayingState=v=>{_s(v);B.classList.toggle("is-playing",v)};
// ---- UI injection
const mk=(h)=>{const d=document.createElement("div");d.innerHTML=h.trim();return d.firstChild};
B.prepend(mk('<div class="wp-layer"></div>'),mk('<div class="wp-dim"></div>'));B.append(mk('<div class="page-wipe"></div>'),mk('<div class="scrim"></div>'));
const top=$(".top-actions"),tb=$(".topbar");
const menu=mk('<button class="icon-button menu-toggle" aria-label="Menu">☰</button>');tb?.prepend(menu);
const wpBtn=mk('<button class="icon-button wp-btn" aria-label="Ganti wallpaper" title="Wallpaper">▨</button>');top?.prepend(wpBtn);
const WP=[["Sakura","linear-gradient(135deg,#ff9ec4,#b69cff)"],["Midnight","linear-gradient(160deg,#0f0c29,#302b63,#24243e)"],["Turf","linear-gradient(135deg,#134e4a,#4ade80)"],["Sunset","linear-gradient(135deg,#ff7e5f,#feb47b 60%,#c471ed)"],["Starry","radial-gradient(circle at 20% 20%,#5b4b8a,#14122a 70%)"],["Ocean","linear-gradient(135deg,#0f2027,#2c5364,#4ca1af)"]];
let wp={k:"none",v:0,dim:.45,blur:0,...JSON.parse(LS.getItem("umatune-wp")||"{}")};
if(wp.k==="img"&&wp.v==="idb"){wp.v="";idb("readonly",s=>s.get("wp")).then(v=>{wp.k=v?"img":"none";wp.v=v||0;applyWP(false)})}
const panel=mk(`<div class="wp-panel"><div class="eyebrow muted">TAMPILAN</div><h3>Wallpaper</h3><div class="wp-grid">${WP.map((w,i)=>`<button class="wp-sw" data-wp="${i}" style="background:${w[1]}">${w[0]}</button>`).join("")}</div>
<div class="wp-row"><button data-act="up">⬆ Upload gambar</button><button data-act="off">Tanpa wallpaper</button></div>
<label>Gelap <input type="range" id="wp-dim" min="0" max=".85" step=".05"></label><label>Blur <input type="range" id="wp-blur" min="0" max="20" step="1"></label></div>`);B.append(panel);
function applyWP(save=true){const l=$(".wp-layer");l.style.background=wp.k==="p"?WP[wp.v][1]:wp.k==="img"?`center/cover url("${wp.v}")`:"";l.style.filter=`blur(${wp.blur}px)`;B.classList.toggle("has-wp",wp.k!=="none");B.style.setProperty("--wp-dim",wp.dim);$("#wp-dim").value=wp.dim;$("#wp-blur").value=wp.blur;$$(".wp-sw").forEach(b=>b.classList.toggle("on",wp.k==="p"&&+b.dataset.wp===wp.v));if(save)try{LS.setItem("umatune-wp",JSON.stringify(wp.k==="img"?{...wp,v:"idb"}:wp))}catch{toast("Gagal menyimpan wallpaper.")}}
applyWP(false);
wpBtn?.addEventListener("click",e=>{e.stopPropagation();panel.classList.toggle("open")});
panel.addEventListener("click",e=>{const s=e.target.closest("[data-wp]"),a=e.target.closest("[data-act]")?.dataset.act;if(s){wp.k="p";wp.v=+s.dataset.wp;applyWP()}if(a==="off"){wp.k="none";applyWP()}if(a==="up")pick("image/*",f=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);wp.k="img";wp.v=c.toDataURL("image/jpeg",.8);idb("readwrite",s=>s.put(wp.v,"wp"));applyWP();toast("Wallpaper diganti ✦")};im.src=URL.createObjectURL(f)})});
panel.addEventListener("input",e=>{if(e.target.id==="wp-dim")wp.dim=+e.target.value;if(e.target.id==="wp-blur")wp.blur=+e.target.value;applyWP()});
// ---- tombol tambah audio / lirik / antrian / mute
const ex=$(".player-extra");
const bAudio=mk('<button class="queue-button" title="Tambah file audio ke lagu ini">♬</button>'),bLyr=mk('<button class="queue-button" title="Impor lirik (.lrc)">✎</button>');ex?.prepend(bAudio,bLyr);
bAudio.onclick=()=>{if(!current)return toast("Pilih lagu dulu.");pick("audio/*",async f=>{await idb("readwrite",s=>s.put(f,"a"+current.id));current.audioUrl=URL.createObjectURL(f);renderTracks();playTrack(current.id);toast("Audio ditambahkan & tersimpan ✦")})};
bLyr.onclick=()=>{if(!current)return toast("Pilih lagu dulu.");pick(".lrc,.txt",async f=>{const l=parseLRC(await f.text());if(!l.length)return toast("Format LRC tidak terbaca ([mm:ss.xx] teks).");current.lyrics=l;LS.setItem("umatune-lyr-"+current.id,JSON.stringify(l));renderLyrics(current);toast("Lirik diimpor ✦")})};
const q=mk('<div class="queue-pop"></div>');B.append(q);
$(".queue-button:last-child")?.addEventListener("click",e=>{e.stopPropagation();q.innerHTML='<h4>Antrian</h4>'+tracks.map(t=>`<button data-q="${t.id}" class="${t.id===current?.id?"on":""}"><span>${t.id===current?.id?"▶":"♪"}</span><b>${t.title}</b></button>`).join("");q.classList.toggle("open")});
q.addEventListener("click",e=>{const b=e.target.closest("[data-q]");if(b){playTrack(b.dataset.q);q.classList.remove("open")}});
document.addEventListener("click",e=>{if(!e.target.closest(".wp-panel,.wp-btn"))panel.classList.remove("open");if(!e.target.closest(".queue-pop,.queue-button"))q.classList.remove("open")});
$(".volume-icon")?.addEventListener("click",()=>{audio.muted=!audio.muted;$(".volume-icon").classList.toggle("muted",audio.muted);toast(audio.muted?"Mute":"Suara aktif")});
// ---- menu mobile
const side=$(".sidebar"),scrim=$(".scrim"),tog=o=>{side?.classList.toggle("open",o);scrim.classList.toggle("show",o)};
scrim.addEventListener("click",()=>tog(false));
// ---- klik baris = putar; transisi halaman
document.addEventListener("click",e=>{const r=e.target.closest(".track-row");if(r&&!e.target.closest("button")){+r.dataset.id===current?.id&&current.audioUrl?$("#play-button").click():playTrack(r.dataset.id)}
const a=e.target.closest("a[href]");if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||a.target)return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||!/\.html$/.test(u.pathname)||(u.pathname===location.pathname&&u.search===location.search))return;e.preventDefault();B.classList.add("leaving");setTimeout(()=>location.href=u.href,330)});
addEventListener("pageshow",e=>e.persisted&&B.classList.remove("leaving"));
// ---- shortcut keyboard
addEventListener("keydown",e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase(),c=id=>$(id).click();
if(k===" "){if(/^(BUTTON|A)$/.test(e.target.tagName))return;e.preventDefault();c("#play-button")}else if(k==="n")c("#next-button");else if(k==="p")c("#prev-button");else if(k==="s")c("#shuffle-button");else if(k==="r")c("#repeat-button");else if(k==="l")c("#current-like");else if(k==="m")$(".volume-icon")?.click();else if(k==="arrowright"&&audio.duration)audio.currentTime=Math.min(audio.duration,audio.currentTime+5);else if(k==="arrowleft")audio.currentTime=Math.max(0,audio.currentTime-5);else if(k==="escape"){panel.classList.remove("open");q.classList.remove("open");tog(false)}});
// ---- simpan & lanjutkan posisi
let resumeAt=0,lastSave=0;
audio.addEventListener("loadedmetadata",()=>{$("#duration").textContent=formatTime(audio.duration);if(resumeAt){audio.currentTime=resumeAt;resumeAt=0}});
audio.addEventListener("timeupdate",()=>{const n=Date.now();if(n-lastSave>1000){lastSave=n;LS.setItem("umatune-time",audio.currentTime);LS.setItem("umatune-time-id",current?.id||"")}});
$("#volume").addEventListener("input",()=>LS.setItem("umatune-vol",audio.volume));
addEventListener("pagehide",()=>{if(audio.readyState>0){LS.setItem("umatune-time",audio.currentTime||0);LS.setItem("umatune-time-id",current?.id||"");LS.setItem("umatune-playing",audio.paused?"0":"1")}});
(async()=>{for(const t of tracks){const b=await idb("readonly",s=>s.get("a"+t.id));if(b)t.audioUrl=URL.createObjectURL(b);try{const l=JSON.parse(LS.getItem("umatune-lyr-"+t.id)||"null");if(l)t.lyrics=l}catch{}}
const id=current?.id||Number(LS.getItem("umatune-last"));if(id&&tracks.some(t=>t.id===id)){resumeAt=Number(LS.getItem("umatune-time-id"))===id?Number(LS.getItem("umatune-time"))||0:0;playTrack(id,true);if(LS.getItem("umatune-playing")==="1"&&current.audioUrl)audio.play().then(()=>setPlayingState(true)).catch(()=>toast("Ketuk ▶ untuk melanjutkan"))}renderTracks()})();
})();
