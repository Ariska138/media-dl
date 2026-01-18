#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { C, printHeader, renderProgressBar, askQuestion, rl } = require('./ui');

// --- KONFIGURASI VISUAL (ANSI COLORS) ---

const TOOLS_DIR = path.join(os.homedir(), '.media-dl');

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isTermux =
  process.env.PREFIX && process.env.PREFIX.includes('com.termux');

let YTDLP_PATH = path.join(TOOLS_DIR, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
let FFMPEG_PATH = path.join(TOOLS_DIR, isWindows ? 'ffmpeg.exe' : 'ffmpeg');

// State Aplikasi
let safeMode = true;

if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });

function checkTools() {
  let ytExists = fs.existsSync(YTDLP_PATH);
  let ffExists = fs.existsSync(FFMPEG_PATH);

  // Cek Global yt-dlp
  if (!ytExists) {
    try {
      const cmd = isWindows ? 'where yt-dlp' : 'which yt-dlp';
      const pathFound = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim()
        .split('\n')[0];
      if (pathFound) {
        YTDLP_PATH = pathFound; // UPDATE PATH KE GLOBAL
        ytExists = true;
      }
    } catch (e) {}
  }

  // Cek Global ffmpeg
  if (!ffExists) {
    try {
      const cmd = isWindows ? 'where ffmpeg' : 'which ffmpeg';
      const globalPath = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim()
        .split('\n')[0];
      if (globalPath) {
        FFMPEG_PATH = globalPath; // UPDATE PATH KE GLOBAL
        ffExists = true;
      }
    } catch (e) {}
  }

  return { ytExists, ffExists, allReady: ytExists && ffExists };
}

// --- INSTALLERS ---
async function installYtdlp() {
  if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });

  printHeader('INSTALL / UPDATE YT-DLP');
  console.log(`${C.blue}⏳ Sedang mengunduh engine terbaru...${C.reset}`);
  const url = isWindows
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

  try {
    if (isTermux) {
      // Di Termux, lebih disarankan menggunakan python/pip untuk stabilitas
      console.log(`${C.dim}Menginstall yt-dlp via python...${C.reset}`);
      execSync('pkg update && pkg install python ffmpeg -y', {
        stdio: 'inherit',
      });
      execSync('pip install -U "yt-dlp[default]"', { stdio: 'inherit' });
      console.log(
        `\n${C.green}✅ yt-dlp berhasil diinstal di Termux!${C.reset}`,
      );
    } else if (isWindows) {
      execSync(
        `powershell -Command "Invoke-WebRequest -Uri ${url} -OutFile '${YTDLP_PATH}'"`,
        { stdio: 'inherit' },
      );
    } else {
      // Linux (Ubuntu) & macOS
      execSync(`curl -L -# "${url}" -o "${YTDLP_PATH}"`, { stdio: 'inherit' });
      execSync(`chmod a+rx "${YTDLP_PATH}"`);
    }
    if (!isTermux) {
      console.log(`\n${C.green}✅ yt-dlp berhasil dikonfigurasi!${C.reset}`);
    }
  } catch (e) {
    console.error(
      `\n${C.red}❌ Gagal mengunduh. Periksa koneksi internet Anda.${C.reset}`,
    );
  }
}

