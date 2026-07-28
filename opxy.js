/* =================================================================
   opxy.js — shared runtime for every page of the course.
   Extracted from the original single-file build; vanilla JS, no deps.
================================================================= */
/* =================================================================
   helpers — chips, svg components
================================================================= */
const $ = (s,el=document)=>el.querySelector(s);
const ORANGE="#FF4D00", INK="#0d0d0d", LINE="#e5e5e5", MID="#8a8a8e", KEY="#2a2a2e";

function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;")}

/* ---- chip parser: tokens in [brackets] ---- */
function chips(text){
  return text.replace(/\[([^\]]+)\]/g,(m,t)=>{
    const lower=t.toLowerCase();
    if(/^m[1-4]$/.test(lower)) return `<span class="k km">${t.slice(1)}</span><span class="encname"> (${t.toUpperCase()})</span>`;
    if(/^track [1-8]$/.test(lower)) return `<span class="k ktr">${t.split(" ")[1]}</span><span class="encname"> (track ${t.split(" ")[1]})</span>`;
    if(/^step /.test(lower)) return `<span class="k kw">step ${t.split(" ")[1]}</span>`;
    if(/^acc /.test(lower)) return `<span class="k kacc">${t.split(" ")[1]}</span>`;
    if(/^key /.test(lower)) return `<span class="k kw">${t.split(" ").slice(1).join(" ")}</span>`;
    if(lower==="record") return `<span class="k krec">record</span>`;
    if(lower==="play") return `<span class="k kplay">play</span>`;
    if(lower==="stop") return `<span class="k kstop">stop</span>`;
    if(lower==="enc dark") return `<span class="enc dark"></span><span class="encname">dark&nbsp;gray</span>`;
    if(lower==="enc mid") return `<span class="enc mid"></span><span class="encname">mid&nbsp;gray</span>`;
    if(lower==="enc light") return `<span class="enc light"></span><span class="encname">light&nbsp;gray</span>`;
    if(lower==="enc white") return `<span class="enc white"></span><span class="encname">white</span>`;
    return `<span class="k">${esc(t)}</span>`;
  });
}

/* ---- 16-step sequencer grid ----
   rows: [{label,key,steps:[..], ghost:[..]}]  steps=press now(orange), ghost=already placed(dark) */
