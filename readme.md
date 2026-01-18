# 🚀 Media-DL Pro 2026

**The Ultimate Cross-Platform Media Engine Manager**

Media-DL Pro is an advanced *CLI wrapper* built on top of `yt-dlp`, designed for speed, structure, and security. It is not just a downloader, but a smart local media manager with an automated installation system.

---

## ✨ New Key Features

### 1. ⚡ Direct Download & Menu Mode

You can now choose between two usage styles:

* **Interactive Mode**: Simply run `media-dl` to access a clean, user-friendly main menu.
* **Fast Mode**: Run `media-dl <url>` to start downloading immediately without entering the menu.

### 2. 📱 Android (Termux) Ready

Full support for mobile users via Termux, with automatic installation scripts tailored for the Android Linux environment.

### 3. 🛡️ Safe Mode Guard™ (Updated)

Designed to avoid bot detection through:

* **Rate Limiting**: Capped at 5 MB/s.
* **Smart Sleep**: Random delays between 3–10 seconds.
* **Modern User-Agent**: Uses up-to-date browser identifiers for safer requests.

---

## 🎞️ Supported Platforms

Powered by the continuously updated `yt-dlp` engine, Media-DL Pro supports downloads from:

* **YouTube**: Videos, Shorts, and Playlists.
* **Social Media**: TikTok, Instagram Reels, Twitter (X).
* **VOD Services**: And hundreds of other video platforms.

---

## 📦 Installation

### Requirements

* **Node.js**: Version 14.0.0 or later.

### Install

```bash
npm install -g media-dl
```

### Usage

```bash
# Open the main menu
media-dl

# Direct download without menu
media-dl https://www.youtube.com/watch?v=example
```

---

## 🛠️ System Navigation

1. **📥 Download Media**
   Supports quality selection (Video / MP3 Audio) and playlist filtering (e.g. `1,3,5-10`).

2. **🛡️ Toggle Safe Mode**
   Enable or disable additional protection on the fly.

3. **⚙️ Maintenance**
   Automatically update `yt-dlp` and `FFmpeg` directly from the app—no manual downloads required.

4. **🗑️ Reset System**
   Remove all engines for a clean reinstallation.

---

## 💻 System Compatibility

| Operating System | Status      | Method                                  |
| ---------------- | ----------- | --------------------------------------- |
| **Windows**      | ✅ Supported | Auto-download `.exe` into `~/.media-dl` |
| **macOS**        | ✅ Supported | Auto-download via `curl`                |
| **Linux**        | ✅ Supported | Integrated via `apt` (Debian/Ubuntu)    |
| **Termux**       | ✅ Supported | Integrated via `pkg` & `pip`            |

---

## 📂 Storage Structure

Your downloads are neatly organized under:

* **Video**: `~/Downloads/media-dl/video/`
* **Audio**: `~/Downloads/media-dl/audio/`
* **Playlists**: Automatically grouped into subfolders by playlist name.

---

## ❤️ Support

This project is developed and maintained by **Ariska Hidayat**.
If you find it useful, you can support ongoing development and server/engine maintenance via:

* **☕ Buy Me a Coffee (Indonesia)**:
  [https://app.midtrans.com/coffee](https://app.midtrans.com/coffee)
* **🍕 Buy Me a Pizza (Indonesia)**:
  [https://app.midtrans.com/pizza](https://app.midtrans.com/pizza)
* **🌍 PayPal (International)**:
  [https://www.paypal.com/ncp/payment/RSXEBXBQGDYN4](https://www.paypal.com/ncp/payment/RSXEBXBQGDYN4)