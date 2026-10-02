import type { QuizQuestion } from '../model/quiz.ts';
import { dirname } from './dependencyScanner.ts';

export interface QuizRenderOptions {
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

export function generatedMainPath(question: QuizQuestion): string {
  if (!question.sourcePath) return '/__quiz__/main.typ';
  const source = `/${question.sourcePath.replace(/^\/+/, '')}`;
  return `${dirname(source)}/__quiz_presenter_main.typ`;
}

export function buildQuizDocument(question: QuizQuestion, options: QuizRenderOptions): string {
  const common = `
#import "/de-thi.typ": *
#import "/vietdoc.typ": *
#import "/__quiz_runtime.typ": quiz-mcq, quiz-tf, quiz-short

#set page(fill: ${options.theme === 'dark' ? 'rgb("#0f172a")' : 'white'})
`;

  if (question.kind === 'mcq') {
    const choices = question.choices.map(choice => content(choice.raw)).join(',\n    ');
    const correct = question.choices.findIndex(choice => choice.correct);
    return `${common}
#quiz-mcq(
  number: ${question.index + 1},
  stem: ${content(question.stem)},
  choices: (
    ${choices},
  ),
  correct: ${correct >= 0 ? correct : 'none'},
  reveal: ${typstBool(options.revealAnswer)},
  solution: ${content(question.solution)},
  show-solution: ${typstBool(options.showSolution)},
  font-size: ${Math.max(30, options.fontSize)}pt,
)
`;
  }

  if (question.kind === 'true-false') {
    const statements = question.choices.map(choice => content(choice.raw)).join(',\n    ');
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
  font-size: ${Math.max(30, options.fontSize)}pt,
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
  font-size: ${Math.max(30, options.fontSize)}pt,
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
  font-size: ${Math.max(30, options.fontSize)}pt,
)
`;
}
