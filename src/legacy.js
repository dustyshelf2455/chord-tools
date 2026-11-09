// Engine and parser as shipped before this revision. Used once, to turn saved voicing numbers into the exact shapes they pointed at.
const LEGACY=(function(){
// Chord engine: qualities, spelling, guitar shape generator, piano voicings.
const SHARP=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const FLAT =['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
const LETTERS=['C','D','E','F','G','A','B']; const NAT=[0,2,4,5,7,9,11];
const DEG={0:1,2:2,3:3,4:3,5:4,6:5,7:5,8:6,9:6,10:7,11:7,13:2,14:2,15:3,17:4,21:6};
const IVNAME={0:'R',2:'9',3:'♭3',4:'3',5:'4',6:'♭5',7:'5',8:'♯5',9:'6',10:'♭7',11:'7',13:'♭9',14:'9',15:'♯9',17:'11',21:'13'};
const mod=n=>((n%12)+12)%12;

// iv: intervals in semitones from root (may exceed 12 for extensions). opt: intervals that can be left out on guitar.
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
  {sym:'dim7',name:'Diminished 7th',iv:[0,3,6,9],opt:[],deg:{9:7}},
  {sym:'7sus4',name:'Dominant 7th sus4',iv:[0,5,7,10],opt:[7]},
 ]},
 {g:'Extended & altered',list:[
  {sym:'add9',name:'Add 9',iv:[0,4,7,14],opt:[7]},
  {sym:'madd9',name:'Minor add 9',iv:[0,3,7,14],opt:[7]},
  {sym:'6/9',name:'Six-nine',iv:[0,4,7,9,14],opt:[7]},
  {sym:'9',name:'Dominant 9th',iv:[0,4,7,10,14],opt:[7]},
  {sym:'maj9',name:'Major 9th',iv:[0,4,7,11,14],opt:[7]},
  {sym:'m9',name:'Minor 9th',iv:[0,3,7,10,14],opt:[7]},
  {sym:'7♭9',name:'Dominant flat 9',iv:[0,4,7,10,13],opt:[7]},
  {sym:'7♯9',name:'Dominant sharp 9',iv:[0,4,7,10,15],opt:[7]},
  {sym:'m11',name:'Minor 11th',iv:[0,3,7,10,14,17],opt:[7,14]},
  {sym:'13',name:'Dominant 13th',iv:[0,4,7,10,14,21],opt:[7,14]},
 ]},
];

// Spell chord tones by letter so thirds stack on consecutive letters (G7 = G B D F, Gm = G B♭ D).
function spell(root,q){
  const tryRoot=(rl)=>{ // rl: letter index of root
    const out=[];
    for(const iv of q.iv){
      const li=(rl+((q.deg&&q.deg[iv])||DEG[iv])-1)%7; let acc=mod(root+iv)-NAT[li]; if(acc>6)acc-=12; if(acc<-6)acc+=12;
      if(Math.abs(acc)>1)return null;
      out.push(LETTERS[li]+(acc===1?'♯':acc===-1?'♭':acc===2?'𝄪':acc===-2?'𝄫':''));
    }
    return out;
  };
  const pc=mod(root);
  const prefFlat=[1,3,8,10].includes(pc);
  const cands=NAT.includes(pc)?[NAT.indexOf(pc)]:(prefFlat?[NAT.indexOf(mod(pc+1)),NAT.indexOf(mod(pc-1))]:[NAT.indexOf(mod(pc-1)),NAT.indexOf(mod(pc+1))]);
  for(const rl of cands){const r=tryRoot(rl);if(r)return r}
  return q.iv.map(iv=>(prefFlat?FLAT:SHARP)[mod(root+iv)]);
}

