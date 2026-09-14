import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-10 max-w-md w-full text-center border border-white/20">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-4xl font-bold text-white mb-3">Test Page</h1>
        <p className="text-purple-200 mb-8 text-lg">
          Everything is working! React + Vite + Tailwind CSS
        </p>

        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-white/80 text-sm mb-2">Interactive Counter</p>
          <p className="text-5xl font-bold text-white mb-4">{count}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setCount(count - 1)}
              className="px-5 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            >
              − Decrease
            </button>
            <button
              onClick={() => setCount(0)}
              className="px-5 py-2 bg-gray-500/80 hover:bg-gray-500 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Reset
            </button>
            <button
              onClick={() => setCount(count + 1)}
              className="px-5 py-2 bg-green-500/80 hover:bg-green-500 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            >
              + Increase
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-4 text-purple-300 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Build: OK
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            React: OK
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Tailwind: OK
          </span>
        </div>
      </div>
    </div>
  );
}
