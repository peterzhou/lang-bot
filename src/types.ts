export type File = {
  filename: string;
  sourceCode: string;
};

export type TranslateFunctionCall = {
  text: string;
  description: string;
  sourceFileName: string;
  line?: number;
  variables: string[];
  character?: number;
  newLang?: string;
};

export type BatchTranslateFunctionCall = {
  text: string;
  variables: string[];
  character?: number;
  languages?: string;
};

export type TranslationRequest = {
  originalText: string;
  originalLang: string;
  newLang: string;
};

export type BatchTranslationRequest = {
  originalText: string;
  originalLang: string;
  description: string;
  languages: string[];
  tags: string[];
};