// ---------- Guitar ----------
const OPEN={6:40,5:45,4:50,3:55,2:59,1:64}; // MIDI of open strings
function guitarShapes(root,q){
  const tones=new Set(q.iv.map(i=>mod(root+i)));
  const req=new Set(q.iv.filter(i=>!q.opt.includes(i)).map(i=>mod(root+i)));
  const minStrings=q.iv.length<=2?2:3;
  const results=[];
  for(let p=1;p<=12;p++){
    const opts={};
    for(let s=6;s>=1;s--){
      const o=[-1]; if(tones.has(mod(OPEN[s])))o.push(0);
      for(let f=p;f<=p+3;f++) if(tones.has(mod(OPEN[s]+f)))o.push(f);
      opts[s]=o;
    }
    const cur={};
    const rec=(s)=>{
      if(s===0){eval_(cur,p);return}
      for(const f of opts[s]){cur[s]=f;rec(s-1)}
      delete cur[s];
    };
    rec(6);
  }
  function eval_(sh,p){
    const strings=[6,5,4,3,2,1].filter(s=>sh[s]>=0);
    if(strings.length<minStrings)return;
    // contiguous sounding strings
    for(let i=1;i<strings.length;i++) if(strings[i-1]-strings[i]!==1)return;
    const fretted=strings.filter(s=>sh[s]>0);
    const minF=fretted.length?Math.min(...fretted.map(s=>sh[s])):0;
    if(fretted.length&&minF!==p)return; // each shape found once, in the window it starts
    if(!fretted.length&&p!==1)return;
    const pcs=new Set(strings.map(s=>mod(OPEN[s]+sh[s])));
    for(const r of req) if(!pcs.has(r))return;
    // fingers
    const maxF=fretted.length?Math.max(...fretted.map(s=>sh[s])):0;
    const atMin=fretted.filter(s=>sh[s]===minF);
    let barre=false, partial=false, fingers=0;
    if(atMin.length>1){
      const low=Math.max(...atMin); barre=true;
      for(let s=low;s>=1;s--) if(sh[s]===0){barre=false;break}
    }
    fingers+=barre?1:atMin.length;
    const levels=[...new Set(fretted.map(s=>sh[s]).filter(f=>f>minF))];
    for(const f of levels){
      const at=fretted.filter(s=>sh[s]===f).sort((a,b)=>b-a); // 6..1
      let i=0;
      while(i<at.length){
        let j=i; while(j+1<at.length&&at[j+1]===at[j]-1)j++;
        const run=at.slice(i,j+1);
        if(run.length>1&&run[run.length-1]===1){fingers+=1;partial=true} else fingers+=run.length;
        i=j+1;
      }
    }
    if(fingers>4)return;
    const bass=strings[0]; const bassIv=mod(OPEN[bass]+sh[bass]-root);
    const opens=strings.filter(s=>sh[s]===0).length;
    const missing=q.iv.filter(i=>!pcs.has(mod(root+i))).reduce((a,i)=>a+(i===7?1.0:2.2),0);
    let score=0;
    score+=maxF*0.9+(maxF-minF)*0.8;
    score+=fingers*1.4-opens*0.25;
    score+=missing;
    score+=bassIv===0?0:(bassIv===7?6:10);
    score+=(6-strings.length)*1.6+(strings.length<4&&q.iv.length>=3?3:0);
    if(barre)score+=1.2; if(partial)score+=0.8;
    if(opens&&maxF>=5)score+=(maxF-4)*1.5;
    if(minF>=2)score+=strings.filter(s=>sh[s]===0&&s<strings[0]&&s>strings[strings.length-1]).length*1.8;
    if(sh[1]<0&&sh[2]>=0)score+=0.6; // top string muted under a sounding 2nd string
    if(sh[1]<0&&sh[2]<0&&sh[3]>=0)score+=0.8;
    results.push({frets:{...sh},score,minF,maxF,fingers,barre,bassIv,strings:strings.length});
  }
  results.sort((a,b)=>a.score-b.score);
  // drop shapes that are a strict subset of a better one (same frets, fewer strings) and cap
  const keep=[];
  for(const r of results){
    const dup=keep.some(k=>[6,5,4,3,2,1].every(s=>r.frets[s]<0||r.frets[s]===k.frets[s]));
    if(!dup)keep.push(r);
    if(keep.length>=12)break;
  }
  return keep;
}

