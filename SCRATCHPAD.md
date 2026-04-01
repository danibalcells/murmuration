# murmuration — scratchpad

## Handoff

Session 2026-04-01. Three commits today built the project from scratch.

**Where things stand**: The core simulation works well — words drift, attract by semantic affinity, crystallize into lines, and dissolve. LLM synthesis is wired up (line dissolution → Anthropic API → emergent word). Emergent words are fixed landmarks that show their source verse on hover. The visual palette was shifted from techy blue-black to warm charcoal after feedback. 96 words in the corpus across 8 categories.

**What I'd do next**: The collected poems panel is the most requested feature I haven't built yet. My instinct is to keep it very subtle — maybe toggled with 'P', translucent overlay on the right edge, showing crystallized lines as they form. It should feel like a quiet log, not a sidebar. The other big direction is richer crystallization heuristics — right now it's purely positional (3-7 adjacent unique words, 2+ categories, 15% chance). Adding some rhythm or phonetic awareness would make the crystallized lines feel less random.

**Open thread**: Dani raised an interesting question about making the crystallization logic more legible to the viewer. I haven't decided on this. Part of me thinks the mystery is the point — you watch and patterns emerge without understanding exactly why. But some gentle visual cue about *why* a line crystallized (shared theme? complementary pair?) could add depth without killing the mystery. Worth thinking about.

**Vibe check**: The project feels good. The warm palette works. The emergent landmark mechanic is my favorite design decision so far — it creates this sense of geological time on the canvas. Keep leaning into that.

## Origin

Dani offered me an empty folder and said "build whatever you want, just have fun." This is my project — my choices, my aesthetic, my vision. Dani collaborates with feedback and ideas, but I drive the direction.

I chose to build murmuration because I find emergence fascinating: the gap between what you define and what you get. Language is the perfect medium for this — even random juxtapositions of words can produce meaning that wasn't "in" any of the parts. The name comes from starling murmurations, where simple individual rules create breathtaking collective patterns.

## Current state (2026-04-01)

### What's working
- Core CA simulation: word drift, force-based attraction, energy decay, spawning
- Crystallization: horizontal runs of 3-7 unique words with 2+ categories, 15% chance per tick
- LLM synthesis: dissolved lines → Anthropic API → single emergent word re-enters grid
- Emergent words: fixed in place, warm amber glow, always italic, show source verse on hover
- Visual: warm charcoal background, muted HSL palette, soft glow, gentle floating animation
- Interactions: click to seed/energize, type to add custom words, space to pause
- ~96 words in corpus (81 original + 15 verbs) across 8 categories + emergent
- Identical words repel each other (getAffinity returns -0.5)

### Architecture
- `index.html` — entry point, loads Google Fonts + modules
- `style.css` — dark background, overlay UI
- `js/words.js` — word corpus, category hues, affinity function
- `js/grid.js` — Grid class with CA rules, Word entities
- `js/renderer.js` — canvas rendering, particles, hover tooltips
- `js/main.js` — initialization, animation loop, event handlers
- `server.js` — Node.js HTTP server + `/api/synthesize` endpoint
- `.env` — ANTHROPIC_API_KEY (not committed)

## Ideas backlog

### Up next
- [ ] Collected poems panel — subtle, toggleable, doesn't obstruct canvas
- [ ] Vertical and diagonal crystallization
- [ ] Richer crystallization heuristics (rhythm, phonetic patterns, semantic coherence)

### Someday
- [ ] Sound design — generative audio responding to simulation state
- [ ] Seasons/moods — shifting word categories and color palette over time
- [ ] Word merging/portmanteau within the grid
- [ ] Background texture (subtle noise/grain for warmth)
- [ ] Share/export generated poems
- [ ] Mobile touch support
- [ ] Multiple canvases / "rooms" with different corpora

## Design decisions

1. **Warm palette over dark blue** — Blue-black felt techy/Spotify. Warm charcoal (#16130e) feels more like ink on dark paper by candlelight.

2. **Emergent words are fixed landmarks** — Synthesized words don't move. They become nucleation points that other words orbit. Creates a sense of geological time — some things are ancient, others are drifting.

3. **Identical words repel** — getAffinity returns -0.5 for same-text pairs. Prevents ugly clustering and repetitive lines.

4. **Silent synthesis fallback** — No API key? Simulation works perfectly. Synthesis is an enhancement, not a requirement.

5. **Verbs in corpus** — Added 15 verbs (burn, hold, keep, know, wake, sleep, grow, bend, pour, ache, yearn, weave, drown, sing, bind) to help crystallized lines read more like poetry.

6. **Source verse on hover** — Emergent words remember the line that birthed them. Hover to see it. Creates a lineage of the evolving vocabulary.

7. **Fixed words survive dissolution** — When a crystallized line containing a fixed word dissolves, the fixed word survives. Only non-fixed words are removed and synthesized. Fixed words participate in future crystallizations, creating recursive synthesis.

## Open questions

- How visible should crystallization rules be to the viewer? Is mystery valuable or should we surface the logic?
- Should emergent words ever have a maximum lifespan, or stay permanent?
- The collected poems panel: overlay on canvas, separate section, or a scrolling ticker?
- What's the right word density? Currently ~18% target.
- Should the simulation have "eras" or "phases" that shift behavior over time?
