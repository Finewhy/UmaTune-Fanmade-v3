/* UmaTune v3 — dimuat setelah script.js dan extras.js */
(()=>{
"use strict";
const LS=localStorage,B=document.body,PAGE=B.dataset.page||"home";
const all=s=>[...document.querySelectorAll(s)];
const mk=h=>{const d=document.createElement("div");d.innerHTML=h.trim();return d.firstChild};
const J=(k,d)=>{try{const v=JSON.parse(LS.getItem(k));return v==null?d:v}catch{return d}};
const S=(k,v)=>{try{LS.setItem(k,JSON.stringify(v))}catch{}};
const mob=()=>matchMedia("(max-width:760px)").matches;
const norm=s=>String(s).normalize("NFKC").toLowerCase();
const fmtDur=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h} j ${m} m`:`${m} m`};
const ago=t=>{const d=(Date.now()-t)/1000;return d<60?"baru saja":d<3600?Math.floor(d/60)+" mnt lalu":d<86400?Math.floor(d/3600)+" jam lalu":Math.floor(d/86400)+" hari lalu"};
let secAcc=0;

/* ---------- 1. Panel kiri & bawah bisa dibuka/ditutup ---------- */
B.classList.add("boot");
if(J("umatune-side",false))B.classList.add("side-collapsed");
if(J("umatune-bar",false))B.classList.add("player-collapsed");
const side=$(".sidebar"),menuBtn=$(".menu-toggle"),bar=$(".player-bar");
const isSideOpen=()=>mob()?side.classList.contains("open"):!B.classList.contains("side-collapsed");
function setSide(open){
  if(mob()){side.classList.toggle("open",open);$(".scrim")?.classList.toggle("show",open)}
  else{B.classList.toggle("side-collapsed",!open);S("umatune-side",!open)}
  menuBtn?.setAttribute("aria-expanded",open);
}
menuBtn?.setAttribute("aria-label","Buka atau tutup panel kiri");
menuBtn?.setAttribute("title","Panel kiri  ( [ )");
menuBtn?.setAttribute("aria-expanded",isSideOpen());
menuBtn?.addEventListener("click",()=>setSide(!isSideOpen()));
const tab=mk(`<div class="bar-tab"><button class="bt-play" aria-label="Putar atau jeda">▶</button><button class="bt-main" aria-expanded="true" aria-label="Sembunyikan pemutar" title="Pemutar  ( ] )"><span id="bt-title"></span><i>⌄</i></button></div>`);
bar.append(tab);
const btMain=tab.querySelector(".bt-main");
function setBar(collapsed){
  B.classList.toggle("player-collapsed",collapsed);S("umatune-bar",collapsed);
  btMain.setAttribute("aria-expanded",!collapsed);btMain.setAttribute("aria-label",collapsed?"Tampilkan pemutar":"Sembunyikan pemutar");
}
btMain.addEventListener("click",()=>setBar(!B.classList.contains("player-collapsed")));
tab.querySelector(".bt-play").addEventListener("click",()=>$("#play-button").click());

/* ---------- 2. Animasi teks ---------- */
function reveal(el){ // kata naik satu per satu
  if(!el)return;let n=0;
  const walk=node=>[...node.childNodes].forEach(c=>{
    if(c.nodeType===3){
      const f=document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(w=>{
        if(!w.trim()){f.append(w);return}
        const o=document.createElement("span"),i=document.createElement("span");
        o.className="rv";i.textContent=w;i.style.setProperty("--d",n++);o.append(i);f.append(o);
      });
      c.replaceWith(f);
    }else if(c.nodeType===1&&c.tagName!=="BR")walk(c);
  });
  walk(el);
}
all(".hero h1,.library-hero h1,.disc-hero h1").forEach(reveal);
const swap=(...sels)=>sels.forEach(s=>{const e=$(s);if(!e)return;e.classList.remove("swap");void e.offsetWidth;e.classList.add("swap")});
const countUp=(el,to,fmt=v=>Math.round(v))=>{const t0=performance.now(),d=900;(function f(now){const p=Math.min(1,(now-t0)/d),e=1-Math.pow(1-p,3);el.textContent=fmt(to*e);if(p<1)requestAnimationFrame(f)})(t0)};
all(".visualizer i").forEach(i=>{i.style.animationDuration=(.5+Math.random()*.55).toFixed(2)+"s";i.style.animationDelay=(-Math.random()).toFixed(2)+"s"});
const list=$("#track-list");if(list)setTimeout(()=>list.classList.add("entered"),1100);

/* ---------- 3. Pemutar: progres mulus, riwayat, timer ---------- */
const seek=$("#seek"),vol=$("#volume");let seeking=false,raf=0;
seek.step="any";
const pct=(el,v)=>el.style.setProperty("--pct",v+"%");
seek.addEventListener("pointerdown",()=>seeking=true);addEventListener("pointerup",()=>seeking=false);
seek.addEventListener("input",()=>pct(seek,seek.value));
vol.addEventListener("input",()=>pct(vol,vol.value*100));pct(vol,vol.value*100);
function frame(){
  if(audio.duration&&!seeking){const p=audio.currentTime/audio.duration*100;seek.value=p;pct(seek,p);$("#elapsed").textContent=formatTime(audio.currentTime)}
  syncLyrics();
  if(!audio.paused)raf=requestAnimationFrame(frame);
}
audio.addEventListener("play",()=>{cancelAnimationFrame(raf);frame()});
audio.addEventListener("seeked",()=>{if(audio.paused)frame()});
let lastT=0;
audio.addEventListener("timeupdate",()=>{
  const d=audio.currentTime-lastT;lastT=audio.currentTime;
  if(!audio.paused&&d>0&&d<1.5){secAcc+=d;if(secAcc>=5){S("umatune-sec",J("umatune-sec",0)+secAcc);secAcc=0}}
});
addEventListener("pagehide",()=>{if(secAcc){S("umatune-sec",J("umatune-sec",0)+secAcc);secAcc=0}});

function addHist(id){
  const h=J("umatune-hist",[]);h.unshift({id,t:Date.now()});S("umatune-hist",h.slice(0,100));
  const p=J("umatune-plays",{});p[id]=(p[id]||0)+1;S("umatune-plays",p);
}
const _pt=playTrack;
playTrack=function(id,quiet){
  _pt(id,quiet);
  if(!current||current.id!==Number(id))return;
  $("#bt-title").textContent=current.title;
  swap("#current-title","#np-title","#np-artist","#np-description");
  all(".dcard").forEach(c=>c.classList.toggle("is-current",+c.dataset.pid===current.id));
  all(".mrow").forEach(c=>c.classList.toggle("is-current",+c.dataset.pid===current.id));
  if(!quiet){addHist(current.id);if(PAGE==="profile")renderPage()}
};
const _sp=setPlayingState;
setPlayingState=v=>{_sp(v);tab.querySelector(".bt-play").textContent=v?"Ⅱ":"▶"};
const _tl=toggleLike;
toggleLike=function(id){_tl(id);document.querySelector(`[data-like="${Number(id)}"]`)?.classList.add("pop")};

/* sleep timer, kecepatan putar */
let sleepT=0;
function fadeStop(){
  LS.removeItem("umatune-sleep");const v0=audio.volume;let k=0;
  const iv=setInterval(()=>{k+=.05;audio.volume=Math.max(0,v0*(1-k));if(k>=1){clearInterval(iv);audio.pause();setPlayingState(false);audio.volume=v0;toast("Sleep timer selesai ✦");refreshAll()}},140);
}
function armSleep(){clearTimeout(sleepT);const ms=J("umatune-sleep",0)-Date.now();if(J("umatune-sleep",0)&&ms>0)sleepT=setTimeout(fadeStop,ms);else LS.removeItem("umatune-sleep")}
function setSleep(min){
  clearTimeout(sleepT);
  if(!min){LS.removeItem("umatune-sleep");S("umatune-sleepmin",0);toast("Sleep timer dimatikan")}
  else{S("umatune-sleep",Date.now()+min*60000);S("umatune-sleepmin",min);armSleep();toast(`Musik berhenti otomatis dalam ${min} menit`)}
  refreshAll();
}
function setRate(r){audio.defaultPlaybackRate=r;audio.playbackRate=r;S("umatune-rate",r);refreshAll()}

/* ---------- 4. Profil pengguna ---------- */
const AV=[["#ffc36e","#ff79ad"],["#ff80b4","#a98aff"],["#7bc9e8","#8f8bf0"],["#69d9ad","#4ca1af"],["#ff9a6c","#f25f8d"],["#b6a1f2","#6f8bff"]];
const EMO=["","🐎","🌸","⭐","🎧","🏆","🍙","🌙"];
let me={name:"Uma fan",bio:"Music listener",emoji:"",color:0,...J("umatune-profile",{})};
if(!AV[me.color])me.color=0;
const ini=()=>(me.name.trim()[0]||"U").toUpperCase();
function applyProfile(){
  const g=`linear-gradient(135deg,${AV[me.color][0]},${AV[me.color][1]})`;
  all(".avatar").forEach(a=>{a.textContent=me.emoji||ini();a.style.background=g});
  all(".profile-row b,.pm-name").forEach(e=>e.textContent=me.name.trim()||"Uma fan");
  all(".profile-row small,.pm-bio").forEach(e=>e.textContent=me.bio.trim()||"Music listener");
}
const stats=()=>({liked:liked.length,plays:Object.values(J("umatune-plays",{})).reduce((a,b)=>a+b,0),sec:J("umatune-sec",0)+secAcc});
const quick=()=>`
<div class="qs-row"><span>Sleep timer</span><div class="chips">${[[0,"Mati"],[15,"15 m"],[30,"30 m"],[60,"60 m"]].map(([m,l])=>`<button data-sleep="${m}">${l}</button>`).join("")}</div><small class="sleep-left"></small></div>
<div class="qs-row"><span>Kecepatan putar</span><div class="chips">${[.75,1,1.25,1.5].map(r=>`<button data-rate="${r}">${r}×</button>`).join("")}</div></div>
<label class="qs-row sw-row"><span>Putar lagu berikutnya otomatis</span><input type="checkbox" data-autoplay><i></i></label>`;
const pm=mk(`<div class="pmenu" role="menu" aria-label="Menu profil">
<div class="pm-head"><div class="avatar"></div><div><b class="pm-name"></b><small class="pm-bio"></small></div></div>
<div class="pm-stats"><a href="library.html?favorites=1"><b data-s="liked">0</b><small>Disukai</small></a><a href="profile.html#riwayat"><b data-s="plays">0</b><small>Diputar</small></a><a href="profile.html#ringkasan"><b data-s="time">0 m</b><small>Waktu dengar</small></a></div>
<div class="pm-list"><a href="profile.html"><span>☺</span>Profil saya</a><a href="library.html?favorites=1"><span>♥</span>Lagu disukai</a><a href="profile.html#riwayat"><span>◷</span>Riwayat putar</a><a href="profile.html#playlist"><span>♫</span>Playlist saya</a><a href="profile.html#pengaturan"><span>⚙</span>Pengaturan</a></div>
<div class="pm-sep"></div>${quick()}<div class="pm-sep"></div>
<div class="pm-list"><button data-act="theme"><span>☼</span>Ganti tema</button><button data-act="wp"><span>▨</span>Wallpaper</button><button data-act="keys"><span>⌨</span>Pintasan keyboard</button><button class="danger" data-act="reset"><span>⟲</span>Hapus data lokal</button></div></div>`);
B.append(pm);
let pmFrom=null;
function openMenu(from){refreshAll();pm.classList.toggle("side",!!from.closest(".sidebar"));pm.classList.add("open");pmFrom=from;from.setAttribute("aria-expanded","true")}
function closeMenu(){pm.classList.remove("open");pmFrom?.setAttribute("aria-expanded","false")}
all(".top-avatar").forEach(a=>{a.setAttribute("aria-haspopup","menu");a.setAttribute("aria-expanded","false")});

function refreshAll(){
  const s=stats();
  all("[data-s=liked]").forEach(e=>e.textContent=s.liked);all("[data-s=plays]").forEach(e=>e.textContent=s.plays);all("[data-s=time]").forEach(e=>e.textContent=fmtDur(s.sec));
  const rate=J("umatune-rate",1),end=J("umatune-sleep",0),mins=J("umatune-sleepmin",0),on=end>Date.now();
  all("[data-rate]").forEach(b=>b.classList.toggle("on",+b.dataset.rate===rate));
  all("[data-sleep]").forEach(b=>b.classList.toggle("on",on?+b.dataset.sleep===mins:b.dataset.sleep==="0"));
  all(".sleep-left").forEach(e=>e.textContent=on?`Berhenti sekitar ${Math.ceil((end-Date.now())/60000)} menit lagi`:"");
  all("[data-autoplay]").forEach(c=>c.checked=LS.getItem("umatune-autoplay")!=="false");
  all("[data-darktheme]").forEach(c=>c.checked=B.dataset.theme==="dark");
}
setInterval(()=>{if(J("umatune-sleep",0)>Date.now())refreshAll()},20000);

/* pintasan keyboard */
const KEYS=[["Space","Putar / jeda"],["N / P","Lagu berikutnya / sebelumnya"],["S · R","Acak · Ulangi"],["L · M","Suka · Bisukan"],["← / →","Mundur / maju 5 detik"],["Ctrl/⌘ + K","Cari lagu"],["[","Buka / tutup panel kiri"],["]","Buka / tutup pemutar"],["Esc","Tutup panel"]];
const modal=mk(`<div class="modal-back" role="dialog" aria-modal="true" aria-label="Pintasan keyboard"><div class="modal"><h3>Pintasan keyboard</h3><div class="keys">${KEYS.map(([k,d])=>`<div><span>${d}</span><kbd>${k}</kbd></div>`).join("")}</div><button class="primary-button" data-act="close-modal">Tutup</button></div></div>`);
B.append(modal);

function resetAll(){
  if(!confirm("Hapus semua data UmaTune di browser ini (suka, riwayat, playlist, pengaturan)? File audio lokal tidak ikut terhapus."))return;
  Object.keys(LS).filter(k=>k.startsWith("umatune-")).forEach(k=>LS.removeItem(k));location.reload();
}
function clearAudio(){
  if(!confirm("Hapus semua file audio yang kamu tambahkan lewat tombol ♬?"))return;
  const q=indexedDB.open("umatune",1);
  q.onsuccess=()=>{const tx=q.result.transaction("audio","readwrite");tx.objectStore("audio").clear();tx.oncomplete=()=>{toast("Audio lokal dihapus");setTimeout(()=>location.reload(),500)}};
}
function exportData(){
  const o={};Object.keys(LS).filter(k=>k.startsWith("umatune-")&&k!=="umatune-wp").forEach(k=>o[k]=LS.getItem(k));
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,1)],{type:"application/json"}));a.download="umatune-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function importData(){
  const i=document.createElement("input");i.type="file";i.accept="application/json";
  i.onchange=async()=>{try{const o=JSON.parse(await i.files[0].text());Object.entries(o).forEach(([k,v])=>k.startsWith("umatune-")&&typeof v==="string"&&LS.setItem(k,v));toast("Data dipulihkan");setTimeout(()=>location.reload(),600)}catch{toast("Berkas cadangan tidak valid.")}};i.click();
}

/* ---------- 5. Discover ---------- */
const DS={mood:"All",ch:"All",sort:"rel"};
const recent=()=>J("umatune-recent",[]);
function addRecent(q){q=q.trim();if(q.length<2)return;S("umatune-recent",[q,...recent().filter(x=>x!==q)].slice(0,6))}
function hl(text,tok){
  if(!tok.length)return esc(text);
  const re=new RegExp("("+tok.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")","gi");
  return String(text).split(re).map((p,i)=>i%2?`<mark>${esc(p)}</mark>`:esc(p)).join("");
}
function buildChips(){
  const moods=["All",...new Set(tracks.map(t=>t.mood))],chars=["All",...new Set(tracks.flatMap(t=>t.characters||[]))];
  $("#disc-moods").innerHTML=moods.map(m=>`<button class="chip ${DS.mood===m?"on":""}" data-mood="${esc(m)}">${m==="All"?"Semua":esc(m)}</button>`).join("");
  $("#disc-chars").innerHTML=chars.map(c=>`<button class="chip ${DS.ch===c?"on":""}" data-char="${esc(c)}">${c==="All"?"Semua":esc(c)}</button>`).join("");
}
function renderDiscover(anim){
  const grid=$("#disc-grid");if(!grid)return;
  const input=$("#search-input"),raw=input.value.trim(),tok=norm(raw).split(/\s+/).filter(Boolean);
  let r=tracks.filter(t=>{const h=norm([t.title,t.artist,t.album,t.mood,...(t.characters||[])].join(" "));return tok.every(w=>h.includes(w))&&(DS.mood==="All"||t.mood===DS.mood)&&(DS.ch==="All"||(t.characters||[]).includes(DS.ch))});
  if(DS.sort==="rel"&&tok.length)r.sort((a,b)=>(norm(b.title).includes(tok[0])?1:0)-(norm(a.title).includes(tok[0])?1:0));
  if(DS.sort==="title")r.sort((a,b)=>a.title.localeCompare(b.title));
  if(DS.sort==="duration")r.sort((a,b)=>a.seconds-b.seconds);
  if(DS.sort==="liked")r.sort((a,b)=>liked.includes(b.id)-liked.includes(a.id));
  $("#disc-count").textContent=`${r.length} ${r.length===1?"lagu":"lagu"}`;
  $("#disc-clear").hidden=!raw;
  const rc=recent(),box=$("#disc-recent");box.hidden=!!raw||!rc.length;
  box.innerHTML=rc.length?`<span>Pencarian terakhir</span>${rc.map(q=>`<button class="chip" data-recent="${esc(q)}">${esc(q)}</button>`).join("")}<button class="link" data-act="clear-recent">Hapus</button>`:"";
  grid.classList.toggle("anim",!!anim);
  grid.innerHTML=r.length?r.map((t,i)=>`<article class="dcard ${current?.id===t.id?"is-current":""}" data-pid="${t.id}" style="--i:${i}">
    <div class="dcover" style="background:${t.color}"><span class="dnote">♪</span><span class="dmood">${esc(t.mood)}</span><button class="dplay" data-pid="${t.id}" aria-label="Putar ${esc(t.title)}">▶</button></div>
    <div class="dmeta"><div><b>${hl(t.title,tok)}</b><small>${hl(t.artist,tok)}</small><em>${hl(t.album,tok)}</em></div><button class="row-like ${liked.includes(t.id)?"liked":""}" data-like="${t.id}" aria-label="Suka ${esc(t.title)}">${liked.includes(t.id)?"♥":"♡"}</button></div></article>`).join("")
    :`<div class="empty-state"><b>Tidak ada lagu yang cocok</b>Coba kata kunci lain, atau reset filter mood dan karakter.</div>`;
  try{history.replaceState(null,"",raw?"?q="+encodeURIComponent(raw):location.pathname)}catch{}
}
function initDiscover(){
  const q0=new URLSearchParams(location.search).get("q");if(q0)$("#search-input").value=q0;
  buildChips();
  $("#sort-select").addEventListener("change",e=>{DS.sort=e.target.value;renderDiscover(true)});
  $("#search-input").addEventListener("keydown",e=>{if(e.key==="Enter")addRecent(e.target.value)});
  $("#search-input").focus({preventScroll:true});
}

/* ---------- 6. Halaman Profil ---------- */
let firstStats=true;
const PL=()=>J("umatune-playlists",[]);
const mrow=(t,right)=>`<div class="mrow ${current?.id===t.id?"is-current":""}" data-pid="${t.id}"><div class="track-cover" style="background:${t.color}">♪</div><div class="track-main"><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div><span class="track-duration">${right}</span><button class="row-like ${liked.includes(t.id)?"liked":""}" data-like="${t.id}" aria-label="Suka ${esc(t.title)}">${liked.includes(t.id)?"♥":"♡"}</button></div>`;
function renderIdentity(){
  $("#p-hero").innerHTML=`<div class="avatar pm-av huge"></div><div class="prof-edit"><div class="eyebrow">PROFIL SAYA</div>
  <input id="pf-name" maxlength="24" value="${esc(me.name)}" aria-label="Nama" placeholder="Nama kamu"><input id="pf-bio" maxlength="40" value="${esc(me.bio)}" aria-label="Bio" placeholder="Bio singkat">
  <div class="swatches">${AV.map((a,i)=>`<button class="swatch ${i===me.color?"on":""}" data-color="${i}" style="background:linear-gradient(135deg,${a[0]},${a[1]})" aria-label="Warna avatar ${i+1}"></button>`).join("")}</div>
  <div class="swatches">${EMO.map(e=>`<button class="chip ${e===me.emoji?"on":""}" data-emoji="${e}" aria-label="${e?"Emoji "+e:"Pakai inisial"}">${e||"Aa"}</button>`).join("")}</div></div>`;
  applyProfile();
}
function renderStats(){
  const s=stats(),p=J("umatune-plays",{}),top=Object.entries(p).sort((a,b)=>b[1]-a[1])[0],tt=top&&tracks.find(t=>t.id===+top[0]);
  $("#p-stats").innerHTML=`<div class="stat"><b data-n="${s.liked}">${s.liked}</b><small>Lagu disukai</small></div><div class="stat"><b data-n="${s.plays}">${s.plays}</b><small>Total putaran</small></div><div class="stat"><b>${fmtDur(s.sec)}</b><small>Waktu mendengar</small></div><div class="stat"><b title="${tt?esc(tt.title):""}">${tt?esc(tt.title):"—"}</b><small>Lagu favorit</small></div>`;
  if(firstStats){firstStats=false;all("#p-stats [data-n]").forEach(e=>countUp(e,+e.dataset.n))}
}
function renderHist(){
  const h=J("umatune-hist",[]).filter(x=>tracks.some(t=>t.id===x.id)).slice(0,10);
  $("#p-hist").innerHTML=h.length?h.map(x=>mrow(tracks.find(t=>t.id===x.id),ago(x.t))).join(""):`<div class="empty-state">Belum ada riwayat. Putar lagu dan jejaknya muncul di sini.</div>`;
}
function renderTop(){
  const p=J("umatune-plays",{}),arr=tracks.filter(t=>p[t.id]).sort((a,b)=>p[b.id]-p[a.id]).slice(0,5),max=arr[0]?p[arr[0].id]:1;
  $("#p-top").innerHTML=arr.length?arr.map(t=>mrow(t,`${p[t.id]}×`).replace("</small></div><span",`</small><div class="meter"><i style="--w:${Math.max(6,p[t.id]/max*100)}%"></i></div></div><span`)).join(""):`<div class="empty-state">Lagu yang paling sering kamu putar akan tampil di sini.</div>`;
}
function renderPL(open){
  const pls=PL();
  $("#p-pl").innerHTML=pls.length?pls.map(p=>`<details class="pl-card" data-pl="${p.id}" ${open===p.id?"open":""}><summary><span class="grow">${esc(p.name)} <small>${p.tracks.length} lagu</small></span><button class="chip" data-act="pl-play" data-id="${p.id}">▶ Putar</button><button class="chip" data-act="pl-del" data-id="${p.id}" aria-label="Hapus playlist ${esc(p.name)}">Hapus</button></summary>
  <div class="pick">${tracks.map(t=>`<label><input type="checkbox" data-pl-track="${t.id}" data-id="${p.id}" ${p.tracks.includes(t.id)?"checked":""}>${esc(t.title)} <small style="color:var(--muted)">· ${esc(t.artist)}</small></label>`).join("")}</div></details>`).join(""):`<div class="empty-state">Belum ada playlist. Buat satu untuk mengelompokkan lagu favoritmu.</div>`;
}
function initProfile(){
  const root=$("#profile-root");
  root.innerHTML=`<section class="prof-hero" id="p-hero"></section>
  <nav class="prof-nav" aria-label="Bagian profil"><a class="chip" href="#ringkasan">Ringkasan</a><a class="chip" href="#riwayat">Riwayat</a><a class="chip" href="#playlist">Playlist</a><a class="chip" href="#pengaturan">Pengaturan</a></nav>
  <section class="p-section" id="ringkasan"><div class="p-head"><h2>Ringkasan</h2></div><div class="stat-grid" id="p-stats"></div></section>
  <section class="p-section" id="riwayat"><div class="p-head"><h2>Terakhir diputar</h2><button class="chip" data-act="hist-clear">Hapus riwayat</button></div><div id="p-hist"></div><div class="p-head" style="margin-top:26px"><h2>Paling sering diputar</h2></div><div id="p-top"></div></section>
  <section class="p-section" id="playlist"><div class="p-head"><h2>Playlist saya</h2></div><div class="pl-new"><input id="pl-name" maxlength="30" placeholder="Nama playlist baru" aria-label="Nama playlist"><button class="primary-button" data-act="pl-new">Buat</button></div><div id="p-pl"></div></section>
  <section class="p-section" id="pengaturan"><div class="p-head"><h2>Pengaturan</h2></div><div class="set-card">${quick()}
  <label class="qs-row sw-row"><span>Tema gelap</span><input type="checkbox" data-darktheme><i></i></label>
  <div class="qs-row"><span>Tampilan</span><div class="chips"><button data-act="wp">Wallpaper</button><button data-act="keys">Pintasan keyboard</button></div></div>
  <div class="qs-row"><span>Data</span><div class="data-row chips"><button data-act="export">Cadangkan</button><button data-act="import">Pulihkan</button><button data-act="clear-audio">Hapus audio lokal</button><button data-act="reset" style="color:#ff6b8a">Hapus semua data</button></div></div></div></section>`;
  renderIdentity();renderPage();refreshAll();
  if(location.hash)setTimeout(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:"smooth"}),300);
}
window.renderPage=()=>{
  if(PAGE==="discover")renderDiscover();
  if(PAGE==="profile"){renderStats();renderHist();renderTop();if(!$("#p-pl").innerHTML)renderPL()}
  refreshAll();
};

/* ---------- 7. Event global ---------- */
document.addEventListener("click",e=>{
  const t=e.target;
  const av=t.closest(".top-avatar,.profile-row");
  if(av){pm.classList.contains("open")?closeMenu():openMenu(av);return}
  if(!t.closest(".pmenu"))closeMenu();
  const lk=t.closest("[data-like]");
  if(lk&&!lk.closest("#track-list")){toggleLike(lk.dataset.like);return}
  const pid=t.closest("[data-pid]");
  if(pid&&!lk){const id=+pid.dataset.pid;if(PAGE==="discover")addRecent($("#search-input").value);current?.id===id&&current.audioUrl?$("#play-button").click():playTrack(id);return}
  const sl=t.closest("[data-sleep]");if(sl)return setSleep(+sl.dataset.sleep);
  const rt=t.closest("[data-rate]");if(rt)return setRate(+rt.dataset.rate);
  const mo=t.closest("[data-mood]");if(mo){DS.mood=mo.dataset.mood;buildChips();return renderDiscover(true)}
  const ch=t.closest("[data-char]");if(ch){DS.ch=ch.dataset.char;buildChips();return renderDiscover(true)}
  const rc=t.closest("[data-recent]");if(rc){$("#search-input").value=rc.dataset.recent;return renderDiscover(true)}
  const co=t.closest("[data-color]");if(co){me.color=+co.dataset.color;S("umatune-profile",me);all(".swatch").forEach(s=>s.classList.toggle("on",s===co));return applyProfile()}
  const em=t.closest("[data-emoji]");if(em){me.emoji=em.dataset.emoji;S("umatune-profile",me);all("[data-emoji]").forEach(s=>s.classList.toggle("on",s===em));return applyProfile()}
  const act=t.closest("[data-act]")?.dataset.act,id=t.closest("[data-id]")?.dataset.id;
  if(!act)return;
  if(act==="theme"){$("#theme-toggle").click();refreshAll()}
  else if(act==="wp"){closeMenu();$(".wp-btn")?.click()}
  else if(act==="keys"){closeMenu();modal.classList.add("open")}
  else if(act==="close-modal")modal.classList.remove("open");
  else if(act==="reset")resetAll();
  else if(act==="clear-audio")clearAudio();
  else if(act==="export")exportData();
  else if(act==="import")importData();
  else if(act==="auto-info")autoInfo();
  else if(act==="auto-reset"){LS.removeItem(META_KEY);toast("Info otomatis dihapus");setTimeout(()=>location.reload(),500)}
  else if(act==="clear-recent"){S("umatune-recent",[]);renderDiscover()}
  else if(act==="hist-clear"){S("umatune-hist",[]);S("umatune-plays",{});renderPage();toast("Riwayat dihapus")}
  else if(act==="pl-new"){const i=$("#pl-name"),n=i.value.trim();if(!n)return i.focus();const p=PL();const nid="p"+Date.now();p.push({id:nid,name:n,tracks:[]});S("umatune-playlists",p);i.value="";renderPL(nid);toast("Playlist dibuat ✦")}
  else if(act==="pl-del"){e.preventDefault();if(confirm("Hapus playlist ini?")){S("umatune-playlists",PL().filter(p=>p.id!==id));renderPL()}}
  else if(act==="pl-play"){e.preventDefault();const p=PL().find(p=>p.id===id);p?.tracks.length?playTrack(p.tracks[0]):toast("Playlist masih kosong — centang lagu di dalamnya.")}
});
modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.matches("[data-autoplay]")){S("umatune-autoplay",t.checked);refreshAll()}
  else if(t.matches("[data-darktheme]")){$("#theme-toggle").click();refreshAll()}
  else if(t.matches("[data-pl-track]")){const p=PL(),pl=p.find(x=>x.id===t.dataset.id),n=+t.dataset.plTrack;if(!pl)return;pl.tracks=t.checked?[...new Set([...pl.tracks,n])]:pl.tracks.filter(x=>x!==n);S("umatune-playlists",p);const s=t.closest("details").querySelector("summary small");s.textContent=pl.tracks.length+" lagu"}
});
document.addEventListener("input",e=>{
  if(e.target.id==="pf-name"){me.name=e.target.value;S("umatune-profile",me);applyProfile()}
  if(e.target.id==="pf-bio"){me.bio=e.target.value;S("umatune-profile",me);applyProfile()}
  if(e.target.id==="search-input"&&PAGE==="discover"){}
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeMenu();modal.classList.remove("open")}
  if(e.key==="Enter"&&e.target.id==="pl-name")$("[data-act=pl-new]").click();
  if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==="[")setSide(!isSideOpen());
  else if(e.key==="]")setBar(!B.classList.contains("player-collapsed"));
  else if(e.key==="/"&&$("#search-input")){e.preventDefault();$("#search-input").focus()}
});
const si=$("#search-input");
if(si&&!["library","discover"].includes(PAGE)){si.title="Tekan Enter untuk mencari di Discover";si.addEventListener("keydown",e=>{if(e.key==="Enter"&&si.value.trim())location.href="discover.html?q="+encodeURIComponent(si.value.trim())})}
const rnd=$("#disc-random");rnd?.addEventListener("click",()=>{const p=tracks[Math.floor(Math.random()*tracks.length)];playTrack(p.id)});
$("#disc-clear")?.addEventListener("click",()=>{si.value="";si.focus();renderDiscover(true)});
addEventListener("pageshow",()=>refreshAll());

/* ---------- 8. Info lagu otomatis (iTunes + LRCLIB) ---------- */
const META_KEY="umatune-meta";
const LYRICS_OK=["localhost","127.0.0.1",""].includes(location.hostname); // false di github.io
const ALIAS={1:"うまぴょい伝説"}; // judul asli di iTunes bila berbeda; tambah sesuai kebutuhan, atau isi t.search di script.js
const strip=s=>norm(s).replace(/[\s\p{P}\p{S}]/gu,"");
const lrcParse=t=>{const o=[];t.split(/\r?\n/).forEach(l=>{const x=l.replace(/\[[^\]]*\]/g,"").trim();if(x)[...l.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)].forEach(a=>o.push({time:+a[1]*60+ +a[2],text:x}))});return o.sort((a,b)=>a.time-b.time)};
function applyMeta(){
  const m=J(META_KEY,{});
  tracks.forEach(t=>{
    const x=m[t.id];if(!x)return;
    if(/^https:\/\/[^'")\s]+$/.test(x.cover||""))t.color=`center/cover url('${x.cover}')`;
    if(x.ms>0){t.seconds=Math.round(x.ms/1000);t.duration=formatTime(t.seconds)}
    if(/^https?:\/\/[^\s]+$/.test(x.preview||"")&&(!t.audioUrl||t.audioUrl===t._prev)){t.audioUrl=x.preview;t._prev=x.preview}
  });
}
async function itunes(term){
  const url=`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=JP&media=music&entity=song&limit=8`;
  try{const r=await fetch(url);if(!r.ok)throw 0;return (await r.json()).results||[]}
  catch{ // cadangan: JSONP bila fetch diblokir CORS
    return new Promise(res=>{const cb="itcb"+Date.now()+Math.floor(Math.random()*1e4),s=document.createElement("script");
      const done=v=>{delete window[cb];s.remove();res(v)};
      window[cb]=d=>done(d.results||[]);s.onerror=()=>done([]);setTimeout(()=>done([]),8000);s.src=url+"&callback="+cb;document.head.append(s)});
  }
}
function pickSong(t,res){
  const names=[t.title,ALIAS[t.id],t.search].filter(Boolean).map(strip);let best=null,bs=0;
  res.forEach(r=>{
    if(!r.trackName)return;const n=strip(r.trackName);let s=0;
    if(names.includes(n))s+=3;else if(names.some(x=>x&&(n.includes(x)||x.includes(n))))s+=1;
    if(/ウマ娘|uma\s*musume|pretty derby|CV[.．]/i.test(`${r.artistName} ${r.collectionName}`))s+=2;
    if(s>bs){bs=s;best=r}
  });
  return bs>=3?best:null;
}
async function lrclib(title,artist,sec){
  for(const withArtist of [true,false]){
    const q=new URLSearchParams({track_name:title});if(withArtist&&artist)q.set("artist_name",artist);
    try{
      const r=await fetch("https://lrclib.net/api/search?"+q);if(!r.ok)continue;
      const hit=(await r.json()).find(x=>x.syncedLyrics&&(!sec||Math.abs(x.duration-sec)<=5));
      if(hit)return hit.syncedLyrics;
    }catch{}
  }
  return null;
}
async function autoInfo(){
  const btn=$("#auto-info"),log=$("#auto-log"),withLyr=LYRICS_OK&&$("#auto-lyr").checked,meta=J(META_KEY,{});let ok=0;
if(!LYRICS_OK)$("#auto-lyr")?.closest("label")?.remove();
  btn.disabled=true;btn.textContent="Mencari…";log.textContent="";
  for(const t of tracks){
    const row=document.createElement("div");row.textContent=`… ${t.title}`;log.append(row);
    try{
      const song=pickSong(t,await itunes(ALIAS[t.id]||t.search||t.title));
      if(!song){row.textContent=`✗ ${t.title}: tidak ditemukan di iTunes (coba isi t.search di script.js)`;continue}
      meta[t.id]={cover:(song.artworkUrl100||"").replace("100x100","600x600"),ms:song.trackTimeMillis,preview:song.previewUrl,artist:song.artistName};
      let note="";
      if(withLyr){
        const txt=await lrclib(song.trackName,song.artistName,song.trackTimeMillis/1000),l=txt?lrcParse(txt):[];
        if(l.length){t.lyrics=l;LS.setItem("umatune-lyr-"+t.id,JSON.stringify(l));note=" · lirik ✓"}else note=" · lirik tidak ada"
      }
      ok++;row.textContent=`✓ ${t.title} → ${song.trackName} — ${song.artistName}${note}`;
    }catch(e){row.textContent=`✗ ${t.title}: gagal (${e.message||"jaringan"})`}
    await new Promise(r=>setTimeout(r,250));
  }
  S(META_KEY,meta);applyMeta();renderDiscover();
  if(current){playTrack(current.id,true)}
  toast(`Info ditemukan untuk ${ok} dari ${tracks.length} lagu`);
  btn.disabled=false;btn.textContent="Cari info otomatis";
}

/* ---------- start ---------- */
if(Object.keys(J(META_KEY,{})).length){applyMeta();if(!["discover","profile"].includes(PAGE))renderTracks();if(current)playTrack(current.id,true)}
applyProfile();setRate(J("umatune-rate",1));armSleep();
if(PAGE==="discover")initDiscover();
if(PAGE==="profile")initProfile();
if(PAGE==="discover")renderDiscover(true);
if(current)$("#bt-title").textContent=current.title;
requestAnimationFrame(()=>requestAnimationFrame(()=>B.classList.remove("boot")));
})();
