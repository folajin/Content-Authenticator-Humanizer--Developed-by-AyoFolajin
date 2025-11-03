export enum AnalysisMode {
  PLAGIARISM = 'PLAGIARISM',
  HUMANIZE = 'HUMANIZE',
  AI_DETECTION = 'AI_DETECTION',
  SUMMARIZE = 'SUMMARIZE',
}

export type PlagiarismSensitivity = 'medium' | 'high' | 'strict';
export type HumanizeStyle = 'default' | 'casual' | 'formal' | 'simple' | 'creative' | 'technical' | 'enthusiastic';
export type SummaryLength = 'short' | 'medium' | 'long';

export interface AnalysisOptions {
  plagiarismSensitivity?: PlagiarismSensitivity;
  humanizeStyle?: HumanizeStyle;
  summaryLength?: SummaryLength;
}

export interface PlagiarismFinding {
  plagiarized_text: string;
  source_url: string;
  confidence_score: number;
}

export interface PlagiarismSegment {
  text: string;
  isPlagiarized: boolean;
  source?: string;
  score?: number;
}

export interface PlagiarismResult {
  overallScore: number;
  segments: PlagiarismSegment[];
}

// New types for AI Detection
export interface AiDetectionFinding {
  text_segment: string;
  is_ai_generated: boolean;
  confidence_score: number;
}

export interface AiDetectionSegment {
  text: string;
  isAi: boolean;
  score?: number;
}

export interface AiDetectionResult {
  overallScore: number;
  segments: AiDetectionSegment[];
}

export interface ResultData {
  originalText: string;
  plagiarismResults?: PlagiarismResult;
  humanizedText?: string;
  aiDetectionResults?: AiDetectionResult;
  summarizedText?: string;
  mode: AnalysisMode;
  options?: AnalysisOptions;
}