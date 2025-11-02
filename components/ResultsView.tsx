import React, { useState, useCallback, useRef } from 'react';
import { AnalysisMode, ResultData } from '../types';
import { CopyIcon, CheckIcon, GitHubIcon, DownloadIcon, PDFIcon, ExternalLinkIcon } from './icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultsViewProps {
  data: ResultData;
  onReset: () => void;
}

const PlagiarismResultDisplay: React.FC<{ data: ResultData }> = ({ data }) => {
  const results = data.plagiarismResults;
  if (!results) return null;

  const scoreColor =
    results.overallScore > 50
      ? 'text-red-500'
      : results.overallScore > 20
      ? 'text-yellow-500'
      : 'text-green-500';

  return (
    <div className="w-full">
      <div className="bg-slate-900 p-6 rounded-lg mb-6 text-center">
        <h3 className="text-lg font-medium text-slate-400">Plagiarism Score</h3>
        <p className={`text-6xl font-bold ${scoreColor}`}>{results.overallScore}%</p>
      </div>
      <div className="bg-slate-900 p-6 rounded-lg max-h-[50vh] overflow-y-auto border border-slate-700">
        <h4 className="font-bold text-slate-200 mb-4">Document Text</h4>
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
          {results.segments.map((segment, index) =>
            segment.isPlagiarized ? (
              <span key={index} className="relative group">
                <span className="bg-yellow-500/30 cursor-pointer rounded px-1">
                  {segment.text}
                </span>
                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-800 border border-slate-600 text-white text-sm rounded-lg p-3 z-10 shadow-lg">
                  <p className="font-bold">Suspected Source</p>
                  <a
                    href={segment.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-cyan-400 hover:underline max-w-full"
                  >
                    <span className="truncate">{segment.source}</span>
                    <ExternalLinkIcon className="w-4 h-4 ml-1.5 shrink-0" />
                  </a>
                  <p className="mt-2">
                    Confidence: <span className="font-semibold">{Math.round((segment.score || 0) * 100)}%</span>
                  </p>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-slate-600"></div>
                </div>
              </span>
            ) : (
              <span key={index}>{segment.text}</span>
            )
          )}
        </p>
      </div>
    </div>
  );
};


const HumanizeResultDisplay: React.FC<{ data: ResultData }> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (data.humanizedText) {
      navigator.clipboard.writeText(data.humanizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full grid md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
          <span className="w-2.5 h-2.5 mr-3 rounded-full bg-slate-500 flex-shrink-0"></span>
          Original Text
        </h3>
        <div className="bg-slate-900 p-4 rounded-lg h-96 overflow-y-auto border border-slate-700 text-slate-400 whitespace-pre-wrap">
          {data.originalText}
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-slate-300 flex items-center">
            <span className="w-2.5 h-2.5 mr-3 rounded-full bg-cyan-400 flex-shrink-0"></span>
            Humanized Text
          </h3>
          <button
            onClick={handleCopy}
            className="flex items-center text-sm bg-slate-700/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 font-semibold py-2 px-3 rounded-lg transition-all duration-200"
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4 mr-2 text-green-400" /> Copied!
              </>
            ) : (
              <>
                <CopyIcon className="w-4 h-4 mr-2" /> Copy
              </>
            )}
          </button>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg h-96 overflow-y-auto border border-cyan-500/30 text-slate-200 whitespace-pre-wrap">
          {data.humanizedText}
        </div>
      </div>
    </div>
  );
};


const ResultsView: React.FC<ResultsViewProps> = ({ data, onReset }) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownload = useCallback(() => {
    let reportContent = '';
    let fileName = 'analysis-report.txt';

    if (data.mode === AnalysisMode.PLAGIARISM && data.plagiarismResults) {
      fileName = 'plagiarism-report.txt';
      const { overallScore, segments } = data.plagiarismResults;
      
      reportContent += `Plagiarism Analysis Report\n`;
      reportContent += `============================\n\n`;
      reportContent += `Overall Plagiarism Score: ${overallScore}%\n\n`;
      reportContent += `----------------------------\n`;
      reportContent += `DETAILED BREAKDOWN\n`;
      reportContent += `----------------------------\n\n`;

      segments.forEach(segment => {
        if (segment.isPlagiarized) {
          reportContent += `[PLAGIARIZED - Confidence: ${Math.round((segment.score || 0) * 100)}%]\n`;
          reportContent += `Source: ${segment.source}\n`;
          reportContent += `Text: "${segment.text}"\n\n`;
        } else {
          reportContent += `[Original]\n`;
          reportContent += `Text: "${segment.text}"\n\n`;
        }
      });

    } else if (data.mode === AnalysisMode.HUMANIZE && data.humanizedText) {
      fileName = 'humanization-report.txt';
      reportContent += `Text Humanization Report\n`;
      reportContent += `========================\n\n`;
      reportContent += `--- ORIGINAL TEXT ---\n\n${data.originalText}\n\n`;
      reportContent += `--- HUMANIZED TEXT ---\n\n${data.humanizedText}\n`;
    }

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  const handleExportPdf = useCallback(async () => {
    if (!exportRef.current || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2, // Higher scale for better quality
        backgroundColor: '#1e293b', // slate-800, matches card background
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const canvasAspectRatio = canvasWidth / canvasHeight;
      const pageAspectRatio = pdfWidth / pdfHeight;

      let finalCanvasWidth, finalCanvasHeight;

      if (canvasAspectRatio > pageAspectRatio) {
        finalCanvasWidth = pdfWidth;
        finalCanvasHeight = pdfWidth / canvasAspectRatio;
      } else {
        finalCanvasHeight = pdfHeight;
        finalCanvasWidth = pdfHeight * canvasAspectRatio;
      }

      const x = (pdfWidth - finalCanvasWidth) / 2;
      const y = (pdfHeight - finalCanvasHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, finalCanvasWidth, finalCanvasHeight);
      
      const fileName = data.mode === AnalysisMode.PLAGIARISM 
        ? 'plagiarism-report.pdf' 
        : 'humanization-report.pdf';

      pdf.save(fileName);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [data, isGeneratingPdf]);

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100">
          Analysis Results
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            className="flex items-center text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
            aria-label="Export results as PDF"
          >
            <PDFIcon className="w-5 h-5 mr-2" />
            {isGeneratingPdf ? 'Generating...' : 'Export as PDF'}
          </button>
           <button
            onClick={handleDownload}
            className="flex items-center text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"
            aria-label="Download analysis report"
          >
            <DownloadIcon className="w-5 h-5 mr-2" />
            Download Report
          </button>
          <a
            href="https://github.com/google/ai-studio-apps"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"
            aria-label="View source code on GitHub"
          >
            <GitHubIcon className="w-5 h-5 mr-2" />
            View Source
          </a>
          <button
            onClick={onReset}
            className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Check Another
          </button>
        </div>
      </div>
      <div ref={exportRef}>
        {data.mode === AnalysisMode.PLAGIARISM ? (
          <PlagiarismResultDisplay data={data} />
        ) : (
          <HumanizeResultDisplay data={data} />
        )}
      </div>
    </div>
  );
};

export default ResultsView;