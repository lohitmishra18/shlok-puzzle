// ---------- Elements & state ----------
const $ = (s)=>document.querySelector(s);
const board=$('#board'), movesEl=$('#moves'), timeEl=$('#time'), statusEl=$('#status'), previewImg=$('#previewImg');

// 16 tiles: 4 rows × 4 cols
const ROWS = 4, COLS = 4;
let currentSrc='./assets/Shlok.jpg';
let originalSrc='./assets/Shlok.jpg';
let tiles=[], timer=null, startTime=null, moves=0;

// ---------- Utils ----------
const pad=(n)=>String(n).padStart(2,'0');
const formatTime=(ms)=>{const s=Math.floor(ms/1000);return `${pad(Math.floor(s/60))}:${pad(s%60)}`};
const startTimer=()=>{stopTimer();startTime=Date.now();timer=setInterval(()=>{timeEl.textContent=formatTime(Date.now()-startTime)},250)};
const stopTimer=()=>{if(timer){clearInterval(timer);timer=null}};
const resetStats=()=>{moves=0;movesEl.textContent='0';timeEl.textContent='00:00'};

const setBoardGrid=()=>{ board.style.gridTemplateColumns=`repeat(${COLS},1fr)`; };

// ---------- Build board (stretch image across 12 tiles) ----------
function buildBoard(){
  board.innerHTML=''; tiles=[]; setBoardGrid();
  const total=ROWS*COLS;
  for(let i=0;i<total;i++){
    const r=Math.floor(i/COLS), c=i%COLS;
    const tile=document.createElement('div');
    tile.className='tile'; tile.draggable=false;
    tile.dataset.id = i;
    tile.style.backgroundImage=`url('${currentSrc}')`;
    tile.style.backgroundSize=`${COLS*100}% ${ROWS*100}%`;
    const px=(COLS>1)?(c/(COLS-1))*100:0, py=(ROWS>1)?(r/(ROWS-1))*100:0;
    tile.style.backgroundPosition=`${px.toFixed(4)}% ${py.toFixed(4)}%`;
    addInteractions(tile);
    board.appendChild(tile); tiles.push(tile);
  }
}

// ---------- Mobile-first interactions: tap-to-swap (fast) ----------
let firstIdx=null;
function addInteractions(tile){
  tile.addEventListener('pointerdown', (e)=>{
    e.preventDefault();
    const idx = tiles.indexOf(tile);
    if(firstIdx===null){ firstIdx=idx; tile.classList.add('active'); return; }
    if(firstIdx!==idx){ swapTiles(firstIdx, idx); }
    tiles[firstIdx]?.classList.remove('active');
    firstIdx=null;
  });
}

function swapTiles(a,b){ if(a===b) return; const parent=board; const A=tiles[a], B=tiles[b]; if(!A||!B) return;
  const ph=document.createElement('div'); parent.insertBefore(ph,A); parent.replaceChild(A,B); parent.replaceChild(B,ph); ph.remove();
  const t=tiles[a]; tiles[a]=tiles[b]; tiles[b]=t;
  playMoveSound();
  moves++;
  movesEl.textContent=String(moves);
  checkSolved();
}

// --- Sound effect for tile move ---
function playMoveSound(){
  let audio = document.getElementById('move-audio');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'move-audio';
    audio.src = 'assets/tile.mp3'; // Remove leading './'
    audio.preload = 'auto';
    document.body.appendChild(audio);
  }
  audio.currentTime = 0;
  audio.play();
}

// --- Sound effect for celebration ---
function playCelebrationSound(){
  let audio = document.getElementById('celebration-audio');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'celebration-audio';
    audio.src = 'assets/celebration.mp3'; // Remove leading './'
    audio.preload = 'auto';
    document.body.appendChild(audio);
  }
  audio.currentTime = 0;
  audio.play();
}

// Prime celebration audio for browser autoplay policies
function primeCelebrationAudio() {
  let audio = document.getElementById('celebration-audio');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'celebration-audio';
    audio.src = 'assets/celebration.mp3'; // Remove leading './'
    audio.preload = 'auto';
    document.body.appendChild(audio);
  }
  audio.volume = 0;
  audio.play().then(()=>{ audio.pause(); audio.currentTime = 0; audio.volume = 1; }).catch(()=>{});
}

// Prime move audio for browser autoplay policies
function primeMoveAudio() {
  let audio = document.getElementById('move-audio');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'move-audio';
    audio.src = 'assets/tile.mp3'; // Remove leading './'
    audio.preload = 'auto';
    document.body.appendChild(audio);
  }
  audio.volume = 0;
  audio.play().then(()=>{ audio.pause(); audio.currentTime = 0; audio.volume = 1; }).catch(()=>{});
}

