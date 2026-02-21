import sys
import json
import base64
from pathlib import Path

import tiktoken

# Anthropic pricing per 1M tokens (USD)
MODELS = [
    {"name": "Claude Haiku 4.5",  "input": 1.0,  "output": 5.0},
    {"name": "Claude Sonnet 4.5", "input": 3.0,  "output": 15.0},
    {"name": "Claude Opus 4.5",   "input": 5.0,  "output": 25.0},
]

# ANSI colors
C = {
    "reset": "\033[0m", "bold": "\033[1m", "dim": "\033[2m",
    "cyan": "\033[36m", "yellow": "\033[33m", "green": "\033[32m",
    "white": "\033[37m", "black": "\033[30m",
    "bgCyan": "\033[46m", "bgMagenta": "\033[45m", "bgYellow": "\033[43m",
    "bgGreen": "\033[42m", "bgBlue": "\033[44m", "bgRed": "\033[41m",
    "bgWhite": "\033[47m",
}

TOKEN_COLORS = [
    C["bgCyan"] + C["black"], C["bgMagenta"] + C["white"],
    C["bgYellow"] + C["black"], C["bgGreen"] + C["black"],
    C["bgBlue"] + C["white"], C["bgRed"] + C["white"],
    C["bgWhite"] + C["black"],
]


def line(char="─", length=60):
    return f'{C["dim"]}{char * length}{C["reset"]}'


def load_tokenizer():
    claude_json = Path(__file__).parent / "claude.json"
    with open(claude_json) as f:
        data = json.load(f)

    parts = data["bpe_ranks"].split(" ")
    offset = int(parts[1])

    mergeable_ranks = {}
    for i, b64 in enumerate(parts[2:]):
        mergeable_ranks[base64.b64decode(b64)] = i + offset

    special_tokens = {k: int(v) for k, v in data["special_tokens"].items()}

    return tiktoken.Encoding(
        name="claude",
        pat_str=data["pat_str"],
        mergeable_ranks=mergeable_ranks,
        special_tokens=special_tokens,
    )


def main():
    text = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "I am Ilya Ivanchikov"

    enc = load_tokenizer()
    token_ids = enc.encode(text)
    token_count = len(token_ids)

    tokens = []
    for tid in token_ids:
        decoded = enc.decode([tid])
        tokens.append({"id": tid, "text": decoded})

    # Header
    print()
    print(line("═"))
    print(f'{C["bold"]}{C["cyan"]}  Anthropic Token Analyzer{C["reset"]}')
    print(line("═"))

    # Input
    print()
    print(f'{C["dim"]}  Input text:{C["reset"]}')
    print(f'{C["bold"]}  "{text}"{C["reset"]}')

    # Stats
    print()
    print(f'{C["dim"]}  Token count: {C["reset"]}{C["bold"]}{C["yellow"]}{token_count}{C["reset"]}')
    print(f'{C["dim"]}  Char count:  {C["reset"]}{C["bold"]}{len(text)}{C["reset"]}')
    print(f'{C["dim"]}  Ratio:       {C["reset"]}{C["bold"]}{len(text) / token_count:.2f} chars/token{C["reset"]}')

    # Token visualization
    print()
    print(line())
    print(f'{C["bold"]}{C["cyan"]}  Token Breakdown{C["reset"]}')
    print(line())
    print()

    colorized = "  "
    for i, t in enumerate(tokens):
        color = TOKEN_COLORS[i % len(TOKEN_COLORS)]
        display = t["text"].replace(" ", "·", 1) if t["text"].startswith(" ") else t["text"]
        colorized += f'{color} {display} {C["reset"]}'
    print(colorized)
    print()

    # Token table
    id_w, text_w, bytes_w = 8, 12, 8
    print(f'{C["dim"]}  {"#":<4}{"Token ID":<{id_w}}{"Text":<{text_w}}{"Bytes":<{bytes_w}}{C["reset"]}')
    print(f'{C["dim"]}  {"─" * (4 + id_w + text_w + bytes_w)}{C["reset"]}')

    for i, t in enumerate(tokens):
        color = TOKEN_COLORS[i % len(TOKEN_COLORS)]
        display = t["text"].replace(" ", "·")
        byte_len = len(t["text"].encode("utf-8"))
        print(
            f'  {C["dim"]}{i + 1:<4}{C["reset"]}'
            f'{t["id"]:<{id_w}}'
            f'{color} {display} {C["reset"]}'
            f'{"" :<{text_w - len(display) - 2}}'
            f'{byte_len:<{bytes_w}}'
        )

    # Cost analysis
    print()
    print(line())
    print(f'{C["bold"]}{C["cyan"]}  Cost Analysis{C["reset"]}')
    print(f'{C["dim"]}  (cost of this phrase as input & output){C["reset"]}')
    print(line())
    print()

    name_w, cost_w = 22, 16
    print(f'{C["dim"]}  {"Model":<{name_w}}{"As Input":<{cost_w}}{"As Output":<{cost_w}}{C["reset"]}')
    print(f'{C["dim"]}  {"─" * (name_w + cost_w * 2)}{C["reset"]}')

    for m in MODELS:
        input_cost = (token_count / 1_000_000) * m["input"]
        output_cost = (token_count / 1_000_000) * m["output"]
        print(
            f'  {C["bold"]}{m["name"]:<{name_w}}{C["reset"]}'
            f'{C["green"]}{"$" + f"{input_cost:.10f}":<{cost_w}}{C["reset"]}'
            f'{C["yellow"]}{"$" + f"{output_cost:.10f}":<{cost_w}}{C["reset"]}'
        )

    # Scale perspective
    print()
    print(line())
    print(f'{C["bold"]}{C["cyan"]}  Scale Perspective{C["reset"]}')
    print(line())
    print()

    for m in MODELS:
        times_input = int(1_000_000 / m["input"] / token_count)
        times_output = int(1_000_000 / m["output"] / token_count)
        print(f'  {C["bold"]}{m["name"]}{C["reset"]}')
        print(
            f'{C["dim"]}    $1 buys: {C["reset"]}'
            f'{C["green"]}{times_input:,}{C["reset"]}'
            f' inputs  |  '
            f'{C["yellow"]}{times_output:,}{C["reset"]}'
            f' outputs'
        )

    # Note
    print()
    print(line())
    print(f'{C["dim"]}  Note: This tokenizer is approximate for Claude 3+ models.{C["reset"]}')
    print(f'{C["dim"]}  For exact counts, use the `usage` field in API responses.{C["reset"]}')
    print(line())
    print()


if __name__ == "__main__":
    main()
