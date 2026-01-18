#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { C, printHeader, renderProgressBar, askQuestion, rl } = require('./ui');

// --- VISUAL CONFIGURATION (ANSI COLORS) ---

const TOOLS_DIR = path.join(os.homedir(), '.media-dl');

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isTermux =
  process.env.PREFIX && process.env.PREFIX.includes('com.termux');

let YTDLP_PATH = path.join(TOOLS_DIR, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
let FFMPEG_PATH = path.join(TOOLS_DIR, isWindows ? 'ffmpeg.exe' : 'ffmpeg');

// Application State
let safeMode = true;

if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });

function checkTools() {
  // Check default local path (internal)
  const LOCAL_YT = path.join(TOOLS_DIR, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  const LOCAL_FF = path.join(TOOLS_DIR, isWindows ? 'ffmpeg.exe' : 'ffmpeg');

  const isLocalYt = fs.existsSync(LOCAL_YT);
  const isLocalFf = fs.existsSync(LOCAL_FF);

  let ytExists = isLocalYt;
  let ffExists = isLocalFf;

  // Reset path to default before global check
  if (isLocalYt) YTDLP_PATH = LOCAL_YT;
  if (isLocalFf) FFMPEG_PATH = LOCAL_FF;

  // Check Global yt-dlp only if local is missing
  if (!isLocalYt) {
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
      YTDLP_PATH = LOCAL_YT; // Revert to local path if global is also missing
    }
  }

  // Check Global ffmpeg only if local is missing
  if (!isLocalFf) {
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
      FFMPEG_PATH = LOCAL_FF; // Revert to local path if global is also missing
    }
  }

  return {
    ytExists,
    ffExists,
    isLocalYt,
    isLocalFf,
    allReady: ytExists && ffExists,
  };
}

// --- INSTALLERS ---
async function installYtdlp() {
  if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });

  printHeader('INSTALL / UPDATE YT-DLP');
  console.log(`${C.blue}⏳ Downloading latest engine...${C.reset}`);
  const url = isWindows
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

  try {
    if (isTermux) {
      // On Termux, using python/pip is recommended for stability
      console.log(`${C.dim}Installing yt-dlp via python...${C.reset}`);
      execSync('pkg update && pkg install python ffmpeg -y', {
        stdio: 'inherit',
      });
      execSync('pip install -U "yt-dlp[default]"', { stdio: 'inherit' });
      console.log(
        `\n${C.green}✅ yt-dlp installed successfully on Termux!${C.reset}`,
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
      console.log(`\n${C.green}✅ yt-dlp configured successfully!${C.reset}`);
    }
  } catch (e) {
    console.error(
      `\n${C.red}❌ Failed to download. Check your internet connection.${C.reset}`,
    );
  }
}

