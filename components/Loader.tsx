import React from 'react';

interface LoaderProps {
  progress: number;
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ progress, message }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // Circle SVG properties
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // Calculate the offset based on progress
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 animate-pulse-glow overflow-hidden">
      <h2 className="text-2xl font-semibold text-slate-200 mb-4 flex items-center">
        Analyzing Document
        <span className="animated-dots ml-1">
          <span className="dot-1">.</span>
          <span className="dot-2">.</span>
          <span className="dot-3">.</span>
        </span>
      </h2>
      <p key={message} className="text-slate-400 mb-8 text-center h-5 animate-fade-in-up">
        {message}
      </p>
      
      {/* Circular Progress Indicator */}
      <div className="relative w-40 h-40 mb-8">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="scannerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'rgba(56, 189, 248, 0)' }} />
              <stop offset="100%" style={{ stopColor: 'rgba(34, 211, 238, 0.7)' }} />
            </linearGradient>
          </defs>
          {/* Background Track */}
          <circle
            className="stroke-slate-700"
            strokeWidth="10"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
          {/* Animated Scanner */}
          <circle
            className="animate-spin-loader"
            stroke="url(#scannerGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
            strokeDasharray={`120 ${circumference - 120}`}
          />
          {/* Main Progress */}
          <circle
            className="stroke-cyan-500 transform -rotate-90 origin-center transition-all duration-500 ease-out"
            style={{ strokeDashoffset: offset }}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-cyan-400 animate-pulse-subtle">{Math.round(clampedProgress)}%</p>
        </div>
      </div>

       <div className="text-sm text-slate-500 text-center">
        <p>This may take a few moments for large documents.</p>
        <p>Please don't close this window.</p>
       </div>
       {/* CSS for animations */}
       <style>{`
        @keyframes dot-blink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
        .animated-dots span {
          animation-name: dot-blink;
          animation-duration: 1.4s;
          animation-iteration-count: infinite;
          animation-fill-mode: both;
        }
        .animated-dots .dot-2 { animation-delay: .2s; }
        .animated-dots .dot-3 { animation-delay: .4s; }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.1), 0 0 0px rgba(56, 189, 248, 0.1); }
          50% { box-shadow: 0 0 30px rgba(56, 189, 248, 0.2), 0 0 10px rgba(56, 189, 248, 0.15); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s infinite ease-in-out;
        }

        @keyframes spin-loader {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-loader {
          transform-origin: center;
          animation: spin-loader 1.5s linear infinite;
        }

        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2.5s infinite ease-in-out;
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Loader;
