#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const TOOLS_DIR = path.join(os.homedir(), '.media-dl');
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

const YTDLP_PATH = path.join(TOOLS_DIR, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
const FFMPEG_PATH = path.join(TOOLS_DIR, isWindows ? 'ffmpeg.exe' : 'ffmpeg');

if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function checkTools() {
  return {
    ytExists: fs.existsSync(YTDLP_PATH),
    ffExists: fs.existsSync(FFMPEG_PATH)
  };
}

async function installYtdlp() {
  console.log('\n⏳ Mengunduh yt-dlp...');
  const url = isWindows 
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  try {
    if (isWindows) {
      execSync(`powershell -Command "Invoke-WebRequest -Uri ${url} -OutFile '${YTDLP_PATH}'"`, { stdio: 'inherit' });
    } else {
      execSync(`curl -L -# "${url}" -o "${YTDLP_PATH}"`, { stdio: 'inherit' });
      execSync(`chmod a+rx "${YTDLP_PATH}"`);
    }
    console.log('✅ yt-dlp berhasil diinstal.');
  } catch (e) { console.error('❌ Gagal mengunduh yt-dlp.'); }
}

async function installFfmpeg() {
  console.log('\n⏳ Mengunduh FFmpeg (Diperlukan untuk konversi)...');
  try {
    if (isMac) {
      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      execSync(`curl -L -# "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip" -o "${zipPath}"`, { stdio: 'inherit' });
      execSync(`unzip -o "${zipPath}" -d "${TOOLS_DIR}"`, { stdio: 'inherit' });
      execSync(`rm "${zipPath}"`);
      execSync(`chmod a+rx "${FFMPEG_PATH}"`);
      console.log('✅ FFmpeg berhasil disiapkan.');
    }
  } catch (e) { console.error('❌ Gagal instal FFmpeg.'); }
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
  console.log('1. Audio (MP3)');
  console.log('2. Video MP4 (Sangat Kompatibel Mac/QuickTime)');
  const mode = await askQuestion('Pilihan: ');

  const baseDir = path.join(os.homedir(), 'Downloads', 'media-dl');
  const subFolder = (mode === '1') ? 'audio' : 'video';
  const finalOutputDir = path.join(baseDir, subFolder);
  if (!fs.existsSync(finalOutputDir)) fs.mkdirSync(finalOutputDir, { recursive: true });

  // Filter Format: Prioritaskan AVC1 + AAC
  const qtFormat = 'bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[vcodec^=avc1]/best';
  
  let args = ['--ffmpeg-location', FFMPEG_PATH, '-o', `${finalOutputDir}/%(title).100s.%(ext)s`, videoURL];

  if (mode === '1') {
    if (!ffExists) { console.log('❌ Butuh FFmpeg.'); return mainMenu(); }
    args.unshift('-x', '--audio-format', 'mp3');
  } else {
    console.log('\n[PILIH KUALITAS]');
    console.log('1. Terbaik (Auto-Conversion ke MP4)');
    console.log('2. 1080p (Pasti MP4)');
    console.log('3. 720p (Pasti MP4)');
    const res = await askQuestion('Pilih: ');
    
    let fCode = qtFormat;
    if (res === '2') fCode = 'bestvideo[height<=1080][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=1080]/best';
    if (res === '3') fCode = 'bestvideo[height<=720][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=720]/best';
    
    args.unshift('-f', fCode);
    
    // FITUR BARU: Jika FFmpeg ada, paksa konversi ke MP4 agar pasti bisa dibuka QuickTime
    if (ffExists) {
        args.unshift('--recode-video', 'mp4'); 
    }
  }

  console.log('\n🚀 Memulai proses (dan konversi jika perlu)...');
  const download = spawn(YTDLP_PATH, args);
  download.stdout.on('data', (data) => process.stdout.write(data));
  download.stderr.on('data', (data) => process.stderr.write(data));

  download.on('close', (code) => {
    if (code === 0) {
      console.log(`\n✅ BERHASIL! File tersimpan di: ${finalOutputDir}`);
      execSync(isMac ? `open "${finalOutputDir}"` : `explorer "${finalOutputDir}"`);
    } else { console.log('\n❌ Gagal saat mendownload atau mengonversi.'); }
    mainMenu();
  });
}

async function mainMenu() {
  const { ytExists, ffExists } = checkTools();
  console.log('\n====================================');
  console.log('         MEDIA-DL MANAGER 2026      ');
  console.log('====================================');
  console.log(` OS     : ${process.platform} | yt-dlp: ${ytExists?'✅':'❌'} | ffmpeg: ${ffExists?'✅':'❌'}`);
  console.log('------------------------------------');
  console.log(' 1. 📥 Download Media');
  console.log(' 2. ⚙️  Update yt-dlp');
  console.log(' 3. 🔨 Instal FFmpeg (macOS)');
  console.log(' 4. 🗑️  Uninstall & Hapus Data');
  console.log(' 5. 🚪 Keluar');
  
  const choice = await askQuestion('\nPilih menu: ');
  if (choice === '1') await startDownload();
  else if (choice === '2') { await installYtdlp(); mainMenu(); }
  else if (choice === '3') { await installFfmpeg(); mainMenu(); }
  else if (choice === '4') {
    const confirm = await askQuestion('Hapus semua? (y/n): ');
    if (confirm.toLowerCase() === 'y') {
        fs.rmSync(TOOLS_DIR, { recursive: true, force: true });
        console.log('✅ Folder tools dibersihkan.');
    }
    mainMenu();
  } else { rl.close(); process.exit(0); }
}

mainMenu();