import './styles.css';
import { parseTypstQuiz } from './parser/typstQuizParser.ts';
import type { QuizQuestion } from './model/quiz.ts';
import { PresenterState } from './presenter/presenterState.ts';
import { TypstQuizRenderer } from './runtime/typstRenderer.ts';
import { UpstreamClient } from './runtime/upstreamClient.ts';

const app = document.querySelector<HTMLDivElement>('#app')!;
const renderer = new TypstQuizRenderer();
const upstream = new UpstreamClient();
let renderRevision = 0;
let lastSlideSignature = '';
let sourcePath = '';
let sourceText = '';
let statusMessage = 'Nạp một file Typst hoặc dán source để bắt đầu.';
let statusError = false;

const state = new PresenterState(() => void renderApp());

app.innerHTML = `
  <div class="app">
    <aside class="sidebar">
      <div class="brand">Typst Quiz Presenter</div>
      <div class="muted">Teacher-led presenter · Typst thật · tối thiểu 30pt</div>

      <div class="field">
        <label>Đường dẫn trong BienSoanTypst</label>
        <input id="sourcePath" value="Toan10/dataTN/0C1-B1.typ" placeholder="Toan10/dataTN/0C1-B1.typ" />
      </div>
      <div class="row" style="margin-top:8px">
        <button class="btn primary" id="loadGithub">Nạp từ repo</button>
        <button class="btn" id="parseSource">Parse source</button>
      </div>

      <div class="field">
        <label>Typst source</label>
        <textarea id="sourceText" placeholder="#ex(...)[ ... ]"></textarea>
      </div>

      <div id="status" class="status"></div>
      <div id="questionList" class="question-list"></div>
    </aside>

    <main class="stage-wrap" id="stageWrap">
      <div class="toolbar">
        <button class="btn" id="previous">←</button>
        <span class="counter" id="counter">0 / 0</span>
        <button class="btn" id="next">→</button>
        <button class="btn primary" id="reveal">Hiện đáp án</button>
        <span class="spacer"></span>
        <label class="muted">Cỡ chữ</label>
        <select id="fontSize" style="width:auto">
          <option>30</option><option>32</option><option selected>34</option><option>36</option><option>40</option><option>44</option>
        </select>
        <label class="muted">Timer</label>
        <select id="timerSeconds" style="width:auto">
          <option>30</option><option selected>45</option><option>60</option><option>90</option>
        </select>
        <button class="btn" id="timerToggle">Start</button>
        <button class="btn" id="timerReset">Reset</button>
        <span class="timer" id="timer">00:45</span>
        <button class="btn" id="fullscreen">Fullscreen</button>
      </div>
      <section class="stage">
        <div class="slide-shell" id="slide">
          <div class="placeholder">Nạp nguồn và chọn câu hỏi.</div>
        </div>
      </section>
    </main>
  </div>
`;

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const pathInput = $('#sourcePath') as HTMLInputElement;
const sourceArea = $('#sourceText') as HTMLTextAreaElement;

