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

async function installYtdlp() {
  console.log('\n⏳ Mengunduh yt-dlp...');
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
    console.log('✅ yt-dlp berhasil diinstal.');
  } catch (e) {
    console.error('❌ Gagal mengunduh yt-dlp.');
  }
}

async function installFfmpeg() {
  console.log('\n⏳ Mengunduh FFmpeg (Diperlukan untuk kualitas HD)...');
  try {
    if (isMac) {
      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      execSync(
        `curl -L -# "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip" -o "${zipPath}"`,
        { stdio: 'inherit' }
      );
      console.log('📦 Mengekstrak FFmpeg...');
      execSync(`unzip -o "${zipPath}" -d "${TOOLS_DIR}"`, { stdio: 'inherit' });
      execSync(`rm "${zipPath}"`);
      execSync(`chmod a+rx "${FFMPEG_PATH}"`);
      console.log('✅ FFmpeg berhasil disiapkan.');
    } else {
      console.log(
        '📝 Untuk Windows, silakan unduh manual dan letakkan ffmpeg.exe di: ' +
          TOOLS_DIR
      );
    }
  } catch (e) {
    console.error('❌ Gagal mengunduh FFmpeg secara otomatis.');
  }
}

async function startDownload() {
  let { ytExists, ffExists } = checkTools();

  if (!ytExists) {
    console.log('\n⚠️ yt-dlp belum terpasang.');
    const ans = await askQuestion('Instal sekarang? (y/n): ');
    if (ans.toLowerCase() === 'y') await installYtdlp();
    if (!fs.existsSync(YTDLP_PATH)) return mainMenu();
  }

  const videoURL = await askQuestion('\n🔗 Masukkan Link: ');

  console.log('\n[PILIH FORMAT]');
  console.log('1. Audio (MP3) ' + (ffExists ? '✅' : '❌ (Butuh FFmpeg)'));
  console.log('2. Video MP4 (Pilih Resolusi)');
  const mode = await askQuestion('Pilihan: ');

  const outputDir = path.join(process.cwd(), 'downloads');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // PERBAIKAN: Menggunakan %(title).100s untuk membatasi panjang nama file agar tidak Error 63
  let args = [
    '--ffmpeg-location',
    FFMPEG_PATH,
    '-o',
    `${outputDir}/%(title).100s.%(ext)s`,
    videoURL,
  ];

  if (mode === '1') {
    if (!ffExists) {
      console.log(
        '❌ MP3 butuh FFmpeg. Silakan instal FFmpeg terlebih dahulu.'
      );
      return mainMenu();
    }
    args.unshift('-x', '--audio-format', 'mp3');
  } else {
    console.log('\n[PILIH RESOLUSI]');
    console.log('1. Terbaik (Best Quality)');
    console.log('2. 1080p (Jika ada)');
    console.log('3. 720p');
    console.log('4. 480p');
    const resChoice = await askQuestion('Pilih resolusi: ');

    let formatCode = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
    if (resChoice === '2')
      formatCode =
        'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best';
    if (resChoice === '3')
      formatCode =
        'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best';
    if (resChoice === '4')
      formatCode =
        'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best';

    args.unshift('-f', formatCode);

    if (!ffExists) {
      console.log(
        '⚠️ FFmpeg tidak terdeteksi. Hanya bisa mengunduh kualitas standar.'
      );
      args = [
        '-f',
        'best[ext=mp4]',
        '-o',
        `${outputDir}/%(title).100s.%(ext)s`,
        videoURL,
      ];
    }
  }

  console.log('\n🚀 Memulai proses...');
  const download = spawn(YTDLP_PATH, args);

  download.stdout.on('data', (data) => process.stdout.write(data));
  download.stderr.on('data', (data) => process.stderr.write(data));

  download.on('close', (code) => {
    if (code === 0) {
      console.log(`\n✅ SELESAI! Folder: ${outputDir}`);
      execSync(isMac ? `open "${outputDir}"` : `explorer "${outputDir}"`);
    } else {
      console.log('\n❌ Terjadi kesalahan selama proses download.');
    }
    mainMenu();
  });
}

async function mainMenu() {
  const { ytExists, ffExists } = checkTools();
  console.log('\n====================================');
  console.log('         MEDIA-DL MANAGER 2026      ');
  console.log('====================================');
  console.log(` OS     : ${process.platform}`);
  console.log(` yt-dlp : ${ytExists ? '✅' : '❌'}`);
  console.log(` ffmpeg : ${ffExists ? '✅' : '❌'}`);
  console.log('------------------------------------');
  console.log(' 1. 📥 Download Media');
  console.log(' 2. ⚙️  Update yt-dlp');
  console.log(' 3. 🔨 Instal FFmpeg (macOS)');
  console.log(' 4. 🗑️  Uninstall & Hapus Data');
  console.log(' 5. 🚪 Keluar');

  const choice = await askQuestion('\nPilih menu: ');
  if (choice === '1') await startDownload();
  else if (choice === '2') {
    await installYtdlp();
    mainMenu();
  } else if (choice === '3') {
    await installFfmpeg();
    mainMenu();
  } else if (choice === '4') {
    const confirm = await askQuestion('Hapus semua data? (y/n): ');
    if (confirm.toLowerCase() === 'y')
      fs.rmSync(TOOLS_DIR, { recursive: true, force: true });
    mainMenu();
  } else {
    rl.close();
    process.exit(0);
  }
}

mainMenu();
