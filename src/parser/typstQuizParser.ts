import type { QuizChoice, QuizDocument, QuizKind, QuizQuestion } from '../model/quiz.ts';
import {
  findMacros,
  isCorrectWrapper,
  readBalanced,
  skipTrivia,
  splitTopLevel,
  unwrapContent,
} from './scanner.ts';

const ANSWER_MACROS = new Set(['choice', 'choiceTF', 'shortanswer']);

interface ParsedCall {
  name: string;
  start: number;
  end: number;
  args?: string;
  body?: string;
}

function parseMacroAt(source: string, nameEnd: number, name: string, hashStart: number): ParsedCall | null {
  let i = skipTrivia(source, nameEnd);
  let args: string | undefined;
  let body: string | undefined;

  if (source[i] === '(') {
    const p = readBalanced(source, i);
    args = p.inner;
    i = skipTrivia(source, p.end);
  }
  if (source[i] === '[') {
    const b = readBalanced(source, i);
    body = b.inner;
    i = b.end;
  }

  if (args === undefined && body === undefined) return null;
  return { name, start: hashStart, end: i, args, body };
}

function findCalls(source: string, names: Set<string>): ParsedCall[] {
  const macros = findMacros(source, names);
  const out: ParsedCall[] = [];
  for (const macro of macros) {
    try {
      const call = parseMacroAt(source, macro.nameEnd, macro.name, macro.hashStart);
      if (call) out.push(call);
    } catch {
      // A malformed macro should not make all later questions disappear.
    }
  }
  return out;
}

function parseMetadata(rawArgs = ''): Pick<QuizQuestion, 'points' | 'tags' | 'sourceMeta'> {
  const fields = splitTopLevel(rawArgs);
  let points: number | undefined;
  const tags: string[] = [];
  let sourceMeta: string | undefined;

  for (const field of fields) {
    const colon = field.indexOf(':');
    if (colon < 0) continue;
    const key = field.slice(0, colon).trim();
    const value = field.slice(colon + 1).trim();
    if (key === 'points') {
      const num = Number(value);
      if (Number.isFinite(num)) points = num;
    } else if (key === 'tags') {
      const matches = [...value.matchAll(/["']([^"']+)["']/g)];
      for (const match of matches) {
        if (match[1]) tags.push(match[1]);
      }
    } else if (key === 'source') {
      sourceMeta = unwrapContent(value);
    }
  }

  return { points, tags, sourceMeta };
}

function parseChoiceArgs(rawArgs: string | undefined): QuizChoice[] {
  if (!rawArgs) return [];
  return splitTopLevel(rawArgs)
    .filter(Boolean)
    .map((raw, index) => ({
      raw: unwrapContent(raw),
      correct: isCorrectWrapper(raw),
      label: String.fromCharCode(65 + index),
    }));
}

function parseQuestion(
  exCall: ParsedCall,
  trailingSource: string,
  index: number,
  sourcePath?: string,
): QuizQuestion {
  const body = exCall.body ?? '';
  const bodyAnswerCalls = findCalls(body, ANSWER_MACROS).sort((a, b) => a.start - b.start);
  const trailingAnswerCalls = findCalls(trailingSource, ANSWER_MACROS).sort((a, b) => a.start - b.start);
  const bodySolutionCall = findCalls(body, new Set(['loigiai'])).sort((a, b) => a.start - b.start)[0];
  const trailingSolutionCall = findCalls(trailingSource, new Set(['loigiai'])).sort((a, b) => a.start - b.start)[0];
  const answer = bodyAnswerCalls[0] ?? trailingAnswerCalls[0];
  const solutionCall = bodySolutionCall ?? trailingSolutionCall;
  const answerIsInBody = bodyAnswerCalls.length > 0;

  let kind: QuizKind = 'unknown';
  let choices: QuizChoice[] = [];
  let shortAnswer: string | undefined;

  if (answer?.name === 'choice') {
    kind = 'mcq';
    choices = parseChoiceArgs(answer.args);
  } else if (answer?.name === 'choiceTF') {
    kind = 'true-false';
    choices = parseChoiceArgs(answer.args).map((choice, i) => ({ ...choice, label: String.fromCharCode(97 + i) }));
  } else if (answer?.name === 'shortanswer') {
    kind = 'short-answer';
    const args = splitTopLevel(answer.args ?? '');
    const firstPositional = args.find(part => !/^[-\w]+\s*:/.test(part));
    shortAnswer = firstPositional ? unwrapContent(firstPositional) : undefined;
  }

  const contentEnd = bodySolutionCall ? bodySolutionCall.start : body.length;
  const stemEnd = answerIsInBody && answer ? answer.start : contentEnd;
  const stem = body.slice(0, stemEnd).trim();
  const solution = solutionCall?.body?.trim();
  const metadata = parseMetadata(exCall.args);

  return {
    id: `${sourcePath ?? 'pasted'}#${index + 1}`,
    index,
    kind,
    sourcePath,
    rawEx: '',
    rawArgs: exCall.args,
    stem,
    choices,
    shortAnswer,
    solution,
    ...metadata,
  };
}

export function parseTypstQuiz(source: string, sourcePath?: string): QuizDocument {
  const macros = findMacros(source, new Set(['ex']));
  const exCalls: ParsedCall[] = [];

  for (const macro of macros) {
    let i = skipTrivia(source, macro.nameEnd);
    let args: string | undefined;
    if (source[i] === '(') {
      const p = readBalanced(source, i);
      args = p.inner;
      i = skipTrivia(source, p.end);
    }
    if (source[i] !== '[') continue;
    const body = readBalanced(source, i);
    exCalls.push({
      name: 'ex',
      start: macro.hashStart,
      end: body.end,
      args,
      body: body.inner,
    });
  }

  const questions: QuizQuestion[] = [];
  for (let index = 0; index < exCalls.length; index += 1) {
    const exCall = exCalls[index]!;
    const nextExStart = exCalls[index + 1]?.start ?? source.length;
    const trailingSource = source.slice(exCall.end, nextExStart);
    const question = parseQuestion(exCall, trailingSource, questions.length, sourcePath);
    question.rawEx = source.slice(exCall.start, exCall.end);
    questions.push(question);
  }

  return { sourcePath, source, questions };
}
