/* Automated screening for every "hear it" clip: node test/clips.test.js
   No dependencies. Since nobody can listen in CI, these meters encode the
   failure modes we have actually shipped and been burned by:
   - hard truncation (HF click)
   - bass chopped while audible (LF thump — a 15 ms fade is NOT enough)
   - silent/clipped/NaN renders
   plus content checks that each clip demonstrates what its lesson claims. */
const { CLIPS, renderClip, VOICES } = require("../opxy.js");
const SR = 44100, TAU = Math.PI * 2;
let fails = 0;
const check = (n, c, d = "") => { console.log((c ? "PASS " : "FAIL ") + n + (d ? " | " + d : "")); if (!c) fails++; };

function goertzel(buf, freq, from, to) {
  const s = Math.floor(from * SR), e = Math.min(buf.length, Math.floor(to * SR));
  const w = TAU * freq / SR, cw = 2 * Math.cos(w);
  let q1 = 0, q2 = 0;
  for (let i = s; i < e; i++) { const q0 = cw * q1 - q2 + buf[i]; q2 = q1; q1 = q0; }
  return Math.sqrt(Math.max(0, q1 * q1 + q2 * q2 - cw * q1 * q2)) / (e - s);
}
function rms(buf, from, to) {
  const s = Math.floor(from * SR), e = Math.min(buf.length, Math.floor(to * SR));
  let a = 0; for (let i = s; i < e; i++) a += buf[i] * buf[i];
  return Math.sqrt(a / Math.max(1, e - s));
}
// bass-thump meter: windowed Goertzel track of a fundamental; flag cliffs.
function bassCliffs(buf, freq = 65.41) {
  const hop = Math.floor(0.010 * SR), win = Math.floor(0.040 * SR), track = [];
  for (let i = 0; i + win < buf.length; i += hop) track.push(goertzel(buf, freq, i / SR, (i + win) / SR));
  const drops = [];
  for (let i = 3; i + 3 < track.length; i++) {
    const sustained = track[i - 3] > 0.0056 && track[i - 2] > 0.0056 && track[i - 1] > 0.0056 && track[i] > 0.0056;
    if (sustained && track[i + 3] < track[i] / 5.6) drops.push(i * hop / SR);
  }
  return drops;
}

/* meter self-validation: a sustained 65 Hz tone chopped with a 15 ms fade
   (under a 262 Hz masker, like the pad) MUST trip the meter; the same tone
   decayed naturally to silence must not. */
{
  const mk = (chop) => {
    const n = Math.floor(1.2 * SR), b = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let bass = 0.35 * Math.sin(TAU * 65.41 * t) * (chop ? (t < 0.35 ? 1 : 0) : Math.exp(-t * 5));
      if (chop && t > 0.335 && t < 0.35) bass *= 0.5 + 0.5 * Math.cos(Math.PI * (t - 0.335) / 0.015);
      b[i] = bass + 0.3 * Math.sin(TAU * 261.63 * t);
    }
    return b;
  };
  check("meter validation: chopped bass trips the thump meter", bassCliffs(mk(true)).length > 0);
  check("meter validation: ringing bass passes the thump meter", bassCliffs(mk(false)).length === 0);
}
// end-of-buffer truncation: the last 5 ms must be effectively silent
const endLevel = (buf) => rms(buf, buf.length / SR - 0.005, buf.length / SR);
// the rule that actually prevents thumps: fast fades only click on LOW
// frequency content (few cycles inside the fade), so a voice must carry no
// audible energy below 300 Hz just before its terminal fade. Noise sweeps
// (riser, hats) ending in a fade are fine; a loud bass ending in one is not.
function preFadeLevel(buf) {
  const a = 1 - Math.exp(-TAU * 300 / SR);
  let y1 = 0, y2 = 0;
  const low = Float64Array.from(buf, (x) => { y1 += a * (x - y1); y2 += a * (y1 - y2); return y2; });
  return rms(low, low.length / SR - 0.08, low.length / SR - 0.06);
}

/* ---- per-voice hygiene ---- */
{
  const samples = {
    kick: VOICES.vKick(SR), snare: VOICES.vSnare(SR), hat: VOICES.vHat(SR),
    hatOpen: VOICES.vHat(SR, 1, true), bass: VOICES.vBass(SR, 65.41),
    pad: VOICES.vTone(SR, [261.63, 329.63, 392], 2.0, {}),
    pluck: VOICES.vPluck(SR, 440), stab: VOICES.vStab(SR, [261.63, 329.63, 392]),
    riser: VOICES.vRiser(SR),
  };
  for (const [name, b] of Object.entries(samples)) {
    const pf = b.length / SR >= 0.15 ? preFadeLevel(b) : 0; // shorter than the window: endLevel covers it
    check("voice " + name + ": no low-frequency loudness at its fade, silent at end",
      pf < 0.05 && endLevel(b) < 0.003,
      "preFadeLF " + pf.toFixed(4) + " · end " + endLevel(b).toFixed(4));
  }
  // rule validation: a still-loud buffer with a polite fade must FAIL this rule
  const loud = new Float64Array(Math.floor(0.4 * SR));
  for (let i = 0; i < loud.length; i++) loud[i] = 0.3 * Math.sin(TAU * 65.41 * i / SR);
  for (let i = 0; i < 661; i++) loud[loud.length - 1 - i] *= 0.5 - 0.5 * Math.cos(Math.PI * i / 661);
  check("rule validation: faded-but-loud tail is rejected", !(preFadeLevel(loud) < 0.05),
    "preFade " + preFadeLevel(loud).toFixed(3));
}

