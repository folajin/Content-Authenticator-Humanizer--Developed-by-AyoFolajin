import React, { useState, useCallback, ChangeEvent } from 'react';
import { AnalysisMode, AnalysisOptions, PlagiarismSensitivity, HumanizeStyle } from '../types';
import { countWords } from '../utils/textUtils';
import { UploadIcon, FileIcon } from './icons';

interface UploadViewProps {
  onAnalyze: (text: string, mode: AnalysisMode, options: AnalysisOptions) => void;
  error: string | null;
}

const MAX_WORDS = 30000;
const MAX_CHARS = 200000; // Character limit for performance

const UploadView: React.FC<UploadViewProps> = ({ onAnalyze, error }) => {
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.PLAGIARISM);
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [options, setOptions] = useState<AnalysisOptions>({
    plagiarismSensitivity: 'medium',
    humanizeStyle: 'default',
  });

  const handleTextChange = useCallback((newText: string) => {
    // Character limit is primarily enforced by textarea's maxLength.
    // This logic handles word count and truncation for pasted/loaded text.
    const currentWordCount = countWords(newText);
    if (currentWordCount <= MAX_WORDS) {
      setText(newText);
      setWordCount(currentWordCount);
    } else {
        const truncatedText = newText.split(/\s+/).slice(0, MAX_WORDS).join(' ');
        setText(truncatedText);
        setWordCount(MAX_WORDS);
    }
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        let fileContent = event.target?.result as string;
        // Enforce character limit on file content
        if (fileContent.length > MAX_CHARS) {
            fileContent = fileContent.substring(0, MAX_CHARS);
        }
        handleTextChange(fileContent);
        setFileName(file.name);
      };
      reader.readAsText(file);
    }
    // Reset file input to allow re-uploading the same file
    e.target.value = '';
  };

  const handleOptionChange = (key: keyof AnalysisOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const isAnalyzeDisabled = text.trim().length === 0;
  
  // More granular color logic for the word count indicator.
  const wordCountColor = (() => {
    if (wordCount >= MAX_WORDS) {
      return 'text-red-400';
    }
    if (wordCount > MAX_WORDS * 0.9) {
      return 'text-yellow-400';
    }
    return 'text-slate-400';
  })();
  
  const charCountColor = text.length > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-slate-400';

  const renderOptions = () => {
    if (mode === AnalysisMode.PLAGIARISM) {
      const sensitivities: { value: PlagiarismSensitivity; label: string }[] = [
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'strict', label: 'Strict' },
      ];
      return (
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Sensitivity Level</label>
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            {sensitivities.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleOptionChange('plagiarismSensitivity', value)}
                className={`flex-1 text-center text-sm font-semibold py-2 px-3 rounded-md transition-colors duration-200 ${
                  options.plagiarismSensitivity === value
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (mode === AnalysisMode.HUMANIZE) {
       const styles: { value: HumanizeStyle; label: string }[] = [
        { value: 'default', label: 'Default' },
        { value: 'casual', label: 'Casual' },
        { value: 'formal', label: 'Formal' },
        { value: 'simple', label: 'Simple' },
        { value: 'creative', label: 'Creative' },
        { value: 'technical', label: 'Technical' },
        { value: 'enthusiastic', label: 'Enthusiastic' },
      ];
       return (
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Humanization Style</label>
          <div className="flex flex-wrap gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
             {styles.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleOptionChange('humanizeStyle', value)}
                className={`flex-grow text-center text-sm font-semibold py-2 px-3 rounded-md transition-colors duration-200 ${
                  options.humanizeStyle === value
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 p-8 transition-all duration-300">
      {error && (
         <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
         </div>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => setMode(AnalysisMode.PLAGIARISM)}
          className={`w-full sm:w-auto text-lg font-semibold py-3 px-6 rounded-lg transition-all duration-200 ${
            mode === AnalysisMode.PLAGIARISM
              ? 'bg-cyan-500 text-slate-900 shadow-cyan-500/30 shadow-lg'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Plagiarism Check
        </button>
        <button
          onClick={() => setMode(AnalysisMode.AI_DETECTION)}
          className={`w-full sm:w-auto text-lg font-semibold py-3 px-6 rounded-lg transition-all duration-200 ${
            mode === AnalysisMode.AI_DETECTION
              ? 'bg-amber-500 text-slate-900 shadow-amber-500/30 shadow-lg'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          AI Check
        </button>
        <button
          onClick={() => setMode(AnalysisMode.HUMANIZE)}
          className={`w-full sm:w-auto text-lg font-semibold py-3 px-6 rounded-lg transition-all duration-200 ${
            mode === AnalysisMode.HUMANIZE
              ? 'bg-purple-500 text-slate-900 shadow-purple-500/30 shadow-lg'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Humanize Text
        </button>
      </div>

      <div className="relative group">
        <textarea
          value={text}
          onChange={(e) => {
            handleTextChange(e.target.value);
            setFileName(null);
          }}
          placeholder="Paste your text here..."
          className="w-full h-64 p-4 pr-32 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none"
          maxLength={MAX_CHARS}
        />
        <div className={`absolute bottom-4 right-5 text-sm font-medium transition-colors pointer-events-none ${wordCountColor}`}>
            {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-0 transition-opacity duration-300 rounded-lg pointer-events-none">
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center text-slate-300 hover:text-cyan-400 transition-colors pointer-events-auto">
                <UploadIcon className="w-12 h-12 mb-2" />
                <span className="font-semibold">Upload a file</span>
                <span className="text-sm text-slate-400">.txt, .md</span>
                <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md" />
            </label>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm">
        {fileName ? (
            <div className="flex items-center text-slate-400">
                <FileIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{fileName}</span>
            </div>
        ) : <div />}
        <div className="flex items-center space-x-4">
            <span className={charCountColor}>{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters</span>
        </div>
      </div>

      {renderOptions()}

      <button
        onClick={() => onAnalyze(text, mode, options)}
        disabled={isAnalyzeDisabled}
        className="w-full mt-6 bg-cyan-600 text-white font-bold py-4 px-6 rounded-lg text-lg hover:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-cyan-600/40 disabled:shadow-none"
      >
        Analyze
      </button>

    </div>
  );
};

export default UploadView;