async function installFfmpeg() {
  printHeader('INSTALL FFmpeg');
  console.log(
    `${C.dim}FFmpeg is required for 1080p+ quality and MP3 conversion.${C.reset}\n`,
  );

  try {
    if (isTermux) {
      console.log(
        `${C.blue}⏳ Termux detected: Installing via pkg...${C.reset}`,
      );
      execSync('pkg update && pkg install ffmpeg -y', { stdio: 'inherit' });
      console.log(
        `\n${C.green}✅ FFmpeg installed successfully on Termux!${C.reset}`,
      );
    } else if (isMac) {
      // ... (Your macOS code is correct)
      console.log(`${C.blue}⏳ Downloading FFmpeg for macOS...${C.reset}`);
      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      execSync(
        `curl -L -# "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip" -o "${zipPath}"`,
        { stdio: 'inherit' },
      );
      execSync(`unzip -o "${zipPath}" -d "${TOOLS_DIR}"`, { stdio: 'inherit' });
      execSync(`rm "${zipPath}"`);
      execSync(`chmod a+rx "${FFMPEG_PATH}"`);
      console.log(`\n${C.green}✅ FFmpeg active on macOS.${C.reset}`);
    } else if (isWindows) {
      console.log(
        `${C.blue}⏳ Downloading FFmpeg for Windows (Essentials)...${C.reset}`,
      );

      const zipPath = path.join(TOOLS_DIR, 'ffmpeg.zip');
      // Direct link to build essentials so the file isn't too large
      const url =
        'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';

      // 1. Download using PowerShell
      execSync(
        `powershell -Command "Invoke-WebRequest -Uri ${url} -OutFile '${zipPath}'"`,
        { stdio: 'inherit' },
      );

      console.log(`${C.yellow}📦 Extracting FFmpeg...${C.reset}`);

      // 2. Extract using 'tar' command (Built-in Windows 10+)
      // We only take ffmpeg.exe from the bin folder inside the zip
      execSync(
        `tar -xf "${zipPath}" -C "${TOOLS_DIR}" --strip-components 2 "*/bin/ffmpeg.exe" "*/bin/ffprobe.exe"`,
        { stdio: 'inherit' },
      );

      // 3. Clean up zip file
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

      console.log(
        `\n${C.green}✅ FFmpeg installed successfully on Windows!${C.reset}`,
      );
    } else {
      // Assume Linux (Ubuntu/Debian)
      console.log(
        `${C.blue}⏳ Linux detected: Installing via apt...${C.reset}`,
      );
      console.log(`${C.dim}May require sudo password.${C.reset}`);
      execSync('sudo apt update && sudo apt install ffmpeg -y', {
        stdio: 'inherit',
      });
      console.log(
        `\n${C.green}✅ FFmpeg installed successfully on Linux!${C.reset}`,
      );
    }
  } catch (e) {
    console.error(
      `${C.red}❌ Failed to install FFmpeg automatically.${C.reset}`,
    );
    console.log(`${C.dim}Error: ${e.message}${C.reset}`);
  }
}

