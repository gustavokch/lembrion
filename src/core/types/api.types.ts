export interface APISettings {
  openaiApiKey: string;
  model: string;
  customPrompts: {
    multipleChoice: string;
    dissertative: string;
    evaluation: string;
    elaborativePrompt: string;
    retrievalPrompt: string;
  };
  preloadQuestions?: number; // Number of questions to preload
}
