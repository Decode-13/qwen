import { useState, useEffect, useRef } from 'react';

interface Mouse {
  id: number;
  row: number;
  col: number;
  targetRow: number;
  targetCol: number;
  progress: number; // 0 to 1 between current and target cell
  speed: number;
  caught: boolean;
}

interface Cell {
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
}

const COLS = 13;
const ROWS = 9;
const CELL_SIZE = 60;

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

  // Iterative DFS
  const stack: { r: number; c: number }[] = [{ r: 0, c: 0 }];
  visited[0][0] = true;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const { r, c } = current;

    // Find unvisited neighbors
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

  return grid;
}

// Get available directions from a cell
function getAvailableDirections(grid: Cell[][], row: number, col: number) {
  const dirs: { dr: number; dc: number }[] = [];
  if (!grid[row][col].walls.top && row > 0) dirs.push({ dr: -1, dc: 0 });
  if (!grid[row][col].walls.right && col < COLS - 1) dirs.push({ dr: 0, dc: 1 });
  if (!grid[row][col].walls.bottom && row < ROWS - 1) dirs.push({ dr: 1, dc: 0 });
  if (!grid[row][col].walls.left && col > 0) dirs.push({ dr: 0, dc: -1 });
  return dirs;
}

export default function App() {
  const [meows, setMeows] = useState(0);
  const [catMood, setCatMood] = useState('😺');
  const [mice, setMice] = useState<Mouse[]>([]);
  const [caughtCount, setCaughtCount] = useState(0);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [maze] = useState(() => generateMaze(COLS, ROWS));
  const miceRef = useRef<Mouse[]>([]);

  // Fixed paw positions
  const [pawPositions] = useState(() =>
    Array.from({ length: 10 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      rotate: Math.random() * 360,
    }))
  );

  // Initialize mice at random positions in the maze
  useEffect(() => {
    const initialMice: Mouse[] = Array.from({ length: 5 }, (_, i) => {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      return {
        id: i,
        row,
        col,
        targetRow: row,
        targetCol: col,
        progress: 0,
        speed: 0.02 + Math.random() * 0.02,
        caught: false,
      };
    });
    setMice(initialMice);
    miceRef.current = initialMice;
  }, []);

  // Animate mice movement through maze
  useEffect(() => {
    const interval = setInterval(() => {
      setMice(prevMice => {
        const updated = prevMice.map(mouse => {
          if (mouse.caught) return mouse;

          // If reached target, pick new direction
          if (mouse.progress >= 1) {
            const newRow = mouse.targetRow;
            const newCol = mouse.targetCol;
            const available = getAvailableDirections(maze, newRow, newCol);

            if (available.length === 0) return mouse;

            // Prefer not going back
            const prevDir = {
              dr: mouse.targetRow - mouse.row,
              dc: mouse.targetCol - mouse.col,
            };
            const opposite = available.filter(
              d => !(d.dr === -prevDir.dr && d.dc === -prevDir.dc)
            );
            const choices = opposite.length > 0 ? opposite : available;

            const choice = choices[Math.floor(Math.random() * choices.length)];

            return {
              ...mouse,
              row: newRow,
              col: newCol,
              targetRow: newRow + choice.dr,
              targetCol: newCol + choice.dc,
              progress: 0,
            };
          }

          return {
            ...mouse,
            progress: Math.min(1, mouse.progress + mouse.speed),
          };
        });
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

    // Respawn mouse after 3 seconds at random position
    setTimeout(() => {
      setMice(prevMice =>
        prevMice.map(mouse => {
          if (mouse.id === id) {
            const row = Math.floor(Math.random() * ROWS);
            const col = Math.floor(Math.random() * COLS);
            return {
              ...mouse,
              caught: false,
              row,
              col,
              targetRow: row,
              targetCol: col,
              progress: 0,
            };
          }
          return mouse;
        })
      );
    }, 3000);
  };

  // Calculate mouse pixel position (interpolated between cells)
  const getMousePosition = (mouse: Mouse) => {
    const x = (mouse.col + (mouse.targetCol - mouse.col) * mouse.progress) * CELL_SIZE + CELL_SIZE / 2;
    const y = (mouse.row + (mouse.targetRow - mouse.row) * mouse.progress) * CELL_SIZE + CELL_SIZE / 2;
    return { x, y };
  };

  // Calculate rotation based on movement direction
  const getMouseRotation = (mouse: Mouse) => {
    const dr = mouse.targetRow - mouse.row;
    const dc = mouse.targetCol - mouse.col;
    if (dr === -1) return 0; // up
    if (dc === 1) return 90; // right
    if (dr === 1) return 180; // down
    if (dc === -1) return 270; // left
    return 0;
  };

  const mazeWidth = COLS * CELL_SIZE;
  const mazeHeight = ROWS * CELL_SIZE;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-orange-100 to-yellow-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
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

      {/* Title */}
      <h1 className="text-4xl font-bold text-pink-700 mb-3 relative z-10">Мяу-мир 🐱</h1>
      <p className="text-orange-600 mb-4 text-lg relative z-10">
        Лови мышей в лабиринте!
      </p>

      {/* Maze container */}
      <div
        className="relative bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-pink-200 shadow-xl overflow-hidden"
        style={{ width: mazeWidth, height: mazeHeight }}
      >
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
              className={`absolute text-3xl cursor-pointer transition-opacity duration-300 ${
                mouse.caught ? 'opacity-30 scale-50' : 'hover:scale-125'
              }`}
              style={{
                left: pos.x,
                top: pos.y,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                zIndex: 10,
              }}
              onClick={() => !mouse.caught && catchMouse(mouse.id)}
            >
              {mouse.caught ? '💀' : '🐭'}
            </div>
          );
        })}
      </div>

      {/* Stats and controls */}
      <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-6 max-w-md w-full text-center border-2 border-pink-200 relative z-10 mt-4">
        {/* Cat face with speech bubble */}
        <div className="relative inline-block mb-3">
          {speechBubble && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 animate-[fadeIn_0.3s_ease-out]">
              <div className="bg-white rounded-2xl px-4 py-2 shadow-lg border-2 border-pink-300 relative whitespace-nowrap">
                <p className="text-pink-700 font-semibold text-sm">{speechBubble}</p>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r-2 border-b-2 border-pink-300 rotate-45"></div>
              </div>
            </div>
          )}
          <div
            className="text-7xl transition-all duration-300 hover:scale-110 cursor-pointer"
            onClick={handlePet}
          >
            {catMood}
          </div>
        </div>

        {/* Mouse catching stats */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-3 mb-3 border border-blue-200">
          <p className="text-blue-700 font-semibold text-sm">🐭 Поймано мышей</p>
          <p className="text-3xl font-bold text-blue-800">{caughtCount}</p>
        </div>

        {/* Meow counter */}
        <div className="bg-gradient-to-r from-pink-100 to-orange-100 rounded-2xl p-4 mb-3 border border-pink-200">
          <p className="text-pink-600 text-sm mb-1 font-medium">Количество мяуканий</p>
          <p className="text-4xl font-bold text-pink-700 mb-3">
            {meows} <span className="text-xl">мяу!</span>
          </p>

          <div className="flex gap-2 justify-center flex-wrap">
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

        {/* Status */}
        <div className="flex justify-center gap-4 text-pink-600 text-sm flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></span>
            Мурчание: ОК
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
            Хвостик: ОК
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            Усы: ОК
          </span>
        </div>
      </div>
    </div>
  );
}
