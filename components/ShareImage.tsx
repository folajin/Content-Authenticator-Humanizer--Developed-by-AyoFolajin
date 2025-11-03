import React from 'react';
import { ResultData, AnalysisMode } from '../types';

interface ShareImageProps {
  data: ResultData;
}

// A self-contained SVG for the Header Icon to ensure it renders correctly in html2canvas
const HeaderIconSVG = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <path 
          d="M56 13.535C56 9.387 52.69 6 48.545 6H15.455C11.31 6 8 9.387 8 13.535V32.667C8 48.467 20.427 58 32 58C43.573 58 56 48.467 56 32.667V13.535Z" 
          stroke="#06B6D4" // cyan-500
          strokeWidth="5"
      />
      <g>
        <path d="M32 28C35.314 28 38 25.314 38 22C38 18.686 35.314 16 32 16C28.686 16 26 18.686 26 22C26 25.314 28.686 28 32 28Z" fill="#14B8A6"/>
        <path d="M42.667 38.667C42.667 33.144 37.856 29.333 32 29.333C26.144 29.333 21.333 33.144 21.333 38.667H42.667Z" fill="#14B8A6"/>
        <path d="M26.667 33.333L32 38.667L42.667 28" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
  </svg>
);

const CheckmarkSVG = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
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
        <div style={{ fontFamily: 'Impact, sans-serif', marginLeft: '24px', textTransform: 'uppercase', fontSize: '36px', fontWeight: 600, letterSpacing: '0.05em', lineHeight: '1.1' }}>
          Content Authenticator
          <span style={{ display: 'block' }}>& Humanizer</span>
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