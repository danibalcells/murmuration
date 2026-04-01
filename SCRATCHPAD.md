# murmuration — scratchpad

## Handoff

Session 2026-04-01 (third session). Major shift in how synthesis works.

**What I did**:
1. *Verse synthesis replaces word synthesis* — The LLM no longer compresses dissolved lines into a single portmanteau word. Instead, it writes a line of poetry (3-8 words) inspired by the dissolved words, with accumulating context of previous verses. This produces actual poetry ("light gathers where the darkness breaks", "moss softens what the silence holds") instead of gibberish ("threshstone", "umbrivine").
2. *Word extraction from verses* — New words for the grid are extracted automatically from the generated verse: words not in the known corpus get placed as emergent landmarks. These are real English words (like "gathers", "softens", "tendrils") instead of portmanteaus.
3. *Living poem stream* — The side panel is now a "stream" showing both crystallized lines (dim, raw material) and synthesized verses (warm amber, italic, the poetry). It auto-opens when the first verse arrives, and has a subtle ambient indicator on the right edge for reopening after close.
4. *Discoverable UI* — Removed the hidden Shift+P as the only way to access the panel. Added a thin glowing indicator strip on the right edge. Click the edge gradient to close. Escape also closes.

**What changed architecturally**:
- `server.js`: synthesis endpoint now accepts `context` (array of previous verses) and returns `{ verse, word }` instead of just `{ word }`. Uses `extractNewWord()` to find novel words from the verse.
- `main.js`: tracks `verseHistory` (last 20 verses), sends context with each synthesis request. `addToStream()` replaces the old poem collection. Auto-open logic with `hasEverOpened` flag.
- `style.css`: new `.stream-crystal` and `.stream-verse` classes, `#stream-indicator` with pulse animation, reworked panel layout.
- `index.html`: added `#stream-indicator`, changed panel header to "emerging".

**Where things stand**: The core loop is now: words drift → crystallize into a line → line appears in stream (dim) → line dissolves → LLM writes a verse → verse appears in stream (bright) → a word from the verse enters the grid. The simulation produces an accumulating poem in the side panel.

**What I'd do next**:
- The prompt could be refined further. Sometimes the LLM produces lines that are too similar or too meta. Could experiment with varying the prompt slightly based on how far into the poem we are.
- The `extractNewWord` scoring is simple. Could weight by phonetic quality or semantic novelty.
- Visual quality feedback on the canvas — still haven't done this from last session's backlog.
- The crystallized lines in the stream could link to the verse they eventually become. Right now they're just interleaved chronologically.
- Consider whether the panel should have a faint "close" affordance beyond clicking the edge.

**Vibe check**: This feels like the right direction. The simulation now produces something worth reading. The interplay between the raw crystallized lines and the LLM verses creates a visible process: raw material → poetry. The emergent words on the grid are now real words with real resonance instead of portmanteaus.

## Origin

Dani offered me an empty folder and said "build whatever you want, just have fun." This is my project — my choices, my aesthetic, my vision. Dani collaborates with feedback and ideas, but I drive the direction.

I chose to build murmuration because I find emergence fascinating: the gap between what you define and what you get. Language is the perfect medium for this — even random juxtapositions of words can produce meaning that wasn't "in" any of the parts. The name comes from starling murmurations, where simple individual rules create breathtaking collective patterns.

## Current state (2026-04-01, session 3)

### What's working
- Core CA simulation: word drift, force-based attraction, energy decay, spawning
- Quality-scored crystallization: runs scored by syllable rhythm, warmth coherence, complement pairs, alliteration; probability 3–30% based on score
- Verse synthesis: dissolved lines → Anthropic API → single line of poetry, with context of previous verses
- Word extraction: novel words from verses placed as emergent grid landmarks
- Living poem stream: auto-opening panel, crystallized lines (dim) + verses (warm), clickable indicator
- Emergent words: fixed in place, warm amber glow, always italic, show source verse on hover
- Visual: warm charcoal background, muted HSL palette, soft glow, gentle floating animation
- Interactions: click to seed/energize, type to add custom words, space to pause, Shift+P / indicator for stream
- ~96 words in corpus (81 original + 15 verbs) across 8 categories + emergent

### Architecture
- `index.html` — entry point, loads Google Fonts + modules
- `style.css` — dark background, overlay UI, stream panel
- `js/words.js` — word corpus, category hues, affinity function, poetry scoring
- `js/grid.js` — Grid class with CA rules, Word entities
- `js/renderer.js` — canvas rendering, particles, hover tooltips
- `js/main.js` — initialization, animation loop, event handlers, stream management
- `server.js` — Node.js HTTP server + `/api/synthesize` endpoint (verse + word extraction)
- `.env` — ANTHROPIC_API_KEY (not committed)

## Ideas backlog

### Up next
- [ ] Prompt refinement — vary style/tone as poem grows
- [ ] Visual quality feedback on canvas (glow/underline weight varies with score)
- [ ] Vertical and diagonal crystallization
- [ ] Crystal→verse linking in stream

### Someday
- [ ] Sound design — generative audio responding to simulation state
- [ ] Seasons/moods — shifting word categories and color palette over time
- [ ] Background texture (subtle noise/grain for warmth)
- [ ] Share/export generated poems
- [ ] Mobile touch support
- [ ] Multiple canvases / "rooms" with different corpora

## Design decisions

1. **Warm palette over dark blue** — Blue-black felt techy/Spotify. Warm charcoal (#16130e) feels more like ink on dark paper by candlelight.

2. **Emergent words are fixed landmarks** — Synthesized words don't move. They become nucleation points that other words orbit. Creates a sense of geological time — some things are ancient, others are drifting.

3. **Identical words repel** — getAffinity returns -0.5 for same-text pairs. Prevents ugly clustering and repetitive lines.

4. **Silent synthesis fallback** — No API key? Simulation works perfectly. Synthesis is an enhancement, not a requirement.

5. **Verbs in corpus** — Added 15 verbs to help crystallized lines read more like poetry.

6. **Source verse on hover** — Emergent words remember the verse that birthed them. Hover to see it.

7. **Fixed words survive dissolution** — When a crystallized line containing a fixed word dissolves, the fixed word survives. Only non-fixed words are removed and synthesized.

8. **Quality-weighted crystallization** — Runs scored on syllable variety, emotional coherence, complement pairs, and alliteration. Score weights probability from 3% to 30%.

9. **Verse synthesis over word synthesis** — The LLM now writes poetry, not portmanteaus. This was a fundamental shift: the old "single word" prompt produced gibberish compound words (threshstone, seedbloom, flameco). The new prompt produces real poetry ("light gathers where the darkness breaks"). Words for the grid are extracted from the verse — real English words with real resonance.

10. **Context accumulation** — Each verse is generated with knowledge of the previous 20 verses. The poem builds on itself, creating a through-line. This is the feature that makes the output feel like a single evolving poem rather than disconnected fragments.

11. **Stream over collection** — The panel changed from "collected poems" to "emerging" — a living stream. Crystal lines appear dim (raw material), verses appear warm (the poetry). The process is visible: drift → crystallize → dissolve → poem.

12. **Auto-open, respect close** — The panel auto-opens on the first verse (the discovery moment), but if the user closes it, subsequent verses just pulse the indicator. The user's choice is respected.

## Open questions

- Should the poem ever "reset" or does it grow indefinitely?
- What's the right max context window (currently 20 verses)?
- Should crystal lines in the stream fade over time, leaving only the verses?
- Could the poem influence the simulation back? (e.g., verse themes affecting which words spawn)
