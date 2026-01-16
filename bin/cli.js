#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const os = require('os');

// --- KONFIGURASI VISUAL (ANSI COLORS) ---
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgRed: '\x1b[41m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const TOOLS_DIR = path.join(os.homedir(), '.media-dl');
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

const YTDLP_PATH = path.join(TOOLS_DIR, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
const FFMPEG_PATH = path.join(TOOLS_DIR, isWindows ? 'ffmpeg.exe' : 'ffmpeg');

// State Aplikasi
let safeMode = true;

if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });

// --- UTILS ---
function askQuestion(query) {
  return new Promise((resolve) =>
    rl.question(`${C.bright}${C.yellow}❯ ${C.reset}${query}`, resolve)
  );
}

function printHeader(title) {
  console.clear();
  const line = '━'.repeat(50);
  console.log(`${C.cyan}┏${line}┓`);
  console.log(`${C.cyan}┃ ${C.bright}${C.white}${title.padEnd(48)} ${C.cyan}┃`);
  console.log(`${C.cyan}┗${line}┛${C.reset}\n`);
}

function checkTools() {
  return {
    ytExists: fs.existsSync(YTDLP_PATH),
    ffExists: fs.existsSync(FFMPEG_PATH),
  };
}

// --- INSTALLERS ---
async function installYtdlp() {
  printHeader('INSTALL / UPDATE YT-DLP');
  console.log(`${C.blue}⏳ Sedang mengunduh engine terbaru...${C.reset}`);
  const url = isWindows
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  try {
    if (isWindows) {
      execSync(
        `powershell -Command "Invoke-WebRequest -Uri ${url} -OutFile '${YTDLP_PATH}'"`,
        { stdio: 'inherit' }
      );
    } else {
      execSync(`curl -L -# "${url}" -o "${YTDLP_PATH}"`, { stdio: 'inherit' });
      execSync(`chmod a+rx "${YTDLP_PATH}"`);
    }
    console.log(`\n${C.green}✅ yt-dlp berhasil dikonfigurasi!${C.reset}`);
  } catch (e) {
    console.error(
      `\n${C.red}❌ Gagal mengunduh. Periksa koneksi internet Anda.${C.reset}`
    );
  }
  await askQuestion('Tekan Enter untuk kembali...');
  mainMenu();
}

async function installFfmpeg() {
  printHeader('INSTALL FFmpeg');
  console.log(
    `${C.dim}FFmpeg diperlukan untuk kualitas 1080p+ dan konversi MP3.${C.reset}\n`
  );

  try {
    if (isMac) {
      console.log(`${C.blue}⏳ Mengunduh FFmpeg untuk macOS...${C.reset}`);
      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      execSync(
        `curl -L -# "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip" -o "${zipPath}"`,
        { stdio: 'inherit' }
      );
      execSync(`unzip -o "${zipPath}" -d "${TOOLS_DIR}"`, { stdio: 'inherit' });
      execSync(`rm "${zipPath}"`);
      execSync(`chmod a+rx "${FFMPEG_PATH}"`);
      console.log(`\n${C.green}✅ FFmpeg aktif di macOS.${C.reset}`);
    } else if (isWindows) {
      console.log(
        `${C.yellow}ℹ️ Untuk Windows, disarankan mengunduh 'ffmpeg.exe' secara manual`
      );
      console.log(`dan letakkan di: ${C.white}${TOOLS_DIR}${C.reset}`);
    }
  } catch (e) {
    console.error(
      `${C.red}❌ Gagal menginstal FFmpeg secara otomatis.${C.reset}`
    );
  }
  await askQuestion('Tekan Enter untuk kembali...');
  mainMenu();
}

