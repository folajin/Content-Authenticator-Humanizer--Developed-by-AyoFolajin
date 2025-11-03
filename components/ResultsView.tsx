import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnalysisMode, ResultData } from '../types';
import { CopyIcon, CheckIcon, GitHubIcon, DownloadIcon, PDFIcon, DocxIcon, ExternalLinkIcon, ShareIcon, TwitterIcon, FacebookIcon, ImageIcon } from './icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph } from 'docx';
import ShareImage from './ShareImage';

interface ResultsViewProps {
  data: ResultData;
  onReset: () => void;
}

// A dedicated component for styling the PDF output.
// It's rendered off-screen and captured by html2canvas.
const PdfExportContent = React.forwardRef<HTMLDivElement, { data: ResultData }>(({ data }, ref) => {
  const renderPdfContent = () => {
    switch (data.mode) {
      case AnalysisMode.PLAGIARISM:
        const plagResults = data.plagiarismResults;
        if (!plagResults) return null;
        return (
          <div>
            <h2 className="text-3xl font-bold mb-2">Plagiarism Analysis Report</h2>
            <p className="text-lg mb-6">Overall Score: <span className="font-bold">{plagResults.overallScore}%</span></p>
            <h3 className="text-xl font-bold border-b pb-2 mb-4">Analyzed Text</h3>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {plagResults.segments.map((segment, index) =>
                segment.isPlagiarized ? (
                  <span key={index} className="bg-yellow-200 px-1">
                    {segment.text}
                  </span>
                ) : (
                  <span key={index}>{segment.text}</span>
                )
              )}
            </p>
          </div>
        );

      case AnalysisMode.AI_DETECTION:
        const aiResults = data.aiDetectionResults;
        if (!aiResults) return null;
        return (
          <div>
            <h2 className="text-3xl font-bold mb-2">AI Content Detection Report</h2>
            <p className="text-lg mb-6">Likelihood of AI Content: <span className="font-bold">{aiResults.overallScore}%</span></p>
            <h3 className="text-xl font-bold border-b pb-2 mb-4">Analyzed Text</h3>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {aiResults.segments.map((segment, index) =>
                segment.isAi ? (
                  <span key={index} className="bg-amber-200 px-1">
                    {segment.text}
                  </span>
                ) : (
                  <span key={index}>{segment.text}</span>
                )
              )}
            </p>
          </div>
        );

      case AnalysisMode.SUMMARIZE:
        return (
          <div>
            <h2 className="text-3xl font-bold mb-6">Text Summarization Report</h2>
            <div className="mb-8">
              <h3 className="text-xl font-bold border-b pb-2 mb-4">Original Text</h3>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{data.originalText}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold border-b pb-2 mb-4">Summarized Text</h3>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{data.summarizedText}</p>
            </div>
          </div>
        );

      case AnalysisMode.HUMANIZE:
        return (
          <div>
            <h2 className="text-3xl font-bold mb-6">Text Humanization Report</h2>
            <div className="mb-8">
              <h3 className="text-xl font-bold border-b pb-2 mb-4">Original Text</h3>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{data.originalText}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold border-b pb-2 mb-4">Humanized Text</h3>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{data.humanizedText}</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div ref={ref} className="p-12 bg-white text-gray-800 font-serif w-full">
      <div className="flex justify-between items-center border-b pb-4 mb-8">
        <h1 className="text-4xl font-bold">Content Analysis Report</h1>
        <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
      </div>
      {renderPdfContent()}
      <div className="mt-12 text-center text-xs text-gray-500 border-t pt-4">
        <p>Powered by Content Authenticator & Humanizer | Built by AyoFolajin</p>
      </div>
    </div>
  );
});


const PlagiarismResultDisplay: React.FC<{ data: ResultData }> = ({ data }) => {
  const results = data.plagiarismResults;
  if (!results) return null;

  const scoreColor =
    results.overallScore > 50
      ? 'text-red-500'
      : results.overallScore > 20
      ? 'text-yellow-500'
      : 'text-green-500';
      
  const sourceMap = new Map<string, { source: string; maxScore: number }>();
  results.segments.forEach(segment => {
    if (segment.isPlagiarized && segment.source && segment.score) {
      const existing = sourceMap.get(segment.source);
      if (!existing || segment.score > existing.maxScore) {
        sourceMap.set(segment.source, { source: segment.source, maxScore: segment.score });
      }
    }
  });
  const uniqueSources = Array.from(sourceMap.values()).sort((a, b) => b.maxScore - a.maxScore);

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

      {uniqueSources.length > 0 && (
        <div className="mt-6 bg-slate-900 p-6 rounded-lg border border-slate-700">
          <h4 className="font-bold text-slate-200 mb-4">Detected Sources</h4>
          <ul className="space-y-3">
            {uniqueSources.map(({ source, maxScore }, index) => {
              const scorePercent = Math.round(maxScore * 100);
              const scoreColor = scorePercent > 75 ? 'bg-red-500/20 text-red-300' : scorePercent > 50 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300';
              return (
                <li key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-slate-800/50 rounded-md">
                  <a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-cyan-400 hover:underline flex-1 min-w-0"
                  >
                    <span className="truncate">{source}</span>
                    <ExternalLinkIcon className="w-4 h-4 ml-2 shrink-0" />
                  </a>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-xs text-slate-400">Confidence:</span>
                    <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${scoreColor}`}>
                      {scorePercent}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

const AiDetectionResultDisplay: React.FC<{ data: ResultData }> = ({ data }) => {
  const results = data.aiDetectionResults;
  if (!results) return null;

  const score = results.overallScore;
  const circumference = 2 * Math.PI * 54; // r="54"
  const offset = circumference - (score / 100) * circumference;

  const scoreColor =
    score > 70
      ? 'text-red-500'
      : score > 40
      ? 'text-amber-500'
      : 'text-green-500';

  const strokeColor =
    score > 70
      ? 'stroke-red-500'
      : score > 40
      ? 'stroke-amber-500'
      : 'stroke-green-500';

  return (
    <div className="w-full">
      <div className="bg-slate-900 p-6 rounded-lg mb-6 flex flex-col sm:flex-row items-center justify-center gap-8 text-center sm:text-left">
        <div className="relative w-40 h-40 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 120 120">
            <circle
              className="stroke-slate-700"
              strokeWidth="12"
              fill="transparent"
              r="54"
              cx="60"
              cy="60"
            />
            <circle
              className={`transform -rotate-90 origin-center transition-all duration-1000 ease-out ${strokeColor}`}
              style={{ strokeDashoffset: offset }}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeLinecap="round"
              fill="transparent"
              r="54"
              cx="60"
              cy="60"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-4xl font-bold ${scoreColor}`}>{score}%</p>
            <p className="text-sm font-medium text-slate-400">AI Content</p>
          </div>
        </div>
        <div>
           <h3 className="text-2xl font-bold text-slate-100">AI Content Analysis</h3>
           <p className="text-slate-400 mt-1 max-w-md">This score represents the likelihood that the provided text was generated by an AI. Segments identified as AI-generated are highlighted below.</p>
        </div>
      </div>
      <div className="bg-slate-900 p-6 rounded-lg max-h-[50vh] overflow-y-auto border border-slate-700">
        <h4 className="font-bold text-slate-200 mb-4">Document Text</h4>
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
          {results.segments.map((segment, index) =>
            segment.isAi ? (
              <span key={index} className="relative group">
                <span className="bg-amber-500/30 cursor-pointer rounded px-1">
                  {segment.text}
                </span>
                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-800 border border-slate-600 text-white text-sm rounded-lg p-3 z-10 shadow-lg">
                  <p className="font-bold">AI Generated Segment</p>
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
        <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
          <span className="w-2.5 h-2.5 mr-3 rounded-full bg-cyan-400 flex-shrink-0"></span>
          Humanized Text
        </h3>
        <div className="relative group bg-slate-800 p-4 rounded-lg h-96 overflow-y-auto border border-cyan-500/30 text-slate-200 whitespace-pre-wrap">
          <button
            onClick={handleCopy}
            aria-label="Copy humanized text to clipboard"
            className="absolute top-3 right-3 z-10 flex items-center text-sm bg-slate-900/70 backdrop-blur-sm border border-slate-700 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 font-semibold py-2 px-3 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
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
          {data.humanizedText}
        </div>
      </div>
    </div>
  );
};

const SummarizeResultDisplay: React.FC<{ data: ResultData }> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (data.summarizedText) {
      navigator.clipboard.writeText(data.summarizedText);
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
        <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
          <span className="w-2.5 h-2.5 mr-3 rounded-full bg-green-400 flex-shrink-0"></span>
          Summarized Text
        </h3>
        <div className="relative group bg-slate-800 p-4 rounded-lg h-96 overflow-y-auto border border-green-500/30 text-slate-200 whitespace-pre-wrap">
          <button
            onClick={handleCopy}
            aria-label="Copy summarized text to clipboard"
            className="absolute top-3 right-3 z-10 flex items-center text-sm bg-slate-900/70 backdrop-blur-sm border border-slate-700 hover:bg-green-500/20 text-slate-300 hover:text-green-300 font-semibold py-2 px-3 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
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
          {data.summarizedText}
        </div>
      </div>
    </div>
  );
};


const ResultsView: React.FC<ResultsViewProps> = ({ data, onReset }) => {
  const pdfExportRef = useRef<HTMLDivElement>(null);
  const shareImageRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const sharePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (sharePopoverRef.current && !sharePopoverRef.current.contains(event.target as Node)) {
            setIsSharePopoverOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleShare = useCallback((platform: 'twitter' | 'facebook') => {
    const appUrl = "https://github.com/google/ai-studio-apps/tree/main/demos/content-authenticator";
    let summary = '';

    switch (data.mode) {
        case AnalysisMode.PLAGIARISM:
            summary = `I analyzed my document for plagiarism and got a score of ${data.plagiarismResults?.overallScore}% using the Content Authenticator.`;
            break;
        case AnalysisMode.AI_DETECTION:
            summary = `My text analysis shows a ${data.aiDetectionResults?.overallScore}% likelihood of being AI-generated, according to the Content Authenticator.`;
            break;
        case AnalysisMode.SUMMARIZE:
            summary = `I just summarized a long document into key points using the Content Authenticator & Summarizer.`;
            break;
        case AnalysisMode.HUMANIZE:
            summary = `I used the Content Authenticator & Humanizer to make my text sound more natural and engaging.`;
            break;
    }
    
    let url = '';
    if (platform === 'twitter') {
        const tweetText = `${summary} Check out the tool built with Google Gemini! #AI #ContentTools\n\n${appUrl}`;
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    } else if (platform === 'facebook') {
        const quote = `${summary} Check out the tool built with Google Gemini!`;
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(quote)}`;
    }
    
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
    setIsSharePopoverOpen(false);
  }, [data]);

  const handleCopySummary = useCallback(() => {
    const appUrl = "https://github.com/google/ai-studio-apps/tree/main/demos/content-authenticator";
    let summary = '';

    switch (data.mode) {
        case AnalysisMode.PLAGIARISM:
            summary = `I analyzed my document for plagiarism and got a score of ${data.plagiarismResults?.overallScore}% using the Content Authenticator.`;
            break;
        case AnalysisMode.AI_DETECTION:
            summary = `My text analysis shows a ${data.aiDetectionResults?.overallScore}% likelihood of being AI-generated, according to the Content Authenticator.`;
            break;
        case AnalysisMode.SUMMARIZE:
            summary = `I just summarized a long document into key points using the Content Authenticator & Summarizer.`;
            break;
        case AnalysisMode.HUMANIZE:
            summary = `I used the Content Authenticator & Humanizer to make my text sound more natural and engaging.`;
            break;
    }

    const textToCopy = `${summary} Built with Google Gemini. See the code: ${appUrl}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    setTimeout(() => {
        setCopiedSummary(false);
        setIsSharePopoverOpen(false);
    }, 2000);
  }, [data]);
  
  const handleDownloadShareImage = useCallback(async () => {
    if (!shareImageRef.current || isGeneratingImage) return;

    setIsGeneratingImage(true);
    try {
        const canvas = await html2canvas(shareImageRef.current, {
            scale: 1,
            backgroundColor: null,
            useCORS: true,
        });

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        
        let fileName = 'analysis-card.png';
        if (data.mode === AnalysisMode.PLAGIARISM) {
            fileName = 'plagiarism-card.png';
        } else if (data.mode === AnalysisMode.AI_DETECTION) {
            fileName = 'ai-detection-card.png';
        } else if (data.mode === AnalysisMode.SUMMARIZE) {
            fileName = 'summary-card.png';
        } else if (data.mode === AnalysisMode.HUMANIZE) {
            fileName = 'humanization-card.png';
        }
        
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to generate share image:", error);
    } finally {
        setIsGeneratingImage(false);
        setIsSharePopoverOpen(false);
    }
  }, [data, isGeneratingImage]);

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
    } else if (data.mode === AnalysisMode.AI_DETECTION && data.aiDetectionResults) {
        fileName = 'ai-detection-report.txt';
        const { overallScore, segments } = data.aiDetectionResults;
        
        reportContent += `AI Content Detection Report\n`;
        reportContent += `============================\n\n`;
        reportContent += `Overall AI Content Score: ${overallScore}%\n\n`;
        reportContent += `----------------------------\n`;
        reportContent += `DETAILED BREAKDOWN\n`;
        reportContent += `----------------------------\n\n`;
  
        segments.forEach(segment => {
          if (segment.isAi) {
            reportContent += `[AI-GENERATED - Confidence: ${Math.round((segment.score || 0) * 100)}%]\n`;
            reportContent += `Text: "${segment.text}"\n\n`;
          } else {
            reportContent += `[Human-Written]\n`;
            reportContent += `Text: "${segment.text}"\n\n`;
          }
        });
    } else if (data.mode === AnalysisMode.SUMMARIZE && data.summarizedText) {
      fileName = 'summary-report.txt';
      reportContent += `Text Summarization Report\n`;
      reportContent += `========================\n\n`;
      reportContent += `--- ORIGINAL TEXT ---\n\n${data.originalText}\n\n`;
      reportContent += `--- SUMMARIZED TEXT ---\n\n${data.summarizedText}\n`;
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
    if (!pdfExportRef.current || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(pdfExportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: pdfExportRef.current.scrollWidth,
        windowHeight: pdfExportRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -pageHeight + (pdfHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      let fileName = 'analysis-report.pdf';
      if (data.mode === AnalysisMode.PLAGIARISM) {
          fileName = 'plagiarism-report.pdf';
      } else if (data.mode === AnalysisMode.AI_DETECTION) {
          fileName = 'ai-detection-report.pdf';
      } else if (data.mode === AnalysisMode.SUMMARIZE) {
          fileName = 'summary-report.pdf';
      } else if (data.mode === AnalysisMode.HUMANIZE) {
          fileName = 'humanization-report.pdf';
      }

      pdf.save(fileName);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [data, isGeneratingPdf]);

  const handleExportDocx = useCallback(async () => {
    const textToExport = data.mode === AnalysisMode.HUMANIZE ? data.humanizedText : data.summarizedText;
    const fileName = data.mode === AnalysisMode.HUMANIZE ? 'humanized-text.docx' : 'summary.docx';
    
    if (!textToExport || isGeneratingDocx) return;

    setIsGeneratingDocx(true);
    try {
        const doc = new Document({
            sections: [{
                children: textToExport.split('\n').map(
                    (text) => new Paragraph({ text })
                ),
            }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to generate DOCX:", error);
    } finally {
        setIsGeneratingDocx(false);
    }
  }, [data, isGeneratingDocx]);


  const renderResults = () => {
    switch (data.mode) {
      case AnalysisMode.PLAGIARISM:
        return <PlagiarismResultDisplay data={data} />;
      case AnalysisMode.AI_DETECTION:
        return <AiDetectionResultDisplay data={data} />;
      case AnalysisMode.SUMMARIZE:
        return <SummarizeResultDisplay data={data} />;
      case AnalysisMode.HUMANIZE:
        return <HumanizeResultDisplay data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 p-8">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-100">
          Analysis Results
        </h2>
        <div className="flex items-center flex-wrap gap-2 sm:gap-4">
          <div className="relative">
            <button
              onClick={() => setIsSharePopoverOpen(prev => !prev)}
              className="flex items-center text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"
              aria-label="Share analysis results"
            >
              <ShareIcon className="w-5 h-5 mr-2" />
              Share
            </button>
            {isSharePopoverOpen && (
              <div
                ref={sharePopoverRef}
                className="absolute right-0 bottom-full mb-2 w-60 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-20 animate-fade-in-up"
              >
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-slate-400">SHARE ON</p>
                  <button onClick={() => handleShare('twitter')} className="flex items-center w-full text-left p-2 rounded-md text-slate-200 hover:bg-slate-600 transition-colors">
                    <TwitterIcon className="w-5 h-5 mr-3" /> Share on Twitter
                  </button>
                  <button onClick={() => handleShare('facebook')} className="flex items-center w-full text-left p-2 rounded-md text-slate-200 hover:bg-slate-600 transition-colors">
                    <FacebookIcon className="w-5 h-5 mr-3" /> Share on Facebook
                  </button>
                  <div className="h-px bg-slate-600 my-1"></div>
                  <button onClick={handleDownloadShareImage} disabled={isGeneratingImage} className="flex items-center w-full text-left p-2 rounded-md text-slate-200 hover:bg-slate-600 transition-colors disabled:opacity-50">
                    <ImageIcon className="w-5 h-5 mr-3" /> {isGeneratingImage ? 'Generating...' : 'Download Share Image'}
                  </button>
                  <div className="h-px bg-slate-600 my-1"></div>
                  <button onClick={handleCopySummary} className="flex items-center w-full text-left p-2 rounded-md text-slate-200 hover:bg-slate-600 transition-colors">
                    {copiedSummary ? (
                       <>
                          <CheckIcon className="w-5 h-5 mr-3 text-green-400" /> Copied to clipboard!
                       </>
                    ) : (
                       <>
                          <CopyIcon className="w-5 h-5 mr-3" /> Copy Summary
                       </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            className="flex items-center text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
            aria-label="Export results as PDF"
          >
            <PDFIcon className="w-5 h-5 mr-2" />
            {isGeneratingPdf ? 'Generating...' : 'Export as PDF'}
          </button>
          {(data.mode === AnalysisMode.HUMANIZE || data.mode === AnalysisMode.SUMMARIZE) && (
            <button
              onClick={handleExportDocx}
              disabled={isGeneratingDocx}
              className="flex items-center text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
              aria-label="Export as DOCX"
            >
              <DocxIcon className="w-5 h-5 mr-2" />
              {isGeneratingDocx ? 'Generating...' : 'Export as DOCX'}
            </button>
          )}
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
      <div>
        {renderResults()}
      </div>
      {/* Hidden components for export */}
      <div className="absolute -left-[9999px] top-auto">
        <div className="w-[800px]">
          <PdfExportContent data={data} ref={pdfExportRef} />
        </div>
        <ShareImage data={data} ref={shareImageRef} />
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ResultsView;