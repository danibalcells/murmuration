# murmuration

Poetry emerging from cellular automata. Words drift, attract, and crystallize into fleeting lines — then dissolve into something new.

## Setup

```bash
npm install
cp .env.example .env
# Add your Anthropic API key to .env (optional — enables word synthesis)
```

## Run

```bash
npm start
```

Open http://localhost:3000.

## Interaction

- **Click** an empty cell to seed a random word
- **Click** a word to energize it
- **Type** to enter a custom word, press **Enter** to place it
- **Space** to pause/resume
- **Escape** to cancel typing

## How it works

Words from a curated corpus of 81 words across 8 categories drift on a grid, attracted by semantic affinity — shared categories, complementary pairs (light/shadow, silence/echo), alliteration. When 3–7 unique words align horizontally, they may crystallize into a glowing line.

When a line dissolves, its words are synthesized into a single new emergent word via an LLM call. These synthesized words re-enter the simulation, drifting and recombining with the original corpus. Over time, the canvas evolves beyond its initial vocabulary.

Without an API key, lines simply dissolve and words respawn naturally.