function setStatus(message: string, error = false): void {
  statusMessage = message;
  statusError = error;
  const el = $('#status');
  el.textContent = message;
  el.classList.toggle('error', error);
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function questionSummary(q: QuizQuestion): string {
  if (q.kind === 'mcq') return `${q.choices.length} lựa chọn`;
  if (q.kind === 'true-false') return `${q.choices.length} mệnh đề Đ/S`;
  if (q.kind === 'short-answer') return 'Trả lời ngắn';
  return 'Chưa nhận dạng';
}

async function renderSlide(): Promise<void> {
  const q = state.question;
  const slide = $('#slide');
  if (!q) {
    lastSlideSignature = '';
    slide.innerHTML = '<div class="placeholder">Nạp nguồn và chọn câu hỏi.</div>';
    return;
  }

  const signature = [q.id, state.value.revealAnswer, state.value.showSolution, state.value.fontSize].join('|');
  if (signature === lastSlideSignature) return;
  lastSlideSignature = signature;
  const revision = ++renderRevision;
  slide.innerHTML = '<div class="placeholder">Đang compile Typst…</div>';
  try {
    const svg = await renderer.render(q, {
      revealAnswer: state.value.revealAnswer,
      showSolution: state.value.showSolution,
      fontSize: state.value.fontSize,
      theme: 'light',
    });
    if (revision !== renderRevision) return;
    slide.innerHTML = svg;
    setStatus(`Render bằng runtime ${upstream.commit.slice(0, 8)} · ${q.kind} · ${state.value.fontSize}pt`);
  } catch (error) {
    if (revision !== renderRevision) return;
    const message = error instanceof Error ? error.message : String(error);
    slide.innerHTML = `<div class="placeholder"><div><strong>Compile Typst chưa thành công.</strong><br><br>${escapeHtml(message)}</div></div>`;
    setStatus(message, true);
  }
}

function renderApp(): void {
  $('#counter').textContent = state.value.questions.length
    ? `${state.value.current + 1} / ${state.value.questions.length}`
    : '0 / 0';
  ($('#previous') as HTMLButtonElement).disabled = state.value.current <= 0;
  ($('#next') as HTMLButtonElement).disabled = state.value.current >= state.value.questions.length - 1;
  ($('#reveal') as HTMLButtonElement).textContent = !state.value.revealAnswer
    ? 'Hiện đáp án'
    : !state.value.showSolution
      ? 'Hiện lời giải'
      : 'Đã hiện lời giải';
  ($('#fontSize') as HTMLSelectElement).value = String(state.value.fontSize);
  ($('#timerSeconds') as HTMLSelectElement).value = String(state.value.timerSeconds);
  $('#timer').textContent = formatTime(state.value.timerRemaining);
  $('#timer').classList.toggle('danger', state.value.timerRemaining <= 10);
  ($('#timerToggle') as HTMLButtonElement).textContent = state.value.timerRunning ? 'Pause' : 'Start';

  const list = $('#questionList');
  list.innerHTML = state.value.questions.map((q, i) => `
    <button class="question-item ${i === state.value.current ? 'active' : ''}" data-index="${i}">
      <strong>Câu ${i + 1} · ${escapeHtml(q.kind)}</strong>
      <span class="muted">${escapeHtml(questionSummary(q))}${q.tags.length ? ` · ${escapeHtml(q.tags.join(', '))}` : ''}</span>
    </button>
  `).join('');
  list.querySelectorAll<HTMLButtonElement>('.question-item').forEach(button => {
    button.addEventListener('click', () => {
      state.stopTimer();
      state.value.current = Number(button.dataset.index ?? 0);
      state.value.revealAnswer = false;
      state.value.showSolution = false;
      state.value.timerRemaining = state.value.timerSeconds;
      void renderApp();
    });
  });

  $('#status').textContent = statusMessage;
  $('#status').classList.toggle('error', statusError);
  void renderSlide();
}

function parseCurrentSource(): void {
  sourceText = sourceArea.value;
  sourcePath = pathInput.value.trim();
  try {
    const doc = parseTypstQuiz(sourceText, sourcePath || undefined);
    state.setQuestions(doc.questions);
    setStatus(`Đã parse ${doc.questions.length} câu hỏi.`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] ?? ch));
}

$('#loadGithub').addEventListener('click', async () => {
  const path = pathInput.value.trim();
  if (!path) return setStatus('Cần nhập đường dẫn file trong BienSoanTypst.', true);
  setStatus('Đang tải source từ commit đã pin…');
  try {
    sourceText = await upstream.loadTextSource(path);
    sourcePath = path;
    sourceArea.value = sourceText;
    const doc = parseTypstQuiz(sourceText, sourcePath);
    state.setQuestions(doc.questions);
    setStatus(`Đã nạp ${path} · ${doc.questions.length} câu.`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
});

$('#parseSource').addEventListener('click', parseCurrentSource);
$('#previous').addEventListener('click', () => state.previous());
$('#next').addEventListener('click', () => state.next());
$('#reveal').addEventListener('click', () => state.reveal());
$('#fontSize').addEventListener('change', event => state.setFontSize(Number((event.target as HTMLSelectElement).value)));
$('#timerSeconds').addEventListener('change', event => state.setTimer(Number((event.target as HTMLSelectElement).value)));
$('#timerToggle').addEventListener('click', () => state.toggleTimer());
$('#timerReset').addEventListener('click', () => state.resetTimer());
$('#fullscreen').addEventListener('click', async () => {
  const target = $('#stageWrap');
  if (!document.fullscreenElement) await target.requestFullscreen();
  else await document.exitFullscreen();
});

document.addEventListener('keydown', event => {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return;
  if (event.code === 'Space') {
    event.preventDefault();
    state.reveal();
  } else if (event.code === 'ArrowRight') {
    state.next();
  } else if (event.code === 'ArrowLeft') {
    state.previous();
  } else if (event.key.toLowerCase() === 'f') {
    void ($('#stageWrap').requestFullscreen());
  } else if (event.key.toLowerCase() === 'r') {
    state.toggleTimer();
  }
});

renderApp();
