import type { QuizQuestion } from '../model/quiz.ts';

export interface PresenterSnapshot {
  questions: QuizQuestion[];
  current: number;
  selectedChoice: number | null;
  trueFalseSelections: Array<boolean | null>;
  shortAnswerInput: string;
  revealAnswer: boolean;
  showSolution: boolean;
  fontSize: number;
  timerSeconds: number;
  timerRemaining: number;
  timerRunning: boolean;
}

export class PresenterState {
  private timer?: number;
  value: PresenterSnapshot = {
    questions: [],
    current: 0,
    selectedChoice: null,
    trueFalseSelections: [],
    shortAnswerInput: '',
    revealAnswer: false,
    showSolution: false,
    fontSize: 30,
    timerSeconds: 45,
    timerRemaining: 45,
    timerRunning: false,
  };

  constructor(private onChange: () => void) {}

  private resetQuestionView(): void {
    this.value.selectedChoice = null;
    this.value.trueFalseSelections = this.question?.kind === 'true-false'
      ? this.question.choices.map(() => null)
      : [];
    this.value.shortAnswerInput = '';
    this.value.revealAnswer = false;
    this.value.showSolution = false;
    this.value.timerRemaining = this.value.timerSeconds;
  }

  setQuestions(questions: QuizQuestion[]): void {
    this.stopTimer();
    this.value.questions = questions;
    this.value.current = 0;
    this.resetQuestionView();
    this.onChange();
  }

  get question(): QuizQuestion | undefined {
    return this.value.questions[this.value.current];
  }

  next(): void {
    if (this.value.current < this.value.questions.length - 1) {
      this.stopTimer();
      this.value.current += 1;
      this.resetQuestionView();
      this.onChange();
    }
  }

  previous(): void {
    if (this.value.current > 0) {
      this.stopTimer();
      this.value.current -= 1;
      this.resetQuestionView();
      this.onChange();
    }
  }

  goTo(index: number): void {
    if (index < 0 || index >= this.value.questions.length || index === this.value.current) return;
    this.stopTimer();
    this.value.current = index;
    this.resetQuestionView();
    this.onChange();
  }

  selectChoice(index: number): void {
    if (this.value.revealAnswer || this.question?.kind !== 'mcq') return;
    if (index < 0 || index >= (this.question?.choices.length ?? 0)) return;
    this.value.selectedChoice = index;
    this.onChange();
  }

  selectTrueFalse(index: number, value: boolean): void {
    if (this.value.revealAnswer || this.question?.kind !== 'true-false') return;
    if (index < 0 || index >= (this.question?.choices.length ?? 0)) return;

    const selections = [...this.value.trueFalseSelections];
    selections[index] = value;
    this.value.trueFalseSelections = selections;
    this.onChange();
  }

  setShortAnswerInput(value: string): void {
    if (this.value.revealAnswer || this.question?.kind !== 'short-answer') return;
    this.value.shortAnswerInput = value;
  }

  reveal(): void {
    if (!this.value.revealAnswer) this.value.revealAnswer = true;
    else this.value.showSolution = true;
    this.onChange();
  }

  hideSolution(): void {
    this.value.showSolution = false;
    this.onChange();
  }

  setFontSize(size: number): void {
    if (!Number.isFinite(size)) return;
    this.value.fontSize = Math.max(10, Math.min(72, Math.round(size * 2) / 2));
    this.onChange();
  }

  setTimer(seconds: number): void {
    this.stopTimer();
    this.value.timerSeconds = Math.max(5, Math.round(seconds));
    this.value.timerRemaining = this.value.timerSeconds;
    this.onChange();
  }

  toggleTimer(): void {
    if (this.value.timerRunning) {
      this.stopTimer();
      this.onChange();
      return;
    }
    if (this.value.timerRemaining <= 0) this.value.timerRemaining = this.value.timerSeconds;
    this.value.timerRunning = true;
    this.timer = window.setInterval(() => {
      this.value.timerRemaining -= 1;
      if (this.value.timerRemaining <= 0) {
        this.value.timerRemaining = 0;
        this.stopTimer();
      }
      this.onChange();
    }, 1000);
    this.onChange();
  }

  resetTimer(): void {
    this.stopTimer();
    this.value.timerRemaining = this.value.timerSeconds;
    this.onChange();
  }

  stopTimer(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    this.value.timerRunning = false;
  }
}
