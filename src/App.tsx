import { useState, useEffect, useRef } from 'react';

interface Mouse {
  id: number;
  row: number;
  col: number;
  targetRow: number;
  targetCol: number;
  progress: number;
  speed: number;
  caught: boolean;
  escaped: boolean;
  pathIndex: number;
  path: { row: number; col: number }[];
}

interface Cell {
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
}

const COLS = 13;
const ROWS = 9;
const CELL_SIZE = 60;

// Entry and exit
const ENTRY = { row: 0, col: 0 };
const EXIT = { row: ROWS - 1, col: COLS - 1 };

const catMessages = [
  'Мяу! Поймала! 😼',
  'Вкусная мышка! 😋',
  'Я — великий охотник! 🏆',
  'Мур-р-р, добыча! 😸',
  'Съела бы, но лень... 😴',
  'Легкотня! 💅',
  'Моя добыча! 🐾',
  'Ням-ням! 🍽️',
  'Котик доволен! 😻',
  'Муррр, молодец! ✨',
  'Быстрее ветра! 💨',
  'Мышь? Моя! 😾',
  'Охота удалась! 🎯',
  'Мяяяу! 🎉',
  'Ещё хочу! 😽',
  'Не убежишь! 🏃',
  'Ага, попалась! 🎪',
  'Слишком медленная! 😏',
];

const escapeMessages = [
  'Убежала! Пока-пока! 👋',
  'Не догонишь! 😜',
  'Свобода! 🎉',
  'Ха-ха-ха! 😂',
  'Котик — лох! 🤪',
  'Не поймал! 😝',
];

const moods = ['😿', '🙀', '😾', '😺', '😸', '😻', '😽'];

// Generate maze using iterative recursive backtracker
function generateMaze(cols: number, rows: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      walls: { top: true, right: true, bottom: true, left: true },
    }))
  );

  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  const directions = [
    { dr: -1, dc: 0, wall: 'top' as const, opposite: 'bottom' as const },
    { dr: 0, dc: 1, wall: 'right' as const, opposite: 'left' as const },
    { dr: 1, dc: 0, wall: 'bottom' as const, opposite: 'top' as const },
    { dr: 0, dc: -1, wall: 'left' as const, opposite: 'right' as const },
  ];

  const stack: { r: number; c: number }[] = [{ r: 0, c: 0 }];
  visited[0][0] = true;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const { r, c } = current;

    const shuffled = [...directions].sort(() => Math.random() - 0.5);
    const unvisitedNeighbors = shuffled.filter(dir => {
      const nr = r + dir.dr;
      const nc = c + dir.dc;
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc];
    });

    if (unvisitedNeighbors.length > 0) {
      const dir = unvisitedNeighbors[0];
      const nr = r + dir.dr;
      const nc = c + dir.dc;

      grid[r][c].walls[dir.wall] = false;
      grid[nr][nc].walls[dir.opposite] = false;
      visited[nr][nc] = true;
      stack.push({ r: nr, c: nc });
    } else {
      stack.pop();
    }
  }

  // Open entry (left wall of first cell)
  grid[ENTRY.row][ENTRY.col].walls.left = false;
  // Open exit (right wall of last cell)
  grid[EXIT.row][EXIT.col].walls.right = false;

  return grid;
}

// BFS to find shortest path from start to exit
function findPathToExit(grid: Cell[][], startRow: number, startCol: number): { row: number; col: number }[] {
  const visited: boolean[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(false)
  );
  const parent: ({ row: number; col: number } | null)[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(null)
  );

  const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }];
  visited[startRow][startCol] = true;

  const directions = [
    { dr: -1, dc: 0, wall: 'top' as const },
    { dr: 0, dc: 1, wall: 'right' as const },
    { dr: 1, dc: 0, wall: 'bottom' as const },
    { dr: 0, dc: -1, wall: 'left' as const },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.row === EXIT.row && current.col === EXIT.col) {
      // Reconstruct path
      const path: { row: number; col: number }[] = [];
      let node: { row: number; col: number } | null = current;
      while (node) {
        path.unshift(node);
        node = parent[node.row][node.col];
      }
      return path;
    }

    for (const dir of directions) {
      const nr = current.row + dir.dr;
      const nc = current.col + dir.dc;

      if (
        nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
        !visited[nr][nc] &&
        !grid[current.row][current.col].walls[dir.wall]
      ) {
        visited[nr][nc] = true;
        parent[nr][nc] = current;
        queue.push({ row: nr, col: nc });
      }
    }
  }

  // Fallback: no path found
  return [{ row: startRow, col: startCol }];
}

