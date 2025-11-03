// FIX: Replaced deprecated `GenerateContentRequest` with `GenerateContentParameters` and imported `Type` for schema definition.
import { GoogleGenAI, GenerateContentParameters, Type } from "@google/genai";
import { chunkText } from '../utils/textUtils';
import { PlagiarismFinding, PlagiarismResult, PlagiarismSegment, AiDetectionFinding, AiDetectionResult, AiDetectionSegment, AnalysisOptions } from "../types";

const CHUNK_SIZE_WORDS = 2000;
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

/**
 * A custom error class for messages intended to be displayed directly to the user.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// FIX: Used `Type` enum for defining the response schema as per the guidelines.
const plagiarismResponseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        plagiarized_text: {
          type: Type.STRING,
          description: "The exact text segment identified as plagiarized.",
        },
        source_url: {
          type: Type.STRING,
          description: "The URL of the suspected original source.",
        },
        confidence_score: {
          type: Type.NUMBER,
          description: "A score from 0.0 to 1.0 indicating the confidence of the match.",
        },
      },
      required: ["plagiarized_text", "source_url", "confidence_score"],
    },
};

const aiDetectionResponseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        text_segment: {
          type: Type.STRING,
          description: "The exact text segment being evaluated.",
        },
        is_ai_generated: {
            type: Type.BOOLEAN,
            description: "True if the text segment is likely AI-generated, false otherwise."
        },
        confidence_score: {
          type: Type.NUMBER,
          description: "A score from 0.0 to 1.0 indicating the confidence that the segment is AI-generated.",
        },
      },
      required: ["text_segment", "is_ai_generated", "confidence_score"],
    },
};

/**
 * Checks if an error is transient and suitable for a retry.
 * @param error The caught error object.
 */
function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        // Network errors or specific HTTP codes that indicate temporary issues
        if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('429') || errorMessage.includes('503') || errorMessage.includes('500')) {
            return true;
        }
    }
    return false;
}

/**
 * Inspects a caught error and throws a new `UserFacingError` with a clear, actionable message.
 * @param error The caught error object.
 */
function handleApiError(error: unknown): never {
    console.error(`Final error after retries:`, error);

    let message = 'An unexpected error occurred. The AI service may be temporarily unavailable.';

    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('api key') || errorMessage.includes('401') || errorMessage.includes('403')) {
            message = 'The API key is invalid or missing. Please ensure it is configured correctly.';
        } else if (errorMessage.includes('safety')) {
            message = 'Your text could not be processed due to safety policies. Please revise your content and try again.';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            message = 'A network error occurred. Please check your internet connection and try again.';
        } else if (errorMessage.includes('resource has been exhausted') || errorMessage.includes('429')) {
             message = 'The service is experiencing high traffic. Please try again in a few moments.';
        } else if (errorMessage.includes('400')) {
             message = 'The request was invalid. This could be due to unusual formatting in the text. Please try simplifying the content.';
        } else if (errorMessage.includes('500') || errorMessage.includes('503')) {
             message = 'The AI service is currently experiencing a server issue. Please try again in a little while.';
        }
    }
    
    throw new UserFacingError(message);
}

/**
 * Wraps the Gemini API call with a retry mechanism for transient errors.
 * @param request The request object for generateContent.
 * @param onRetry A callback function to inform the user about retry attempts.
 */
// FIX: Replaced deprecated `GenerateContentRequest` with `GenerateContentParameters`.
async function generateContentWithRetry(request: GenerateContentParameters, onRetry: (attempt: number) => void) {
    let lastError: unknown = new Error('API call failed after all retries.');
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent(request);
            return response;
        } catch (error) {
            lastError = error;
            if (isRetryableError(error) && attempt < MAX_RETRIES) {
                onRetry(attempt);
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Not a retryable error or max retries reached, throw the last error to be handled.
                throw lastError;
            }
        }
    }
    // This should not be reachable, but is a fallback.
    throw lastError;
}

const processPlagiarismResults = (originalText: string, findings: PlagiarismFinding[]): PlagiarismResult => {
    if (findings.length === 0) {
        return {
            overallScore: 0,
            segments: [{ text: originalText, isPlagiarized: false }],
        };
    }

    let segments: PlagiarismSegment[] = [{ text: originalText, isPlagiarized: false }];
    let totalPlagiarizedChars = 0;

    findings.forEach(finding => {
        const newSegments: PlagiarismSegment[] = [];
        segments.forEach(segment => {
            if (segment.isPlagiarized) {
                newSegments.push(segment);
                return;
            }
            
            const parts = segment.text.split(finding.plagiarized_text);
            if (parts.length > 1) {
              totalPlagiarizedChars += finding.plagiarized_text.length * (parts.length -1)
            }
            
            for (let i = 0; i < parts.length; i++) {
                if (parts[i]) {
                    newSegments.push({ text: parts[i], isPlagiarized: false });
                }
                if (i < parts.length - 1) {
                    newSegments.push({
                        text: finding.plagiarized_text,
                        isPlagiarized: true,
                        source: finding.source_url,
                        score: finding.confidence_score,
                    });
                }
            }
        });
        segments = newSegments;
    });

    const overallScore = originalText.length > 0 ? (totalPlagiarizedChars / originalText.length) * 100 : 0;

    return {
        overallScore: Math.min(100, Math.round(overallScore)),
        segments,
    };
};

