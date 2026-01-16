# Media-DL CLI 2026 🚀

**Media-DL CLI** adalah pengunduh media berbasis terminal generasi terbaru yang dirancang untuk kecepatan, kemudahan, dan kompatibilitas penuh. Ditenagai oleh `yt-dlp`, alat ini memastikan video yang Anda unduh selalu siap diputar di perangkat apa pun tanpa kendala codec.

## ✨ Fitur Unggulan

* 📥 **YouTube Playlist Power**: Deteksi otomatis playlist. Pilih video tertentu (misal: `1,3,5-10`) atau unduh semua sekaligus.
* 🍏 **Apple Ecosystem Ready**: Secara otomatis mengonversi dan mengoptimalkan video ke format **H.264 (AVC1)** & **AAC** agar lancar diputar di **QuickTime Player**, iPhone, dan iPad.
* 🛠️ **Smart Auto-Installer**: Tidak perlu pusing mengunduh `yt-dlp` atau `ffmpeg` secara manual. Skrip akan menyiapkannya untuk Anda (Optimal untuk macOS).
* 📂 **Organized Storage**: Hasil unduhan tersimpan rapi di folder standar sistem `~/Downloads/media-dl/` yang dipisahkan berdasarkan kategori `video` dan `audio`.
* 🛡️ **Fail-Safe Filename**: Fitur pemotongan judul otomatis untuk menghindari error *filename too long* pada sistem macOS/Windows.

## 📦 Instalasi

Cukup pastikan Anda memiliki [Node.js](https://nodejs.org/) terinstal, lalu jalankan:

```bash
npm install -g media-dl

```

## 🚀 Cara Penggunaan

Jalankan perintah berikut di terminal Anda:

```bash
media-dl

```

### Panduan Menu:

1. **Download Media**: Masukkan link video atau playlist.
2. **Pilih Format**: Video MP4 (QuickTime Compatible) atau Audio MP3.
3. **Seleksi Playlist**: Masukkan angka video yang diinginkan (Contoh: `1,3-5`) atau tekan `Enter` untuk semua.
4. **Auto-Open**: Folder tujuan akan otomatis terbuka setelah proses selesai.

## 📁 Lokasi Penyimpanan

Skrip ini menggunakan struktur folder yang rapi:

* **Tools**: `~/.media-dl/` (Tersembunyi agar sistem tetap bersih).
* **Video**: `~/Downloads/media-dl/video/`
* **Audio**: `~/Downloads/media-dl/audio/`

## 📋 Persyaratan Sistem

* **Node.js**: v14.0.0 atau lebih tinggi.
* **FFmpeg**: Diperlukan untuk konversi tingkat lanjut. Gunakan **Menu 3** di dalam aplikasi untuk instalasi otomatis (macOS).

## ❤️ Dukungan & Donasi

Skrip ini dikembangkan secara terbuka. Jika alat ini membantu produktivitas Anda, pertimbangkan untuk traktir pengembang:

* **Beli Kopi ☕**: [Donasi via Midtrans](https://app.midtrans.com/payment-links/coffee-developer)
* **Beli Pizza 🍕**: [Donasi via Midtrans](https://app.midtrans.com/payment-links/pizza-developer)

---

## 📄 Lisensi

Distribusi di bawah Lisensi MIT. Bebas digunakan dan dikembangkan kembali.

---