function seqGrid(rows, nsteps=16, caption=""){
  const cell=30, gap=5, grp=10, lw=120;
  const W = lw + nsteps*(cell+gap) + Math.floor((nsteps-1)/4)*grp + 10;
  const rowH = cell+16;
  const H = 26 + rows.length*rowH;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:${W}px">`;
  // step numbers
  for(let i=0;i<nsteps;i++){
    const x = lw + i*(cell+gap) + Math.floor(i/4)*grp;
    const beat = i%4===0;
    s+=`<text x="${x+cell/2}" y="14" font-size="10" font-weight="${beat?700:400}" fill="${beat?INK:MID}" text-anchor="middle" font-family="Helvetica,Arial">${i+1}</text>`;
  }
  rows.forEach((r,ri)=>{
    const y = 24 + ri*rowH;
    s+=`<text x="0" y="${y+cell/2+4}" font-size="12" font-weight="600" fill="${INK}" font-family="Helvetica,Arial">${esc(r.label)}</text>`;
    if(r.key) s+=`<text x="0" y="${y+cell/2+16}" font-size="9.5" fill="${MID}" font-family="Helvetica,Arial">key: ${esc(r.key)}</text>`;
    for(let i=0;i<nsteps;i++){
      const x = lw + i*(cell+gap) + Math.floor(i/4)*grp;
      const on = (r.steps||[]).includes(i+1);
      const gh = (r.ghost||[]).includes(i+1);
      const fill = on?ORANGE:(gh?KEY:"#ffffff");
      const stroke = on?ORANGE:(gh?KEY:"#cfcfcf");
      s+=`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
      if(on) s+=`<circle cx="${x+cell/2}" cy="${y+cell/2}" r="4" fill="#fff"/>`;
      if(gh) s+=`<circle cx="${x+cell/2}" cy="${y+cell/2}" r="4" fill="#9a9aa0"/>`;
      if(r.txt && r.txt[i+1]) s+=`<text x="${x+cell/2}" y="${y+cell/2+3.5}" font-size="9" fill="${on?'#fff':INK}" font-weight="700" text-anchor="middle" font-family="Helvetica,Arial">${r.txt[i+1]}</text>`;
    }
  });
  s+="</svg>";
  if(caption) s+=`<div class="vizcap">${chips(caption)}</div>`;
  return `<div class="viz">${s}</div>`;
}

/* ---- 24-key keyboard, runs F..E F..E like the real device ----
   hl: {"C1":"C","E1":"E","G2":"G"} note→label (orange). drum:{"F1":"kick",...}
   accNums: show 1-0 labels on accidentals */
function kbSVG(opts={}){
  const naturals=["F","G","A","B","C","D","E"];
  const accAfter={F:true,G:true,A:true,B:false,C:true,D:true,E:false};
  const nw=44, nh=84, ah=50, aw=30;
  const keys=[]; // naturals across 2 octaves
  let accCount=0;
  const W=14*nw+2, H=nh+30;
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:${W}px">`;
  // naturals
  for(let o=1;o<=2;o++){
    naturals.forEach((n,i)=>{
      const idx=(o-1)*7+i, x=idx*nw;
      const id=n+o;
      const hl = opts.hl && opts.hl[id];
      const fillN = hl ? (opts.plain ? "#fafafa" : ORANGE) : "#fafafa";
      const strokeN = hl && !opts.plain ? ORANGE : "#c9c9c9";
      s+=`<rect x="${x}" y="0" width="${nw-3}" height="${nh}" rx="6" fill="${fillN}" stroke="${strokeN}" stroke-width="1.5"/>`;
      s+=`<text x="${x+(nw-3)/2}" y="${nh-10}" font-size="11" text-anchor="middle" font-weight="${hl?700:400}" fill="${hl?(opts.plain?INK:"#fff"):MID}" font-family="Helvetica,Arial">${n}</text>`;
      if(hl && hl!==true && hl!==n) s+=`<text x="${x+(nw-3)/2}" y="${nh+16}" font-size="10.5" font-weight="700" text-anchor="middle" fill="${opts.plain?INK:ORANGE}" font-family="Helvetica,Arial">${esc(String(hl))}</text>`;
    });
  }
  // accidentals
  for(let o=1;o<=2;o++){
    naturals.forEach((n,i)=>{
      if(!accAfter[n]) return;
      accCount++;
      const idx=(o-1)*7+i, x=idx*nw + nw - 3 - aw/2 + 1.5;
      const id=n+"#"+o;
      const hl = opts.hl && opts.hl[id];
      s+=`<rect x="${x}" y="-1" width="${aw}" height="${ah}" rx="5" fill="${hl?ORANGE:"#1d1d20"}" stroke="${hl?ORANGE:"#1d1d20"}"/>`;
      const lab = opts.accNums ? (accCount%10) : (hl&&hl!==true?hl:"");
      const num = accCount%10===0?"0":String(accCount%10);
      if(opts.accNums) s+=`<text x="${x+aw/2}" y="${ah-8}" font-size="9.5" text-anchor="middle" fill="#bbb" font-family="Helvetica,Arial">${num}</text>`;
      if(hl && hl!==true) s+=`<text x="${x+aw/2}" y="${ah-8}" font-size="9.5" font-weight="700" text-anchor="middle" fill="#fff" font-family="Helvetica,Arial">${esc(String(hl))}</text>`;
    });
  }
  s+="</svg>";
  let cap = opts.caption?`<div class="vizcap">${chips(opts.caption)}</div>`:"";
  return `<div class="viz">${s}${cap}</div>`;
}

/* ---- ADSR envelope ---- */
function adsr(a,d,su,r,label,note){
  const W=220,H=128,p=16, base=H-44, top=16;
  const span=W-2*p;
  const ax=p+span*a*0.25, dx=ax+span*d*0.25, sx=p+span*0.62, rx=Math.min(W-p, sx+span*r*0.3);
  const sy= top+(base-top)*(1-su);
  const path=`M ${p} ${base} L ${ax} ${top} L ${dx} ${sy} L ${sx} ${sy} L ${rx} ${base}`;
  return `<div style="display:inline-block;margin:0 14px 10px 0;vertical-align:top">
  <svg viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="10" fill="#fff" stroke="${LINE}"/>
    <path d="${path}" fill="none" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M ${p} ${base} L ${W-p} ${base}" stroke="${LINE}" stroke-width="1"/>
    <text x="${p}" y="${H-24}" font-size="11.5" font-weight="700" fill="${INK}" font-family="Helvetica,Arial">${esc(label)}</text>
    <text x="${p}" y="${H-10}" font-size="9.5" fill="${MID}" font-family="Helvetica,Arial">${esc(note||"")}</text>
  </svg></div>`;
}

/* ---- scene blocks diagram ---- */
function scenesViz(scenes, tracks, caption){
  const cw=104, ch=20, lw=86, gap=8;
  const W=lw+scenes.length*(cw+gap), H=34+tracks.length*(ch+5);
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:${W}px">`;
  scenes.forEach((sc,si)=>{
    const x=lw+si*(cw+gap);
    s+=`<text x="${x+cw/2}" y="13" font-size="11" font-weight="700" text-anchor="middle" fill="${INK}" font-family="Helvetica,Arial">${esc(sc.name)}</text>`;
  });
  tracks.forEach((tr,ti)=>{
    const y=24+ti*(ch+5);
    s+=`<text x="0" y="${y+ch-6}" font-size="10.5" fill="${MID}" font-family="Helvetica,Arial">${esc(tr)}</text>`;
    scenes.forEach((sc,si)=>{
      const x=lw+si*(cw+gap);
      const on=sc.on.includes(ti);
      s+=`<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="5" fill="${on?ORANGE:"#f0f0f0"}" opacity="${on?(sc.dim&&sc.dim.includes(ti)?0.45:1):1}"/>`;
    });
  });
  s+="</svg>";
  return `<div class="viz">${s}${caption?`<div class="vizcap">${chips(caption)}</div>`:""}</div>`;
}

/* ---- energy curve ---- */
function energyViz(pts,labels,caption){
  const W=560,H=120,p=30;
  const xs=i=>p+(W-2*p)*i/(pts.length-1), ys=v=>H-26-(H-58)*v;
  let path="M "+pts.map((v,i)=>`${xs(i)} ${ys(v)}`).join(" L ");
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:${W}px">
    <path d="${path}" fill="none" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M ${p} ${H-26} L ${W-p} ${H-26}" stroke="${LINE}"/>`;
  pts.forEach((v,i)=>{ s+=`<circle cx="${xs(i)}" cy="${ys(v)}" r="4" fill="${ORANGE}"/>`;
    if(labels[i]) s+=`<text x="${xs(i)}" y="${H-10}" font-size="10" text-anchor="middle" fill="${MID}" font-family="Helvetica,Arial">${labels[i]}</text>`;});
  s+="</svg>";
  return `<div class="viz">${s}${caption?`<div class="vizcap">${chips(caption)}</div>`:""}</div>`;
}

/* ---- mixer levels ---- */
function mixerViz(items,caption){
  const bw=52,gap=18,H=150,W=items.length*(bw+gap);
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:${W}px">`;
  items.forEach((it,i)=>{
    const x=i*(bw+gap), bh=(H-44)*it.v, y=H-30-bh;
    s+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="6" fill="${it.c||KEY}"/>
        <text x="${x+bw/2}" y="${H-14}" font-size="10.5" text-anchor="middle" fill="${MID}" font-family="Helvetica,Arial">${esc(it.l)}</text>`;
    if(it.pan!==undefined){
      s+=`<line x1="${x+8}" y1="${y-9}" x2="${x+bw-8}" y2="${y-9}" stroke="${LINE}" stroke-width="2"/>
          <circle cx="${x+bw/2+it.pan*(bw/2-10)}" cy="${y-9}" r="4" fill="${ORANGE}"/>`;
    }
  });
  s+="</svg>";
  return `<div class="viz">${s}${caption?`<div class="vizcap">${chips(caption)}</div>`:""}</div>`;
}

/* =================================================================
   device map — schematic of the OP-XY top panel, 14 official zones
================================================================= */
function badge(s,x,y,n){return s+`<circle cx="${x}" cy="${y}" r="13" fill="${ORANGE}"/><text x="${x}" y="${y+4.5}" font-size="13" font-weight="700" fill="#fff" text-anchor="middle" font-family="Helvetica,Arial">${n}</text>`}

function deviceMap(){
  const u=74, k=62, W=17*u+60, H=420, ox=30, oy=14;
  const cx=i=>ox+i*u, kk=(s,c,r,o={})=>{ // key at col c row-y r
    return s+`<rect x="${cx(c)+(o.dx||0)}" y="${r}" width="${o.w||k}" height="${o.h||k}" rx="${o.rx||12}" fill="${o.fill||"#26262a"}" stroke="#000" stroke-width="0.5"/>`;
  };
  const lab=(s,c,r,t,o={})=>s+`<text x="${cx(c)+(o.dx||k/2)}" y="${r}" font-size="${o.fs||11}" font-weight="${o.fw||600}" fill="${o.fill||"#d7d7d9"}" text-anchor="middle" font-family="Helvetica,Arial">${t}</text>`;
  const R1=oy+18, R2=oy+118, R3=oy+196, R4=oy+274, R5=oy+340;
  let s=`<svg viewBox="0 0 ${W} ${H+40}" xmlns="http://www.w3.org/2000/svg">`;
  s+=`<rect x="6" y="${oy-8}" width="${W-12}" height="${H}" rx="22" fill="#1b1b1e"/>`;

  /* row 1: speaker, volume, projects, tempo, screen, encoders, sample */
  for(let r=0;r<6;r++)for(let c=0;c<7;c++) s+=`<circle cx="${cx(0)+10+c*9}" cy="${R1+8+r*9}" r="2.6" fill="#0c0c0d"/>`; // speaker
  s+=`<circle cx="${cx(1)+k-8}" cy="${R1+30}" r="22" fill="#222226" stroke="#000"/><circle cx="${cx(1)+k-8}" cy="${R1+30}" r="3" fill="#9a9aa0"/>`; // volume
  s=kk(s,2,R1,{}); s=lab(s,2,R1+36,"projects",{fs:9.5});
  s=kk(s,3,R1,{}); s=lab(s,3,R1+36,"tempo",{fs:9.5});
  s+=`<rect x="${cx(4)}" y="${R1-4}" width="${4*u-12}" height="${k+10}" rx="6" fill="#e9e9e6" stroke="#000"/>`; // screen
  s+=`<rect x="${cx(4)+14}" y="${R1+10}" width="${4*u-40}" height="${k-22}" fill="none" stroke="#bdbdb8"/>`;
  s=lab(s,5,R1+34,"screen",{fill:"#8a8a85",dx:u-6,fs:11});
  const encCols=[8.5,10.5,12.5,14.5], encFill=["#3b3b41","#77777d","#b9b9bd","#f4f4f4"];
  encCols.forEach((c,i)=>{ s+=`<circle cx="${cx(c)}" cy="${R1+30}" r="26" fill="${encFill[i]}" stroke="#000"/><circle cx="${cx(c)}" cy="${R1+14}" r="3" fill="${i>1?"#555":"#ddd"}"/>`;});
  s=kk(s,16,R1,{rx:31}); s=lab(s,16,R1+36,"sample",{fs:9});

  /* row 2: modes, M1-4, tracks 1-8, com+players right col */
  const modes=["instr","aux","arrange","mix"];
  modes.forEach((m,i)=>{ s=kk(s,i,R2); s=lab(s,i,R2+36,m,{fs:9.5}); });
  for(let i=0;i<4;i++){ s=kk(s,4+i,R2,{rx:31,fill:"#2e2e33"}); s=lab(s,4+i,R2+38,String(i+1),{fs:14,fill:"#eee"}); }
  const auxlab=["brain","fx","midi","cv","ext","tape","fx i","fx ii"];
  for(let i=0;i<8;i++){ s=kk(s,8+i,R2,{rx:31,fill:"#2e2e33"}); s=lab(s,8+i,R2+32,String(i+1),{fs:13,fill:"#eee"}); s=lab(s,8+i,R2+46,auxlab[i],{fs:7.5,fill:"#86868c"}); }
  s=kk(s,16,R2,{h:28,rx:8}); s=lab(s,16,R2+18,"com",{fs:9});
  s=kk(s,16,R2+34,{h:28,rx:8}); s=lab(s,16,R2+52,"players",{fs:8});

  /* row 3: sequencer + bar */
  for(let i=0;i<16;i++){
    const shade = 38+Math.round(i*9.5);
    s=kk(s,i,R3,{rx:31,fill:`rgb(${shade},${shade},${shade+4})`});
    s+=`<circle cx="${cx(i)+k/2}" cy="${R3+14}" r="2.5" fill="${i<2?ORANGE:"#0e0e10"}"/>`;
    s=lab(s,i,R3+40,String(i+1),{fs:10,fill:i>9?"#333":"#bbb"});
  }
  s=kk(s,16,R3,{rx:31}); s=lab(s,16,R3+30,"1–4",{fs:8.5}); s=lab(s,16,R3+42,"bar",{fs:9.5});

  /* row 4: record/play/stop + accidentals  ----  row 5: -/+/shift + naturals */
  s=kk(s,0,R4,{h:54}); s+=`<circle cx="${cx(0)+k/2}" cy="${R4+27}" r="8" fill="${ORANGE}"/>`;
  s=kk(s,1,R4,{h:54}); s+=`<polygon points="${cx(1)+25},${R4+19} ${cx(1)+25},${R4+35} ${cx(1)+39},${R4+27}" fill="#d7d7d9"/>`;
  s=kk(s,2,R4,{h:54}); s=lab(s,2,R4+32,"■",{fs:12});
  // accidentals: offsets after naturals F G A _ C D _ — natural cols 3..16
  const accPat=[0,1,2,4,5]; let accN=0;
  for(let o=0;o<2;o++) accPat.forEach(p=>{ accN++;
    const c=3+o*7+p; const x=cx(c)+k-18;
    s+=`<rect x="${x}" y="${R4}" width="40" height="54" rx="9" fill="#161618" stroke="#000"/>`;
    s+=`<text x="${x+20}" y="${R4+32}" font-size="11" fill="#cfcfcf" text-anchor="middle" font-family="Helvetica,Arial">${accN%10}</text>`;
  });
  s=kk(s,0,R5,{h:54,fill:"#222226"}); s=lab(s,0,R5+32,"−",{fs:15});
  s=kk(s,1,R5,{h:54,fill:"#222226"}); s=lab(s,1,R5+32,"+",{fs:15});
  s=kk(s,2,R5,{h:54,fill:"#222226"}); s=lab(s,2,R5+32,"shift",{fs:10});
  const nat=["F","G","A","B","C","D","E"];
  for(let o=0;o<2;o++) nat.forEach((n,i)=>{ const c=3+o*7+i;
    s=kk(s,c,R5,{h:54,fill:"#2c2c30"});
    s=lab(s,c,R5+34,n,{fs:11,fill:"#9d9da3"});
  });

  /* badges */
  s=badge(s,cx(1)+k/2,R2-16,1);            // main modes
  s=badge(s,cx(5)+u-8,R2-16,2);            // modules
  s=badge(s,cx(11)+u-8,R2-16,3);           // tracks
  s=badge(s,cx(7)+k/2,R3-14,4);            // sequencer
  s=badge(s,cx(1)+k/2,R4+70,5);            // transport (under, spans both rows)
  s=badge(s,cx(9)+k/2,R5+70,6);            // keyboard
  s=badge(s,cx(16)+k/2,R1-14,7);           // sample
  s=badge(s,cx(2)+k/2,R1-14,8);            // projects
  s=badge(s,cx(3)+k/2,R1-14,9);            // tempo
  s=badge(s,cx(16)+k+18,R2+14,10);         // com
  s=badge(s,cx(16)+k+18,R2+48,11);         // players
  s=badge(s,cx(16)+k/2,R3-14,12);          // bar
  s=badge(s,cx(1)+k-8,R1-14,13);           // volume
  s=badge(s,cx(10.5),R1-14,14);            // encoders
  s+="</svg>";
  return s;
}

const LEGEND=[
 [1,"main modes","instrument · auxiliary · arrange · mix — the four 'rooms' of the device. you'll live in these."],
 [2,"modules M1–M4","four buttons under the screen. in instrument mode: M1 engine, M2 envelopes, M3 filter, M4 LFO."],
 [3,"track buttons 1–8","select which track you're editing. lit red = selected. small icons = their auxiliary-mode jobs."],
 [4,"step sequencer","16 steps = one bar. the musical grid you place sounds onto. the heart of OP–XY."],
 [5,"transport","record, play, stop — plus − / + (octave down/up) and shift (sub-functions everywhere)."],
 [6,"keyboard","two octaves, F to E. naturals carry the step-component icons; accidentals are numbered 1–0."],
 [7,"sample","press from anywhere to record a sample (max 20 s) into the device."],
 [8,"projects","view, create and save projects. hold M1 in here to make a new project."],
 [9,"tempo","bpm, swing and metronome."],
 [10,"com","system settings, wireless, outputs, connecting to a computer."],
 [11,"players","note effects — arpeggios, chord helpers, hold."],
 [12,"bar","extend sequences, track scale, quantize, groove, smoothing. hold it + something."],
 [13,"volume","rotate for level. beside the speaker."],
 [14,"encoders","dark gray → mid gray → light gray → white. the screen always shows what they do right now."]
];


/* ---- nesting viz: note → pattern → scene → song ---- */
function nestViz(){
  const W=900,H=120;
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:${W}px">`;
  const box=(x,w,t,sub,fill)=>{
    s+=`<rect x="${x}" y="18" width="${w}" height="70" rx="10" fill="${fill}" stroke="${LINE}"/>
        <text x="${x+w/2}" y="44" font-size="13" font-weight="700" text-anchor="middle" fill="${INK}" font-family="Helvetica,Arial">${t}</text>
        <text x="${x+w/2}" y="62" font-size="10.5" text-anchor="middle" fill="${MID}" font-family="Helvetica,Arial">${sub}</text>`;
  };
  box(0,150,"note","one key, one step","#fff");
  box(190,170,"pattern","up to 4 bars on 1 track","#fff");
  box(400,170,"scene","8 patterns playing together","#fff");
  box(610,150,"song","scenes in order","#fff");
  box(800,100,"project","the file","#f4f4f4");
  [165,375,585,775].forEach(x=>{s+=`<path d="M ${x} 53 l 16 0 m -6 -6 l 6 6 l -6 6" stroke="${ORANGE}" stroke-width="2.5" fill="none"/>`});
  return s+"</svg>";
}

const VOCAB=[
 ["instrument mode","where the 8 instrument tracks live: drum kits, samplers and synth engines. press [instrument] to get here."],
 ["pattern","a sequence on one track (up to 9 per track). made in the step sequencer, managed in arrange mode."],
 ["scene","one pattern choice + mutes + levels for all 8 tracks. scenes become your song sections (99 available)."],
 ["song","scenes chained in order, in arrange mode's song view."],
 ["module (M1–M4)","sub-pages of a mode. instrument mode: M1 engine · M2 envelopes · M3 filter · M4 LFO."],
 ["parameter lock","hold a step + turn an encoder → only that step gets the new value. instant variation."],
 ["step component","per-step trick on the natural keys: repeats, holds, ramps, jumps… hold [shift] + step, then a natural key."],
 ["track scale","how much time one step covers (set per track: hold [bar] + accidental). scale 4 → one step = one beat."]
];

const ROADMAP=[
 ["Week 1","Rhythm I","the grid, first beats"],["Week 2","Rhythm II","groove, fills, feel"],
 ["Week 3","Harmony I","chords on the grid"],["Week 4","Harmony II","bass + chord rhythm"],
 ["Week 5","Melody","pentatonic, call & response"],["Week 6","First sketch","90 seconds of music"],
 ["Week 7","Synthesis I","engines & envelopes"],["Week 8","Synthesis II","filters, LFO, sampling"],
 ["Week 9","Arrangement I","scenes & transitions"],["Week 10","Arrangement II","song mode, performing"],
 ["Week 11","Mixing","levels, pan, sends"],["Week 12","Final project","finish one real track"]
];

const KICK={label:"kick",key:"low F"}, SNARE={label:"snare",key:"G"}, HAT={label:"hi-hat",key:"C#"};

/* =================================================================
   course rendering — one week per page
================================================================= */
const TOTAL=26;
function renderWeek(wk, startIdx, weekIndex){
  const host=$("#course");
  let idx=startIdx;
  let html=`<section class="block"><div class="wrap">
      <div class="weekhead"><span class="wno">${wk.n}</span><h2>${wk.title}</h2></div>
      <p class="weekgoal">${chips(wk.goal)}</p>`;
  wk.sessions.forEach(se=>{
    html+=`<details class="session" data-idx="${idx}" ${idx===startIdx?"open":""}>
        <summary>
          <span class="done-toggle" data-done="${idx}" title="mark done"></span>
          <span class="sno">${idx}</span>
          <span><span class="stitle">${se.t}</span><span class="ssub">${se.sub}</span></span>
          <span class="chev">›</span>
        </summary>
        <div class="sbody">
          ${se.warm?`<div class="warm"><b>Warm-up · 2 min</b><span>${chips(se.warm)}</span></div>`:""}
          <div class="goal"><b>Goal</b><span>${chips(se.goal)}</span></div>
          ${se.story?`<aside class="story"><b>Liner notes — ${se.story.t}</b><p>${chips(se.story.x)}</p></aside>`:""}
          <ol class="steps">${se.steps.map(st=>`
            <li>
              <div class="do">${chips(st.do)}</div>
              ${st.why?`<div class="why">${chips(st.why)}</div>`:""}
              ${st.viz||""}
              ${st.listen?`<div class="listen">${chips(st.listen)}</div>`:""}
            </li>`).join("")}
          </ol>
          <div class="sfoot">
            <div class="fcell assign"><b>Assignment</b><span>${chips(se.assign)}</span></div>
            <div class="fcell ready"><b>Ready to move on when</b><span>${chips(se.ready)}</span></div>
            <div class="fcell fix"><b>If it sounds wrong</b><span>${chips(se.fix)}</span></div>
            ${se.challenge?`<div class="fcell challenge"><b>Go further</b><span>${chips(se.challenge)}</span></div>`:""}
          </div>
          ${se.remember?`<div class="remember">${chips(se.remember)}</div>`:""}
        </div>
      </details>`;
    idx++;
  });
  if(wk.quiz){
    html+=`<div class="noteslabel">${wk.n} — Quick recall · answer out loud, then click to check</div>`
      + wk.quiz.map(qa=>`<details class="quiz"><summary>${chips(qa[0])}</summary><div class="qa">${chips(qa[1])}</div></details>`).join("");
  }
  html+=`<div class="noteslabel">${wk.n} — Practice notes (saved in this browser)</div>
    <textarea class="notesbox" data-notes="w${weekIndex}" placeholder="What worked · what sounded wrong · next action"></textarea>
  </div></section>`;
  host.innerHTML=html;
}

/* =================================================================
   progress + notes (localStorage, fails silently on restricted setups)
   Keys are unchanged from the single-page build: opxy.done.0–25 and
   opxy.notes.w0–w12 — existing saved progress carries over.
================================================================= */
const store={
  get(k){ try{return localStorage.getItem("opxy."+k)}catch(e){return null} },
  set(k,v){ try{localStorage.setItem("opxy."+k,v)}catch(e){} }
};
function refreshProgress(){
  let done=0;
  for(let i=0;i<TOTAL;i++) if(store.get("done."+i)==="1") done++;
  document.querySelectorAll(".done-toggle").forEach(t=>{
    const on=store.get("done."+t.dataset.done)==="1";
    t.classList.toggle("on",on);
    const d=t.closest("details"); if(d) d.classList.toggle("isdone",on);
  });
  const pt=$("#progressTxt"), pb=$("#progressBar i");
  if(pt) pt.textContent=`${done} / ${TOTAL}`;
  if(pb) pb.style.width=(100*done/TOTAL)+"%";
  return done;
}
document.addEventListener("click",e=>{
  const t=e.target.closest(".done-toggle");
  if(!t)return;
  e.preventDefault(); e.stopPropagation();
  const k="done."+t.dataset.done;
  store.set(k, store.get(k)==="1"?"0":"1");
  refreshProgress();
});
function initPage(){
  document.querySelectorAll(".notesbox").forEach(n=>{
    n.value=store.get("notes."+n.dataset.notes)||"";
    n.addEventListener("input",()=>store.set("notes."+n.dataset.notes,n.value));
  });
  refreshProgress();
  sentenceCase();
}

/* =================================================================
   sentence case — capitalize rendered prose naturally.
   skips device chips (.k), encoder dots, svg diagrams and textareas,
   so hardware labels stay lowercase like on the real panel.
================================================================= */
function sentenceCase(){
  const seen=new WeakSet();
  const SKIP=".k,.enc,.encname";
  const blocks=document.querySelectorAll(
    "nav .links a, .kicker, header.hero h1, header.hero .sub, header.hero .meta,"+
    "section.block h2, section.block h3, .lede, .card h4, .card p, .card li,"+
    ".maplegend .li, .roadmap .wk, .weekgoal, .stitle, .ssub,"+
    ".goal>span, aside.story b, aside.story p, .warm span,"+
    "ol.steps .do, ol.steps .why, ol.steps .listen, .fcell>span, .remember,"+
    "details.quiz summary, details.quiz .qa, .noteslabel,"+
    ".cheat .row .what, .rules li, #encleg p, #encleg span,"+
    "table.t th, table.t td, .vizcap, #chapters a");
  const ABBR=/(?:^|\s)(?:e\.g\.|i\.e\.|vs\.|etc\.|cf\.)$/i;
  blocks.forEach(block=>{
    let cap=true, started=false, pending=false, recent="";
    const walker=document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {acceptNode(n){
      const pe=n.parentElement;
      if(pe && pe.closest("svg,textarea,.badge")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    let node;
    while(node=walker.nextNode()){
      if(seen.has(node)) continue; seen.add(node);
      const pe=node.parentElement;
      if(pe && pe.closest(SKIP)){ started=true; cap=false; pending=false; continue; } // chip = a word, never modified
      const chars=[...node.nodeValue]; let changed=false;
      for(let i=0;i<chars.length;i++){
        const ch=chars[i];
        if(!started && !/\s/.test(ch)){
          started=true;
          if(!/[a-zà-öø-ÿ]/.test(ch)) cap=false;  // block starts with digit/symbol/chip → no cap
        }
        if(/[a-zà-öø-ÿ]/.test(ch)&&cap){ chars[i]=ch.toUpperCase(); changed=true; cap=false; pending=false; }
        else if(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(ch)){ cap=false; pending=false; }
        recent=(recent+ch).slice(-14);
        if(/[.!?]/.test(ch)) pending=true;
        else if(/\s/.test(ch)){ if(pending && !ABBR.test(recent.slice(0,-1).trimEnd())){ cap=true; } pending=false; }
      }
      if(changed) node.nodeValue=chars.join("");
    }
  });
}
