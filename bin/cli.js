#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ANSI Color Codes untuk tampilan Premium
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
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

if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });

function askQuestion(query) {
  return new Promise((resolve) =>
    rl.question(`${C.bright}${C.yellow}❯ ${C.reset}${query}`, resolve)
  );
}

function checkTools() {
  return {
    ytExists: fs.existsSync(YTDLP_PATH),
    ffExists: fs.existsSync(FFMPEG_PATH),
  };
}

function printHeader(title) {
  console.clear();
  const line = '━'.repeat(50);
  console.log(`${C.cyan}┏${line}┓`);
  console.log(`${C.cyan}┃ ${C.bright}${C.white}${title.padEnd(48)} ${C.cyan}┃`);
  console.log(`${C.cyan}┗${line}┛${C.reset}\n`);
}

async function installYtdlp() {
  console.log(`\n${C.blue}⏳ Mengunduh yt-dlp...${C.reset}`);
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
    console.log(`${C.green}✅ yt-dlp berhasil diinstal.${C.reset}`);
  } catch (e) {
    console.error(`${C.red}❌ Gagal mengunduh yt-dlp.${C.reset}`);
  }
}

async function installFfmpeg() {
  console.log(`\n${C.blue}⏳ Mengunduh FFmpeg...${C.reset}`);
  try {
    if (isMac) {
      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      execSync(
        `curl -L -# "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip" -o "${zipPath}"`,
        { stdio: 'inherit' }
      );
      execSync(`unzip -o "${zipPath}" -d "${TOOLS_DIR}"`, { stdio: 'inherit' });
      execSync(`rm "${zipPath}"`);
      execSync(`chmod a+rx "${FFMPEG_PATH}"`);
      console.log(`${C.green}✅ FFmpeg berhasil disiapkan.${C.reset}`);
    } else {
      console.log(
        `${C.yellow}ℹ️ Silakan instal FFmpeg secara manual untuk Windows/Linux agar fitur Audio aktif.${C.reset}`
      );
    }
  } catch (e) {
    console.error(`${C.red}❌ Gagal instal FFmpeg.${C.reset}`);
  }
}

function parseSelection(input, max) {
  if (!input || input.toLowerCase() === 'all') return null;
  const selected = new Set();
  const parts = input.split(',');
  parts.forEach((part) => {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) if (i > 0 && i <= max) selected.add(i);
    } else {
      const num = parseInt(part.trim());
      if (num > 0 && num <= max) selected.add(num);
    }
  });
  return Array.from(selected).join(',');
}