async function installFfmpeg() {
  printHeader('INSTALL FFmpeg');
  console.log(
    `${C.dim}FFmpeg diperlukan untuk kualitas 1080p+ dan konversi MP3.${C.reset}\n`,
  );

  try {
    if (isTermux) {
      console.log(
        `${C.blue}⏳ Mendeteksi Termux: Menginstall via pkg...${C.reset}`,
      );
      execSync('pkg update && pkg install ffmpeg -y', { stdio: 'inherit' });
      console.log(
        `\n${C.green}✅ FFmpeg berhasil diinstal di Termux!${C.reset}`,
      );
    } else if (isMac) {
      // ... (Kode macOS Anda sudah benar)
      console.log(`${C.blue}⏳ Mengunduh FFmpeg untuk macOS...${C.reset}`);
      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      execSync(
        `curl -L -# "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip" -o "${zipPath}"`,
        { stdio: 'inherit' },
      );
      execSync(`unzip -o "${zipPath}" -d "${TOOLS_DIR}"`, { stdio: 'inherit' });
      execSync(`rm "${zipPath}"`);
      execSync(`chmod a+rx "${FFMPEG_PATH}"`);
      console.log(`\n${C.green}✅ FFmpeg aktif di macOS.${C.reset}`);
    } else if (isWindows) {
      console.log(
        `${C.blue}⏳ Mengunduh FFmpeg untuk Windows (Essentials)...${C.reset}`,
      );

      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      // Link direct ke build essentials agar file tidak terlalu besar
      const url =
        'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';

      // 1. Download menggunakan PowerShell
      execSync(
        `powershell -Command "Invoke-WebRequest -Uri ${url} -OutFile '${zipPath}'"`,
        { stdio: 'inherit' },
      );

      console.log(`${C.yellow}📦 Mengekstrak FFmpeg...${C.reset}`);

      // 2. Ekstrak menggunakan perintah 'tar' (Bawaan Windows 10+)
      // Kita hanya mengambil ffmpeg.exe dari dalam folder bin di zip tersebut
      execSync(
        `tar -xf "${zipPath}" -C "${TOOLS_DIR}" --strip-components 2 "*/bin/ffmpeg.exe" "*/bin/ffprobe.exe"`,
        { stdio: 'inherit' },
      );

      // 3. Bersihkan file zip
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

      console.log(
        `\n${C.green}✅ FFmpeg berhasil diinstal di Windows!${C.reset}`,
      );
    } else {
      // Asumsi Linux (Ubuntu/Debian)
      console.log(
        `${C.blue}⏳ Mendeteksi Linux: Menginstall via apt...${C.reset}`,
      );
      console.log(`${C.dim}Mungkin memerlukan password sudo.${C.reset}`);
      execSync('sudo apt update && sudo apt install ffmpeg -y', {
        stdio: 'inherit',
      });
      console.log(
        `\n${C.green}✅ FFmpeg berhasil diinstal di Linux!${C.reset}`,
      );
    }
  } catch (e) {
    console.error(
      `${C.red}❌ Gagal menginstal FFmpeg secara otomatis.${C.reset}`,
    );
    console.log(`${C.dim}Error: ${e.message}${C.reset}`);
  }
}

function runSpawn(command, args) {
  return new Promise((resolve) => {
    const proc = spawn(command, args);
    let lastOutput = '';

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      // Regex untuk menangkap progress dari yt-dlp
      const progressMatch = output.match(
        /\[download\]\s+(\d+\.\d+)%\s+of\s+.*\s+at\s+([\d\w\./s]+)\s+ETA\s+([\d:]+)/,
      );

      if (progressMatch) {
        const [_, percent, speed, eta] = progressMatch;
        renderProgressBar(parseFloat(percent), speed, eta);
      } else {
        // Jika bukan bar, print normal (misal: info merging/ffmpeg)
        if (output.trim() && !output.includes('[download]')) {
          process.stdout.write(`\n${C.dim}${output.trim()}${C.reset}\n`);
        }
      }
    });

    proc.stderr.on('data', (data) => {
      const err = data.toString();
      if (!err.includes('WARNING')) {
        process.stdout.write(`\n${C.red}⚠️  ${err}${C.reset}`);
      }
    });

    proc.on('close', (code) => {
      process.stdout.write('\n'); // Baris baru setelah selesai
      resolve(code);
    });
  });
}

async function getEstimate(url, format) {
  try {
    const sizeStr = execSync(
      `"${YTDLP_PATH}" --print "%(filesize_approx,filesize)s" -f "${format}" --no-warnings "${url}"`,
      {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 10000,
      },
    ).trim();

    if (sizeStr && sizeStr !== 'NA') {
      const bytes = parseInt(sizeStr);
      if (isNaN(bytes)) return 'N/A';
      if (bytes > 1024 * 1024 * 1024)
        return (bytes / 1024 ** 3).toFixed(2) + ' GB';
      return (bytes / 1024 ** 2).toFixed(2) + ' MB';
    }
  } catch (e) {}
  return 'Estimasi tidak tersedia';
}