function runSpawn(command, args) {
  return new Promise((resolve) => {
    const proc = spawn(command, args);

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      // Regex to capture progress from yt-dlp
      const progressMatch = output.match(
        /\[download\]\s+(\d+\.\d+)%\s+of\s+.*\s+at\s+([\d\w\./s]+)\s+ETA\s+([\d:]+)/,
      );

      if (progressMatch) {
        const [_, percent, speed, eta] = progressMatch;
        renderProgressBar(parseFloat(percent), speed, eta);
      } else {
        // If not a bar, print normal (e.g., merging info/ffmpeg)
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
      process.stdout.write('\n'); // New line after completion
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
  return 'Estimate unavailable';
}

// --- DOWNLOAD ENGINE ---
async function startDownload(videoURLFromArgs = null) {
  let { ytExists, ffExists } = checkTools();
  if (!ytExists) {
    console.log(
      `\n${C.red}❌ yt-dlp engine not found. Please select Update/Install menu.${C.reset}`,
    );
    await backToMenu();
  }

  if (!ffExists) {
    console.log(
      `${C.yellow}⚠️  Warning: FFmpeg not found. Video might not be merged with audio.${C.reset}`,
    );
    const cont = await askQuestion('Continue anyway? (y/n): ');
    if (cont.toLowerCase() !== 'y') return mainMenu();
  }

  const videoURL =
    videoURLFromArgs || (await askQuestion('Enter Link (Video/Playlist): '));
  if (!videoURL) return mainMenu();

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
      playlistInfo.title = lines[0].split('|')[0] || 'Playlist Download';
      playlistInfo.items = lines.map((l) => l.split('|')[1]).filter(Boolean);
    }
  } catch (e) {
    console.log(`\n${C.red}❌ Failed to analyze link.${C.reset}`);
    if (e.message.includes('ETIMEDOUT')) {
      console.log(
        `${C.yellow}⚠️  Analysis timed out. Check your internet connection.${C.reset}`,
      );
    } else {
      console.log(
        `${C.yellow}⚠️  Ensure link is valid or not private/deleted.${C.reset}`,
      );
    }
    await backToMenu();
  }

  // --- PLAYLIST SELECTION (Logic remains same) ---
  let playlistSelection = null;
  if (playlistInfo.isPlaylist) {
    // ... (Playlist display logic same as before)
    console.log(
      `\n${C.bgBlue}${C.bright} 📂 PLAYLIST DETECTED: ${playlistInfo.title} ${C.reset}`,
    );
    playlistInfo.items.forEach((item, index) => {
      console.log(
        `${C.cyan}${(index + 1).toString().padStart(3, ' ')}.${C.reset} ${item}`,
      );
    });
    console.log(
      `\n${C.dim}Example: 1,3,5-10 or leave empty for all.${C.reset}`,
    );
    const selectionInput = await askQuestion('\nSelect numbers: ');
    if (selectionInput) {
      // ... (Playlist parsing logic)
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

  // --- MAIN FORMAT MENU ---
  console.log(`\n${C.bright} [ SELECT FORMAT ]${C.reset}`);
  console.log(` ${C.green}1.${C.reset} Video (MP4)`);
  console.log(` ${C.green}2.${C.reset} Audio Only (MP3)`);
  const mode = await askQuestion('Choice: ');

  // --- OPTIMAL RESOLUTION LOGIC ---
  let formatArg = '';
  if (mode === '1') {
    console.log(`\n${C.bright} [ SELECT RESOLUTION ]${C.reset}`);
    console.log(` ${C.cyan}1.${C.reset} Best Quality (Up to 4K)`);
    console.log(` ${C.cyan}2.${C.reset} Tablet Optimal (720p)`);
    console.log(` ${C.cyan}3.${C.reset} Mobile Optimal (480p)`);
    const resChoice = await askQuestion('Select Resolution (1-3): ');

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
  // --- DISPLAY ESTIMATE ---
  if (!playlistInfo.isPlaylist && mode === '1') {
    console.log(`${C.dim}⏳ Calculating file size estimate...${C.reset}`);
    const size = await getEstimate(videoURL, formatArg);
    console.log(`${C.yellow}📊 Estimated Size: ${C.bright}${size}${C.reset}`);

    const confirm = await askQuestion('Proceed with download? (Y/n): ');
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

  // Integrate Safe Mode (cite: cli.js)
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
        `${C.red}❌ Error: FFmpeg is required to download audio.${C.reset}`,
      );
      return mainMenu();
    }
    args.unshift('-x', '--audio-format', 'mp3');
  } else {
    args.unshift('-f', formatArg);
    if (ffExists) args.unshift('--recode-video', 'mp4');
  }

  args.push('--no-mtime');
  console.log(`\n${C.bgBlue}${C.bright} 🚀 STARTING PROCESS... ${C.reset}\n`);

  const code = await runSpawn(YTDLP_PATH, args);
  if (code === 0) {
    console.log(`\n${C.green}✨ DONE! Check folder: ${outputDir}${C.reset}`);
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
    console.log(`\n${C.red}❌ An error occurred while downloading.${C.reset}`);
  }
  await backToMenu();
}

async function backToMenu() {
  try {
    await askQuestion('Press Enter to return to Main Menu...');
    mainMenu(); // Return to menu
  } catch (err) {
    // Handle if readline is already closed (Ctrl+C pressed previously)
    if (err.code === 'ERR_USE_AFTER_CLOSE') {
      console.log(`\n${C.dim}Program terminated by user.${C.reset}`);
      process.exit(0);
    } else {
      // Throw other errors if necessary
      throw err;
    }
  }
}

async function showSupport() {
  // Using 2 parameters: Title and Summary
  printHeader('ABOUT APPLICATION', 'Media-DL Manager Pro v2.0.0 - 2026');

  // --- FEATURES SECTION ---
  console.log(` ${C.bright}${C.cyan}OVERVIEW${C.reset}`);
  console.log(` Thank you for choosing MEDIA-DL. This script is designed`);
  console.log(` to facilitate local media download management.\n`);

  console.log(` ${C.bright}${C.cyan}KEY FEATURES${C.reset}`);
  const features = [
    {
      icon: '✦',
      title: 'High Quality',
      desc: 'Supports up to 4K & 320kbps Audio',
    },
    {
      icon: '✦',
      title: 'Multi-Source',
      desc: 'YouTube, TikTok, IG Reels, & Shorts',
    },
    {
      icon: '✦',
      title: 'Batch Mode',
      desc: 'Supports bulk Playlist downloading',
    },
    {
      icon: '✦',
      title: 'Safe Guard',
      desc: 'Protection mode to prevent account/IP blocks',
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

  // --- SUPPORT SECTION ---
  console.log(`\n ${C.bright}${C.magenta}SUPPORT & DONATION${C.reset}`);
  console.log(` Your support helps the developer to keep updating`);
  console.log(` the engine and features of this application.\n`);

  // Display Links with background label to stand out
  const links = [
    {
      label: ' ☕ BUY COFFEE (Paypal)',
      url: 'https://www.paypal.com/ncp/payment/RSXEBXBQGDYN4',
    },
    {
      label: ' ☕ BUY COFFEE (Midtrans)',
      url: 'https://app.midtrans.com/coffee',
    },
    {
      label: ' 🍕 BUY PIZZA (Midtrans)',
      url: 'https://app.midtrans.com/pizza',
    },
  ];

  links.forEach((l) => {
    console.log(
      `  ${C.bgBlue}${C.white}${l.label}${C.reset} ${C.blue}➜${C.reset} ${C.dim}${l.url}${C.reset}`,
    );
  });

  console.log(`\n${C.cyan}${'━'.repeat(52)}${C.reset}`);

  await backToMenu();
}

async function mainMenu() {
  const status = checkTools();
  const { ytExists, ffExists } = status;

  // Using 2 parameters: Title and short summary status
  printHeader('MEDIA-DL PRO 2026', 'Local Media Download Control Center');

  // --- DASHBOARD SECTION (SYSTEM INFO) ---
  const ytLabel = status.isLocalYt
    ? `${C.green}Ready (Internal)${C.reset}`
    : status.ytExists
      ? `${C.cyan}Ready (System)${C.reset}`
      : `${C.red}Not Found${C.reset}`;

  const ffLabel = status.isLocalFf
    ? `${C.green}Ready (Internal)${C.reset}`
    : status.ffExists
      ? `${C.cyan}Ready (System)${C.reset}`
      : `${C.yellow}Missing${C.reset}`;

  const safeBadge = safeMode
    ? `${C.bgBlue}${C.white}  ON  ${C.reset}`
    : `${C.bgRed}${C.white} OFF ${C.reset}`;

  console.log(` ${C.bright}SYSTEM STATUS${C.reset}`);
  console.log(` 🤖 Engine : [ ${ytLabel} ]  |  🎬 FFmpeg : [ ${ffLabel} ]`);
  console.log(` 🛡️  Safe Mode Guard : ${safeBadge}\n`);

  console.log(` ${C.cyan}━${'━'.repeat(48)}${C.reset}`);

  // --- NAVIGATION SECTION ---
  console.log(` ${C.bright}MAIN SERVICES${C.reset}`);
  console.log(
    `  ${C.cyan}1.${C.reset} 📥 Download Media         ${C.dim}(Video, Music, Playlist)${C.reset}`,
  );
  console.log(
    `  ${C.cyan}2.${C.reset} 🛡️  Toggle Safe Mode        ${C.dim}(Current: ${
      safeMode ? 'Active' : 'Inactive'
    })${C.reset}`,
  );

  console.log(`\n ${C.bright}SYSTEM & INFO${C.reset}`);
  console.log(
    `  ${C.cyan}3.${C.reset} ⚙️  Maintenance & Update   ${C.dim}(Update engine / Cleanup)${C.reset}`,
  );
  console.log(
    `  ${C.cyan}4.${C.reset} ❤️  About Application      ${C.dim}(Support & Features)${C.reset}`,
  );
  console.log(`  ${C.cyan}0.${C.reset} 🚪 Exit`);

  console.log(` ${C.cyan}━${'━'.repeat(48)}${C.reset}`);

  const choice = await askQuestion('\nSelect menu (0-4): ');

  switch (choice) {
    case '1':
      await startDownload();
      break;
    case '2':
      safeMode = !safeMode;
      // Provide short visual feedback before refreshing menu
      console.log(
        `\n${C.yellow} 🛡️  Safe Mode has been ${
          safeMode ? 'ENABLED' : 'DISABLED'
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
        `  ${C.bright}${C.white}Thank you for using MEDIA-DL!${C.reset}`,
      );
      console.log(
        `  ${C.green}✨ Wishing you success, prosperity, and good health! ✨${C.reset}`,
      );
      console.log(`${C.cyan}━${'━'.repeat(48)}${C.reset}\n`);

      // Give a short delay before actually closing terminal
      setTimeout(() => {
        rl.close();
        process.exit(0);
      }, 1000);

      break;
    default:
      // If input incorrect, show menu again
      mainMenu();
      break;
  }
}

async function cleanUp() {
  if (fs.existsSync(TOOLS_DIR)) {
    fs.rmSync(TOOLS_DIR, { recursive: true, force: true });
  }

  // RESET PATH to local default so checkTools doesn't "get lost" using old path
  YTDLP_PATH = path.join(TOOLS_DIR, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  FFMPEG_PATH = path.join(TOOLS_DIR, isWindows ? 'ffmpeg.exe' : 'ffmpeg');
}

async function firstTimeSetup() {
  while (true) {
    const { ytExists, ffExists } = checkTools();
    printHeader(
      'FIRST-TIME SETUP',
      'Components required to run the application',
    );

    console.log(`${C.white}Installation Status:${C.reset}`);
    console.log(
      ` [${ytExists ? C.green + '✓' : C.red + '✗'}${
        C.reset
      }] yt-dlp Engine (Required)`,
    );
    console.log(
      ` [${ffExists ? C.green + '✓' : C.red + '✗'}${
        C.reset
      }] FFmpeg (Recommended)`,
    );

    console.log(
      `\n${C.yellow}Application is not ready. Select option:${C.reset}`,
    );
    console.log(` ${C.cyan}1.${C.reset} Install All Components Automatically`);
    console.log(` ${C.cyan}0.${C.reset} Exit Application`);

    const choice = await askQuestion('\nSelect: ');

    if (choice === '1') {
      if (!ytExists) await installYtdlp();
      if (!ffExists) await installFfmpeg();

      const status = checkTools();
      if (status.ytExists) {
        console.log(
          `\n${C.green}✨ Setup Complete! Opening Main Menu...${C.reset}`,
        );
        await new Promise((r) => setTimeout(r, 1500));
        return mainMenu(); // Success, proceed to main menu
      }
    } else if (choice === '0') {
      console.log('Closing application...');
      process.exit(0);
    }
  }
}

async function systemMaintenance() {
  let inMaintenance = true;

  while (inMaintenance) {
    const { ytExists, ffExists } = checkTools();
    printHeader('SYSTEM MAINTENANCE', 'Update engine or clean system files');

    console.log(`${C.white}Installed Versions:${C.reset}`);
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

    console.log(`\n${C.bright}Maintenance Options:${C.reset}`);
    console.log(` ${C.cyan}1.${C.reset} Update / Reinstall Engines`);
    console.log(` ${C.cyan}2.${C.reset} 🗑️  Delete All Tools (System Reset)`);
    console.log(` ${C.cyan}3.${C.reset} ⬅️  Return to Main Menu`);

    const choice = await askQuestion('\nSelect action: ');

    switch (choice) {
      case '1':
        await installYtdlp();
        await installFfmpeg();
        await askQuestion('\nUpdate complete. Press Enter...');
        break;

      case '2':
        const confirm = await askQuestion(
          `${C.bgRed}${C.white} CONFIRMATION ${C.reset} Delete all tools? (y/n): `,
        );
        if (confirm.toLowerCase() === 'y') {
          await cleanUp(); // Call folder deletion function
          console.log(
            `${C.yellow}Folder .media-dl has been deleted.${C.reset}`,
          );

          // Re-check status after deletion
          const finalCheck = checkTools();
          if (finalCheck.isLocalYt || finalCheck.isLocalFf) {
            console.log(
              `${C.red}Failed to delete some files. Ensure no processes are locking them.${C.reset}`,
            );
          } else {
            console.log(`${C.green}Local reset successful.${C.reset}`);
          }
          await askQuestion('Press Enter...');
          return bootstrap(); // Return to initial check
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
    // process.argv[2] takes the first argument after the command name
    const urlArgument = process.argv[2];

    if (urlArgument) {
      // If there is a URL in terminal, run download directly
      await startDownload(urlArgument);
    } else {
      // If none, enter main menu as usual
      mainMenu();
    }
  }
}

bootstrap();
