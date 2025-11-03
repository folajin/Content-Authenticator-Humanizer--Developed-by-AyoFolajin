import React, { useState, useCallback } from 'react';
import { AnalysisMode, ResultData, AnalysisOptions } from './types';
import UploadView from './components/UploadView';
import ResultsView from './components/ResultsView';
import Loader from './components/Loader';
import FeedbackModal from './components/FeedbackModal';
import { checkPlagiarism, humanizeText, checkAiContent, UserFacingError } from './services/geminiService';
import { HeaderIcon, FeedbackIcon } from './components/icons';

type View = 'upload' | 'loading' | 'results';

const App: React.FC = () => {
  const [view, setView] = useState<View>('upload');
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const handleAnalyze = useCallback(async (text: string, mode: AnalysisMode, options: AnalysisOptions) => {
    setView('loading');
    setLoadingProgress(0);
    setError(null);

    const onProgress = (progress: number, message: string) => {
      setLoadingProgress(progress);
      setLoadingMessage(message);
    };

    try {
      if (mode === AnalysisMode.PLAGIARISM) {
        setLoadingMessage('Starting plagiarism analysis...');
        const plagiarismResults = await checkPlagiarism(text, onProgress, options);
        setResultData({
          originalText: text,
          plagiarismResults,
          mode,
          options,
        });
      } else if (mode === AnalysisMode.AI_DETECTION) {
        setLoadingMessage('Starting AI content analysis...');
        const aiDetectionResults = await checkAiContent(text, onProgress);
        setResultData({
            originalText: text,
            aiDetectionResults,
            mode,
            options,
        });
      } else {
        setLoadingMessage('Starting text humanization...');
        const humanizedText = await humanizeText(text, onProgress, options);
        setResultData({
          originalText: text,
          humanizedText,
          mode,
          options,
        });
      }
      setView('results');
    } catch (err) {
      console.error("Analysis failed:", err);
      if (err instanceof UserFacingError) {
        setError(err.message);
      } else if (err instanceof Error) {
        // For other unexpected errors, provide a more generic but helpful message
        setError('An unexpected technical issue occurred. Please check your connection or try again later.');
      } else {
        setError('An unknown error occurred during analysis.');
      }
      setView('upload'); // Go back to upload view on error
    }
  }, []);

  const handleReset = () => {
    setView('upload');
    setResultData(null);
    setLoadingProgress(0);
    setLoadingMessage('');
    setError(null);
  };

  const renderContent = () => {
    switch (view) {
      case 'loading':
        return <Loader progress={loadingProgress} message={loadingMessage} />;
      case 'results':
        return resultData && <ResultsView data={resultData} onReset={handleReset} />;
      case 'upload':
      default:
        return <UploadView onAnalyze={handleAnalyze} error={error} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl mx-auto flex items-center justify-center py-6">
        <HeaderIcon className="w-10 h-10 mr-4 text-cyan-400" />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight text-center">
          Content Authenticator & Humanizer
          <span className="block text-xl sm:text-2xl font-normal text-slate-400 mt-1">AyoFolajin</span>
        </h1>
      </header>
      <main className="w-full flex-grow flex flex-col items-center justify-center">
        {renderContent()}
      </main>
      <footer className="w-full max-w-5xl mx-auto text-center py-4 mt-8 flex justify-between items-center">
        <p className="text-sm text-slate-500">Powered by Google Gemini</p>
        <button 
          onClick={() => setIsFeedbackModalOpen(true)}
          className="flex items-center text-sm text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <FeedbackIcon className="w-4 h-4 mr-2" />
          Send Feedback
        </button>
      </footer>
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
      />
    </div>
  );
};

export default App;