/* ---- clip hygiene ---- */
// in-context thump canary: only the kickless single-root clip — in polyphonic
// mixes the 65 Hz bin is polluted by kick pitch-sweeps and neighboring roots,
// so voice-level rules above carry the guarantee there.
const HAS_BASS = ["major-vs-minor"];
for (const id of Object.keys(CLIPS)) {
  const b = renderClip(id, SR);
  let bad = false, peak = 0;
  for (const x of b) { if (!isFinite(x)) bad = true; peak = Math.max(peak, Math.abs(x)); }
  const secs = b.length / SR;
  check(id + ": finite, peak ≤ 0.89, 1.5–14 s, audible, clean ending",
    !bad && peak <= 0.891 && secs >= 1.5 && secs <= 14 && rms(b, 0, secs) > 0.02 && endLevel(b) < 0.003,
    "peak " + peak.toFixed(2) + " · " + secs.toFixed(1) + "s · end " + endLevel(b).toFixed(4));
  if (HAS_BASS.includes(id)) {
    const d = bassCliffs(b);
    check(id + ": no bass thumps", d.length === 0, d.slice(0, 3).map((t) => t.toFixed(2) + "s").join(" "));
  }
}

/* ---- content: each demo demonstrates its lesson ---- */
const N = { C2: 65.41, A2: 110.0, C4: 261.63, Eb4: 311.13, E4: 329.63, G4: 392.0 };
{
  const b = renderClip("major-vs-minor", SR);
  const half = b.length / SR / 2;
  check("major-vs-minor: E4 in A, Eb4 in B",
    goertzel(b, N.E4, 0.1, 1.4) > 4 * goertzel(b, N.Eb4, 0.1, 1.4) &&
    goertzel(b, N.Eb4, half + 0.1, half + 1.4) > 4 * goertzel(b, N.E4, half + 0.1, half + 1.4));
}
{
  const b = renderClip("four-on-the-floor", SR), st = 60 / 122 / 4;
  check("four-on-the-floor: kicks on the beat",
    rms(b, 4 * st, 4 * st + 0.05) > 3 * rms(b, 4 * st - 0.06, 4 * st - 0.01));
}
{
  const b = renderClip("hiphop-headnod", SR), st = 60 / 90 / 4;
  check("hiphop: kick on step 6, silence at step 2 window",
    rms(b, 6 * st, 6 * st + 0.04) > 2.5 * rms(b, 2 * st + 0.06, 2 * st + 0.10));
}
{
  const b = renderClip("sidechain-pump", SR);
  const bar = 60 / 122 * 4, bStart = 2 * bar + 0.8 + 0.45;
  // C5 sits between kick harmonics; average the post-kick dip over kicks 2–7
  // so the pad's detune-beating cancels out of the A/B ratio
  let a = 0, bb = 0;
  for (let k = 1; k <= 6; k++) {
    const kt = k * bar / 4;
    a += goertzel(b, 523.25, kt + 0.02, kt + 0.12);
    bb += goertzel(b, 523.25, bStart + kt + 0.02, bStart + kt + 0.12);
  }
  check("sidechain-pump: pad ducks after kicks in B only", bb < a * 0.55,
    "ratio " + (bb / a).toFixed(2));
}
{
  const b = renderClip("filter-sweep", SR);
  const hfEarly = goertzel(b, 2028, 0.2, 0.9), hfMid = goertzel(b, 2028, 1.9, 2.6);
  check("filter-sweep: highs open up mid-clip", hfMid > 3 * hfEarly,
    (hfMid / hfEarly).toFixed(1) + "x");
}
{
  const b = renderClip("levels-ab", SR);
  const half = b.length / SR / 2;
  const bassA = goertzel(b, N.C2, 0.05, 0.4), bassB = goertzel(b, N.C2, half + 0.05, half + 0.4);
  check("levels-ab: bass overwhelming in A, tamed in B", bassA > 2 * bassB,
    (bassA / bassB).toFixed(1) + "x");
}
{
  const b = renderClip("dry-vs-space", SR);
  const half = b.length / SR / 2;
  // the echo tail lives where the dry version has gone quiet (after both stabs)
  check("dry-vs-space: B has a tail where A is silent",
    rms(b, half + 1.35, half + 1.75) > 3 * rms(b, 1.35, 1.55),
    (rms(b, half + 1.35, half + 1.75) / rms(b, 1.35, 1.55)).toFixed(1) + "x");
}
{
  const b = renderClip("pluck-vs-pad", SR);
  // pluck reaches near-peak within 30 ms; pad takes ~0.9 s
  const a0 = rms(b, 0.005, 0.03), aPk = rms(b, 0.03, 0.25);
  const half = b.length / SR - 3.4;
  const p0 = rms(b, half + 0.05, half + 0.2), pPk = rms(b, half + 0.95, half + 1.6);
  check("pluck-vs-pad: fast attack vs slow swell", a0 > 0.4 * aPk && p0 < 0.5 * pPk,
    "pluck " + (a0 / aPk).toFixed(2) + " · pad " + (p0 / pPk).toFixed(2));
}
{
  const b = renderClip("verse-vs-drop", SR), bar = 60 / 118 * 4;
  const lp = (() => { const a = 1 - Math.exp(-TAU * 3000 / SR); let y = 0; return (x) => (y += a * (x - y)); })();
  const hi = Float64Array.from(b, (x) => x - lp(x));
  check("verse-vs-drop: the big scene adds high-band layers",
    rms(hi, bar, 2 * bar) > 3 * rms(hi, 0, bar),
    (rms(hi, bar, 2 * bar) / rms(hi, 0, bar)).toFixed(1) + "x");
}

console.log("\n" + Object.keys(CLIPS).length + " clips, " + fails + " failures");
process.exit(fails ? 1 : 0);
