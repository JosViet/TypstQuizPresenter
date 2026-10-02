import type { QuizQuestion } from '../model/quiz.ts';

export interface PresenterSnapshot {
  questions: QuizQuestion[];
  current: number;
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
    revealAnswer: false,
    showSolution: false,
    fontSize: 34,
    timerSeconds: 45,
    timerRemaining: 45,
    timerRunning: false,
  };

  constructor(private onChange: () => void) {}

  setQuestions(questions: QuizQuestion[]): void {
    this.stopTimer();
    this.value.questions = questions;
    this.value.current = 0;
    this.value.revealAnswer = false;
    this.value.showSolution = false;
    this.onChange();
  }

  get question(): QuizQuestion | undefined {
    return this.value.questions[this.value.current];
  }

  next(): void {
    if (this.value.current < this.value.questions.length - 1) {
      this.stopTimer();
      this.value.current += 1;
      this.value.revealAnswer = false;
      this.value.showSolution = false;
      this.value.timerRemaining = this.value.timerSeconds;
      this.onChange();
    }
  }

  previous(): void {
    if (this.value.current > 0) {
      this.stopTimer();
      this.value.current -= 1;
      this.value.revealAnswer = false;
      this.value.showSolution = false;
      this.value.timerRemaining = this.value.timerSeconds;
      this.onChange();
    }
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
    this.value.fontSize = Math.max(30, Math.min(44, Math.round(size)));
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
