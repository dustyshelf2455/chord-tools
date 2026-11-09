// Chord engine: qualities, spelling, parser, guitar shape generator, piano voicings.
const SHARP=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const FLAT =['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
const LETTERS=['C','D','E','F','G','A','B'], NAT=[0,2,4,5,7,9,11];
// Scale degree each interval is spelled on (♯5 stays on the 5th letter, ♯9 on the 2nd).
const DEG={0:1,2:2,3:3,4:3,5:4,6:5,7:5,8:5,9:6,10:7,11:7,13:2,14:2,15:2,17:4,18:4,21:6};
const IVNAME={0:'R',2:'2',3:'♭3',4:'3',5:'4',6:'♭5',7:'5',8:'♯5',9:'6',10:'♭7',11:'7',13:'♭9',14:'9',15:'♯9',17:'11',18:'♯11',21:'13'};
const GENERIC={0:'R',1:'♭9',2:'9',3:'♭3',4:'3',5:'4',6:'♭5',7:'5',8:'♯5',9:'6',10:'♭7',11:'7'};
const mod=n=>((n%12)+12)%12;

// iv: semitones above the root (extensions above 12). opt: tones a guitar shape may leave out.
const QUAL=[
 {g:'Triads',list:[
  {sym:'',name:'Major',iv:[0,4,7],opt:[]},
  {sym:'m',name:'Minor',iv:[0,3,7],opt:[]},
  {sym:'5',name:'Power chord',iv:[0,7],opt:[]},
  {sym:'sus2',name:'Suspended 2nd',iv:[0,2,7],opt:[]},
  {sym:'sus4',name:'Suspended 4th',iv:[0,5,7],opt:[]},
  {sym:'dim',name:'Diminished',iv:[0,3,6],opt:[]},
  {sym:'aug',name:'Augmented',iv:[0,4,8],opt:[]},
 ]},
 {g:'Sixths & sevenths',list:[
  {sym:'6',name:'Major 6th',iv:[0,4,7,9],opt:[7]},
  {sym:'m6',name:'Minor 6th',iv:[0,3,7,9],opt:[7]},
  {sym:'7',name:'Dominant 7th',iv:[0,4,7,10],opt:[7]},
  {sym:'maj7',name:'Major 7th',iv:[0,4,7,11],opt:[7]},
  {sym:'m7',name:'Minor 7th',iv:[0,3,7,10],opt:[7]},
  {sym:'m(maj7)',name:'Minor-major 7th',iv:[0,3,7,11],opt:[7]},
  {sym:'m7♭5',name:'Half-diminished',iv:[0,3,6,10],opt:[]},
  {sym:'dim7',name:'Diminished 7th',iv:[0,3,6,9],opt:[],deg:{9:7},lab:{9:'°7'},guide:[9]},
  {sym:'7sus4',name:'Dominant 7th sus4',iv:[0,5,7,10],opt:[7]},
 ]},
 {g:'Extended',list:[
  {sym:'add9',name:'Add 9',iv:[0,4,7,14],opt:[7]},
  {sym:'madd9',name:'Minor add 9',iv:[0,3,7,14],opt:[7]},
  {sym:'6/9',name:'Six-nine',iv:[0,4,7,9,14],opt:[7]},
  {sym:'9',name:'Dominant 9th',iv:[0,4,7,10,14],opt:[7]},
  {sym:'maj9',name:'Major 9th',iv:[0,4,7,11,14],opt:[7]},
  {sym:'m9',name:'Minor 9th',iv:[0,3,7,10,14],opt:[7]},
  {sym:'11',name:'Dominant 11th (9sus4)',iv:[0,7,10,14,17],opt:[7,14]},
  {sym:'m11',name:'Minor 11th',iv:[0,3,7,10,14,17],opt:[7,14]},
  {sym:'13',name:'Dominant 13th',iv:[0,4,7,10,14,21],opt:[7,14]},
 ]},
 {g:'Altered',list:[
  {sym:'7♭5',name:'Dominant 7th flat 5',iv:[0,4,6,10],opt:[]},
  {sym:'7♯5',name:'Dominant 7th sharp 5',iv:[0,4,8,10],opt:[]},
  {sym:'7♭9',name:'Dominant 7th flat 9',iv:[0,4,7,10,13],opt:[7]},
  {sym:'7♯9',name:'Dominant 7th sharp 9',iv:[0,4,7,10,15],opt:[7]},
  {sym:'7♯11',name:'Dominant 7th sharp 11',iv:[0,4,7,10,18],opt:[7]},
  {sym:'maj7♯11',name:'Major 7th sharp 11',iv:[0,4,7,11,18],opt:[7]},
 ]},
];
function findQ(sym){for(const g of QUAL)for(const q of g.list)if(q.sym===sym)return q;return null}

// Per-chord labels: pitch-class offset from the root -> {lab, role}. The ♯9 of a 7♯9 is not a ♭3.
function tones(q){
  const m={};
  for(const iv of q.iv){
    const lab=(q.lab&&q.lab[iv])||(iv===2?'2':IVNAME[iv]);
    const role=iv===0?'root':([3,4,10,11].includes(iv)||(q.guide&&q.guide.includes(iv))?'guide':'color');
    m[iv%12]={lab,role};
  }
  return m;
}
function toneOf(q,pcOffset){const t=tones(q)[mod(pcOffset)];return t||{lab:GENERIC[mod(pcOffset)],role:'color'}}

// Spell chord tones by letter so thirds land on consecutive letters (Gm = G B♭ D, Caug = C E G♯).
// pref: 'sharp' | 'flat' when the player typed a particular root name.
function spell(root,q,pref){
  const pc=mod(root);
  const tryRoot=rl=>{
    const out=[];
    for(const iv of q.iv){
      const li=(rl+((q.deg&&q.deg[iv])||DEG[iv])-1)%7; let acc=mod(root+iv)-NAT[li]; if(acc>6)acc-=12; if(acc<-6)acc+=12;
      if(Math.abs(acc)>1)return null;
      out.push(LETTERS[li]+(acc===1?'♯':acc===-1?'♭':''));
    }
    return out;
  };
  if(NAT.includes(pc)){const r=tryRoot(NAT.indexOf(pc));if(r)return r;return q.iv.map(iv=>(q.iv.includes(3)?FLAT:SHARP)[mod(root+iv)])}
  const minorish=q.iv.includes(3)&&!q.iv.includes(4);
  const flatFirst=pref?pref==='flat':(minorish?[3,10].includes(pc):[1,3,8,10].includes(pc));
  const sharpL=NAT.indexOf(mod(pc-1)), flatL=NAT.indexOf(mod(pc+1));
  const order=flatFirst?[[flatL,FLAT],[sharpL,SHARP]]:[[sharpL,SHARP],[flatL,FLAT]];
  if(pref){const r=tryRoot(order[0][0]);return r||q.iv.map(iv=>order[0][1][mod(root+iv)])}
  for(const [rl] of order){const r=tryRoot(rl);if(r)return r}
  return q.iv.map(iv=>order[0][1][mod(root+iv)]);
}

// ---------- Parser ----------
const CANON={'':'','maj':'','m':'m','5':'5','sus2':'sus2','2':'sus2','sus4':'sus4','sus':'sus4','4':'sus4','dim':'dim','aug':'aug',
 '6':'6','maj6':'6','m6':'m6','7':'7','maj7':'maj7','m7':'m7','mmaj7':'m(maj7)','m/maj7':'m(maj7)','m#7':'m(maj7)','m7b5':'m7♭5','m7-5':'m7♭5','dim7':'dim7',
 '7sus4':'7sus4','7sus':'7sus4','add9':'add9','add2':'add9','madd9':'madd9','madd2':'madd9','6/9':'6/9','69':'6/9','maj6/9':'6/9','9':'9','maj9':'maj9','m9':'m9',
 '11':'11','9sus4':'11','9sus':'11','m11':'m11','13':'13','7b5':'7♭5','7-5':'7♭5','7#5':'7♯5','7+5':'7♯5','7+':'7♯5','aug7':'7♯5','7aug':'7♯5','7b9':'7♭9','7-9':'7♭9','7#9':'7♯9','7+9':'7♯9',
 '7#11':'7♯11','7+11':'7♯11','maj7#11':'maj7♯11','maj7+11':'maj7♯11'};
function normQual(raw){
  let q=raw.replace(/[()\s]/g,'').replace(/♭/g,'b').replace(/♯/g,'#');
  q=q.replace(/^(mi?n?|-)M7$/,'mmaj7');
  if(/^M(\d|$|\/)/.test(q))q='maj'+q.slice(1); // CM7 is major; Cm7 is minor
  q=q.toLowerCase();
  q=q.replace(/^half-?dim(inished)?7?/,'m7b5').replace(/^[øØ]7?/,'m7b5').replace(/^diminished/,'dim').replace(/^augmented/,'aug').replace(/^dom(inant)?/,'')
     .replace(/^major/,'maj').replace(/^minor/,'m').replace(/^min/,'m').replace(/^mi(?=\d|$)/,'m').replace(/^-/,'m')
     .replace(/^(δ|Δ|△|\^)$/,'maj7').replace(/^(δ|Δ|△|\^)/,'maj').replace(/^m(δ|Δ|△|\^)7?$/,'mmaj7').replace(/^ma(?=\d)/,'maj')
     .replace(/^(°|º|o)(?=7|$)/,'dim').replace(/^\+/,'aug');
  if(q==='maj')q='';
  return Object.prototype.hasOwnProperty.call(CANON,q)?CANON[q]:null;
}
const ROOTPC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function noteTok(letter,acc){let pc=ROOTPC[letter.toUpperCase()];const sharp=acc==='#'||acc==='♯',flat=acc==='b'||acc==='♭';if(sharp)pc++;if(flat)pc--;return {pc:mod(pc),pref:sharp?'sharp':flat?'flat':null,name:letter.toUpperCase()+(sharp?'♯':flat?'♭':'')}}
function parseChord(tok){
  const m=tok.match(/^([A-Ga-g])([#♯b♭]?)(.*)$/); if(!m)return null;
  let rest=m[3], bass=null;
  const s=rest.match(/^(.*)\/([A-Ga-g])([#♯b♭]?)$/);
  if(s){rest=s[1];bass=noteTok(s[2],s[3])}
  const sym=normQual(rest); if(sym===null)return null;
  const r=noteTok(m[1],m[2]), q=findQ(sym);
  if(bass&&bass.pc===r.pc)bass=null;
  return {root:r.pc,pref:r.pref,qual:q,bass:bass?bass.pc:null,bassName:bass?bass.name:null,text:tok,key:r.pc+'|'+sym+'|'+(bass?bass.pc:'')};
}
function parseProg(text){
  const W='major|minor|maj|min|dim|aug|dom|sus|add|half';
  let t=String(text).replace(new RegExp('(^|[\\s,|;])([A-Ga-g][#b♯♭]?)\\s+(?=('+W+'))','gi'),'$1$2')   // "A minor" -> "Aminor"
                    .replace(new RegExp('('+W+')[a-z-]*\\s+(?=\\d)','gi'),m=>m.replace(/\s+/g,''));      // "Aminor 7" -> "Aminor7"
  const toks=t.split(/\s+[-–—]\s+|[\s,|;>→]+/).filter(Boolean);
  const chords=[],bad=[];
  for(const tok of toks){
    if(tok==='%'){if(chords.length)chords.push({...chords[chords.length-1]});continue}
    if(/^[-–—:.]+$/.test(tok)||/^\(?x\d+\)?$/i.test(tok))continue;
    const c=parseChord(tok); if(c)chords.push(c); else bad.push(tok);
  }
  return {chords,bad};
}
function chordName(c){const n=spell(c.root,c.qual,c.pref);return {root:n[0],sym:c.qual.sym,bass:c.bass!=null?(c.bassName||SHARP[c.bass]):null,notes:n}}

// ---------- Guitar ----------
const OPEN={6:40,5:45,4:50,3:55,2:59,1:64}; // MIDI of the open strings
const fretKey=fr=>{const a=[6,5,4,3,2,1].map(s=>fr[s]<0?'x':String(fr[s]));return a.some(x=>x.length>1)?a.join('-'):a.join('')};
function parseFretKey(k){const a=k.includes('-')?k.split('-'):k.split('');if(a.length!==6)return null;const fr={};a.forEach((x,i)=>{fr[6-i]=x==='x'?-1:parseInt(x,10)});return Object.values(fr).some(Number.isNaN)?null:fr}
function describeShape(fr,root,q){
  const strings=[6,5,4,3,2,1].filter(s=>fr[s]>=0), fretted=strings.filter(s=>fr[s]>0);
  const minF=fretted.length?Math.min(...fretted.map(s=>fr[s])):0, maxF=fretted.length?Math.max(...fretted.map(s=>fr[s])):0;
  const atMin=fretted.filter(s=>fr[s]===minF).sort((a,b)=>b-a);
  let barre=null, partial=false, fingers=0;
  if(atMin.length>1){
    let ok=true; for(let s=atMin[0];s>=1;s--) if(fr[s]===0){ok=false;break}
    const adjacent=atMin.every((s,i)=>i===0||atMin[i-1]-s===1);
    if(ok&&(adjacent||fretted.length>4))barre={fret:minF,from:atMin[0],to:atMin[atMin.length-1]};
  }
  fingers+=barre?1:atMin.length;
  for(const f of [...new Set(fretted.map(s=>fr[s]).filter(f=>f>minF))]){
    const at=fretted.filter(s=>fr[s]===f).sort((a,b)=>b-a);
    let i=0; while(i<at.length){let j=i; while(j+1<at.length&&at[j+1]===at[j]-1)j++; if(j>i&&at[j]===1){fingers++;partial=true}else fingers+=j-i+1; i=j+1}
  }
  const opens=strings.filter(s=>fr[s]===0).length;
  const pcs=new Set(strings.map(s=>mod(OPEN[s]+fr[s])));
  const pos=opens&&maxF<=4?0:minF;
  return {frets:{...fr},key:fretKey(fr),minF,maxF,fingers,barre,partial,opens,pos,strings:strings.length,
    bassPc:mod(OPEN[strings[0]]+fr[strings[0]]),bassIv:mod(OPEN[strings[0]]+fr[strings[0]]-root),
    omitted:q.iv.filter(i=>!pcs.has(mod(root+i))),midis:strings.map(s=>OPEN[s]+fr[s]),
    label:pos===0?'Open position':(barre?'Barre, fret '+minF:'Fret '+minF)};
}
function guitarShapes(root,q,bass){
  const chordPcs=new Set(q.iv.map(i=>mod(root+i)));
  const slash=bass!=null&&mod(bass)!==mod(root), bassPc=slash?mod(bass):null;
  const allowed=new Set(chordPcs); if(slash)allowed.add(bassPc);
  const req=new Set(q.iv.filter(i=>!q.opt.includes(i)).map(i=>mod(root+i)));
  const minStrings=q.iv.length<=2?2:3;
  const results=[], cur={};
  const consider=p=>{
    const strings=[6,5,4,3,2,1].filter(s=>cur[s]>=0);
    if(strings.length<minStrings)return;
    // Sounding strings must be adjacent, except one muted string directly above the bass (the 3x34xx jazz grip).
    let innerMute=false;
    for(let i=1;i<strings.length;i++){const gap=strings[i-1]-strings[i]; if(gap===1)continue; if(gap===2&&i===1&&strings.length>=3&&cur[strings[0]]>0){innerMute=true;continue} return}
    const fretted=strings.filter(s=>cur[s]>0);
    const minF=fretted.length?Math.min(...fretted.map(s=>cur[s])):0;
    if(fretted.length?minF!==p:p!==1)return; // each shape is found once, in the window it starts in
    const pcs=new Set(strings.map(s=>mod(OPEN[s]+cur[s])));
    for(const r of req) if(!pcs.has(r))return;
    if(slash){ if(mod(OPEN[strings[0]]+cur[strings[0]])!==bassPc)return; if(!chordPcs.has(bassPc)&&strings.slice(1).some(s=>mod(OPEN[s]+cur[s])===bassPc))return }
    const d=describeShape(cur,root,q);
    if(d.fingers>4)return;
    const big=q.iv.length>=5, seventh=q.iv.length>=4;
    let score=d.maxF*0.6+(d.maxF-d.minF)*0.8+d.fingers*1.4-d.opens*0.25;
    score+=d.omitted.reduce((a,i)=>a+(i===7?(big?0.3:1.0):(big?0.8:2.2)),0);
    if(!slash)score+=d.bassIv===0?0:(d.bassIv===7?7:12);
    score+=(6-d.strings)*(seventh?0.9:1.6)+(d.strings<4&&q.iv.length>=3?4:0);
    if(d.barre)score+=1.2; if(d.partial)score+=0.8; if(innerMute)score+=2;
    if(d.opens&&d.maxF>=5)score+=(d.maxF-4)*1.5;
    if(d.pos>0)score+=strings.filter(s=>cur[s]===0&&s!==strings[0]).length*1.8+(cur[strings[0]]===0?0.5:0); // open strings only help in open position
    // Two fingers on the lowest fret with an open string between them and higher-fret fingers reaching in between: awkward.
    const low=fretted.filter(s=>cur[s]===minF);
    if(low.length>1&&!d.barre&&strings.some(s=>cur[s]===0&&s<low[0]&&s>low[low.length-1])&&fretted.some(s=>cur[s]>minF&&s<low[0]&&s>low[low.length-1]))score+=4.5;
    if(cur[1]<0&&cur[2]>=0)score+=0.6;
    if(cur[1]<0&&cur[2]<0&&cur[3]>=0)score+=0.8;
    d.score=score; results.push(d);
  };
  for(let p=1;p<=12;p++){
    const opts={};
    for(let s=6;s>=1;s--){const o=[-1]; if(allowed.has(mod(OPEN[s])))o.push(0); for(let f=p;f<=p+3;f++) if(allowed.has(mod(OPEN[s]+f)))o.push(f); opts[s]=o}
    const rec=s=>{ if(s===0){consider(p);return} for(const f of opts[s]){cur[s]=f;rec(s-1)} };
    rec(6);
  }
  results.sort((a,b)=>a.score-b.score);
  // Keep the best, skip shapes that are a better shape with strings removed, and spread the picks along the neck.
  const keep=[], perPos={};
  for(const r of results){
    if(keep.length>=6&&r.score>keep[0].score+13)break;
    if(keep.some(k=>[6,5,4,3,2,1].every(s=>r.frets[s]<0||r.frets[s]===k.frets[s])))continue;
    if(!slash&&r.bassIv!==0&&r.bassIv!==7)continue; // 3rd or 7th in the bass is a slash chord; ask for it by name
    const region=r.pos===0?0:1+Math.floor((r.pos-1)/3);
    const bucket=region+(r.strings>=5?'f':'c'), cap=region===0&&r.strings>=5?4:2; // full shapes and compact grips each get room in every region of the neck
    if((perPos[bucket]||0)>=cap)continue;
    perPos[bucket]=(perPos[bucket]||0)+1; keep.push(r);
    if(keep.length>=16||(keep.length>=6&&r.score>keep[0].score+13))break; // stop before the contortions
  }
  // Always offer the two three-note jazz shells (root, 3rd, 7th) when the chord has them: root on the 6th string and on the 5th.
  const third=[4,3].find(x=>q.iv.includes(x)), sev=[10,11].find(x=>q.iv.includes(x));
  if(!slash&&third!=null&&sev!=null&&q.iv.every(i=>[0,third,sev].includes(i)||q.opt.includes(i)||i===7)){
    const want=new Set([0,third,sev].map(i=>mod(root+i)));
    for(const set of [[6,4,3],[5,4,3]]){
      const hit=results.find(r=>r.strings===3&&set.every(st=>r.frets[st]>0)&&r.bassIv===0&&new Set(r.midis.map(m=>mod(m))).size===3&&r.midis.every(m=>want.has(mod(m))));
      if(hit&&!keep.includes(hit)){hit.shell=true;hit.label='Shell, root on string '+set[0];keep.push(hit)}
      else if(hit){hit.shell=true}
    }
  }
  return keep;
}

// ---------- Piano (37 keys, C to C: MIDI 48..84) ----------
const KB_LO=48, KB_HI=84;
const pianoKey=v=>v.lh.join('.')+'|'+v.rh.join('.');
function pianoVoicings(root,q,bass){
  const iv=q.iv, has=x=>iv.includes(x);
  const slash=bass!=null&&mod(bass)!==mod(root);
  const t=[4,3].find(has)??((has(5)||has(17))?5:(has(2)?2:null));          // 3rd, or the suspended note standing in for it
  const f=[7,6,8].find(has)??null;
  const six=!has(10)&&!has(11)&&has(9);
  const s=[10,11].find(has)??(six?9:null);                                  // 7th; in 6th chords the 6th does the same job
  const exts=iv.filter(i=>i>=12);
  const L=x=>toneOf(q,x).lab;
  const sName=q.sym==='dim7'?'diminished 7th':(six?'6th':'7th');
  const tName=t===5?'4th':t===2?'2nd':'3rd';
  const out=[], seen=new Set();
  const add=(label,desc,lh,rh)=>{
    const lhAbs=slash?[KB_LO+mod(bass)]:lh.map(x=>KB_LO+mod(root)+x);
    const maxLH=Math.max(...lhAbs), span=rh[rh.length-1]-rh[0];
    if(span>14||lhAbs[lhAbs.length-1]-lhAbs[0]>12)return;
    for(let i=1;i<rh.length;i++) if(rh[i]<=rh[i-1])return;
    let rhAbs=null;
    for(const floor of [Math.max(maxLH+1,55),maxLH+1]){
      let b=floor; while(mod(b)!==mod(root+rh[0]))b++;
      if(b+span<=KB_HI){rhAbs=rh.map(x=>b+x-rh[0]);break}
    }
    if(!rhAbs)return;
    const v={label,desc,lh:lhAbs,rh:rhAbs}; v.key=pianoKey(v);
    if(seen.has(v.key))return; seen.add(v.key); out.push(v);
  };
  const closed=[...new Set(iv.map(i=>i%12))].sort((a,b)=>a-b);
  const rot=(a,k)=>{a=a.slice();for(let i=0;i<k;i++)a.push(a.shift()+12);return a};
  const ORD=['1st','2nd','3rd'];
  if(!exts.length){
    add('Root position','Left hand plays the root; right hand stacks the chord from the root up. The plain one to learn first.',[0],closed);
    for(let k=1;k<closed.length;k++) add(ORD[k-1]+' inversion','Same notes with the '+L(closed[k])+' at the bottom of the right hand. Pick the inversion nearest your last chord so the hand barely moves.',[0],rot(closed,k));
  }
  if(s==null){
    if(!exts.length&&closed.length===3) add('Open','Left hand takes the root and '+L(closed[2])+'; right hand plays the '+L(closed[1])+' with the root above it. Wide and ringing.',[0,closed[2]],[closed[1],12]);
    if(closed.length===2) add('With the octave','Root, 5th and the root again on top. Fuller than the bare two notes.',[0],[0,7,12]);
    if(exts.length&&t!=null){
      add('Close','Right hand plays 9, '+L(t)+', 5 in a tight cluster; the 9 rubs against the 3rd, which is the sound of this chord.',[0],[2,t,7]);
      add('Stacked','Right hand plays '+L(t)+', 5, 9 from the bottom up, with the 9th ringing on top.',[0],[t,7,14]);
      add('5th on the bottom','Right hand plays 5, 9, '+L(t)+'. Sits higher and brighter.',[0],[7,14,12+t]);
      add('Open','Left hand root and 5th; right hand just the '+L(t)+' and the 9th. Leaves room for a guitar.',[0,7],[t,14]);
    }
  }else{
    const shells=()=>{if(t!=null){
      add('Shell, '+tName+' on the bottom','Root in the left hand, only the '+tName+' and '+sName+' in the right. These two notes define the chord.',[0],[t,s]);
      add('Shell, '+sName+' on the bottom','The same two notes flipped. Alternate the two shells from chord to chord and the right hand moves by a step or not at all.',[0],[s,12+t]);
    }
    };
    if(!exts.length)shells(); // extended chords lead with voicings that contain the extension
    const nine=[14,13,15].find(has)??(['m7♭5','dim7'].includes(q.sym)?null:14);
    const slot2=has(21)?9:(has(17)&&t!==5)?5:has(18)?6:f;                  // the 13th, 11th or ♯11 takes the 5th's place
    const adds=nine!=null&&!has(nine)?' Adds a 9th for color.':'';
    if(t!=null&&slot2!=null&&nine!=null){
      const n9=has(nine)?toneOf(q,nine).lab:'9', n2=slot2===9&&has(21)?'13':slot2===5&&has(17)?'11':slot2===6&&has(18)?'♯11':L(slot2);
      add('Rootless, '+tName+' on the bottom','Right hand plays '+[L(t),n2,L(s),n9].join(', ')+' with no root; the left hand, a bass or your looper supplies it.'+adds,[0],[t,slot2,s,nine]);
      add('Rootless, '+sName+' on the bottom','The same four notes starting from the '+sName+': '+[L(s),n9,L(t),n2].join(', ')+'. Use whichever rootless shape is closer to your last chord.'+adds,[0],[s,nine,12+t,12+slot2]);
      if(exts.length){
        add('Rootless, '+n2+' on the bottom','Another turn of the same four notes: '+[n2,L(s),n9,L(t)].join(', ')+'.',[0],[slot2,s,nine,12+t]);
        add('Rootless, '+n9+' on the bottom','Another turn of the same four notes: '+[n9,L(t),n2,L(s)].join(', ')+'.',[0],[nine-12,t,slot2,s]);
      }
    }
    if(exts.length&&t!=null){
      const top=Math.max(...exts.filter(e=>e%12!==t%12));
      const c1=[t,s,top], c2=[s,12+t,top>12+t?top:top+12];
      const pick=top-t<=12?c1:c2, names=pick.map(x=>toneOf(q,x).lab).join(', ');
      add('Shell plus color','Root in the left hand; right hand plays '+names+'. The shell with the one note that names the chord on top.',[0],pick);
      if(f!=null) add('Spread','Root and '+L(f)+' in the left hand, '+names+' in the right. Wide and full; good for ballads and slow blues.',[0,f],pick);
    }else if(f!=null&&t!=null){
      add('Spread','Root and '+L(f)+' in the left hand; '+L(t)+', '+L(s)+' and the root on top in the right. Wide and full; good for ballads and slow blues.',[0,f],[t,s,12]);
    }
    if(exts.length)shells();
  }
  return out;
}
function customPiano(key){const [a,b]=key.split('|');const lh=a?a.split('.').map(Number):[],rh=b?b.split('.').map(Number):[];if(![...lh,...rh].length||[...lh,...rh].some(n=>!Number.isFinite(n)||n<KB_LO||n>KB_HI))return null;return {label:'Saved voicing',desc:'',lh,rh,key}}

if(typeof module!=='undefined')module.exports={QUAL,findQ,spell,tones,toneOf,parseChord,parseProg,chordName,guitarShapes,describeShape,parseFretKey,fretKey,pianoVoicings,customPiano,pianoKey,OPEN,SHARP,FLAT,mod,KB_LO,KB_HI,normQual};
