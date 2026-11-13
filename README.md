# UmaTune — Home, Music Library & Now Playing

Fan-made Uma Musume music player interface built with HTML, CSS, and vanilla JavaScript (no framework).

## Run
Open `index.html` in a browser, or open the folder in VS Code and use Live Server.
- `index.html` — Home
- `library.html` — Music Library
- `now-playing.html` — Now Playing detail page
- `discover.html` — Discover: pencarian lagu, filter mood/karakter, urutan, pencarian terakhir
- `profile.html` — Profil: statistik, riwayat, playlist, pengaturan, cadangan data

From any page, choose **Now Playing** in the sidebar. You can open a specific track with `now-playing.html?track=1` (replace the ID with a track ID from `script.js`).

## Audio and lyrics
Open `script.js` and add a direct audio file URL to each track's `audioUrl` field, for example:
`audioUrl: "assets/audio/your-audio-file.mp3"`
Place audio files in `assets/audio/`. Use only audio files you have the right to use. No copyrighted music files or lyrics are bundled.

For synchronized lyrics, add authorized lines to a track's `lyrics` array, using seconds:
`lyrics: [{ time: 0, text: "Your licensed lyric line" }, { time: 8, text: "Next line" }]`

The visualizer animates when a track with a valid audio URL is playing. Without an audio URL, the track can still be selected and its information displayed, but playback and time-synced lyrics remain inactive.

## Features
- Home, Music Library, and Now Playing pages
- Dark/light themes saved in localStorage
- Search, mood filters, favorites, and library sorting
- Shared mini-player with play/pause, previous/next, seek, volume, shuffle, and repeat
- Now Playing artwork treatment, animated visualizer, character tags, track details, and synchronized-lyrics framework
- Responsive desktop and mobile layouts

## Update v2
- `extras.js` (dimuat setelah `script.js`): wallpaper (preset/upload, atur gelap & blur — tombol ▨ di topbar), transisi halaman, upload audio lokal (♬, tersimpan di IndexedDB) & impor lirik `.lrc` (✎), panel antrian, mute, menu mobile (☰), lanjut posisi lagu antar halaman.
- Shortcut: Space play/pause, N/P next/prev, S shuffle, R repeat, L like, M mute, ←/→ ±5 detik, Ctrl/⌘+K cari.

## Update v3
- `v3.js` (dimuat terakhir): panel kiri & pemutar bawah bisa dibuka/ditutup, menu profil, Discover, halaman Profil, animasi teks.
- **Panel**: tombol ☰ di topbar (atau tombol `[`) untuk panel kiri; tab ⌄ di atas pemutar (atau `]`) untuk pemutar bawah. Status tersimpan. Saat pemutar ditutup tersisa tab kecil dengan tombol putar/jeda.
- **Menu profil** (klik avatar): statistik singkat, tautan profil/disukai/riwayat/playlist, sleep timer, kecepatan putar, putar otomatis, tema, wallpaper, pintasan keyboard, hapus data.
- **Animasi teks**: judul muncul kata demi kata, judul lagu berganti dengan transisi, dan lirik tersinkron terisi warna mengikuti waktu lagu.
- Pintasan baru: `[` panel kiri, `]` pemutar, `/` fokus pencarian (Discover). Ctrl/⌘+K kini bekerja dari mana saja.
- Wallpaper hasil upload disimpan di IndexedDB (bukan localStorage), jadi tidak kena batas kuota.
- **Info lagu otomatis** (Discover → "Cari info otomatis"): mengambil cover, durasi, dan preview 30 detik dari iTunes Search API, plus lirik tersinkron dari LRCLIB. Hasil disimpan di browser. Bila judul di script.js berbeda dari judul asli di iTunes, tambahkan `search:"judul asli"` pada track atau isi `ALIAS` di `v3.js`. Preview hanya 30 detik; untuk lagu penuh tambahkan file sendiri lewat tombol ♬.
