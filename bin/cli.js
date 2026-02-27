#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { C, printHeader, renderProgressBar, askQuestion, rl } = require('./ui');

// --- CONFIGURATION ---
const TOOLS_DIR = path.join(os.homedir(), '.media-dl');
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isTermux =
  process.env.PREFIX && process.env.PREFIX.includes('com.termux');

let YTDLP_PATH = path.join(TOOLS_DIR, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
let FFMPEG_PATH = path.join(TOOLS_DIR, isWindows ? 'ffmpeg.exe' : 'ffmpeg');

let safeMode = true;

if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });

function checkTools() {
  const LOCAL_YT = path.join(TOOLS_DIR, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  const LOCAL_FF = path.join(TOOLS_DIR, isWindows ? 'ffmpeg.exe' : 'ffmpeg');

  let ytExists = fs.existsSync(LOCAL_YT);
  let ffExists = fs.existsSync(LOCAL_FF);

  if (ytExists) YTDLP_PATH = LOCAL_YT;
  if (ffExists) FFMPEG_PATH = LOCAL_FF;

  if (!ytExists) {
    try {
      const cmd = isWindows ? 'where yt-dlp' : 'which yt-dlp';
      const pathFound = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim()
        .split('\n')[0];
      if (pathFound) {
        YTDLP_PATH = pathFound;
        ytExists = true;
      }
    } catch (e) {
      YTDLP_PATH = LOCAL_YT;
    }
  }

  if (!ffExists) {
    try {
      const cmd = isWindows ? 'where ffmpeg' : 'which ffmpeg';
      const globalPath = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim()
        .split('\n')[0];
      if (globalPath) {
        FFMPEG_PATH = globalPath;
        ffExists = true;
      }
    } catch (e) {
      FFMPEG_PATH = LOCAL_FF;
    }
  }

  return {
    ytExists,
    ffExists,
    isLocalYt: fs.existsSync(LOCAL_YT),
    isLocalFf: fs.existsSync(LOCAL_FF),
    allReady: ytExists && ffExists,
  };
}

// --- INSTALLERS ---
async function installYtdlp() {
  printHeader('INSTALL / UPDATE YT-DLP');
  console.log(`${C.blue}⏳ Downloading latest engine...${C.reset}`);
  const url = isWindows
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

  try {
    if (isTermux) {
      execSync('pkg update && pkg install python ffmpeg -y', {
        stdio: 'inherit',
      });
      execSync('pip install -U "yt-dlp[default]"', { stdio: 'inherit' });
    } else if (isWindows) {
      execSync(
        `powershell -Command "Invoke-WebRequest -Uri ${url} -OutFile '${YTDLP_PATH}'"`,
        { stdio: 'inherit' },
      );
    } else {
      execSync(`curl -L -# "${url}" -o "${YTDLP_PATH}"`, { stdio: 'inherit' });
      execSync(`chmod a+rx "${YTDLP_PATH}"`);
    }
    console.log(`\n${C.green}✅ yt-dlp configured successfully!${C.reset}`);
  } catch (e) {
    console.error(`\n${C.red}❌ Download failed.${C.reset}`);
  }
}

async function installFfmpeg() {
  printHeader('INSTALL FFmpeg');
  try {
    if (isTermux) {
      execSync('pkg update && pkg install ffmpeg -y', { stdio: 'inherit' });
    } else if (isMac) {
      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      execSync(
        `curl -L -# "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip" -o "${zipPath}"`,
        { stdio: 'inherit' },
      );
      execSync(`unzip -o "${zipPath}" -d "${TOOLS_DIR}"`, { stdio: 'inherit' });
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      execSync(`chmod a+rx "${FFMPEG_PATH}"`);
    } else if (isWindows) {
      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      const url =
        'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';
      execSync(
        `powershell -Command "Invoke-WebRequest -Uri ${url} -OutFile '${zipPath}'"`,
        { stdio: 'inherit' },
      );
      execSync(
        `tar -xf "${zipPath}" -C "${TOOLS_DIR}" --strip-components 2 "*/bin/ffmpeg.exe" "*/bin/ffprobe.exe"`,
        { stdio: 'inherit' },
      );
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    } else {
      execSync('sudo apt update && sudo apt install ffmpeg -y', {
        stdio: 'inherit',
      });
    }
    console.log(`\n${C.green}✅ FFmpeg installed successfully!${C.reset}`);
  } catch (e) {
    console.error(`${C.red}❌ FFmpeg failed.${C.reset}`);
  }
}

function runSpawn(command, args) {
  return new Promise((resolve) => {
    const proc = spawn(command, args);
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      const progressMatch = output.match(
        /\[download\]\s+(\d+\.\d+)%\s+of\s+.*\s+at\s+([\d\w\./s]+)\s+ETA\s+([\d:]+)/,
      );
      if (progressMatch) {
        renderProgressBar(
          parseFloat(progressMatch[1]),
          progressMatch[2],
          progressMatch[3],
        );
      } else if (output.trim() && !output.includes('[download]')) {
        process.stdout.write(`\n${C.dim}${output.trim()}${C.reset}\n`);
      }
    });
    proc.stderr.on('data', (data) => {
      const err = data.toString();
      if (!err.includes('WARNING'))
        process.stdout.write(`\n${C.red}⚠️  ${err}${C.reset}`);
    });
    proc.on('close', resolve);
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
      return bytes > 1024 ** 3
        ? (bytes / 1024 ** 3).toFixed(2) + ' GB'
        : (bytes / 1024 ** 2).toFixed(2) + ' MB';
    }
  } catch (e) {}
  return 'Estimate unavailable';
}

