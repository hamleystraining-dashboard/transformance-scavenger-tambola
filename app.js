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

// Generates a standard 9x27 tambola ticket (3 rows x 9 cols, 5 numbers per row)
function generateTicketGrid(){
  const colRanges = [
    [1,9],[10,19],[20,29],[30,39],[40,49],[50,59],[60,69],[70,79],[80,90]
  ];
  const colNumbers = colRanges.map(([lo,hi]) => {
    const pool = [];
    for(let n=lo;n<=hi;n++) pool.push(n);
    pool.sort(() => Math.random()-0.5);
    return pool;
  });

  // decide how many numbers each column gets across 3 rows (1-3 each, total 15)
  let colCounts = new Array(9).fill(1);
  let remaining = 15 - 9;
  while(remaining > 0){
    const c = Math.floor(Math.random()*9);
    if(colCounts[c] < 3){ colCounts[c]++; remaining--; }
  }

  const grid = [[null,null,null,null,null,null,null,null,null],
                [null,null,null,null,null,null,null,null,null],
                [null,null,null,null,null,null,null,null,null]];

  for(let c=0;c<9;c++){
    const rowsForCol = [0,1,2].sort(() => Math.random()-0.5).slice(0, colCounts[c]);
    const nums = colNumbers[c].slice(0, colCounts[c]).sort((a,b)=>a-b);
    rowsForCol.sort((a,b)=>a-b).forEach((r,i) => { grid[r][c] = nums[i]; });
  }

  // ensure each row has exactly 5 — fix rows with != 5 by rebalancing (rare edge case)
  for(let attempt=0; attempt<20; attempt++){
    const rowCounts = grid.map(row => row.filter(x => x!==null).length);
    if(rowCounts.every(c => c===5)) break;
    // rebuild if imbalanced
    return generateTicketGrid();
  }

  const flat = [];
  grid.forEach(row => row.forEach(v => flat.push(v)));
  return flat; // 27-length array, null for empty cells, in row-major order
}

function ticketToNumberArray(flat){
  return flat.filter(n => n !== null);
}

function renderTicketGrid(container, flat){
  container.innerHTML = '';
  flat.forEach(v => {
    const cell = document.createElement('div');
    cell.className = v === null ? 'cell empty' : 'cell';
    cell.textContent = v === null ? '' : v;
    container.appendChild(cell);
  });
}

function fmtTime(sec){
  if(sec < 0) sec = 0;
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = Math.floor(sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}
