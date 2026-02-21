const { getTokenizer, countTokens } = require("@anthropic-ai/tokenizer");

const TEXT = process.argv.slice(2).join(" ") || "I am Ilya Ivanchikov";

// Anthropic pricing per 1M tokens (USD)
const MODELS = [
  { name: "Claude Haiku 4.5",  input: 1.0,  output: 5.0  },
  { name: "Claude Sonnet 4.5", input: 3.0,  output: 15.0 },
  { name: "Claude Opus 4.5",   input: 5.0,  output: 25.0 },
];

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  bgCyan: "\x1b[46m",
  bgMagenta: "\x1b[45m",
  bgYellow: "\x1b[43m",
  bgGreen: "\x1b[42m",
  bgBlue: "\x1b[44m",
  bgRed: "\x1b[41m",
  bgWhite: "\x1b[47m",
  black: "\x1b[30m",
};

const TOKEN_COLORS = [
  COLORS.bgCyan + COLORS.black,
  COLORS.bgMagenta + COLORS.white,
  COLORS.bgYellow + COLORS.black,
  COLORS.bgGreen + COLORS.black,
  COLORS.bgBlue + COLORS.white,
  COLORS.bgRed + COLORS.white,
  COLORS.bgWhite + COLORS.black,
];

function line(char = "─", len = 60) {
  return COLORS.dim + char.repeat(len) + COLORS.reset;
}

function main() {
  const tokenizer = getTokenizer();
  const tokenIds = tokenizer.encode(TEXT);
  const tokenCount = tokenIds.length;

  // Decode each token to text
  const tokens = [];
  for (const id of tokenIds) {
    const bytes = tokenizer.decode(new Uint32Array([id]));
    const text = Buffer.from(bytes).toString("utf-8");
    tokens.push({ id, text });
  }

  // Header
  console.log();
  console.log(line("═"));
  console.log(
    COLORS.bold + COLORS.cyan + "  Anthropic Token Analyzer" + COLORS.reset
  );
  console.log(line("═"));

  // Input
  console.log();
  console.log(COLORS.dim + "  Input text:" + COLORS.reset);
  console.log(COLORS.bold + `  "${TEXT}"` + COLORS.reset);

  // Token count
  console.log();
  console.log(
    COLORS.dim +
      "  Token count: " +
      COLORS.reset +
      COLORS.bold +
      COLORS.yellow +
      tokenCount +
      COLORS.reset
  );

  // Character count
  console.log(
    COLORS.dim +
      "  Char count:  " +
      COLORS.reset +
      COLORS.bold +
      TEXT.length +
      COLORS.reset
  );

  console.log(
    COLORS.dim +
      "  Ratio:       " +
      COLORS.reset +
      COLORS.bold +
      (TEXT.length / tokenCount).toFixed(2) +
      " chars/token" +
      COLORS.reset
  );

  // Token visualization
  console.log();
  console.log(line());
  console.log(
    COLORS.bold + COLORS.cyan + "  Token Breakdown" + COLORS.reset
  );
  console.log(line());
  console.log();

  // Colorized text
  let colorized = "  ";
  tokens.forEach((t, i) => {
    const color = TOKEN_COLORS[i % TOKEN_COLORS.length];
    colorized += color + " " + t.text.replace(/^ /, "·") + " " + COLORS.reset;
  });
  console.log(colorized);
  console.log();

  // Token table
  const idWidth = 8;
  const textWidth = 12;
  const bytesWidth = 8;

  console.log(
    COLORS.dim +
      "  " +
      "#".padEnd(4) +
      "Token ID".padEnd(idWidth) +
      "Text".padEnd(textWidth) +
      "Bytes".padEnd(bytesWidth) +
      COLORS.reset
  );
  console.log(COLORS.dim + "  " + "─".repeat(4 + idWidth + textWidth + bytesWidth) + COLORS.reset);

  tokens.forEach((t, i) => {
    const color = TOKEN_COLORS[i % TOKEN_COLORS.length];
    const display = t.text.replace(/ /g, "·");
    const byteLen = Buffer.byteLength(t.text, "utf-8");
    console.log(
      "  " +
        COLORS.dim +
        String(i + 1).padEnd(4) +
        COLORS.reset +
        String(t.id).padEnd(idWidth) +
        color +
        ` ${display} ` +
        COLORS.reset +
        "".padEnd(textWidth - display.length - 2) +
        String(byteLen).padEnd(bytesWidth)
    );
  });

  // Cost analysis
  console.log();
  console.log(line());
  console.log(
    COLORS.bold + COLORS.cyan + "  Cost Analysis" + COLORS.reset
  );
  console.log(
    COLORS.dim +
      "  (cost of this phrase as input & output)" +
      COLORS.reset
  );
  console.log(line());
  console.log();

  const nameWidth = 22;
  const costWidth = 16;
  console.log(
    COLORS.dim +
      "  " +
      "Model".padEnd(nameWidth) +
      "As Input".padEnd(costWidth) +
      "As Output".padEnd(costWidth) +
      COLORS.reset
  );
  console.log(COLORS.dim + "  " + "─".repeat(nameWidth + costWidth * 2) + COLORS.reset);

  for (const model of MODELS) {
    const inputCost = (tokenCount / 1_000_000) * model.input;
    const outputCost = (tokenCount / 1_000_000) * model.output;
    console.log(
      "  " +
        COLORS.bold +
        model.name.padEnd(nameWidth) +
        COLORS.reset +
        COLORS.green +
        ("$" + inputCost.toFixed(10)).padEnd(costWidth) +
        COLORS.reset +
        COLORS.yellow +
        ("$" + outputCost.toFixed(10)).padEnd(costWidth) +
        COLORS.reset
    );
  }

  // How many times you can say this phrase
  console.log();
  console.log(line());
  console.log(
    COLORS.bold + COLORS.cyan + "  Scale Perspective" + COLORS.reset
  );
  console.log(line());
  console.log();

  for (const model of MODELS) {
    const timesPerDollarInput = Math.floor(1_000_000 / model.input / tokenCount);
    const timesPerDollarOutput = Math.floor(1_000_000 / model.output / tokenCount);
    console.log(
      "  " +
        COLORS.bold +
        model.name +
        COLORS.reset
    );
    console.log(
      COLORS.dim +
        "    $1 buys: " +
        COLORS.reset +
        COLORS.green +
        timesPerDollarInput.toLocaleString() +
        COLORS.reset +
        " inputs  |  " +
        COLORS.yellow +
        timesPerDollarOutput.toLocaleString() +
        COLORS.reset +
        " outputs"
    );
  }

  // Note about accuracy
  console.log();
  console.log(line());
  console.log(
    COLORS.dim +
      "  Note: This tokenizer is approximate for Claude 3+ models." +
      COLORS.reset
  );
  console.log(
    COLORS.dim +
      "  For exact counts, use the `usage` field in API responses." +
      COLORS.reset
  );
  console.log(line());
  console.log();
}

main();
