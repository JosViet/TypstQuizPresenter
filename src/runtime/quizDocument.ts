import type { QuizQuestion } from '../model/quiz.ts';
import { dirname } from './dependencyScanner.ts';

export interface QuizRenderOptions {
  selectedChoice?: number | null;
  revealAnswer: boolean;
  showSolution: boolean;
  fontSize: number;
  theme?: 'light' | 'dark';
}

function content(raw: string | undefined): string {
  return `[${raw ?? ''}]`;
}

function typstBool(value: boolean): string {
  return value ? 'true' : 'false';
}

function fontSizeValue(size: number): number {
  if (!Number.isFinite(size)) return 30;
  return Math.max(10, Math.min(72, Math.round(size * 2) / 2));
}

export function generatedMainPath(question: QuizQuestion): string {
  if (!question.sourcePath) return '/__quiz__/main.typ';
  const source = `/${question.sourcePath.replace(/^\/+/, '')}`;
  return `${dirname(source)}/__quiz_presenter_main.typ`;
}

export function buildQuizDocument(question: QuizQuestion, options: QuizRenderOptions): string {
  const fs = fontSizeValue(options.fontSize);
  const common = `
#import "/de-thi.typ": *
#import "/vietdoc.typ": *
#import "/__quiz_runtime.typ": quiz-mcq, quiz-tf, quiz-short

#set page(
  width: 13.333in,
  height: 7.5in,
  margin: (x: 18pt, y: 10pt),
  fill: ${options.theme === 'dark' ? 'rgb("#0f172a")' : 'white'},
)
#set text(fill: rgb("#0f172a"))
#set par(justify: false, leading: 0.62em)
`;

  if (question.kind === 'mcq') {
    const choices = question.choices.map(choice => content(choice.raw)).join(',\\n    ');
    const correct = question.choices.findIndex(choice => choice.correct);
    const selected = options.selectedChoice ?? null;
    return `${common}
#quiz-mcq(
  number: ${question.index + 1},
  stem: ${content(question.stem)},
  choices: (
    ${choices},
  ),
  correct: ${correct >= 0 ? correct : 'none'},
  selected: ${selected === null ? 'none' : selected},
  reveal: ${typstBool(options.revealAnswer)},
  solution: ${content(question.solution)},
  show-solution: ${typstBool(options.showSolution)},
  font-size: ${fs}pt,
)
`;
  }

  if (question.kind === 'true-false') {
    const statements = question.choices.map(choice => content(choice.raw)).join(',\\n    ');
    const truths = question.choices.map(choice => typstBool(choice.correct)).join(', ');
    return `${common}
#quiz-tf(
  number: ${question.index + 1},
  stem: ${content(question.stem)},
  statements: (
    ${statements},
  ),
  truths: (${truths},),
  reveal: ${typstBool(options.revealAnswer)},
  solution: ${content(question.solution)},
  show-solution: ${typstBool(options.showSolution)},
  font-size: ${fs}pt,
)
`;
  }

  if (question.kind === 'short-answer') {
    return `${common}
#quiz-short(
  number: ${question.index + 1},
  stem: ${content(question.stem)},
  answer: ${content(question.shortAnswer)},
  reveal: ${typstBool(options.revealAnswer)},
  solution: ${content(question.solution)},
  show-solution: ${typstBool(options.showSolution)},
  font-size: ${fs}pt,
)
`;
  }

  return `${common}
#quiz-short(
  number: ${question.index + 1},
  stem: ${content(question.stem || question.rawEx)},
  answer: [],
  reveal: false,
  solution: ${content(question.solution)},
  show-solution: ${typstBool(options.showSolution)},
  font-size: ${fs}pt,
)
`;
}
