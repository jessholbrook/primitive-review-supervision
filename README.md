# Review & Supervision

Become the editor-in-chief of AI-generated content with per-paragraph review controls and real-time editorial analytics.

## Concept

Most AI writing tools give you a single output to take or leave. Review & Supervision breaks AI-generated content into individual paragraphs, each of which you can accept, edit, reject, or send back with revision instructions. As you review, the app tracks your decisions and builds an editorial fingerprint that reveals your supervision style.

![Demo](screenshot.png)

## Editorial Controls

Each paragraph presents four actions:

- **Accept** (green) — approve the paragraph as-is
- **Edit** (amber) — manually rewrite or tweak the text yourself
- **Reject** (red) — discard the paragraph entirely and regenerate it from scratch
- **Revise** (blue) — send natural-language instructions back to the AI (e.g. "make shorter", "add statistics", "more formal tone")

## Editor Styles

Based on your review patterns, the dashboard classifies your editorial personality:

- **Perfectionist** — you refine every detail by hand
- **Trusting** — you trust the AI's judgment
- **Harsh Critic** — nothing gets past your standards
- **Collaborative** — you guide the AI to do better

## Getting Started

```bash
git clone <repo-url>
cd primitive-review-supervision
npm install
```

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=your-api-key-here
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. Enter a topic and click **Generate** — Claude writes a 6-paragraph blog post
2. Review each paragraph using the editorial controls
3. The sidebar dashboard tracks your decisions in real time: word count deltas, edit distance, change rate, time spent, and decision distribution
4. When all paragraphs are reviewed, check your editorial fingerprint to see your supervision style

## Stack

- **Next.js** — app router with API routes
- **Tailwind CSS** — styling
- **Claude API** — content generation and revision

## Part of

This is one of 7 demos for **New Interaction Primitives for GenAI**.