async function startDownload() {
  let { ytExists, ffExists } = checkTools();
  if (!ytExists) {
    console.log(`\n${C.yellow}⚠️ yt-dlp belum terpasang.${C.reset}`);
    const ans = await askQuestion('Instal sekarang? (y/n): ');
    if (ans.toLowerCase() === 'y') await installYtdlp();
    if (!fs.existsSync(YTDLP_PATH)) return mainMenu();
  }

  const videoURL = await askQuestion('Masukkan Link (Video/Playlist): ');
  if (!videoURL) return mainMenu();

  console.log(`${C.dim}⏳ Menganalisa konten...${C.reset}`);
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
      `\n${C.bgBlue}${C.bright} 📂 PLAYLIST: ${playlistInfo.title} ${C.reset}`
    );
    playlistInfo.items.forEach((item, index) => {
      const num = (index + 1).toString().padStart(3, ' ');
      console.log(`${C.cyan}${num}.${C.reset} ${item}`);
    });

    console.log(
      `\n${C.dim}Tip: Gunakan format 1,3,5-10 atau tekan Enter untuk semua.${C.reset}`
    );
    const selectionInput = await askQuestion('Pilih nomor video: ');
    playlistSelection = parseSelection(
      selectionInput,
      playlistInfo.items.length
    );
  }

  console.log(`\n${C.bright} [ PILIH FORMAT ]${C.reset}`);
  console.log(`${C.green} 1.${C.reset} Video MP4 (QuickTime Compatible)`);
  console.log(
    `${C.green} 2.${C.reset} Audio MP3 ${
      ffExists ? C.green + '✅' : C.red + '❌ (Butuh FFmpeg)'
    }`
  );
  const mode = await askQuestion('Pilihan: ');

  const baseDir = path.join(os.homedir(), 'Downloads', 'media-dl');
  const subFolder = mode === '2' ? 'audio' : 'video';
  let finalOutputDir = path.join(baseDir, subFolder);

  if (playlistInfo.isPlaylist) {
    const folderName = playlistInfo.title.replace(/[\\/:"*?<>|]/g, '_');
    finalOutputDir = path.join(finalOutputDir, folderName);
  }

  if (!fs.existsSync(finalOutputDir))
    fs.mkdirSync(finalOutputDir, { recursive: true });

  let args = [
    '--ffmpeg-location',
    FFMPEG_PATH,
    '-o',
    `${finalOutputDir}/%(title).100s.%(ext)s`,
    videoURL,
  ];

  if (playlistSelection) {
    args.push('--playlist-items', playlistSelection);
  } else if (!playlistInfo.isPlaylist) {
    args.push('--no-playlist');
  }

  if (mode === '2') {
    if (!ffExists) {
      console.log(
        `${C.red}❌ Error: Fitur audio membutuhkan FFmpeg.${C.reset}`
      );
      await askQuestion('Tekan Enter untuk kembali...');
      return mainMenu();
    }
    args.unshift('-x', '--audio-format', 'mp3');
  } else {
    console.log(`\n${C.bright} [ KUALITAS VIDEO ]${C.reset}`);
    console.log(`${C.cyan} 1.${C.reset} Terbaik (Auto-Conversion)`);
    console.log(`${C.cyan} 2.${C.reset} High Definition (1080p)`);
    console.log(`${C.cyan} 3.${C.reset} Standard (720p)`);
    const res = await askQuestion('Pilih: ');

    let fCode =
      'bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[vcodec^=avc1]/best';
    if (res === '2')
      fCode =
        'bestvideo[height<=1080][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=1080]/best';
    if (res === '3')
      fCode =
        'bestvideo[height<=720][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=720]/best';

    args.unshift('-f', fCode);
    if (ffExists) args.unshift('--recode-video', 'mp4');
  }

  console.log(`\n${C.bgBlue}${C.bright} 🚀 PROCESSING... ${C.reset}\n`);
  const download = spawn(YTDLP_PATH, args);

  download.stdout.on('data', (data) => {
    const str = data.toString();
    // Menyaring output agar lebih bersih (opsional)
    if (str.includes('%')) {
      process.stdout.write(`${C.cyan}  ${str.trim()}\r${C.reset}`);
    } else {
      process.stdout.write(`${C.dim}${str}${C.reset}`);
    }
  });

  download.stderr.on('data', (data) =>
    process.stdout.write(`${C.red}${data}${C.reset}`)
  );

  download.on('close', (code) => {
    if (code === 0) {
      console.log(`\n\n${C.green}✨ SELESAI! File disimpan di:${C.reset}`);
      console.log(`${C.underscore}${finalOutputDir}${C.reset}`);
      execSync(
        isMac ? `open "${finalOutputDir}"` : `explorer "${finalOutputDir}"`
      );
    } else {
      console.log(`\n${C.red}❌ Terjadi kesalahan saat mengunduh.${C.reset}`);
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

async function mainMenu() {
  const { ytExists, ffExists } = checkTools();
  printHeader('MEDIA-DL MANAGER 2026');

  console.log(`${C.dim} Status Sistem:${C.reset}`);
  console.log(` 💻 OS      : ${C.bright}${process.platform}${C.reset}`);
  console.log(
    ` ⬇️  yt-dlp  : ${ytExists ? C.green + 'Ready' : C.red + 'Not Installed'}${
      C.reset
    }`
  );
  console.log(
    ` 🎥 ffmpeg  : ${ffExists ? C.green + 'Ready' : C.red + 'Not Installed'}${
      C.reset
    }`
  );
  console.log(`\n${C.dim} Main Menu:${C.reset}`);

  const menus = [
    '📥 Download Media (Single/Playlist)',
    '⚙️  Update yt-dlp',
    '🔨 Instal FFmpeg (macOS Only)',
    '❤️  Support Developer',
    '🗑️  Cleanup (Hapus Tools)',
    '🚪 Keluar',
  ];

  menus.forEach((m, i) => console.log(` ${C.cyan}${i + 1}.${C.reset} ${m}`));

  console.log('');
  const choice = await askQuestion('Pilih menu: ');

  switch (choice) {
    case '1':
      await startDownload();
      break;
    case '2':
      await installYtdlp();
      mainMenu();
      break;
    case '3':
      await installFfmpeg();
      mainMenu();
      break;
    case '4':
      await showSupport();
      break;
    case '5':
      const confirm = await askQuestion(
        `${C.red}Hapus semua data tools? (y/n): ${C.reset}`
      );
      if (confirm.toLowerCase() === 'y') {
        fs.rmSync(TOOLS_DIR, { recursive: true, force: true });
        console.log(`${C.green}✅ Bersih!${C.reset}`);
      }
      mainMenu();
      break;
    case '6':
      console.log(`\n${C.yellow}Sampai jumpa!${C.reset}`);
      rl.close();
      process.exit(0);
      break;
    default:
      mainMenu();
      break;
  }
}

mainMenu();
