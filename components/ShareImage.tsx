import React from 'react';
import { ResultData, AnalysisMode } from '../types';

interface ShareImageProps {
  data: ResultData;
}

// A self-contained SVG for the Header Icon to ensure it renders correctly in html2canvas
const HeaderIconSVG = () => (
    <svg viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
        <defs>
            <linearGradient id="logo-main-gradient-share" x1="125" y1="0" x2="125" y2="250" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFD68A" />
                <stop offset="1" stopColor="#E67E22" />
            </linearGradient>
        </defs>
        <path d="M187.5 90 V 65 C 187.5 33.2 159.3 5 125 5 C 90.7 5 62.5 33.2 62.5 65 V 90" stroke="url(#logo-main-gradient-share)" strokeWidth="30" strokeLinecap="round" />
        <path d="M232.47,159.72c6.26-6.26,8.71-15.1,7.52-23.23c-3.13-21.2-19.16-37.81-38.38-37.81H48.39 c-13.63,0-25.75,8.8-27.18,22.25c-1.42,13.43,5.18,26.47,15.6,34.93c12.35,9.6,27.11,15.39,42.54,17.47 c17.9,2.37,36.96,2.16,55.19-0.56c13.71-2.05,26.54-6.83,36.8-14.07 C224.38,168.12,229.43,164.08,232.47,159.72z" fill="url(#logo-main-gradient-share)" />
        <path d="M192.83,154.21c2.81-2.81,4.12-6.52,3.7-9.84c-1.12-8.52-7.51-15.42-14.88-15.42h-35.33c0,6.23,3.06,12.28,8.23,16.89 c5.18,4.59,11.2,7.43,17.58,7.91c7.76,0.61,15.54-1.1,21.57-5.81v15.08Z" fill="#D35400" opacity="0.7" />
        <path d="M125 125.5 a 12 12 0 1 0 0 -24 a 12 12 0 1 0 0 24z M 117 125 H 133 V 145 H 117 V 125 z" fill="#582900" />
    </svg>
);

const CheckmarkSVG = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const SummarizeIconSVG = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"></path>
        <path d="M12 4h9"></path>
        <path d="M12 12h9"></path>
        <path d="M5 17l-3-3 3-3"></path>
        <path d="M9 7l-3 3 3 3"></path>
        <path d="M2 14V10"></path>
    </svg>
);

const ShareImage = React.forwardRef<HTMLDivElement, ShareImageProps>(({ data }, ref) => {
  const renderContent = () => {
    switch(data.mode) {
      case AnalysisMode.PLAGIARISM:
        const plagScore = data.plagiarismResults?.overallScore || 0;
        const plagColor = plagScore > 50 ? '#EF4444' : plagScore > 20 ? '#F59E0B' : '#10B981';
        return (
          <>
            <div style={{ fontSize: '160px', fontWeight: 700, color: plagColor, lineHeight: 1 }}>{plagScore}%</div>
            <div style={{ fontSize: '48px', color: '#CBD5E1', marginTop: '20px' }}>Plagiarism Score</div>
          </>
        );
      case AnalysisMode.AI_DETECTION:
        const aiScore = data.aiDetectionResults?.overallScore || 0;
        const aiColor = aiScore > 70 ? '#EF4444' : aiScore > 40 ? '#F59E0B' : '#10B981';
        return (
          <>
            <div style={{ fontSize: '160px', fontWeight: 700, color: aiColor, lineHeight: 1 }}>{aiScore}%</div>
            <div style={{ fontSize: '48px', color: '#CBD5E1', marginTop: '20px' }}>AI Content Likelihood</div>
          </>
        );
      case AnalysisMode.SUMMARIZE:
        return (
          <>
             <div style={{
                width: '180px', height: '180px',
                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
             }}>
                <SummarizeIconSVG />
             </div>
            <div style={{ fontSize: '48px', color: '#CBD5E1', marginTop: '20px' }}>Text Successfully Summarized</div>
          </>
        );
      case AnalysisMode.HUMANIZE:
        return (
          <>
             <div style={{
                width: '180px', height: '180px',
                backgroundColor: 'rgba(45, 212, 191, 0.1)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
             }}>
                <CheckmarkSVG />
             </div>
            <div style={{ fontSize: '48px', color: '#CBD5E1', marginTop: '20px' }}>Text Successfully Humanized</div>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <div
      ref={ref}
      style={{
        width: '1200px',
        height: '630px',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        color: '#E2E8F0',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: '50px',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <HeaderIconSVG />
        <div style={{ marginLeft: '24px', lineHeight: '1.2' }}>
            <div style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'", fontSize: '48px', fontWeight: 800, color: '#E2E8F0', letterSpacing: '-0.05em' }}>
                HumanizeX
            </div>
            <div style={{ fontSize: '24px', color: '#94A3B8', marginTop: '4px' }}>
                Content Authenticator & Humanizer
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {renderContent()}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '20px', color: '#64748B' }}>
        <span>Powered by Google Gemini | Built by AyoFolajin</span>
        <span>github.com/google/ai-studio-apps</span>
      </div>
    </div>
  );
});

export default ShareImage;