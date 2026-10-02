export type QuizKind = 'mcq' | 'true-false' | 'short-answer' | 'unknown';

export interface QuizChoice {
  raw: string;
  correct: boolean;
  label?: string;
}

export interface QuizQuestion {
  id: string;
  index: number;
  kind: QuizKind;
  sourcePath?: string;
  rawEx: string;
  rawArgs?: string;
  stem: string;
  choices: QuizChoice[];
  shortAnswer?: string;
  solution?: string;
  points?: number;
  tags: string[];
  sourceMeta?: string;
}

export interface QuizDocument {
  sourcePath?: string;
  source: string;
  questions: QuizQuestion[];
}
