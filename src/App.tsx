import { useState, useEffect } from 'react';

interface Mouse {
  id: number;
  x: number;
  y: number;
  direction: number;
  speed: number;
  caught: boolean;
}

export default function App() {
  const [meows, setMeows] = useState(0);
  const [catMood, setCatMood] = useState('😺');
  const [mice, setMice] = useState<Mouse[]>([]);
  const [caughtCount, setCaughtCount] = useState(0);

  const moods = ['😿', '🙀', '😾', '😺', '😸', '😻', '😽'];

  // Initialize mice
  useEffect(() => {
    const initialMice: Mouse[] = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      direction: Math.random() * 360,
      speed: 0.3 + Math.random() * 0.5,
      caught: false,
    }));
    setMice(initialMice);
  }, []);

  // Animate mice movement
  useEffect(() => {
    const interval = setInterval(() => {
      setMice(prevMice =>
        prevMice.map(mouse => {
          if (mouse.caught) return mouse;

          // Random direction changes
          const newDirection = mouse.direction + (Math.random() - 0.5) * 30;
          const rad = (newDirection * Math.PI) / 180;

          let newX = mouse.x + Math.cos(rad) * mouse.speed;
          let newY = mouse.y + Math.sin(rad) * mouse.speed;

          // Bounce off edges
          let finalDirection = newDirection;
          if (newX < 5 || newX > 95) {
            finalDirection = 180 - newDirection;
            newX = Math.max(5, Math.min(95, newX));
          }
          if (newY < 5 || newY > 95) {
            finalDirection = 360 - newDirection;
            newY = Math.max(5, Math.min(95, newY));
          }

          return {
            ...mouse,
            x: newX,
            y: newY,
            direction: finalDirection,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

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

    // Respawn mouse after 3 seconds
    setTimeout(() => {
      setMice(prevMice =>
        prevMice.map(mouse =>
          mouse.id === id
            ? {
                ...mouse,
                caught: false,
                x: Math.random() * 80 + 10,
                y: Math.random() * 80 + 10,
              }
            : mouse
        )
      );
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-orange-100 to-yellow-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Floating paw prints */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-20 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            🐾
          </div>
        ))}
      </div>

      {/* Running mice */}
      {mice.map(mouse => (
        <div
          key={mouse.id}
          className={`absolute text-4xl cursor-pointer transition-transform duration-100 ${
            mouse.caught ? 'opacity-30 scale-50' : 'hover:scale-125'
          }`}
          style={{
            left: `${mouse.x}%`,
            top: `${mouse.y}%`,
            transform: `translate(-50%, -50%) rotate(${mouse.direction + 90}deg)`,
            zIndex: 5,
          }}
          onClick={() => !mouse.caught && catchMouse(mouse.id)}
        >
          {mouse.caught ? '💀' : '🐭'}
        </div>
      ))}

      <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border-2 border-pink-200 relative z-10">
        {/* Cat face */}
        <div className="text-8xl mb-4 transition-all duration-300 hover:scale-110 cursor-pointer" onClick={handlePet}>
          {catMood}
        </div>

        <h1 className="text-4xl font-bold text-pink-700 mb-2">Мяу-мир 🐱</h1>
        <p className="text-orange-600 mb-6 text-lg">
          Нажми на котика, чтобы погладить!
        </p>

        {/* Mouse catching stats */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-4 mb-4 border border-blue-200">
          <p className="text-blue-700 font-semibold mb-1">🐭 Поймано мышей</p>
          <p className="text-3xl font-bold text-blue-800">{caughtCount}</p>
          <p className="text-blue-600 text-xs mt-1">Кликай на мышей, чтобы ловить!</p>
        </div>

        {/* Meow counter */}
        <div className="bg-gradient-to-r from-pink-100 to-orange-100 rounded-2xl p-6 mb-6 border border-pink-200">
          <p className="text-pink-600 text-sm mb-1 font-medium">Количество мяуканий</p>
          <p className="text-5xl font-bold text-pink-700 mb-4">{meows} <span className="text-2xl">мяу!</span></p>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={handleMeow}
              className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-pink-300"
            >
              🐱 Мяукнуть
            </button>
            <button
              onClick={handlePet}
              className="px-5 py-2.5 bg-orange-400 hover:bg-orange-500 text-white rounded-full font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-orange-300"
            >
              🤚 Погладить
            </button>
            <button
              onClick={() => { setMeows(0); setCatMood('😺'); }}
              className="px-5 py-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded-full font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-gray-300"
            >
              💤 Усыпить
            </button>
          </div>
        </div>

        {/* Cat facts */}
        <div className="bg-white/50 rounded-xl p-4 mb-4 text-left">
          <p className="text-pink-700 font-semibold mb-2">🐾 Факты о котиках:</p>
          <ul className="text-gray-700 text-sm space-y-1">
            <li>• Котики спят 12-16 часов в день 😴</li>
            <li>• У котиков 230 костей в теле 🦴</li>
            <li>• Котики могут издавать более 100 звуков 🔊</li>
          </ul>
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
