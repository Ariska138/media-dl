const readline = require('readline');

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

function printHeader(title, summary = '') {
  console.clear();
  const width = 50;
  const line = '━'.repeat(width);

  console.log(`${C.cyan}┏${line}┓`);

  // Baris Judul (Bright White)
  console.log(
    `${C.cyan}┃ ${C.bright}${C.white}${title.padEnd(width - 2)} ${C.cyan}┃`
  );

  // Baris Summary (Hanya muncul jika summary diisi)
  if (summary) {
    console.log(
      `${C.cyan}┃ ${C.dim}${C.white}${summary.padEnd(width - 2)} ${C.cyan}┃`
    );
  }

  console.log(`${C.cyan}┗${line}┛${C.reset}\n`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) =>
    rl.question(`${C.bright}${C.yellow}❯ ${C.reset}${query}`, resolve)
  );
}

function renderProgressBar(percent, speed, eta) {
  const width = 30;
  const complete = Math.round((percent / 100) * width);
  const incomplete = width - complete;
  const bar = `${C.green}${'█'.repeat(complete)}${C.dim}${'░'.repeat(
    incomplete
  )}${C.reset}`;

  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(
    ` ${C.bright}${percent.toString().padStart(5)}% ${bar} ${C.cyan}${speed}${
      C.reset
    } | ${C.yellow}ETA: ${eta}${C.reset}`
  );
}

module.exports = {
  C,
  rl,
  printHeader,
  askQuestion,
  renderProgressBar,
};