const processAiDetectionResults = (originalText: string, findings: AiDetectionFinding[]): AiDetectionResult => {
    const aiFindings = findings.filter(f => f.is_ai_generated);
    if (aiFindings.length === 0) {
        return {
            overallScore: 0,
            segments: [{ text: originalText, isAi: false }],
        };
    }

    let segments: AiDetectionSegment[] = [{ text: originalText, isAi: false }];
    let totalAiChars = 0;

    aiFindings.forEach(finding => {
        const newSegments: AiDetectionSegment[] = [];
        segments.forEach(segment => {
            if (segment.isAi) {
                newSegments.push(segment);
                return;
            }
            
            const parts = segment.text.split(finding.text_segment);
             if (parts.length > 1) {
              totalAiChars += finding.text_segment.length * (parts.length -1)
            }
            
            for (let i = 0; i < parts.length; i++) {
                if (parts[i]) {
                    newSegments.push({ text: parts[i], isAi: false });
                }
                if (i < parts.length - 1) {
                    newSegments.push({
                        text: finding.text_segment,
                        isAi: true,
                        score: finding.confidence_score,
                    });
                }
            }
        });
        segments = newSegments;
    });

    const overallScore = originalText.length > 0 ? (totalAiChars / originalText.length) * 100 : 0;

    return {
        overallScore: Math.min(100, Math.round(overallScore)),
        segments,
    };
};


export const checkPlagiarism = async (
    text: string, 
    onProgress: (progress: number, message: string) => void,
    options: AnalysisOptions
): Promise<PlagiarismResult> => {
    const chunks = chunkText(text, CHUNK_SIZE_WORDS);
    const totalChunks = chunks.length;
    let allFindings: PlagiarismFinding[] = [];

    const sensitivity = options.plagiarismSensitivity || 'medium';
    let promptIntro = "Analyze the following text for plagiarism against public web sources. Identify any sections that are not original.";
    if (sensitivity === 'high') {
        promptIntro = "Analyze the following text for plagiarism against public web sources. Perform a thorough analysis and identify sections that show strong similarity, even if not directly copied.";
    } else if (sensitivity === 'strict') {
        promptIntro = "Perform a very strict plagiarism analysis on the following text against public web sources. Identify even remotely similar phrasing or sentence structures that might be considered unoriginal.";
    }

    for (let i = 0; i < totalChunks; i++) {
        const chunk = chunks[i];
        const progress = ((i + 1) / totalChunks) * 100;
        const baseMessage = `Analyzing chunk ${i + 1} of ${totalChunks}...`;
        onProgress(progress, baseMessage);

        try {
            // FIX: Replaced deprecated `GenerateContentRequest` with `GenerateContentParameters`.
            const request: GenerateContentParameters = {
                model: "gemini-2.5-flash",
                contents: `${promptIntro} Text to analyze: "${chunk}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: plagiarismResponseSchema,
                }
            };

            const onRetry = (attempt: number) => {
                onProgress(progress, `${baseMessage} (Network issue, retrying attempt ${attempt + 1}/${MAX_RETRIES})`);
            };

            const response = await generateContentWithRetry(request, onRetry);

            const jsonString = response.text.trim();
            if (jsonString) {
                try {
                    const findings: PlagiarismFinding[] = JSON.parse(jsonString);
                    allFindings = [...allFindings, ...findings];
                } catch (parseError) {
                    console.error(`Error parsing JSON for chunk ${i + 1}:`, jsonString);
                    throw new UserFacingError(`The AI returned an invalid response format. This can sometimes happen with complex text. Please try your request again.`);
                }
            }
        } catch (error) {
            if (error instanceof UserFacingError) {
                throw error; // Re-throw if it's already our specific error
            }
            handleApiError(error);
        }
    }
    
    onProgress(100, 'Finalizing results...');
    return processPlagiarismResults(text, allFindings);
};

export const checkAiContent = async (
    text: string, 
    onProgress: (progress: number, message: string) => void
): Promise<AiDetectionResult> => {
    const chunks = chunkText(text, CHUNK_SIZE_WORDS);
    const totalChunks = chunks.length;
    let allFindings: AiDetectionFinding[] = [];

    for (let i = 0; i < totalChunks; i++) {
        const chunk = chunks[i];
        const progress = ((i + 1) / totalChunks) * 100;
        const baseMessage = `Analyzing chunk ${i + 1} of ${totalChunks} for AI content...`;
        onProgress(progress, baseMessage);

        try {
            const request: GenerateContentParameters = {
                model: "gemini-2.5-flash",
                contents: `Analyze the following text to determine the likelihood that it was generated by an AI. Break the text down into segments and for each, determine if it is AI-generated and provide a confidence score. Focus on identifying unnatural phrasing, excessive complexity, or other AI-like patterns. Text to analyze: "${chunk}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: aiDetectionResponseSchema,
                }
            };

            const onRetry = (attempt: number) => {
                onProgress(progress, `${baseMessage} (Network issue, retrying attempt ${attempt + 1}/${MAX_RETRIES})`);
            };

            const response = await generateContentWithRetry(request, onRetry);

            const jsonString = response.text.trim();
            if (jsonString) {
                try {
                    const findings: AiDetectionFinding[] = JSON.parse(jsonString);
                    allFindings = [...allFindings, ...findings];
                } catch (parseError) {
                    console.error(`Error parsing JSON for AI check on chunk ${i + 1}:`, jsonString);
                    throw new UserFacingError(`The AI returned an invalid response format. This can sometimes happen with complex text. Please try your request again.`);
                }
            }
        } catch (error) {
            if (error instanceof UserFacingError) {
                throw error;
            }
            handleApiError(error);
        }
    }
    
    onProgress(100, 'Finalizing results...');
    return processAiDetectionResults(text, allFindings);
};

