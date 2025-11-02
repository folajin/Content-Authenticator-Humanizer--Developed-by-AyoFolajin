import React from 'react';

interface LoaderProps {
  progress: number;
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ progress, message }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700">
      <h2 className="text-2xl font-semibold text-slate-200 mb-4">Analyzing Document...</h2>
      <p className="text-slate-400 mb-6">{message}</p>
      <div className="w-full bg-slate-700 rounded-full h-4">
        <div
          className="bg-cyan-500 h-4 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
       <p className="text-lg font-bold text-cyan-400 mt-4">{Math.round(clampedProgress)}%</p>
       <div className="mt-8 text-sm text-slate-500 text-center">
        <p>This may take a few moments for large documents.</p>
        <p>Please don't close this window.</p>
       </div>
    </div>
  );
};

export default Loader;