let nextMouseId = 0;

function createMouse(maze: Cell[][]): Mouse {
  // Random starting position in the maze
  const startRow = Math.floor(Math.random() * ROWS);
  const startCol = Math.floor(Math.random() * COLS);
  
  const path = findPathToExit(maze, startRow, startCol);
  return {
    id: nextMouseId++,
    row: startRow,
    col: startCol,
    targetRow: path.length > 1 ? path[1].row : startRow,
    targetCol: path.length > 1 ? path[1].col : startCol,
    progress: 0,
    speed: 0.015 + Math.random() * 0.015,
    caught: false,
    escaped: false,
    pathIndex: 0,
    path,
  };
}

export default function App() {
  const [meows, setMeows] = useState(0);
  const [catMood, setCatMood] = useState('😺');
  const [mice, setMice] = useState<Mouse[]>([]);
  const [caughtCount, setCaughtCount] = useState(0);
  const [escapedCount, setEscapedCount] = useState(0);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [maze] = useState(() => generateMaze(COLS, ROWS));
  const miceRef = useRef<Mouse[]>([]);
  const catRef = useRef<HTMLDivElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // Fixed paw positions
  const [pawPositions] = useState(() =>
    Array.from({ length: 10 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      rotate: Math.random() * 360,
    }))
  );

  // Track mouse cursor for cat eyes
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!catRef.current) return;

      const catRect = catRef.current.getBoundingClientRect();
      const catCenterX = catRect.left + catRect.width / 2;
      const catCenterY = catRect.top + catRect.height / 2;

      const deltaX = e.clientX - catCenterX;
      const deltaY = e.clientY - catCenterY;

      // Limit the eye movement
      const maxOffset = 8;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const normalizedDistance = Math.min(distance / 200, 1);

      const offsetX = (deltaX / distance) * maxOffset * normalizedDistance;
      const offsetY = (deltaY / distance) * maxOffset * normalizedDistance;

      setEyeOffset({ x: offsetX, y: offsetY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Initialize mice
  useEffect(() => {
    const initialMice: Mouse[] = Array.from({ length: 4 }, () => createMouse(maze));
    setMice(initialMice);
    miceRef.current = initialMice;
  }, [maze]);

  // Animate mice movement through maze
  useEffect(() => {
    const interval = setInterval(() => {
      setMice(prevMice => {
        const updated = prevMice.map(mouse => {
          if (mouse.caught || mouse.escaped) return mouse;

          // If reached target cell, advance to next in path
          if (mouse.progress >= 1) {
            const nextIndex = mouse.pathIndex + 1;

            // Reached exit?
            if (mouse.row === EXIT.row && mouse.col === EXIT.col) {
              return { ...mouse, escaped: true, progress: 1 };
            }

            if (nextIndex >= mouse.path.length) {
              return { ...mouse, escaped: true, progress: 1 };
            }

            const nextCell = mouse.path[nextIndex];
            return {
              ...mouse,
              row: mouse.targetRow,
              col: mouse.targetCol,
              targetRow: nextCell.row,
              targetCol: nextCell.col,
              progress: 0,
              pathIndex: nextIndex,
            };
          }

          return {
            ...mouse,
            progress: Math.min(1, mouse.progress + mouse.speed),
          };
        });

        // Handle escaped mice — remove them and spawn new ones
        const escaped = updated.filter(m => m.escaped);
        if (escaped.length > 0) {
          setEscapedCount(prev => prev + escaped.length);
          // Spawn new mice through entry
          const newMice = escaped.map(() => createMouse(maze));
          const remaining = updated.filter(m => !m.escaped);
          const result = [...remaining, ...newMice];
          miceRef.current = result;
          return result;
        }

        miceRef.current = updated;
        return updated;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [maze]);

  const handleMeow = () => {
    setMeows(meows + 1);
    setCatMood(moods[Math.floor(Math.random() * moods.length)]);
  };

  const handlePet = () => {
    setCatMood('😻');
    setMeows(meows + 5);
  };

  const catchMouse = (id: number) => {
    setMice(prevMice =>
      prevMice.map(mouse =>
        mouse.id === id ? { ...mouse, caught: true } : mouse
      )
    );
    setCaughtCount(caughtCount + 1);
    setCatMood('😸');
    setMeows(meows + 10);

    const randomMessage = catMessages[Math.floor(Math.random() * catMessages.length)];
    setSpeechBubble(randomMessage);
    setTimeout(() => setSpeechBubble(null), 2500);

    // Respawn mouse after 3 seconds at entry
    setTimeout(() => {
      setMice(prevMice =>
        prevMice.map(mouse => {
          if (mouse.id === id) {
            return createMouse(maze);
          }
          return mouse;
        })
      );
    }, 3000);
  };

  // Handle escape events
  useEffect(() => {
    if (escapedCount > 0) {
      const msg = escapeMessages[Math.floor(Math.random() * escapeMessages.length)];
      setSpeechBubble(msg);
      setCatMood('😿');
      setTimeout(() => setSpeechBubble(null), 2500);
    }
  }, [escapedCount]);

  // Calculate mouse pixel position
  const getMousePosition = (mouse: Mouse) => {
    const x = (mouse.col + (mouse.targetCol - mouse.col) * mouse.progress) * CELL_SIZE + CELL_SIZE / 2;
    const y = (mouse.row + (mouse.targetRow - mouse.row) * mouse.progress) * CELL_SIZE + CELL_SIZE / 2;
    return { x, y };
  };

  // Calculate rotation
  const getMouseRotation = (mouse: Mouse) => {
    const dr = mouse.targetRow - mouse.row;
    const dc = mouse.targetCol - mouse.col;
    if (dr === -1) return 0;
    if (dc === 1) return 90;
    if (dr === 1) return 180;
    if (dc === -1) return 270;
    return 0;
  };

  const mazeWidth = COLS * CELL_SIZE;
  const mazeHeight = ROWS * CELL_SIZE;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-orange-100 to-yellow-100 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Static paw prints */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {pawPositions.map((paw, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-15"
            style={{
              left: `${paw.left}%`,
              top: `${paw.top}%`,
              transform: `rotate(${paw.rotate}deg)`,
            }}
          >
            🐾
          </div>
        ))}
      </div>

      {/* Top menu bar */}
      <div className="w-full max-w-6xl bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border-2 border-pink-200 p-4 mb-4 relative z-10">
        <div className="flex items-center justify-between gap-4">
          {/* Left buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleMeow}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-pink-300 text-sm"
            >
              🐱 Мяукнуть
            </button>
            <button
              onClick={handlePet}
              className="px-4 py-2 bg-orange-400 hover:bg-orange-500 text-white rounded-full font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-orange-300 text-sm"
            >
              🤚 Погладить
            </button>
          </div>

          {/* Center cat with eyes tracking cursor */}
          <div className="relative flex-1 flex justify-center">
            {speechBubble && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg border-2 border-pink-300 relative whitespace-nowrap">
                  <p className="text-pink-700 font-semibold text-sm">{speechBubble}</p>
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r-2 border-b-2 border-pink-300 rotate-45"></div>
                </div>
              </div>
            )}
            <div
              ref={catRef}
              className="relative inline-block cursor-pointer transition-transform duration-300 hover:scale-110 select-none"
              onClick={handlePet}
            >
              {/* CSS Cat face */}
              <div className="relative w-20 h-20">
                {/* Ears */}
                <div className="absolute -top-3 left-1 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[18px] border-b-orange-400" />
                <div className="absolute -top-3 right-1 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[18px] border-b-orange-400" />
                {/* Inner ears */}
                <div className="absolute -top-1 left-[8px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-pink-300" />
                <div className="absolute -top-1 right-[8px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-pink-300" />

                {/* Head */}
                <div className="absolute inset-0 bg-orange-400 rounded-full shadow-md">
                  {/* Cheeks */}
                  <div className="absolute bottom-4 left-1 w-4 h-3 bg-pink-300/50 rounded-full" />
                  <div className="absolute bottom-4 right-1 w-4 h-3 bg-pink-300/50 rounded-full" />

                  {/* Eyes */}
                  <div className="absolute top-6 left-4 w-5 h-5 bg-white rounded-full overflow-hidden border border-gray-300">
                    <div
                      className="absolute w-3 h-3 bg-gray-800 rounded-full transition-transform duration-100"
                      style={{
                        transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                        top: '50%',
                        left: '50%',
                        marginTop: '-6px',
                        marginLeft: '-6px',
                      }}
                    >
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="absolute top-6 right-4 w-5 h-5 bg-white rounded-full overflow-hidden border border-gray-300">
                    <div
                      className="absolute w-3 h-3 bg-gray-800 rounded-full transition-transform duration-100"
                      style={{
                        transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                        top: '50%',
                        left: '50%',
                        marginTop: '-6px',
                        marginLeft: '-6px',
                      }}
                    >
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Nose */}
                  <div className="absolute top-[52%] left-1/2 -translate-x-1/2 w-3 h-2 bg-pink-500 rounded-full" />

                  {/* Mouth */}
                  <div className="absolute top-[62%] left-1/2 -translate-x-1/2 w-6 h-2">
                    <div className="absolute left-0 top-0 w-3 h-2 border-b-2 border-gray-700 rounded-b-full" />
                    <div className="absolute right-0 top-0 w-3 h-2 border-b-2 border-gray-700 rounded-b-full" />
                  </div>

                  {/* Whiskers */}
                  <div className="absolute top-[55%] left-0 w-5 h-[1px] bg-gray-600 -rotate-6" />
                  <div className="absolute top-[60%] left-0 w-5 h-[1px] bg-gray-600 rotate-6" />
                  <div className="absolute top-[55%] right-0 w-5 h-[1px] bg-gray-600 rotate-6" />
                  <div className="absolute top-[60%] right-0 w-5 h-[1px] bg-gray-600 -rotate-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Right buttons and stats */}
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl px-3 py-1.5 border border-blue-200">
                <p className="text-blue-700 font-bold text-xs">🐭 {caughtCount}</p>
              </div>
              <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-xl px-3 py-1.5 border border-red-200">
                <p className="text-red-700 font-bold text-xs">🏃 {escapedCount}</p>
              </div>
              <div className="bg-gradient-to-r from-pink-100 to-orange-100 rounded-xl px-3 py-1.5 border border-pink-200">
                <p className="text-pink-700 font-bold text-xs">💬 {meows}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMeows(0);
                setCatMood('😺');
              }}
              className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-full font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-gray-300 text-sm"
            >
              💤 Усыпить
            </button>
          </div>
        </div>
      </div>

      {/* Maze container */}
      <div
        className="relative bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-pink-200 shadow-xl overflow-visible"
        style={{ width: mazeWidth, height: mazeHeight }}
      >
        {/* Entry marker */}
        <div
          className="absolute flex flex-col items-center z-20"
          style={{
            left: -40,
            top: ENTRY.row * CELL_SIZE + CELL_SIZE / 2,
            transform: 'translateY(-50%)',
          }}
        >
          <span className="text-2xl">🚪</span>
          <span className="text-xs font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded mt-0.5">ВХОД</span>
        </div>

        {/* Exit marker */}
        <div
          className="absolute flex flex-col items-center z-20"
          style={{
            right: -40,
            top: EXIT.row * CELL_SIZE + CELL_SIZE / 2,
            transform: 'translateY(-50%)',
          }}
        >
          <span className="text-2xl">🏁</span>
          <span className="text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded mt-0.5">ВЫХОД</span>
        </div>

        {/* Maze walls SVG */}
        <svg
          className="absolute inset-0"
          width={mazeWidth}
          height={mazeHeight}
          viewBox={`0 0 ${mazeWidth} ${mazeHeight}`}
        >
          {maze.map((row, r) =>
            row.map((cell, c) => {
              const x = c * CELL_SIZE;
              const y = r * CELL_SIZE;
              return (
                <g key={`${r}-${c}`}>
                  {cell.walls.top && (
                    <line x1={x} y1={y} x2={x + CELL_SIZE} y2={y} stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
                  )}
                  {cell.walls.right && (
                    <line x1={x + CELL_SIZE} y1={y} x2={x + CELL_SIZE} y2={y + CELL_SIZE} stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
                  )}
                  {cell.walls.bottom && (
                    <line x1={x} y1={y + CELL_SIZE} x2={x + CELL_SIZE} y2={y + CELL_SIZE} stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
                  )}
                  {cell.walls.left && (
                    <line x1={x} y1={y} x2={x} y2={y + CELL_SIZE} stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
                  )}
                </g>
              );
            })
          )}
        </svg>

        {/* Mice */}
        {mice.map(mouse => {
          const pos = getMousePosition(mouse);
          const rotation = getMouseRotation(mouse);
          return (
            <div
              key={mouse.id}
              className={`absolute text-3xl cursor-pointer transition-all duration-300 ${
                mouse.caught ? 'opacity-30 scale-50' : 'hover:scale-125'
              }`}
              style={{
                left: pos.x,
                top: pos.y,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                zIndex: 10,
              }}
              onClick={() => !mouse.caught && !mouse.escaped && catchMouse(mouse.id)}
            >
              {mouse.caught ? '💀' : '🐭'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
