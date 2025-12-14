export type ViewState = 'HOME' | 'INPUT_PROBLEM' | 'LOADING' | 'RESULT';

export interface ResultData {
  answer: string;
}

// Minimal structure for Gemini response parsing
export interface RawGeminiResponse {
  answer: string;
}