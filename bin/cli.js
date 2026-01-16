#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Penentuan folder Tools berdasarkan OS
const TOOLS_DIR = path.join(os.homedir(), '.media-dl');
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

const YTDLP_PATH = path.join(TOOLS_DIR, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
const FFMPEG_PATH = path.join(TOOLS_DIR, isWindows ? 'ffmpeg.exe' : 'ffmpeg');

if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function checkTools() {
  return {
    ytExists: fs.existsSync(YTDLP_PATH),
    ffExists: fs.existsSync(FFMPEG_PATH),
  };
}

// Fungsi instalasi yt-dlp
async function installYtdlp() {
  console.log('⏳ Mengunduh yt-dlp...');
  try {
    const url = isWindows
      ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

    if (isWindows) {
      execSync(
        `powershell -Command "Invoke-WebRequest -Uri ${url} -OutFile '${YTDLP_PATH}'"`
      );
    } else {
      execSync(`curl -L ${url} -o "${YTDLP_PATH}"`);
      execSync(`chmod a+rx "${YTDLP_PATH}"`);
    }
    console.log('✅ yt-dlp berhasil diinstal.');
    return true;
  } catch (e) {
    console.error('❌ Gagal menginstal yt-dlp.');
    return false;
  }
}

// Fungsi instalasi FFmpeg (Baru: Mendukung macOS & Windows)
async function installFfmpeg() {
  console.log('⏳ Mengunduh FFmpeg (ini mungkin memakan waktu)...');
  try {
    if (isMac) {
      // Mengunduh static binary untuk macOS
      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      execSync(
        `curl -L https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -o "${zipPath}"`
      );
      execSync(`unzip -o "${zipPath}" -d "${TOOLS_DIR}"`);
      execSync(`rm "${zipPath}"`);
      execSync(`chmod a+rx "${FFMPEG_PATH}"`);
    } else if (isWindows) {
      // Mengunduh versi essential untuk Windows
      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      execSync(
        `powershell -Command "Invoke-WebRequest -Uri https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip -OutFile '${zipPath}'"`
      );
      console.log(
        'ℹ️  Untuk Windows, silakan ekstrak ffmpeg.exe dari zip ke folder .media-dl secara manual.'
      );
    }
    console.log('✅ FFmpeg berhasil disiapkan.');
    return true;
  } catch (e) {
    console.error('❌ Gagal menginstal FFmpeg secara otomatis.');
    return false;
  }
}

async function uninstallTools() {
  console.log('\n--- 🗑️ UNINSTALL ---');
  const confirm = await askQuestion(
    'Hapus semua tools dan folder .media-dl? (y/n): '
  );
  if (confirm.toLowerCase() === 'y') {
    fs.rmSync(TOOLS_DIR, { recursive: true, force: true });
    console.log('✅ Berhasil dihapus.');
  }
}

function validateUrl(url) {
  const supported = [
    /youtube\.com/i,
    /youtu\.be/i,
    /tiktok\.com/i,
    /instagram\.com/i,
    /facebook\.com/i,
  ];
  return supported.some((p) => p.test(url));
}

async function startDownload() {
  let { ytExists, ffExists } = checkTools();

  // Cek tools sebelum lanjut
  if (!ytExists || !ffExists) {
    console.log('\n⚠️ Komponen belum lengkap.');
    if (!ytExists) {
      const askYt = await askQuestion(
        'yt-dlp belum ada. Instal sekarang? (y/n): '
      );
      if (askYt.toLowerCase() === 'y') await installYtdlp();
    }
    if (!ffExists) {
      const askFf = await askQuestion(
        'ffmpeg belum ada (penting untuk MP3). Instal sekarang? (y/n): '
      );
      if (askFf.toLowerCase() === 'y') await installFfmpeg();
    }
    // Update status setelah instalasi
    const update = checkTools();
    ytExists = update.ytExists;
    ffExists = update.ffExists;
  }

  if (!ytExists) {
    console.log('❌ Download dibatalkan karena yt-dlp tidak tersedia.');
    return mainMenu();
  }

  const videoURL = await askQuestion(
    '\n🔗 Masukkan Link (YouTube/TikTok/Reel/Shorts): '
  );
  if (!validateUrl(videoURL)) {
    const force = await askQuestion(
      '⚠️ Link tidak dikenali. Coba paksa lanjut? (y/n): '
    );
    if (force.toLowerCase() !== 'y') return mainMenu();
  }

  console.log(
    '\n[Format]\n1. Audio (MP3) ' + (ffExists ? '✅' : '❌ (Butuh FFmpeg)')
  );
  console.log('2. Video (MP4) ✅');
  const choice = await askQuestion('Pilihan: ');

  if (choice === '1' && !ffExists) {
    console.log('❌ MP3 memerlukan FFmpeg. Silakan instal terlebih dahulu.');
    return mainMenu();
  }

  const outputDir = path.join(process.cwd(), 'downloads');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const args =
    choice === '1'
      ? [
          '-x',
          '--audio-format',
          'mp3',
          '--ffmpeg-location',
          FFMPEG_PATH,
          '-o',
          `${outputDir}/%(title)s.%(ext)s`,
          videoURL,
        ]
      : ['-f', 'mp4', '-o', `${outputDir}/%(title)s.%(ext)s`, videoURL];

  console.log('⏳ Mendownload...');
  const download = spawn(YTDLP_PATH, args);

  download.stdout.on('data', (data) => process.stdout.write(data));
  download.on('close', (code) => {
    console.log(
      code === 0 ? `\n✅ SELESAI! Folder: ${outputDir}` : '\n❌ Gagal.'
    );
    mainMenu();
  });
}

async function mainMenu() {
  const { ytExists, ffExists } = checkTools();
  console.log('\n==============================');
  console.log('       MEDIA-DL MANAGER       ');
  console.log('==============================');
  console.log(
    `OS: ${process.platform} | yt-dlp: ${ytExists ? '✅' : '❌'} | ffmpeg: ${
      ffExists ? '✅' : '❌'
    }`
  );
  console.log('------------------------------');
  console.log('1. 📥 Download Media');
  console.log('2. ⚙️  Instal/Update yt-dlp');
  console.log('3. 🔨 Instal FFmpeg (macOS)');
  console.log('4. 🗑️  Uninstall Tools');
  console.log('5. 🚪 Keluar');

  const menuChoice = await askQuestion('\nPilih: ');
  if (menuChoice === '1') await startDownload();
  else if (menuChoice === '2') {
    await installYtdlp();
    mainMenu();
  } else if (menuChoice === '3') {
    await installFfmpeg();
    mainMenu();
  } else if (menuChoice === '4') {
    await uninstallTools();
    mainMenu();
  } else {
    rl.close();
    process.exit(0);
  }
}

mainMenu();
