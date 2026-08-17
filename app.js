// Transformer Scavenger Tambola — shared client & helpers
const SUPABASE_URL = "https://htamhljlypylsuarjcjj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0YW1obGpseXB5bHN1YXJqY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjIwOTgsImV4cCI6MjEwMjUzODA5OH0.InPFdc4BG9aafIRM8APqtkPvvn-U09uWH9cL4PBGybE";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORY_LABELS = {
  fast_five: "Fast Five",
  four_corners: "Four Corners",
  top_line: "Top Line",
  middle_line: "Middle Line",
  bottom_line: "Bottom Line",
  full_house: "Full House"
};
const CATEGORY_ORDER = ["fast_five","four_corners","top_line","middle_line","bottom_line","full_house"];
const CLAIM_WINDOW_SECONDS = 120;

function showToast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3300);
}

// Generates a standard, correctly-formed 9x27 tambola ticket:
// 3 rows x 9 cols, 5 numbers per row, 1-3 numbers per column,
// numbers within each column strictly increasing top to bottom,
// column ranges: 1-9, 10-19, 20-29, ..., 80-90 (last col is 80-90, 11 numbers)
function generateTicketGrid(){
  const colRanges = [
    [1,9],[10,19],[20,29],[30,39],[40,49],[50,59],[60,69],[70,79],[80,90]
  ];

  for(let attempt=0; attempt<50; attempt++){
    // Step 1: decide how many numbers each column gets (1-3 each, total 15)
    let colCounts = new Array(9).fill(1);
    let remaining = 15 - 9;
    let guard = 0;
    while(remaining > 0 && guard < 500){
      const c = Math.floor(Math.random()*9);
      if(colCounts[c] < 3){ colCounts[c]++; remaining--; }
      guard++;
    }

    // Step 2: decide which rows within each column get a number,
    // constrained so every row ends up with exactly 5 numbers total
    const rowCounts = [0,0,0];
    const colRowAssignment = []; // colRowAssignment[c] = array of row indices (sorted)
    let feasible = true;

    // shuffle column order so the greedy row-balancing isn't biased
    const colOrder = [0,1,2,3,4,5,6,7,8].sort(() => Math.random()-0.5);

    for(const c of colOrder){
      const need = colCounts[c];
      // pick rows with the fewest numbers so far, to keep rows balanced at 5 each
      const rowsByLoad = [0,1,2].sort((a,b) => rowCounts[a]-rowCounts[b] || Math.random()-0.5);
      const chosen = rowsByLoad.slice(0, need);
      chosen.forEach(r => rowCounts[r]++);
      colRowAssignment[c] = chosen.sort((a,b)=>a-b);
    }

    if(!rowCounts.every(r => r === 5)) { feasible = false; }
    if(!feasible) continue;

    // Step 3: pick actual numbers per column, sorted ascending into the chosen rows
    const grid = [
      new Array(9).fill(null),
      new Array(9).fill(null),
      new Array(9).fill(null)
    ];
    let ok = true;
    for(let c=0;c<9;c++){
      const [lo,hi] = colRanges[c];
      const pool = [];
      for(let n=lo;n<=hi;n++) pool.push(n);
      pool.sort(() => Math.random()-0.5);
      const picked = pool.slice(0, colCounts[c]).sort((a,b)=>a-b);
      if(picked.length !== colCounts[c]){ ok = false; break; }
      colRowAssignment[c].forEach((r,i) => { grid[r][c] = picked[i]; });
    }
    if(!ok) continue;

    const flat = [];
    grid.forEach(row => row.forEach(v => flat.push(v)));
    return flat; // 27-length array, null for empty cells, in row-major order
  }

  // extremely unlikely fallback
  throw new Error('Could not generate a valid ticket — please try again.');
}

function ticketToNumberArray(flat){
  return flat.filter(n => n !== null);
}

function renderTicketGrid(container, flat, ticketNo){
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'ticket';

  const header = document.createElement('div');
  header.className = 'ticket-header';
  header.innerHTML = `<span class="tno">Ticket ${ticketNo ? '#' + ticketNo : ''}</span><span class="tbrand">Transformer<br>Scavenger Tambola</span>`;
  wrapper.appendChild(header);

  const body = document.createElement('div');
  body.className = 'ticket-body';

  for(let r=0;r<3;r++){
    const rowEl = document.createElement('div');
    rowEl.className = 'ticket-row';
    for(let c=0;c<9;c++){
      const v = flat[r*9 + c];
      const cell = document.createElement('div');
      cell.className = v === null ? 'cell empty' : 'cell';
      cell.textContent = v === null ? '' : v;
      rowEl.appendChild(cell);
    }
    body.appendChild(rowEl);
  }
  wrapper.appendChild(body);

  container.appendChild(wrapper);
}

function fmtTime(sec){
  if(sec < 0) sec = 0;
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = Math.floor(sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function generateGameCode(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  let code = '';
  for(let i=0;i<6;i++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}
