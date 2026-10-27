// Portrait cards stay hidden until real character art exists.
// The gray stand-in used to ship with a SPEAK line and a placeholder label.

const CAST = {
  MARCUS: 'MARCUS',
  REYES: 'REYES',
  KARA: 'KARA',
  THOMAS: 'THOMAS',
  ELENA: 'ELENA',
  DAVID: 'DAVID',
  VERA: 'VERA',
  LEDGER: 'THE LEDGER',
  'OMEGA-7': 'OMEGA-7',
  HUNTER: 'THE HUNTER',
  'ANGELA M.': 'ANGELA M.',
  WARDEN: 'THE WARDEN',
};

// Flip this only when a real portrait set replaces the drawn stand-in.
const PORTRAIT_ART = false;

let card, canvas, ctx, nameEl;

export function mountPortrait(host){
  if (card) return card;
  card = document.createElement('div');
  card.id = 'portraitCard';
  canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 320;
  ctx = canvas.getContext('2d');
  const meta = document.createElement('div');
  meta.className = 'pmeta';
  nameEl = document.createElement('div');
  nameEl.className = 'pname';
  meta.append(nameEl);
  card.append(canvas, meta);
  const parent = host || document.body;
  if (parent.firstChild) parent.insertBefore(card, parent.firstChild);
  else parent.appendChild(card);
  return card;
}

export function showPortrait(who, expr){
  if (!PORTRAIT_ART){
    hidePortrait();
    return;
  }
  if (!card) mountPortrait(document.getElementById('storyWrap') || document.body);
  const key = who && CAST[who] ? who : null;
  if (!key){ hidePortrait(); return; }
  const face = expr === 'tense' || expr === 'speak' ? expr : 'neutral';
  nameEl.textContent = CAST[key];
  draw(key, face);
  card.classList.add('on');
  card.dataset.who = key;
  card.dataset.expr = face;
}

export function hidePortrait(){
  if (card) card.classList.remove('on');
}

function draw(who, expr){
  const g = ctx;
  const w = canvas.width, h = canvas.height;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#14120f';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(231,201,138,.45)';
  g.lineWidth = 2;
  g.strokeRect(8, 8, w - 16, h - 16);
  // shoulders and head are shapes, not a face
  g.fillStyle = '#2a2622';
  g.beginPath();
  g.moveTo(40, h - 18);
  g.lineTo(70, 190);
  g.lineTo(210, 190);
  g.lineTo(w - 40, h - 18);
  g.fill();
  g.fillStyle = who === 'HUNTER' || who === 'LEDGER' || who === 'OMEGA-7' ? '#3a3030' : '#6a5a48';
  g.beginPath();
  g.arc(140, 118, 48, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(244,236,223,.35)';
  g.beginPath();
  if (expr === 'tense'){
    g.moveTo(112, 96); g.lineTo(132, 104);
    g.moveTo(168, 96); g.lineTo(148, 104);
  } else if (expr === 'speak'){
    g.moveTo(122, 142); g.lineTo(158, 142);
    g.moveTo(128, 150); g.lineTo(152, 146);
  } else {
    g.moveTo(116, 100); g.lineTo(136, 100);
    g.moveTo(144, 100); g.lineTo(164, 100);
  }
  g.stroke();
}