// --- DOWNLOAD ENGINE ---
async function startDownload() {
  let { ytExists, ffExists } = checkTools();
  if (!ytExists) {
    console.log(
      `\n${C.red}❌ Engine yt-dlp tidak ditemukan. Silakan pilih menu Update/Install.${C.reset}`
    );
    await askQuestion('Tekan Enter...');
    return mainMenu();
  }

  const videoURL = await askQuestion('Masukkan Link (Video/Playlist): ');
  if (!videoURL) return mainMenu();

  console.log(`${C.dim}⏳ Menganalisa tautan...${C.reset}`);
  let playlistInfo = { isPlaylist: false, title: '', items: [] };

  try {
    const rawInfo = execSync(
      `"${YTDLP_PATH}" --flat-playlist --print "%(playlist_title)s|%(title)s" "${videoURL}"`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const lines = rawInfo.trim().split('\n');
    if (lines.length > 1 || videoURL.includes('playlist?list=')) {
      playlistInfo.isPlaylist = true;
      playlistInfo.title = lines[0].split('|')[0] || 'Unduhan Playlist';
      playlistInfo.items = lines.map((l) => l.split('|')[1]).filter(Boolean);
    }
  } catch (e) {}

  let playlistSelection = null;
  if (playlistInfo.isPlaylist) {
    console.log(
      `\n${C.bgBlue}${C.bright} 📂 PLAYLIST TERDETEKSI: ${playlistInfo.title} ${C.reset}`
    );
    playlistInfo.items.forEach((item, index) => {
      console.log(
        `${C.cyan}${(index + 1).toString().padStart(3, ' ')}.${C.reset} ${item}`
      );
    });
    console.log(
      `\n${C.dim}Contoh pilih nomor: 1,3,5-10 atau biarkan kosong untuk semua.${C.reset}`
    );
    const selectionInput = await askQuestion('Pilih nomor: ');

    // Parsing nomor playlist
    if (selectionInput) {
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

  console.log(`\n${C.bright} [ PILIH FORMAT ]${C.reset}`);
  console.log(` ${C.green}1.${C.reset} Video (Kualitas Terbaik/MP4)`);
  console.log(
    ` ${C.green}2.${C.reset} Audio Only (MP3) ${
      ffExists ? C.green + '✅' : C.red + '❌ (Butuh FFmpeg)'
    }`
  );
  const mode = await askQuestion('Pilihan: ');

  const baseDir = path.join(os.homedir(), 'Downloads', 'media-dl');
  const subFolder = mode === '2' ? 'audio' : 'video';
  let outputDir = path.join(baseDir, subFolder);
  if (playlistInfo.isPlaylist)
    outputDir = path.join(
      outputDir,
      playlistInfo.title.replace(/[\\/:"*?<>|]/g, '_')
    );
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  let args = [
    '--ffmpeg-location',
    FFMPEG_PATH,
    '-o',
    `${outputDir}/%(title).100s.%(ext)s`,
    videoURL,
  ];

  // Integrasi Safe Mode
  if (safeMode) {
    args.push(
      '--ratelimit',
      '5M',
      '--sleep-interval',
      '3',
      '--max-sleep-interval',
      '10',
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    );
  }

  if (playlistSelection) args.push('--playlist-items', playlistSelection);
  else if (!playlistInfo.isPlaylist) args.push('--no-playlist');

  if (mode === '2') {
    if (!ffExists) {
      console.log(
        `${C.red}❌ Error: Anda wajib menginstal FFmpeg untuk mengunduh audio.${C.reset}`
      );
      await askQuestion('Kembali...');
      return mainMenu();
    }
    args.unshift('-x', '--audio-format', 'mp3');
  } else {
    args.unshift(
      '-f',
      'bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[vcodec^=avc1]/best'
    );
    if (ffExists) args.unshift('--recode-video', 'mp4');
  }

  console.log(`\n${C.bgBlue}${C.bright} 🚀 MEMULAI PROSES... ${C.reset}\n`);
  const download = spawn(YTDLP_PATH, args);
  download.stdout.on('data', (data) =>
    process.stdout.write(`${C.dim}${data}${C.reset}`)
  );
  download.on('close', (code) => {
    if (code === 0) {
      console.log(`\n${C.green}✨ SELESAI! Cek folder: ${outputDir}${C.reset}`);
      execSync(isMac ? `open "${outputDir}"` : `explorer "${outputDir}"`);
    } else {
      console.log(`\n${C.red}❌ Terjadi kesalahan.${C.reset}`);
    }
    setTimeout(mainMenu, 2000);
  });
}

async function showSupport() {
  printHeader('SUPPORT DEVELOPER');
  console.log(`${C.white}Terima kasih telah menggunakan MEDIA-DL!${C.reset}`);
  console.log(
    `${C.white}Dukungan Anda membantu pemeliharaan skrip ini.${C.reset}\n`
  );
  console.log(
    `${C.magenta} ☕ Beli Kopi :${C.reset} https://app.midtrans.com/coffee`
  );
  console.log(
    `${C.magenta} 🍕 Beli Pizza :${C.reset} https://app.midtrans.com/pizza`
  );
  console.log(`\n${'━'.repeat(50)}`);
  await askQuestion('Tekan Enter untuk kembali ke Menu Utama...');
  mainMenu();
}
// --- MENU UTAMA ---
async function mainMenu() {
  const { ytExists, ffExists } = checkTools();
  printHeader('MEDIA-DL MANAGER PRO 2026');

  console.log(`${C.dim} Status Sistem:${C.reset}`);
  console.log(
    ` ⬇️  yt-dlp : ${ytExists ? C.green + 'Ready' : C.red + 'Not Found'}${
      C.reset
    } | 🎥 FFmpeg : ${ffExists ? C.green + 'Ready' : C.red + 'Not Found'}${
      C.reset
    }`
  );

  const safeStatus = safeMode
    ? `${C.bgBlue}${C.white}  ACTIVE  ${C.reset}`
    : `${C.bgRed}${C.white} DISABLED ${C.reset}`;

  console.log(` 🛡️  Safe Mode: ${safeStatus}`);
  console.log(`\n${C.dim} Layanan Utama:${C.reset}`);
  console.log(` ${C.cyan}1.${C.reset} 📥 Download Media (Video/Playlist)`);
  console.log(` ${C.cyan}2.${C.reset} 🛡️  Toggle Safe Mode (ON/OFF)`);
	console.log(`\n${C.dim} Dukungan:${C.reset}`);
  console.log(` ${C.cyan}3.${C.reset} ❤️  Support Developer`);
  console.log(`\n${C.dim} Pengaturan Engine:${C.reset}`);
  console.log(` ${C.cyan}4.${C.reset} ⚙️  Update/Install yt-dlp`);
  console.log(` ${C.cyan}5.${C.reset} 🔨 Install FFmpeg (macOS)`);
  console.log(` ${C.cyan}6.${C.reset} 🗑️  Cleanup Tools`);
  console.log(` ${C.cyan}7.${C.reset} 🚪 Keluar`);

  const choice = await askQuestion('\nPilih menu: ');
  switch (choice) {
    case '1':
      await startDownload();
      break;
    case '2':
      safeMode = !safeMode;
      mainMenu();
      break;
		case '3':
      await showSupport();
      break;	
    case '4':
      await installYtdlp();
      break;
    case '5':
      await installFfmpeg();
      break;
    case '6':
      const conf = await askQuestion('Hapus semua file tools? (y/n): ');
      if (conf.toLowerCase() === 'y')
        fs.rmSync(TOOLS_DIR, { recursive: true, force: true });
      mainMenu();
      break;
    case '7':
      rl.close();
      process.exit(0);
    default:
      mainMenu();
      break;
  }
}

mainMenu();