// --- DOWNLOAD ENGINE ---
async function startDownload(videoURLFromArgs = null) {
  let { ytExists, ffExists } = checkTools();
  if (!ytExists) {
    console.log(
      `\n${C.red}❌ Engine yt-dlp tidak ditemukan. Silakan pilih menu Update/Install.${C.reset}`,
    );
    await askQuestion('Tekan Enter...');
    return mainMenu();
  }

  if (!ffExists) {
    console.log(
      `${C.yellow}⚠️  Peringatan: FFmpeg tidak ditemukan. Video mungkin tidak tergabung dengan audio.${C.reset}`,
    );
    const cont = await askQuestion('Lanjutkan saja? (y/n): ');
    if (cont.toLowerCase() !== 'y') return mainMenu();
  }

  const videoURL =
    videoURLFromArgs || (await askQuestion('Masukkan Link (Video/Playlist): '));
  if (!videoURL) return mainMenu();

  console.log(`${C.dim}⏳ Menganalisa tautan...${C.reset}`);
  let playlistInfo = { isPlaylist: false, title: '', items: [] };

  try {
    const rawInfo = execSync(
      `"${YTDLP_PATH}" --flat-playlist --no-warnings --print "%(playlist_title)s|%(title)s" "${videoURL}"`,
      {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 20000,
      },
    );
    const lines = rawInfo.trim().split('\n');
    if (lines.length > 1 || videoURL.includes('playlist?list=')) {
      playlistInfo.isPlaylist = true;
      playlistInfo.title = lines[0].split('|')[0] || 'Unduhan Playlist';
      playlistInfo.items = lines.map((l) => l.split('|')[1]).filter(Boolean);
    }
  } catch (e) {
    console.log(`\n${C.red}❌ Gagal menganalisa tautan.${C.reset}`);
    if (e.message.includes('ETIMEDOUT')) {
      console.log(
        `${C.yellow}⚠️  Waktu analisa habis. Periksa koneksi internet Anda.${C.reset}`,
      );
    } else {
      console.log(
        `${C.yellow}⚠️  Pastikan link valid atau tidak diprivat/dihapus.${C.reset}`,
      );
    }
    await askQuestion('\nTekan Enter untuk kembali ke menu...');
    return mainMenu();
  }

  // --- PEMILIHAN PLAYLIST (Tetap Sama) ---
  let playlistSelection = null;
  if (playlistInfo.isPlaylist) {
    // ... (Logika tampilan playlist sama seperti sebelumnya)
    console.log(
      `\n${C.bgBlue}${C.bright} 📂 PLAYLIST TERDETEKSI: ${playlistInfo.title} ${C.reset}`,
    );
    playlistInfo.items.forEach((item, index) => {
      console.log(
        `${C.cyan}${(index + 1).toString().padStart(3, ' ')}.${C.reset} ${item}`,
      );
    });
    console.log(
      `\n${C.dim}Contoh pilih nomor: 1,3,5-10 atau biarkan kosong untuk semua.${C.reset}`,
    );
    const selectionInput = await askQuestion('\nPilih nomor: ');
    if (selectionInput) {
      // ... (Logika parsing nomor playlist)
      const selected = new Set();
      selectionInput.split(',').forEach((p) => {
        if (p.includes('-')) {
          const [s, e] = p.split('-').map(Number);
          for (let i = s; i <= e; i++)
            if (i > 0 && i <= playlistInfo.items.length) selected.add(i);
        } else {
          const n = parseInt(p.trim());
          if (n > 0 && n <= playlistInfo.items.length) selected.add(n);
        }
      });
      playlistSelection = Array.from(selected).join(',');
    }
  }

  // --- MENU FORMAT UTAMA ---
  console.log(`\n${C.bright} [ PILIH FORMAT ]${C.reset}`);
  console.log(` ${C.green}1.${C.reset} Video (MP4)`);
  console.log(` ${C.green}2.${C.reset} Audio Only (MP3)`);
  const mode = await askQuestion('Pilihan: ');

  // --- LOGIKA RESOLUSI OPTIMAL ---
  let formatArg = '';
  if (mode === '1') {
    console.log(`\n${C.bright} [ PILIH RESOLUSI ]${C.reset}`);
    console.log(` ${C.cyan}1.${C.reset} Best Quality (Up to 4K)`);
    console.log(` ${C.cyan}2.${C.reset} Tablet Optimal (720p)`);
    console.log(` ${C.cyan}3.${C.reset} Mobile Optimal (480p)`);
    const resChoice = await askQuestion('Pilihan Resolusi (1-3): ');

    if (resChoice === '2') {
      formatArg =
        'bestvideo[height<=720][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=720]';
    } else if (resChoice === '3') {
      formatArg =
        'bestvideo[height<=480][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=480]';
    } else {
      formatArg =
        'bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[vcodec^=avc1]/best';
    }
  }
  // --- TAMPILKAN ESTIMASI ---
  if (!playlistInfo.isPlaylist && mode === '1') {
    console.log(`${C.dim}⏳ Menghitung estimasi ukuran file...${C.reset}`);
    const size = await getEstimate(videoURL, formatArg);
    console.log(`${C.yellow}📊 Estimasi Ukuran: ${C.bright}${size}${C.reset}`);

    const confirm = await askQuestion('Lanjutkan unduhan? (Y/n): ');
    if (confirm.toLowerCase() === 'n') return mainMenu();
  }

  const baseDir = path.join(os.homedir(), 'Downloads', 'media-dl');
  const subFolder = mode === '2' ? 'audio' : 'video';
  let outputDir = path.join(baseDir, subFolder);
  if (playlistInfo.isPlaylist)
    outputDir = path.join(
      outputDir,
      playlistInfo.title.replace(/[\\/:"*?<>|]/g, '_'),
    );
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  let args = [
    '--ffmpeg-location',
    FFMPEG_PATH,
    '-o',
    `${outputDir}/%(title).100s.%(ext)s`,
    videoURL,
  ];

  // Integrasi Safe Mode (cite: cli.js)
  if (safeMode) {
    args.push(
      '--rate-limit',
      '5M',
      '--sleep-interval',
      '3',
      '--max-sleep-interval',
      '10',
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    );
  }

  if (playlistSelection) args.push('--playlist-items', playlistSelection);
  else if (!playlistInfo.isPlaylist) args.push('--no-playlist');

  if (mode === '2') {
    if (!ffExists) {
      console.log(
        `${C.red}❌ Error: Anda wajib menginstal FFmpeg untuk mengunduh audio.${C.reset}`,
      );
      return mainMenu();
    }
    args.unshift('-x', '--audio-format', 'mp3');
  } else {
    args.unshift('-f', formatArg);
    if (ffExists) args.unshift('--recode-video', 'mp4');
  }

  args.push('--no-mtime');
  console.log(`\n${C.bgBlue}${C.bright} 🚀 MEMULAI PROSES... ${C.reset}\n`);

  const code = await runSpawn(YTDLP_PATH, args);
  if (code === 0) {
    console.log(`\n${C.green}✨ SELESAI! Cek folder: ${outputDir}${C.reset}`);
    try {
      execSync(
        isWindows
          ? `explorer "${outputDir}"`
          : isMac
            ? `open "${outputDir}"`
            : `xdg-open "${outputDir}"`,
      );
    } catch (e) {}
  } else {
    console.log(`\n${C.red}❌ Terjadi kesalahan saat mengunduh.${C.reset}`);
  }
  await askQuestion('Tekan Enter untuk kembali ke Menu Utama...');
  mainMenu();
}

async function showSupport() {
  // Menggunakan 2 parameter: Judul dan Summary
  printHeader('TENTANG APLIKASI', 'Media-DL Manager Pro v2.0.0 - 2026');

  // --- SEKSI FITUR ---
  console.log(` ${C.bright}${C.cyan}OVERVIEW${C.reset}`);
  console.log(` Terima kasih telah memilih MEDIA-DL. Skrip ini dirancang`);
  console.log(` untuk memudahkan manajemen unduhan media secara lokal.\n`);

  console.log(` ${C.bright}${C.cyan}FITUR UNGGULAN${C.reset}`);
  const features = [
    {
      icon: '✦',
      title: 'High Quality',
      desc: 'Mendukung hingga 4K & Audio 320kbps',
    },
    {
      icon: '✦',
      title: 'Multi-Source',
      desc: 'YouTube, TikTok, IG Reels, & Shorts',
    },
    {
      icon: '✦',
      title: 'Batch Mode',
      desc: 'Mendukung unduhan Playlist secara massal',
    },
    {
      icon: '✦',
      title: 'Safe Guard',
      desc: 'Mode proteksi agar akun/IP tidak terblokir',
    },
  ];

  features.forEach((f) => {
    console.log(
      `  ${C.green}${f.icon}${C.reset} ${C.white}${f.title.padEnd(15)}${
        C.reset
      } ${C.dim}• ${f.desc}${C.reset}`,
    );
  });

  console.log('\n' + '─'.repeat(52));

  // --- SEKSI DUKUNGAN ---
  console.log(`\n ${C.bright}${C.magenta}DUKUNGAN & DONASI${C.reset}`);
  console.log(` Dukungan Anda sangat membantu pengembang untuk terus`);
  console.log(` memperbarui engine dan fitur aplikasi ini.\n`);

  // Menampilkan Link dengan label background agar menonjol
  const links = [
    { label: ' ☕ BELI KOPI ', url: 'https://app.midtrans.com/coffee' },
    { label: ' 🍕 BELI PIZZA', url: 'https://app.midtrans.com/pizza' },
  ];

  links.forEach((l) => {
    console.log(
      `  ${C.bgBlue}${C.white}${l.label}${C.reset} ${C.blue}➜${C.reset} ${C.dim}${l.url}${C.reset}`,
    );
  });

  console.log(`\n${C.cyan}${'━'.repeat(52)}${C.reset}`);

  await askQuestion('Tekan Enter untuk kembali ke Menu Utama...');
  mainMenu();
}

async function mainMenu() {
  const { ytExists, ffExists } = checkTools();

  // Menggunakan 2 parameter: Judul dan Summary status singkat
  printHeader('MEDIA-DL PRO 2026', 'Pusat Kendali Unduhan Media Lokal');

  // --- SEKSI DASHBOARD (INFO SISTEM) ---
  const statusYt = ytExists
    ? `${C.green}Ready${C.reset}`
    : `${C.red}Not Found${C.reset}`;
  const statusFf = ffExists
    ? `${C.green}Ready${C.reset}`
    : `${C.yellow}Missing${C.reset}`;
  const safeBadge = safeMode
    ? `${C.bgBlue}${C.white}  ON  ${C.reset}`
    : `${C.bgRed}${C.white} OFF ${C.reset}`;

  console.log(` ${C.bright}SYSTEM STATUS${C.reset}`);
  console.log(` 🤖 Engine : [ ${statusYt} ]  |  🎬 FFmpeg : [ ${statusFf} ]`);
  console.log(` 🛡️  Safe Mode Guard : ${safeBadge}\n`);

  console.log(` ${C.cyan}━${'━'.repeat(48)}${C.reset}`);

  // --- SEKSI NAVIGASI ---
  console.log(` ${C.bright}MAIN SERVICES${C.reset}`);
  console.log(
    `  ${C.cyan}1.${C.reset} 📥 Download Media         ${C.dim}(Video, Music, Playlist)${C.reset}`,
  );
  console.log(
    `  ${C.cyan}2.${C.reset} 🛡️  Toggle Safe Mode        ${C.dim}(Sekarang: ${
      safeMode ? 'Aktif' : 'Nonaktif'
    })${C.reset}`,
  );

  console.log(`\n ${C.bright}SYSTEM & INFO${C.reset}`);
  console.log(
    `  ${C.cyan}3.${C.reset} ⚙️  Maintenance & Update   ${C.dim}(Update engine / Cleanup)${C.reset}`,
  );
  console.log(
    `  ${C.cyan}4.${C.reset} ❤️  Tentang Aplikasi       ${C.dim}(Dukungan & Fitur)${C.reset}`,
  );
  console.log(`  ${C.cyan}0.${C.reset} 🚪 Keluar`);

  console.log(` ${C.cyan}━${'━'.repeat(48)}${C.reset}`);

  const choice = await askQuestion('\nPilih menu (0-4): ');

  switch (choice) {
    case '1':
      await startDownload();
      break;
    case '2':
      safeMode = !safeMode;
      // Berikan feedback visual singkat sebelum refresh menu
      console.log(
        `\n${C.yellow} 🛡️  Safe Mode telah ${
          safeMode ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'
        }${C.reset}`,
      );
      setTimeout(() => mainMenu(), 800);
      break;
    case '3':
      await systemMaintenance();
      break;
    case '4':
      await showSupport();
      break;
    case '0':
      console.log(`\n${C.cyan}━${'━'.repeat(48)}${C.reset}`);
      console.log(
        `  ${C.bright}${C.white}Terima kasih telah menggunakan MEDIA-DL!${C.reset}`,
      );
      console.log(
        `  ${C.green}✨ Semoga Anda sukses, jaya, dan sehat selalu! ✨${C.reset}`,
      );
      console.log(`${C.cyan}━${'━'.repeat(48)}${C.reset}\n`);

      // Memberikan jeda sebentar sebelum benar-benar menutup terminal
      setTimeout(() => {
        rl.close();
        process.exit(0);
      }, 1000);

      break;
    default:
      // Jika salah input, tampilkan kembali menu
      mainMenu();
      break;
  }
}

async function cleanUp() {
  const conf = await askQuestion('Hapus semua file tools? (y/n): ');
  if (conf.toLowerCase() === 'y')
    fs.rmSync(TOOLS_DIR, { recursive: true, force: true });
}

async function firstTimeSetup() {
  while (true) {
    const { ytExists, ffExists } = checkTools();
    printHeader(
      'FIRST-TIME SETUP',
      'Komponen diperlukan untuk menjalankan aplikasi',
    );

    console.log(`${C.white}Status Instalasi:${C.reset}`);
    console.log(
      ` [${ytExists ? C.green + '✓' : C.red + '✗'}${
        C.reset
      }] Engine yt-dlp (Wajib)`,
    );
    console.log(
      ` [${ffExists ? C.green + '✓' : C.red + '✗'}${
        C.reset
      }] FFmpeg (Direkomendasikan)`,
    );

    console.log(
      `\n${C.yellow}Aplikasi belum siap digunakan. Pilih opsi:${C.reset}`,
    );
    console.log(` ${C.cyan}1.${C.reset} Install Semua Komponen Otomatis`);
    console.log(` ${C.cyan}0.${C.reset} Keluar dari Aplikasi`);

    const choice = await askQuestion('\nPilih: ');

    if (choice === '1') {
      if (!ytExists) await installYtdlp();
      if (!ffExists) await installFfmpeg();

      const status = checkTools();
      if (status.ytExists) {
        console.log(
          `\n${C.green}✨ Setup Selesai! Membuka Menu Utama...${C.reset}`,
        );
        await new Promise((r) => setTimeout(r, 1500));
        return mainMenu(); // Berhasil, lanjut ke menu utama
      }
    } else if (choice === '0') {
      console.log('Menutup aplikasi...');
      process.exit(0);
    }
  }
}

async function systemMaintenance() {
  let inMaintenance = true;

  while (inMaintenance) {
    const { ytExists, ffExists } = checkTools();
    printHeader(
      'SYSTEM MAINTENANCE',
      'Update engine atau bersihkan file sistem',
    );

    console.log(`${C.white}Versi Terinstal:${C.reset}`);
    console.log(
      ` • yt-dlp : ${ytExists ? C.green + 'Ready' : C.red + 'Not Found'}${
        C.reset
      }`,
    );
    console.log(
      ` • FFmpeg : ${ffExists ? C.green + 'Ready' : C.red + 'Not Found'}${
        C.reset
      }`,
    );

    console.log(`\n${C.bright}Opsi Pemeliharaan:${C.reset}`);
    console.log(` ${C.cyan}1.${C.reset} Update / Reinstall Engines`);
    console.log(` ${C.cyan}2.${C.reset} 🗑️  Hapus Semua Tools (Reset System)`);
    console.log(` ${C.cyan}3.${C.reset} ⬅️  Kembali ke Menu Utama`);

    const choice = await askQuestion('\nPilih tindakan: ');

    switch (choice) {
      case '1':
        await installYtdlp();
        await installFfmpeg();
        await askQuestion('\nUpdate selesai. Tekan Enter...');
        break;

      case '2':
        const confirm = await askQuestion(
          `${C.bgRed}${C.white} KONFIRMASI ${C.reset} Hapus semua tools? (y/n): `,
        );
        if (confirm.toLowerCase() === 'y') {
          await cleanUp(); // Panggil fungsi penghapusan folder
          console.log(
            `${C.yellow}Sistem dibersihkan. Anda akan diarahkan ke Setup Wizard.${C.reset}`,
          );
          await askQuestion('Tekan Enter...');
          return bootstrap(); // Kembali ke pengecekan awal
        }
        break;

      case '3':
        inMaintenance = false;
        return mainMenu();

      default:
        break;
    }
  }
}

// --- ENTRY POINT ---
async function bootstrap() {
  const status = checkTools();
  if (!status.allReady) {
    await firstTimeSetup();
  } else {
    // process.argv[2] mengambil argumen pertama setelah nama perintah
    const urlArgument = process.argv[2];

    if (urlArgument) {
      // Jika ada URL di terminal, langsung jalankan download
      await startDownload(urlArgument);
    } else {
      // Jika tidak ada, masuk ke menu utama seperti biasa [cite: 113]
      mainMenu();
    }
  }
}

bootstrap();

