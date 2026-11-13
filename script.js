const tracks = [
  {id:1,title:"Umapyoi Densetsu",artist:"Special Week, Silence Suzuka & team",album:"Uma Musume: Pretty Derby",duration:"3:24",seconds:204,mood:"Energetic",color:"linear-gradient(135deg,#ff8eb9,#9d8af3)",audioUrl:"",characters:["Special Week","Silence Suzuka"],description:"Lagu ikonik penuh semangat dari dunia Uma Musume.",lyrics:[]},
  {id:2,title:"Make Debut!",artist:"Special Week, Silence Suzuka, Tokai Teio",album:"Make Debut! — Single",duration:"4:38",seconds:278,mood:"Energetic",color:"linear-gradient(135deg,#ffad78,#f47fa9)",audioUrl:"",characters:["Special Week","Silence Suzuka","Tokai Teio"],description:"Opening yang membawa energi dan semangat untuk memulai perjalanan.",lyrics:[]},
  {id:3,title:"winning the soul",artist:"Tokai Teio",album:"Uma Musume Character Songs",duration:"4:02",seconds:242,mood:"Energetic",color:"linear-gradient(135deg,#7bc9e8,#8f8bf0)",audioUrl:"",characters:["Tokai Teio"],description:"Track karakter dengan nuansa kompetitif dan penuh determinasi.",lyrics:[]},
  {id:4,title:"ささやかな祈り",artist:"Rice Shower",album:"Uma Musume Character Songs",duration:"4:18",seconds:258,mood:"Nostalgic",color:"linear-gradient(135deg,#a99af1,#e2a5cb)",audioUrl:"",characters:["Rice Shower"],description:"Lagu bernuansa lembut dan emosional dari Rice Shower.",lyrics:[]},
  {id:5,title:"ユメヲカケル！",artist:"Special Week & Team Spica",album:"Yume wo Kakeru!",duration:"4:42",seconds:282,mood:"Chill",color:"linear-gradient(135deg,#77c9db,#8e9ff1)",audioUrl:"",characters:["Team Spica"],description:"Lagu penuh harapan tentang mengejar mimpi bersama.",lyrics:[]}
];
const $ = s => document.querySelector(s);
const audio = $("#audio-player");
let current = null, playing = false, activeFilter = "All", shuffle = false, repeat = false, lastLyric = -1;
let liked = JSON.parse(localStorage.getItem("umatune-liked") || "[]");
const esc = v => String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const formatTime = n => `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,"0")}`;
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2200)}
function renderTracks(){
  if(["discover","profile"].includes(document.body.dataset.page)){$("#liked-count").textContent=liked.length;window.renderPage&&window.renderPage();return}
  const query=$("#search-input").value.toLowerCase().trim();
  const favoritesOnly = document.body.dataset.page === "library" && $("#favorites-filter")?.classList.contains("active");
  let shown=tracks.filter(t=>(activeFilter==="All"||t.mood===activeFilter)&&(!favoritesOnly||liked.includes(t.id))&&`${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(query));
  const sortMode = $("#sort-select")?.value || "default";
  if(sortMode==="title") shown.sort((a,b)=>a.title.localeCompare(b.title));
  if(sortMode==="duration") shown.sort((a,b)=>a.seconds-b.seconds);
  const countNode=$("#track-count"); if(countNode) countNode.textContent=`${shown.length} ${shown.length===1?"track":"tracks"}`;
  $("#track-list").innerHTML=shown.length?shown.map((t,i)=>`<div class="track-row" data-id="${t.id}">
    <span class="track-number">${String(i+1).padStart(2,"0")}</span>
    <div class="track-cover" style="background:${t.color}">♪</div>
    <div class="track-main"><b>${t.title}</b><small>${t.artist}</small></div>
    <div class="track-album">${t.album}</div><span class="track-duration">${t.duration}</span>
    <button class="row-like ${liked.includes(t.id)?"liked":""}" data-like="${t.id}" aria-label="Like ${t.title}">${liked.includes(t.id)?"♥":"♡"}</button>
    <button class="track-play" data-play="${t.id}" aria-label="Play ${t.title}">▶</button>
  </div>`).join(""):`<div class="empty-state">Tidak ada lagu yang cocok. Coba kata kunci lain.</div>`;
  $("#liked-count").textContent=liked.length;
}
function setPlayingState(value){playing=value;$("#play-button").textContent=playing?"Ⅱ":"▶";$("#visualizer")?.classList.toggle("playing",playing);if($("#np-play"))$("#np-play").innerHTML=playing?"Ⅱ <span>Pause</span>":"▶ <span>Play</span>"}
function renderLyrics(track){
  const box=$("#lyrics-content"); if(!box)return;
  const lines=track.lyrics||[];
  if(!lines.length){box.innerHTML='<div class="lyrics-empty"><span>♫</span><b>Lyrics are waiting backstage</b><p>Tambahkan lirik yang kamu miliki hak untuk gunakan ke properti <code>lyrics</code> pada track di <code>script.js</code>.</p></div>';return;}
  lastLyric=-1;box.scrollTop=0;box.innerHTML=lines.map(line=>`<p class="lyric-line" data-time="${Number(line.time)||0}"><span>${esc(line.text)}</span></p>`).join("");
}
function syncLyrics(){
  const box=$("#lyrics-content"); if(!box||!current||!current.lyrics?.length)return;
  const L=current.lyrics,t=audio.currentTime,lines=box.children;let a=-1;
  for(let i=0;i<L.length;i++){if(t>=L[i].time)a=i;else break}
  if(a!==lastLyric){
    lastLyric=a;
    [...lines].forEach((el,i)=>{el.classList.toggle("active",i===a);el.classList.toggle("done",i<a);if(i!==a)el.style.removeProperty("--p")});
    const el=lines[a]; if(el)box.scrollTo({top:el.offsetTop-box.clientHeight/2+el.offsetHeight/2,behavior:"smooth"});
  }
  if(a>=0){ // progres teks: isi warna mengikuti waktu lagu
    const end=L[a+1]?L[a+1].time:(audio.duration||L[a].time+4);
    const p=Math.min(1,Math.max(0,(t-L[a].time)/Math.max(.1,end-L[a].time)));
    lines[a].style.setProperty("--p",(p*100).toFixed(1)+"%");
  }
}
function playTrack(id,quiet){
  const track=tracks.find(t=>t.id===Number(id));if(!track)return;
  current=track;localStorage.setItem("umatune-last",track.id);$("#current-title").textContent=track.title;$("#current-artist").textContent=track.artist;$("#current-cover").style.background=track.color;
  $("#current-like").textContent=liked.includes(track.id)?"♥":"♡";$("#current-like").classList.toggle("liked",liked.includes(track.id));
  if($("#np-title")) {
    $("#np-title").textContent=track.title; $("#np-artist").textContent=track.artist;
    $("#np-album").textContent=track.album; $("#np-cover").style.background=track.color;
    $("#detail-art").style.background=track.color; $("#detail-title").textContent=track.album;
    $("#np-description").textContent=track.description || "Track Uma Musume pilihanmu.";
    $("#np-characters").innerHTML=(track.characters||[]).map(name=>`<span class="character-chip">${name}</span>`).join("");
    $("#np-like").textContent=liked.includes(track.id)?"♥":"♡"; $("#np-like").classList.toggle("liked",liked.includes(track.id));
    renderLyrics(track);
    document.title=`${track.title} — UmaTune`;
  }
  if(!track.audioUrl){audio.pause();setPlayingState(false);$("#elapsed").textContent="0:00";$("#duration").textContent=track.duration;$("#seek").value=0;if(!quiet)toast("Track dipilih. Tambahkan audio lewat tombol ♬ di player.");return}
  audio.src=track.audioUrl;if(quiet){setPlayingState(false);return}audio.play().then(()=>setPlayingState(true)).catch(e=>{if(e&&e.name==="AbortError")return;setPlayingState(false);toast("Audio tidak dapat diputar. Periksa file audio.");});
}
function toggleLike(id){id=Number(id);liked=liked.includes(id)?liked.filter(x=>x!==id):[...liked,id];localStorage.setItem("umatune-liked",JSON.stringify(liked));renderTracks();if(current?.id===id){$("#current-like").textContent=liked.includes(id)?"♥":"♡";$("#current-like").classList.toggle("liked",liked.includes(id));if($("#np-like")){$("#np-like").textContent=liked.includes(id)?"♥":"♡";$("#np-like").classList.toggle("liked",liked.includes(id))}}}
$("#track-list")?.addEventListener("click",e=>{const like=e.target.closest("[data-like]"),play=e.target.closest("[data-play]");if(like)toggleLike(like.dataset.like);if(play)playTrack(play.dataset.play)});
$("#search-input")?.addEventListener("input",renderTracks);
document.querySelectorAll(".mood-card").forEach(btn=>btn.addEventListener("click",()=>{activeFilter=btn.dataset.filter;renderTracks();$("#library").scrollIntoView({behavior:"smooth"});toast(activeFilter==="All"?"Menampilkan semua lagu":`Mood: ${activeFilter}`)}));
$("#show-all")?.addEventListener("click",()=>{activeFilter="All";$("#search-input").value="";renderTracks()});
$("#hero-play")?.addEventListener("click",()=>{$("#discover")?.scrollIntoView({behavior:"smooth"});toast("Pilih mood dan temukan lagu favoritmu!")});
// Initialize theme consistently on Home, Library, and Now Playing.
const themeButton = $("#theme-toggle");
const savedTheme = localStorage.getItem("umatune-theme");
document.body.dataset.theme = savedTheme === "light" ? "light" : "dark";
function updateThemeButton(){
  if(!themeButton) return;
  const isLight = document.body.dataset.theme === "light";
  themeButton.textContent = isLight ? "☾" : "☼";
  themeButton.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
  themeButton.setAttribute("title", isLight ? "Ganti ke tema gelap" : "Ganti ke tema terang");
}
updateThemeButton();
themeButton?.addEventListener("click",()=>{
  const next = document.body.dataset.theme === "dark" ? "light" : "dark";
  document.body.dataset.theme = next;
  localStorage.setItem("umatune-theme", next);
  updateThemeButton();
});
$("#play-button").addEventListener("click",()=>{if(!current){playTrack(tracks[0].id);return}if(!current.audioUrl){toast("Tambahkan URL audio di script.js untuk mengaktifkan playback.");return}if(playing){audio.pause();setPlayingState(false)}else audio.play().then(()=>setPlayingState(true)).catch(()=>toast("Audio gagal diputar."))});
function moveTrack(direction){if(!current){playTrack(tracks[0].id);return}let i=tracks.findIndex(t=>t.id===current.id);if(shuffle&&tracks.length>1){let n;do{n=Math.floor(Math.random()*tracks.length)}while(n===i);i=n}else i=(i+direction+tracks.length)%tracks.length;playTrack(tracks[i].id)}
$("#next-button").addEventListener("click",()=>moveTrack(1));$("#prev-button").addEventListener("click",()=>moveTrack(-1));
$("#shuffle-button").addEventListener("click",()=>{shuffle=!shuffle;$("#shuffle-button").classList.toggle("active",shuffle);toast(shuffle?"Shuffle aktif":"Shuffle nonaktif")});
$("#repeat-button").addEventListener("click",()=>{repeat=!repeat;$("#repeat-button").classList.toggle("active",repeat);toast(repeat?"Repeat aktif":"Repeat nonaktif")});
$("#current-like").addEventListener("click",()=>current&&toggleLike(current.id));
audio.addEventListener("timeupdate",()=>{syncLyrics();if(!audio.duration)return;$("#seek").value=audio.currentTime/audio.duration*100;$("#elapsed").textContent=formatTime(audio.currentTime);$("#duration").textContent=formatTime(audio.duration)});
$("#seek").addEventListener("input",()=>{if(audio.duration)audio.currentTime=Number($("#seek").value)/100*audio.duration});
$("#volume").addEventListener("input",()=>audio.volume=Number($("#volume").value));audio.volume=Number(localStorage.getItem("umatune-vol")??.75);$("#volume").value=audio.volume;
audio.addEventListener("ended",()=>{if(repeat&&current){audio.currentTime=0;audio.play()}else if(localStorage.getItem("umatune-autoplay")==="false")setPlayingState(false);else moveTrack(1)});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();const si=$("#search-input");si?si.focus():location.href="discover.html"}});

// Dedicated Music Library controls (only present on library.html).
if(document.body.dataset.page === "now-playing"){
  $("#np-like").addEventListener("click",()=>current&&toggleLike(current.id));
  $("#np-play").addEventListener("click",()=>current?$("#play-button").click():playTrack(tracks[0].id));
  $("#np-next").addEventListener("click",()=>moveTrack(1));
  $("#np-prev").addEventListener("click",()=>moveTrack(-1));
  const requestedTrack=Number(new URLSearchParams(location.search).get("track"))||Number(localStorage.getItem("umatune-last"))||tracks[0].id;
  playTrack(requestedTrack,true);
}
if(document.body.dataset.page === "library"){
  document.querySelectorAll("#library-filters [data-filter]").forEach(btn=>btn.addEventListener("click",()=>{
    activeFilter=btn.dataset.filter;
    document.querySelectorAll("#library-filters .filter-pill").forEach(p=>p.classList.toggle("active",p===btn));
    renderTracks();
  }));
  $("#favorites-filter").addEventListener("click",e=>{e.currentTarget.classList.toggle("active");renderTracks();});
  $("#sort-select").addEventListener("change",renderTracks);
  if(new URLSearchParams(location.search).get("favorites")==="1") $("#favorites-filter").classList.add("active");
}

renderTracks();
