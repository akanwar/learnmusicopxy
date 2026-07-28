# Learn Music with OP–XY

**From first beat to finished track** — a free, hands-on 12-week course for learning electronic
music on the Teenage Engineering OP–XY, written for complete beginners. Rhythm, harmony, melody,
synthesis, arrangement and mixing, taught one 30–45 minute session at a time, with every button
press shown exactly as it appears on the device.

**Live site:** <https://akanwar.github.io/learnmusicopxy/>

This is a self-contained static site: plain HTML files, no build step, no frameworks, no external
assets. The course flows across pages like a book — a course HQ (`index.html`), one page per week
(`week-00.html` … `week-12.html`) and a printable quick reference (`cheatsheet.html`), sharing one
stylesheet (`opxy.css`) and one script (`opxy.js`). `node test/clips.test.js` screens every audio
demo for clicks, thumps and silent renders, plus checks that each clip demonstrates what its
lesson claims. Open `index.html` on your own computer right
now (double-click it) and everything works — including offline at the practice desk.

## What's inside

- **An annotated device map** — all 14 zones of the OP–XY panel, drawn as an original schematic,
  so every instruction ("hold `bar` + `shift`") points at something you can find.
- **26 sessions across 12 weeks, one page per week** — Rhythm I/II → Harmony I/II → Melody → First sketch →
  Synthesis I/II → Arrangement I/II → Mixing → Final project. Each session: a goal, exact
  button-path steps, what to listen for, an assignment, a mastery check, and a fix-it box.
- **Visual, not verbal** — step-sequencer grids showing exactly which pads to press, keyboard
  diagrams with chord notes lit, ADSR envelope shapes, scene maps and energy curves.
- **Audible, too** — 22 sessions carry "▶ hear it" buttons that synthesize a short demo of the
  idea (the four-on-the-floor, the major/minor flip, the sidechain pump…) right in your browser
  with the Web Audio API. No audio files: every clip is a few lines of deterministic sample math
  in `opxy.js`, rendered when you press play. They are schematic sketches of each concept — the
  OP–XY's own engines sound far richer.
- **Built on learning science** — each session opens with a 2-minute retrieval warm-up, closes
  with a one-line mantra, and each week ends with click-to-reveal recall quizzes. "Liner notes"
  vignettes (the 808's flop-to-legend arc, the Amen break, the invention of ADSR, the 303 and
  acid house…) give the concepts stories to stick to.
- **Progress that persists** — session checkboxes, a progress bar, and per-week practice notes
  all save in your browser (localStorage, per device) and follow you across pages; the HQ roadmap
  shows per-week completion. Print works too: navigation hides itself, and each week prints as its
  own booklet.

## Publishing to GitHub Pages (one-time, ~5 minutes)

1. Push this folder to a public GitHub repository.
2. Repo **Settings → Pages** → under *Branch*, choose `main` and `/ (root)`, then **Save**.
3. Wait a minute, refresh: your site is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

To change anything later, edit the page and push — the site updates within a minute.

## Contributing

Spotted a wrong button path or a muddled explanation? Please open an issue or a pull request —
corrections are the whole point of hosting this on GitHub. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the two-minute version.

## Accuracy

This guide was drafted with AI assistance and reviewed by a human, but it will contain mistakes.
Button paths, key positions and default sounds were checked against the official
[Teenage Engineering OP–XY guide](https://teenage.engineering/guides/op-xy) (v 1.1.0), but
firmware changes and errors happen: when this page and your device disagree, **trust the device's
screen and the official guide**, and please report the difference.

## Not affiliated with Teenage Engineering

OP–XY is a product and trademark of Teenage Engineering. This is an independent fan-made study
guide — not affiliated with, sponsored by, or endorsed by Teenage Engineering. The site contains
no Teenage Engineering imagery; every diagram is an original schematic drawn for this course.

## License

- **Content** (text, diagrams, course design): [Creative Commons Attribution 4.0](LICENSE)
  (CC BY 4.0). Reuse and adapt freely — with attribution, e.g.:

  > Based on *learnmusicopxy* by Ansh Kanwar — github.com/akanwar/learnmusicopxy

- **Code** (`opxy.js` and inline scripts): [MIT](LICENSE-CODE).
