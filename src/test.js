const E=require('./engine.js');
const tab=s=>s.key;
let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m)}};
// 1. reference guitar shapes: expected shape must be in the first N results
const REF=[['C','x32010',1],['A','x02220',1],['G','320003',1],['E','022100',1],['D','xx0232',1],['F','133211',1],['B','x24442',2],['Bb','x13331',1],
['Am','x02210',1],['Em','022000',1],['Dm','xx0231',1],['Bm','x24432',1],['F#m','244222',1],['Gm','355333',3],['Cm','x35543',3],
['G7','320001',1],['C7','x32310',1],['D7','xx0212',1],['E7','020100',1],['A7','x02020',1],['B7','x21202',1],
['Cmaj7','x32000',1],['Gmaj7','320002',1],['Fmaj7','xx3210',2],['Am7','x02010',1],['Em7','020030',3],['Dm7','xx0211',1],
['Asus4','x02230',2],['Dsus4','xx0233',1],['Dsus2','xx0230',1],['E7#9','x7678x',12],['E7#9','020103',2],['G13','3x345x',8],['Bm7b5','x2323x',5],['C9','x3233x',3],
['C6','x32210',2],['Am6','x02212',2],['Cadd9','x32030',3],['C6/9','x3223x',3],['Gm7','3x333x',4],['Gmaj7','3x443x',8],['G7','3x34xx',16],['Dm7','x535xx',16],['Cmaj7','x324xx',16],['Cdim7','x3424x',3],
['C/G','332010',2],['D/F#','2x0232',3],['Am/G','302210',3],['G/B','x20003',3]];
for(const [name,want,n] of REF){const c=E.parseChord(name);const sh=E.guitarShapes(c.root,c.qual,c.bass).map(tab);const sup=(k)=>k.length===want.length&&[...want].every((ch,j)=>ch==='x'||ch===k[j]);const i=sh.findIndex(sup);ok(i>=0&&i<n,`${name}: want ${want} in top ${n}, got #${i+1} of [${sh.slice(0,6).join(' ')}]`)}
// 2. every chord: shapes exist, contain required tones, only chord tones; piano voicings in range, hands ordered, only chord tones (+9)
let minG=99,minP=99,maxP=0;
for(const g of E.QUAL)for(const q of g.list)for(let r=0;r<12;r++){
  const sh=E.guitarShapes(r,q);minG=Math.min(minG,sh.length);ok(sh.length>0,`no guitar shape ${r} ${q.sym}`);
  const pcs=new Set(q.iv.map(i=>E.mod(r+i)));
  for(const s of sh){ok(s.midis.every(m=>pcs.has(E.mod(m))),`non-chord tone in ${r}${q.sym} ${s.key}`);ok(s.fingers<=4,'fingers')}
  const pv=E.pianoVoicings(r,q);minP=Math.min(minP,pv.length);maxP=Math.max(maxP,pv.length);ok(pv.length>=2,`few piano ${r} ${q.sym}: ${pv.length}`);
  const pcs9=new Set([...pcs,E.mod(r+2)]);
  for(const v of pv){const all=[...v.lh,...v.rh];ok(Math.min(...all)>=48&&Math.max(...all)<=84,`range ${r}${q.sym} ${v.label}`);ok(Math.max(...v.lh)<Math.min(...v.rh),`hands cross ${r}${q.sym} ${v.label}`);
    ok(all.every(m=>pcs9.has(E.mod(m))),`piano non-chord tone ${r}${q.sym} ${v.label} ${all}`);ok(v.rh.at(-1)-v.rh[0]<=14,'span');
    const need=q.iv.filter(i=>[3,4,10,11].includes(i));ok(need.every(i=>all.some(m=>E.mod(m-r)===i)),`missing 3rd/7th ${r}${q.sym} ${v.label}`)}
}
console.log('min guitar shapes',minG,'piano voicings min/max',minP,maxP);
// 3. spelling
const SP={'C#m':'C♯ E G♯','Dbm':'D♭ F♭ A♭','Ab':'A♭ C E♭','G#m':'G♯ B D♯','Caug':'C E G♯','C7#9':'C E G B♭ D♯','Ebm7':'E♭ G♭ B♭ D♭','F#':'F♯ A♯ C♯','Bb7':'B♭ D F A♭','A#m7':'A♯ C♯ E♯ G♯','C#dim7':'C♯ E G B♭','Gm':'G B♭ D','Fmaj7#11':'F A C E B'};
for(const k in SP){const c=E.parseChord(k);ok(c&&E.spell(c.root,c.qual,c.pref).join(' ')===SP[k],`spell ${k}: ${c&&E.spell(c.root,c.qual,c.pref).join(' ')}`)}
ok(E.spell(1,E.findQ('m')).join(' ')==='C♯ E G♯','default C#m');ok(E.spell(8,E.findQ('')).join(' ')==='A♭ C E♭','default Ab');
// 4. parser
const P=[['Am7, GMaj7, F major, a minor','Am7 Gmaj7 F Am'],['A minor 7 | D7 | G maj7 | %','Am7 D7 Gmaj7 Gmaj7'],['CM7 Cm7 C-7 CΔ C^7 Cø C°7 Co C+ C7+ Caug7','Cmaj7 Cm7 Cm7 Cmaj7 Cmaj7 Cm7♭5 Cdim7 Cdim C aug C7♯5 C7♯5'.replace('C aug','Caug')],
['Bb6/9 F#m7b5 Dsus D7sus G9sus4 C2 Eb(add9) AmM7 Dm/C C/E','B♭6/9 F♯m7♭5 Dsus4 D7sus4 G11 Csus2 E♭add9 Am(maj7) Dm/C C/E'],['Am - G - F x2','Am G F'],['bb7 eb ab','B♭7 E♭ A♭'],['C dim7 G sus4 D add9','Cdim7 Gsus4 Dadd9']];
for(const [inp,want] of P){const r=E.parseProg(inp);const got=r.chords.map(c=>{const n=E.chordName(c);return n.root+n.sym+(n.bass?'/'+n.bass:'')}).join(' ');ok(got===want&&!r.bad.length,`parse "${inp}" -> "${got}" bad=[${r.bad}]`)}
ok(E.parseProg('Am7 Xyz H7').bad.join()==='Xyz,H7','bad tokens');
// 5. labels
ok(E.toneOf(E.findQ('7♯9'),3).lab==='♯9'&&E.toneOf(E.findQ('7♯9'),3).role==='color','♯9 label');ok(E.toneOf(E.findQ('13'),9).lab==='13','13 label');ok(E.toneOf(E.findQ('dim7'),9).role==='guide','dim7 guide');
console.log(fail?fail+' FAILURES':'ALL PASS');
if(process.argv[2])for(const name of process.argv.slice(2)){const c=E.parseChord(name);console.log(name,'G:',E.guitarShapes(c.root,c.qual,c.bass).map(s=>s.key+'('+s.score.toFixed(1)+')').join(' '));for(const v of E.pianoVoicings(c.root,c.qual,c.bass))console.log('   ',v.label.padEnd(34),v.lh.join(','),'|',v.rh.join(','))}
