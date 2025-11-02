import React, { useState, useCallback, ChangeEvent } from 'react';
import { AnalysisMode } from '../types';
import { countWords } from '../utils/textUtils';
import { UploadIcon, FileIcon } from './icons';

interface UploadViewProps {
  onAnalyze: (text: string, mode: AnalysisMode) => void;
  error: string | null;
}

const MAX_WORDS = 30000;
const MAX_CHARS = 200000; // Character limit for performance

const UploadView: React.FC<UploadViewProps> = ({ onAnalyze, error }) => {
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.PLAGIARISM);
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);

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

  const isAnalyzeDisabled = text.trim().length === 0;
  const wordCountColor = wordCount > MAX_WORDS * 0.9 ? 'text-red-400' : 'text-slate-400';
  const charCountColor = text.length > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-slate-400';


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
          className={`w-full sm:w-auto text-lg font-semibold py-3 px-8 rounded-lg transition-all duration-200 ${
            mode === AnalysisMode.PLAGIARISM
              ? 'bg-cyan-500 text-slate-900 shadow-cyan-500/30 shadow-lg'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Plagiarism Check
        </button>
        <button
          onClick={() => setMode(AnalysisMode.HUMANIZE)}
          className={`w-full sm:w-auto text-lg font-semibold py-3 px-8 rounded-lg transition-all duration-200 ${
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
          className="w-full h-64 p-4 bg-slate-900 border-2 border-slate-700 rounded-lg resize-y focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors duration-200 text-slate-300"
          maxLength={MAX_CHARS}
        />
        {!text && (
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none text-slate-500">
                 <p className="mb-4">Or</p>
                <label htmlFor="file-upload" className="pointer-events-auto cursor-pointer inline-flex items-center px-6 py-3 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors">
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Upload Document
                </label>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.md" />
            </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-slate-400">
          {fileName && (
            <span className="flex items-center bg-slate-700/50 px-3 py-1 rounded-full">
              <FileIcon className="w-4 h-4 mr-2 text-slate-500" />
              {fileName}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4 text-sm">
            <p className={`font-medium ${charCountColor}`}>
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
            </p>
            <p className={`font-medium ${wordCountColor}`}>
              {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
            </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => onAnalyze(text, mode)}
          disabled={isAnalyzeDisabled}
          className="bg-green-600 text-white font-bold py-3 px-16 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:scale-100"
        >
          Analyze
        </button>
      </div>
    </div>
  );
};

export default UploadView;