// ---------- Piano ----------
function pianoVoicings(root,q){
  const has7=q.iv.some(i=>i===10||i===11);
  const LH=48+root;
  const top=Math.max(...q.iv);
  const RH=(60+root+top>84)?48+root:60+root;
  const closed=q.iv.map(i=>i>=12?i-12:i).filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b);
  const inv=(arr,n)=>{const a=arr.slice();for(let i=0;i<n;i++)a.push(a.shift()+12);return a};
  const V=[];
  V.push({label:'Root position',desc:'Left hand plays the root, right hand stacks the chord from the root up. The plain, obvious one; learn it first.',lh:[LH],rh:inv(closed,0).map(i=>RH+i)});
  const names=['1st inversion','2nd inversion','3rd inversion'];
  for(let n=1;n<closed.length&&n<=3;n++){
    const bottom=IVNAME[closed[n]]||'';
    V.push({label:names[n-1],desc:`Same notes, ${bottom} on the bottom of the right hand. Inversions let you move to the next chord with the smallest hand movement.`,lh:[LH],rh:inv(closed,n).map(i=>RH+i)});
  }
  if(has7){
    const third=q.iv.find(i=>i===3||i===4||i===5), sev=q.iv.find(i=>i===10||i===11);
    V.push({label:'Shell',desc:'Root in the left hand, 3rd and 7th in the right. The jazz minimum; the two notes that define the chord.',lh:[LH],rh:[RH+third,RH+sev]});
    const nine=q.iv.includes(13)?13:q.iv.includes(15)?15:14;
    const fifthOr=q.iv.includes(21)?21:q.iv.includes(6)?6:q.iv.includes(8)?8:7;
    const a=[third,fifthOr,sev,nine].map(i=>i>=12?i-12:i);
    V.push({label:'Rootless A',desc:'Right hand plays 3-5-7-9 with no root; the left hand (or a bass player, or your looper) supplies it. The Bill Evans sound.',lh:[LH],rh:[...new Set(a)].sort((x,y)=>x-y).map(i=>RH+i)});
    const b=[sev,nine,third+12,(fifthOr>=12?fifthOr:fifthOr+12)];
    V.push({label:'Rootless B',desc:'The same four notes flipped: 7-9-3-5. Use whichever of A or B sits closer to the last chord you played.',lh:[LH],rh:b.map(i=>RH+i-12)});
    V.push({label:'Spread',desc:'Root and 5th in the left hand, 3rd and 7th (plus 9th) spread in the right. Wide and orchestral; good for ballads and slow blues.',lh:[LH,LH+7],rh:[RH+third,RH+sev,RH+12+(q.iv.includes(14)?2:0)].filter((v,i,a)=>a.indexOf(v)===i)});
  } else if(closed.length===3){
    V.push({label:'Open (10ths)',desc:'Root and 5th in the left hand, 3rd an octave higher in the right. The widest, most "piano" sounding triad.',lh:[LH,LH+closed[2]],rh:[RH+closed[1]+12,RH+12+ (closed[2]===7?7:closed[2])]});
    V.push({label:'Left-hand root, right-hand triad',desc:'Root low, first-inversion triad in the middle of the keyboard. Good for comping under a guitar.',lh:[LH],rh:inv(closed,1).map(i=>RH+i+(RH===LH?12:0))});
  }
  // Fit every voicing onto a 37-key C-to-C board (48..84): drop the right hand an octave while it is too high, then discard anything that still does not fit.
  return V.map(v=>{let rh=v.rh.slice();while(Math.max(...rh)>84&&Math.min(...rh)-12>Math.max(...v.lh))rh=rh.map(n=>n-12);return {...v,rh}})
          .filter(v=>Math.min(...v.lh,...v.rh)>=48&&Math.max(...v.lh,...v.rh)<=84);
}


  function findQ(sym){for(const g of QUAL)for(const q of g.list)if(q.sym===sym)return q;return null}
  const ALIAS={'':'','maj':'','major':'','M':'','m':'m','min':'m','minor':'m','-':'m','5':'5','sus2':'sus2','sus4':'sus4','sus':'sus4','dim':'dim','°':'dim','o':'dim','aug':'aug','+':'aug','6':'6','maj6':'6','m6':'m6','min6':'m6','-6':'m6','7':'7','dom7':'7','maj7':'maj7','M7':'maj7','Δ':'maj7','Δ7':'maj7','ma7':'maj7','m7':'m7','min7':'m7','-7':'m7','mmaj7':'m(maj7)','m(maj7)':'m(maj7)','minmaj7':'m(maj7)','mM7':'m(maj7)','-Δ7':'m(maj7)','m7b5':'m7♭5','m7♭5':'m7♭5','ø':'m7♭5','ø7':'m7♭5','-7b5':'m7♭5','min7b5':'m7♭5','dim7':'dim7','°7':'dim7','o7':'dim7','7sus4':'7sus4','7sus':'7sus4','add9':'add9','madd9':'madd9','m(add9)':'madd9','6/9':'6/9','69':'6/9','9':'9','maj9':'maj9','M9':'maj9','Δ9':'maj9','m9':'m9','min9':'m9','-9':'m9','7b9':'7♭9','7♭9':'7♭9','7#9':'7♯9','7♯9':'7♯9','m11':'m11','min11':'m11','-11':'m11','13':'13'};
  const ROOTPC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  function parseChord(tok){
    const m=tok.match(/^([A-Ga-g])([#♯b♭]?)(.*?)(?:\/([A-Ga-g][#♯b♭]?))?$/);
    if(!m)return null;
    let pc=ROOTPC[m[1].toUpperCase()]; if(m[2]==='#'||m[2]==='♯')pc++; if(m[2]==='b'||m[2]==='♭')pc--;
    let q=m[3].replace(/\s+/g,'').replace(/^maj$/i,'maj').replace(/^Maj/,'maj').replace(/^MAJ/,'maj').replace(/^Min/,'min').replace(/^MIN/,'min');
    const key=ALIAS[q]!==undefined?q:(ALIAS[q.toLowerCase()]!==undefined?q.toLowerCase():null);
    if(key===null)return null;
    return {root:mod(pc),qual:findQ(ALIAS[key])};
  }
  function convert(text,v){
    const out=[];
    String(text||'').split(/[\s,|]+/).filter(t=>t&&!/^[-–—]$/.test(t)).forEach(t=>{
      const c=parseChord(t); if(!c||!c.qual)return;
      const g=guitarShapes(c.root,c.qual), p=pianoVoicings(c.root,c.qual), vi=(v&&v[out.length])||{};
      const gi=Math.max(0,Math.min(g.length-1,vi.g|0)), pi=Math.max(0,Math.min(p.length-1,vi.p|0));
      const fr=g[gi]&&g[gi].frets, a=fr?[6,5,4,3,2,1].map(s=>fr[s]<0?'x':String(fr[s])):null;
      out.push({id:c.root+'|'+c.qual.sym+'|',g:a?(a.some(x=>x.length>1)?a.join('-'):a.join('')):null,p:p[pi]?p[pi].lh.join('.')+'|'+p[pi].rh.join('.'):null});
    });
    return out;
  }
  return {convert};
})();
if(typeof module!=='undefined')module.exports={LEGACY};