async function startDownload(videoURLFromArgs = null) {
  const { ytExists, ffExists } = checkTools();
  if (!ytExists) return console.log(`\n${C.red}❌ Engine not found.${C.reset}`);

  const videoURL = videoURLFromArgs || (await askQuestion('Enter Link: '));
  if (!videoURL) return;

  console.log(`${C.dim}⏳ Analyzing link...${C.reset}`);
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
      playlistInfo.title = lines[0].split('|')[0] || 'Playlist';
      playlistInfo.items = lines.map((l) => l.split('|')[1]).filter(Boolean);
    }
  } catch (e) {}

  let playlistSelection = null;
  if (playlistInfo.isPlaylist) {
    console.log(
      `\n${C.bgBlue}${C.bright} 📂 PLAYLIST: ${playlistInfo.title} ${C.reset}`,
    );
    playlistInfo.items.forEach((item, i) =>
      console.log(
        `${C.cyan}${(i + 1).toString().padStart(3, ' ')}.${C.reset} ${item}`,
      ),
    );
    const sel = await askQuestion(
      '\nNumbers (ex: 1,3,5-10 or empty for all): ',
    );
    if (sel) {
      const selected = new Set();
      sel.split(',').forEach((p) => {
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

  console.log(
    `\n${C.bright} [ FORMAT ]${C.reset}\n ${C.green}1.${C.reset} Video (MP4)\n ${C.green}2.${C.reset} Audio (MP3)`,
  );
  const mode = await askQuestion('Choice: ');

  let formatArg = '';
  if (mode === '1') {
    console.log(
      `\n${C.bright} [ RESOLUTION ]${C.reset}\n 1. Best\n 2. 720p\n 3. 480p`,
    );
    const res = await askQuestion('Select: ');
    if (res === '2')
      formatArg =
        'bestvideo[height<=720][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=720]/best';
    else if (res === '3')
      formatArg =
        'bestvideo[height<=480][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=480]/best';
    else
      formatArg = 'bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/best/best';

    if (!playlistInfo.isPlaylist) {
      const size = await getEstimate(videoURL, formatArg);
      console.log(`${C.yellow}📊 Estimated Size: ${size}${C.reset}`);
      if ((await askQuestion('Proceed? (y/n): ')).toLowerCase() !== 'y') return;
    }
  }

  const sub = mode === '2' ? 'audio' : 'video';
  let output = path.join(os.homedir(), 'Downloads', 'media-dl', sub);
  if (playlistInfo.isPlaylist)
    output = path.join(
      output,
      playlistInfo.title.replace(/[\\/:"*?<>|]/g, '_'),
    );
  if (!fs.existsSync(output)) fs.mkdirSync(output, { recursive: true });

  let args = [
    '--ffmpeg-location',
    FFMPEG_PATH,
    '-o',
    `${output}/%(title).100s.%(ext)s`,
    '--no-mtime',
    videoURL,
  ];
  if (safeMode)
    args.push(
      '--rate-limit',
      '5M',
      '--sleep-interval',
      '3',
      '--user-agent',
      'Mozilla/5.0...',
    );
  if (playlistSelection) args.push('--playlist-items', playlistSelection);

  if (mode === '2') args.unshift('-x', '--audio-format', 'mp3');
  else {
    args.unshift('-f', formatArg);
    if (ffExists) args.unshift('--recode-video', 'mp4');
  }

  console.log(`\n${C.bgBlue}${C.bright} 🚀 STARTING... ${C.reset}\n`);
  const code = await runSpawn(YTDLP_PATH, args);
  if (code === 0) {
    console.log(`\n${C.green}✨ DONE! Folder: ${output}${C.reset}`);
    try {
      execSync(
        isWindows
          ? `explorer "${output}"`
          : isMac
            ? `open "${output}"`
            : `xdg-open "${output}"`,
      );
    } catch (e) {}
  }
  await askQuestion('\nPress Enter to continue...');
}

async function systemMaintenance() {
  while (true) {
    const { ytExists, ffExists } = checkTools();
    printHeader('MAINTENANCE', 'Update or Reset');
    console.log(
      ` • Engine: ${ytExists ? C.green + 'Ready' : C.red + 'Missing'}${C.reset}`,
    );
    console.log(
      ` • FFmpeg: ${ffExists ? C.green + 'Ready' : C.red + 'Missing'}${C.reset}\n`,
    );
    console.log(` 1. Update Engines\n 2. Reset System\n 0. Back`);
    const c = await askQuestion('\nSelect: ');
    if (c === '1') {
      await installYtdlp();
      await installFfmpeg();
      await askQuestion('\nDone. Enter...');
    } else if (c === '2') {
      if ((await askQuestion('Delete all? (y/n): ')).toLowerCase() === 'y') {
        fs.rmSync(TOOLS_DIR, { recursive: true, force: true });
        process.exit(0);
      }
    } else break;
  }
}

async function showSupport() {
  printHeader('ABOUT', 'Media-DL Pro v2.5.2');
  console.log(
    ` ${C.cyan}KEY FEATURES:${C.reset}\n ✦ High Quality 4K & MP3\n ✦ Multi-Source (YT, IG, FB, TikTok)\n ✦ Playlist Batch Mode\n ✦ Safe Guard Mode\n`,
  );
  console.log(
    ` ${C.magenta}SUPPORT DEVELOPER:${C.reset}\n ☕ PayPal: https://paypal.me/Ariska138\n`,
  );
  await askQuestion('Press Enter...');
}

async function mainMenu() {
  while (true) {
    const status = checkTools();
    printHeader('MEDIA-DL PRO 2026', 'Stable Control Center');
    const ytL = status.ytExists
      ? C.green + 'Ready' + C.reset
      : C.red + 'Missing' + C.reset;
    const ffL = status.ffExists
      ? C.green + 'Ready' + C.reset
      : C.yellow + 'Missing' + C.reset;
    console.log(` 🤖 Engine: [ ${ytL} ] | 🎬 FFmpeg: [ ${ffL} ]`);
    console.log(
      ` 🛡️  Safe Mode: ${safeMode ? C.bgBlue + ' ON ' + C.reset : C.bgRed + ' OFF ' + C.reset}\n`,
    );
    console.log(
      ` 1. 📥 Download Media\n 2. 🛡️  Toggle Safe Mode\n 3. ⚙️  Maintenance\n 4. ❤️  About\n 0. 🚪 Exit`,
    );
    const choice = await askQuestion('\nChoice: ');
    if (choice === '1') await startDownload();
    else if (choice === '2') {
      safeMode = !safeMode;
      console.log('\nSafe Mode Toggled.');
      await new Promise((r) => setTimeout(r, 600));
    } else if (choice === '3') await systemMaintenance();
    else if (choice === '4') await showSupport();
    else if (choice === '0') process.exit(0);
  }
}

async function bootstrap() {
  const status = checkTools();
  if (!status.ytExists) {
    printHeader('FIRST-TIME SETUP');
    if (
      (
        await askQuestion('Install required components? (y/n): ')
      ).toLowerCase() === 'y'
    ) {
      await installYtdlp();
      await installFfmpeg();
    } else process.exit(0);
  }
  const urlArg = process.argv[2];
  if (urlArg) await startDownload(urlArg);
  else mainMenu();
}

bootstrap();
