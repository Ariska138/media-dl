# 🚀 Media-DL Pro 2026

**The Ultimate Cross-Platform Media Engine Manager**

Media-DL Pro adalah *CLI wrapper* canggih berbasis `yt-dlp` yang dirancang untuk kecepatan, keteraturan, dan keamanan. Bukan sekadar pengunduh, ini adalah manajer media lokal yang cerdas dengan sistem instalasi otomatis.

---

## ✨ Fitur Unggulan Baru

### 1. ⚡ Direct Download & Menu Mode

Sekarang kamu bisa memilih dua cara penggunaan:

* **Interactive Mode**: Cukup ketik `media-dl` untuk masuk ke menu utama yang cantik.
* **Fast Mode**: Ketik `media-dl <url>` untuk langsung masuk ke proses download tanpa basa-basi.

### 2. 📱 Android (Termux) Ready

Dukungan penuh untuk pengguna mobile via Termux dengan script instalasi otomatis yang menyesuaikan lingkungan Linux Android.

### 3. 🛡️ Safe Mode Guard™ (Updated)

Menghindari deteksi bot dengan:

* **Rate Limiting**: Dibatasi hingga 5 MB/s.
* **Smart Sleep**: Jeda acak 3–10 detik.
* **Modern User-Agent**: Identitas browser terbaru agar tetap aman.

---

## 🎞️ Platform yang Didukung

Berkat engine `yt-dlp` yang selalu diperbarui, kamu bisa mengunduh dari:

* **YouTube**: Video, Shorts, & Playlist.
* **Social Media**: TikTok, Instagram Reels, Twitter (X).
* **VOD Services**: Dan ratusan platform video lainnya.

---

## 📦 Instalasi

### Prasyarat

* **Node.js**: Versi 14.0.0 atau lebih tinggi.

### Cara Install

```bash
npm install -g media-dl

```

### Penggunaan

```bash
# Buka menu utama
media-dl

# Download langsung tanpa menu
media-dl https://www.youtube.com/watch?v=example

```

---

## 🛠️ Navigasi Sistem

1. **📥 Download Media**: Mendukung pemilihan kualitas (Video/Audio MP3) dan seleksi playlist (misal: `1,3,5-10`).
2. **🛡️ Toggle Safe Mode**: Aktifkan perlindungan tambahan secara *on-the-fly*.
3. **⚙️ Maintenance**: Update otomatis `yt-dlp` dan `FFmpeg` langsung dari aplikasi tanpa perlu download manual.
4. **🗑️ Reset System**: Hapus semua engine untuk instalasi ulang yang bersih.

---

## 💻 Kompatibilitas Sistem

| Sistem Operasi | Status | Cara Kerja |
| --- | --- | --- |
| **Windows** | ✅ Supported | Auto-download `.exe` ke folder `~/.media-dl` |
| **macOS** | ✅ Supported | Auto-download via `curl` |
| **Linux** | ✅ Supported | Integrasi via `apt` (Debian/Ubuntu) |
| **Termux** | ✅ Supported | Integrasi via `pkg` & `pip` |

---

## 📂 Struktur Penyimpanan

Unduhan kamu akan tersimpan rapi di:

* **Video**: `~/Downloads/media-dl/video/`
* **Audio**: `~/Downloads/media-dl/audio/`
* **Playlist**: Sub-folder otomatis berdasarkan nama playlist.

---

## ❤️ Dukungan

Aplikasi ini dikembangkan oleh **Ariska Hidayat**. Jika bermanfaat, kamu bisa memberikan dukungan untuk biaya pemeliharaan server/engine:

* **☕ Traktir Kopi**: [Midtrans Coffee](https://app.midtrans.com/coffee)
* **🍕 Beli Pizza**: [Midtrans Pizza](https://app.midtrans.com/pizza)