// ---------- Shuffle / Reset ----------
function shuffle(){ const idx=tiles.map((_,i)=>i); for(let i=idx.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; } if(idx.every((v,i)=>v===i)&&idx.length>1){ [idx[0],idx[1]]=[idx[1],idx[0]]; } const frag=document.createDocumentFragment(); idx.forEach(i=> frag.appendChild(tiles[i])); board.innerHTML=''; board.appendChild(frag); tiles=Array.from(board.children); resetStats(); startTimer(); statusEl.textContent='Arrange tiles to match the preview →'; }
function reset(){ buildBoard(); resetStats(); stopTimer(); statusEl.textContent='Ready.'; }

// ---------- Solved? ----------
function checkSolved(){ const kids=Array.from(board.children); let ok=true; for(let pos=0; pos<kids.length; pos++){ const id=Number(kids[pos].dataset.id); if(id!==pos){ ok=false; kids[pos].classList.remove('correct'); } else kids[pos].classList.add('correct'); } if(ok){ stopTimer(); celebrate(); statusEl.textContent='Solved!'; } }

// ---------- Image load: STRETCH to 4:3 (no letterboxing) ----------
function loadImage(src){ return new Promise((res,rej)=>{ const img=new Image(); img.crossOrigin='anonymous'; img.onload=()=>res(img); img.onerror=()=>rej(new Error('Image failed')); img.src=src; }); }
async function setImage(src){
  try{
    originalSrc = src;
    const img=await loadImage(src);
    const W=1200, H=900;
    const can=document.createElement('canvas');
    can.width=W; can.height=H;
    const ctx=can.getContext('2d');
    ctx.drawImage(img, 0,0,W,H);
    const url=can.toDataURL('image/jpeg',0.92);
    currentSrc=url;
    previewImg.src=originalSrc;
    buildBoard();
    shuffle();
  }catch(e){
    console.error(e);
    alert('Could not load that image. Check the path or try another file.');
  }
}

// ---------- Celebration ----------
const overlay=$('#winOverlay'), fm=$('#finalMoves'), ft=$('#finalTime');
$('#closeOverlay').addEventListener('click', ()=>{
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  const audio = document.getElementById('celebration-audio');
  if (audio) { audio.pause(); audio.currentTime = 0; }
});
$('#playAgain').addEventListener('click', ()=>{
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  const audio = document.getElementById('celebration-audio');
  if (audio) { audio.pause(); audio.currentTime = 0; }
  shuffle();
});
function celebrate(){
  fm.textContent=String(moves);
  ft.textContent=timeEl.textContent;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  runConfetti();
  runBalloons();
  playCelebrationSound();
}

const confettiCanvas=document.getElementById('confetti'); const cctx=confettiCanvas.getContext('2d'); let confetti=[];
function resize(){ confettiCanvas.width=innerWidth; confettiCanvas.height=innerHeight; }
addEventListener('resize', resize); resize();
function makePiece(){ return { x:Math.random()*confettiCanvas.width, y:-20, size:6+Math.random()*6, rot:Math.random()*Math.PI, color:['#5eead4','#a78bfa','#f472b6','#facc15','#60a5fa'][Math.floor(Math.random()*5)], speed:2+Math.random()*3, drift:-1+Math.random()*2 }; }
function runConfetti(){
  confetti = Array.from({length:220}, makePiece);
  let t = 0, dur = 4800;
  (function frame(){
    t += 16;
    cctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    confetti.forEach(p=>{
      p.y += p.speed; p.x += p.drift; p.rot += 0.05;
      cctx.save(); cctx.translate(p.x,p.y); cctx.rotate(p.rot);
      cctx.fillStyle = p.color; cctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
      cctx.restore();
    });
    if(t < dur) {
      requestAnimationFrame(frame);
    } else {
      confetti.length = 0;
      cctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    }
  })();
}
function runBalloons(){ const colors=['#fca5a5','#fdba74','#fde68a','#86efac','#93c5fd','#c4b5fd','#f0abfc']; for(let i=0;i<16;i++){ const b=document.createElement('div'); b.className='balloon'; b.style.left=Math.random()*100+'vw'; b.style.background=colors[Math.floor(Math.random()*colors.length)]; const dur=2.2+Math.random()*2.2, delay=Math.random()*0.4; b.style.animation=`floatUp ${dur}s ease-out ${delay}s forwards`; document.body.appendChild(b); setTimeout(()=>b.remove(), (dur+delay)*1000+200); }}

// ---------- Events ----------
$('#fileInput').addEventListener('change', (e)=>{ primeCelebrationAudio(); primeMoveAudio(); const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=> setImage(r.result); r.onerror=()=> alert('File read failed'); r.readAsDataURL(f); });
$('#shuffleBtn').addEventListener('click', ()=>{ primeCelebrationAudio(); primeMoveAudio(); shuffle(); });
$('#resetBtn').addEventListener('click', ()=>{ primeCelebrationAudio(); primeMoveAudio(); reset(); });

// ---------- Init ----------
(async function init(){ await setImage('assets/Shlok.jpg'); })();
