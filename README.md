# AI: Anthropic Token Analyzer

A CLI tool that breaks down text into tokens using Anthropic's tokenizer, visualizes the token boundaries, and calculates costs across Claude models.

## Install

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Usage

```bash
python main.py <your text here>
```

If no text is provided, defaults to `"I am Ilya Ivanchikov"`.

## Example

```bash
python main.py Hello, my name is Ilya
```

```
══════════════════════════════════════════════════════════════
  Anthropic Token Analyzer
══════════════════════════════════════════════════════════════

  Input text:
  "Hello, my name is Ilya"

  Token count: 6
  Char count:  22
  Ratio:       3.67 chars/token

────────────────────────────────────────────────────────────
  Token Breakdown
────────────────────────────────────────────────────────────

   Hello  ,  ·my  ·name  ·is  ·Ilya

  #   Token ID  Text        Bytes
  ────────────────────────────────
  1   10002     Hello       5
  2   16        ,           1
  3   961       ·my         3
  4   682       ·name       5
  5   365       ·is         3
  6   15760     ·Ilya       5

────────────────────────────────────────────────────────────
  Cost Analysis
  (cost of this phrase as input & output)
────────────────────────────────────────────────────────────

  Model                 As Input        As Output
  ──────────────────────────────────────────────────────
  Claude Haiku 4.5      $0.0000060000   $0.0000300000
  Claude Sonnet 4.5     $0.0000180000   $0.0000900000
  Claude Opus 4.5       $0.0000300000   $0.0001500000

────────────────────────────────────────────────────────────
  Scale Perspective
────────────────────────────────────────────────────────────

  Claude Haiku 4.5
    $1 buys: 166,666 inputs  |  33,333 outputs
  Claude Sonnet 4.5
    $1 buys: 55,555 inputs  |  11,111 outputs
  Claude Opus 4.5
    $1 buys: 33,333 inputs  |  6,666 outputs
```

## Notes

- Uses [`tiktoken`](https://github.com/openai/tiktoken) with Claude's BPE ranks (vocabulary size: 65,000 tokens)
- This tokenizer is approximate for Claude 3+ models — exact counts come from the `usage` field in API responses
- Pricing reflects Claude 4.5 series models
