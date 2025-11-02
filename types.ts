export enum AnalysisMode {
  PLAGIARISM = 'PLAGIARISM',
  HUMANIZE = 'HUMANIZE',
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


export interface ResultData {
  originalText: string;
  plagiarismResults?: PlagiarismResult;
  humanizedText?: string;
  mode: AnalysisMode;
}