export const humanizeText = async (
    text: string, 
    onProgress: (progress: number, message: string) => void,
    options: AnalysisOptions
): Promise<string> => {
    const chunks = chunkText(text, CHUNK_SIZE_WORDS);
    const totalChunks = chunks.length;
    const humanizedChunks: string[] = [];
    
    const style = options.humanizeStyle || 'default';
    let promptCore = "Rewrite the following text to sound more natural, human, and engaging. Avoid robotic phrasing and complex sentence structures, but preserve the core meaning and information.";
    
    switch (style) {
        case 'casual':
            promptCore = "Rewrite the following text to sound more casual and conversational. Use simpler language and a friendly tone, while keeping the original meaning intact.";
            break;
        case 'formal':
            promptCore = "Rewrite the following text to adopt a more professional and formal tone. Use precise language, structured sentences, and an authoritative voice, while preserving the core information.";
            break;
        case 'simple':
            promptCore = "Rewrite the following text to improve readability. Simplify complex sentences, use clearer vocabulary, and shorten paragraphs where appropriate. The goal is to make the content easy for anyone to understand.";
            break;
        case 'creative':
            promptCore = "Rewrite the following text to be more creative and expressive. Use vivid language, metaphors, or storytelling elements where appropriate, while preserving the core meaning.";
            break;
        case 'technical':
            promptCore = "Rewrite the following text with a focus on technical accuracy and clarity. Use precise, unambiguous language suitable for a knowledgeable audience. Maintain a formal and objective tone, ensuring the original technical information is preserved and well-structured.";
            break;
        case 'enthusiastic':
            promptCore = "Rewrite the following text with an enthusiastic and energetic tone. Use positive and vibrant language, exclamation points where appropriate, while preserving the core meaning.";
            break;
    }


    for (let i = 0; i < totalChunks; i++) {
        const chunk = chunks[i];
        const progress = ((i + 1) / totalChunks) * 100;
        const baseMessage = `Humanizing chunk ${i + 1} of ${totalChunks}...`;
        onProgress(progress, baseMessage);

        try {
            // FIX: Replaced deprecated `GenerateContentRequest` with `GenerateContentParameters`.
            const request: GenerateContentParameters = {
                model: 'gemini-2.5-flash',
                contents: `${promptCore} Respond only with the rewritten text. Here is the text to humanize: "${chunk}"`,
            };
            
            const onRetry = (attempt: number) => {
                onProgress(progress, `${baseMessage} (Network issue, retrying attempt ${attempt + 1}/${MAX_RETRIES})`);
            };

            const response = await generateContentWithRetry(request, onRetry);
            
            humanizedChunks.push(response.text);

        } catch (error) {
            if (error instanceof UserFacingError) {
                throw error;
            }
            handleApiError(error);
        }
    }
    onProgress(100, 'Finalizing results...');
    return humanizedChunks.join(' ');
};