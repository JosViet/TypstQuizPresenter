import './styles.css';
import { parseLoadableQuiz } from './presenter/loadQuiz.ts';
import type { QuizQuestion } from './model/quiz.ts';
import { PresenterState } from './presenter/presenterState.ts';
import { LocalWorkspace } from './runtime/localWorkspace.ts';
import { TypstQuizRenderer } from './runtime/typstRenderer.ts';
import { UpstreamClient } from './runtime/upstreamClient.ts';
import { loadWorkspaceHandle, pickWorkspaceDirectory, saveWorkspaceHandle, supportsDirectoryPicker } from './runtime/workspaceStore.ts';
import { installSwipeNavigation } from './presenter/touchNavigation.ts';
import { isStandalone, setupPwa } from './pwa.ts';
import { shortAnswerMatches } from './presenter/answerCompare.ts';
import { shouldOfferFullscreenRecovery } from './presenter/presentationLifecycle.ts';
import { resolveFigureScale } from './runtime/figureInstrumenter.ts';

const app = document.querySelector<HTMLDivElement>('#app')!;
const renderer = new TypstQuizRenderer();
const upstream = new UpstreamClient();
let renderRevision = 0;
let sourceLoadRevision = 0;
let lastSlideSignature = '';
let sourcePath = '';
let sourceText = '';
let statusMessage = 'Chọn thư mục BienSoanTypst trên máy để bắt đầu.';
let statusError = false;
let activeMode: 'none' | 'workspace' | 'github' | 'paste' = 'none';
let workspace: LocalWorkspace | undefined;
let recentHandle: FileSystemDirectoryHandle | undefined;
let workspaceFiles: string[] = [];
let filteredWorkspaceFiles: string[] = [];
let presentationMode = false;
let fullscreenWasActive = false;
let preservedSlideScrollTop = 0;
let preservedSlideScrollLeft = 0;
let timerPausedInBackground = false;
let returnNoticeTimer: number | undefined;
const LAST_SOURCE_KEY = 'typst-quiz-last-source';
const state = new PresenterState(() => void renderApp());

app.innerHTML = `
<div class="app">
  <aside class="sidebar">
    <div class="brand">Typst Quiz Presenter</div>
    <div class="muted">Local-first · Typst thật · không upload ngân hàng bài tập</div>
    <section class="source-card primary-source">
      <div class="source-card-head"><div><div class="eyebrow">Nguồn chính</div><strong>Workspace local</strong></div><span class="mode-chip local">LOCAL</span></div>
      <p class="muted compact">Chọn thư mục gốc <code>BienSoanTypst</code>. App đọc trực tiếp <code>de-thi.typ</code>, <code>vietdoc.typ</code>, assets và file bài tập trên máy.</p>
      <div class="row wrap"><button class="btn primary" id="chooseWorkspace">Chọn workspace</button><button class="btn" id="openRecentWorkspace" disabled>Mở lại gần đây</button></div>
      <div id="workspaceInfo" class="workspace-info empty">Chưa kết nối workspace.</div>
      <div class="field"><label>Lọc file Typst</label><input id="workspaceFilter" placeholder="Ví dụ: 0C1-B1, dataTN, Toan10..." disabled /></div>
      <div class="field"><label>File trong workspace</label><select id="workspaceFiles" size="9" disabled><option>Chưa có workspace</option></select></div>
      <button class="btn primary full" id="loadWorkspaceFile" disabled>Nạp file đã chọn</button>
      <button class="btn present full" id="startPresentation" disabled>Tiếp tục trình chiếu</button>
      <button class="btn full" id="installApp" hidden>Cài app trên thiết bị</button>
    </section>
    <details class="source-card dev-source">
      <summary>Dev / demo: GitHub hoặc paste source</summary>
      <div class="field"><label>Đường dẫn trong BienSoanTypst</label><input id="sourcePath" value="Toan10/dataTN/0C1-B1.typ" placeholder="Toan10/dataTN/0C1-B1.typ" /></div>
      <div class="row wrap" style="margin-top:8px"><button class="btn" id="loadGithub">Nạp từ commit pin</button><button class="btn" id="parseSource">Parse source</button></div>
      <div class="field"><label>Typst source</label><textarea id="sourceText" placeholder="#ex(...)[ ... ]"></textarea></div>
    </details>
    <div id="status" class="status"></div>
    <div id="questionList" class="question-list"></div>
  </aside>
  <main class="stage-wrap" id="stageWrap">
    <div class="toolbar">
      <button class="btn" id="previous">←</button><span class="counter" id="counter">0 / 0</span><button class="btn" id="next">→</button><button class="btn reset-first" id="resetQuiz">↺ Câu 1</button><button class="btn primary" id="reveal">Hiện đáp án</button>
      <span class="spacer"></span><span class="active-source" id="activeSource">Chưa có nguồn</span>
      <label class="muted">Cỡ chữ</label><input id="fontSize" class="font-size-input" type="number" min="10" max="72" step="0.5" value="30" inputmode="decimal" />
      <label class="muted">Hình</label><select id="figureScale" class="figure-scale-select"><option value="auto" selected>Auto</option><option value="0.8">80%</option><option value="1">100%</option><option value="1.2">120%</option><option value="1.4">140%</option><option value="1.6">160%</option><option value="1.8">180%</option><option value="2">200%</option></select>
      <label class="muted">Timer</label><select id="timerSeconds" style="width:auto"><option>30</option><option selected>45</option><option>60</option><option>90</option></select>
      <button class="btn" id="timerToggle">Start</button><button class="btn" id="timerReset">Reset timer</button><span class="timer" id="timer">00:45</span><button class="btn presentation-only" id="fullscreen">⛶ Toàn màn hình</button><button class="btn presentation-only setup-link" id="exitPresentation">⚙ Cấu hình</button>
    </div>
    <button class="fullscreen-recovery" id="fullscreenRecovery" type="button" hidden>
      <span class="fullscreen-recovery-card">
        <span class="fullscreen-recovery-icon">↗</span>
        <strong>Chạm để trở lại toàn màn hình</strong>
        <small>Câu hỏi và trạng thái hiện tại vẫn được giữ nguyên.</small>
      </span>
    </button>
    <div class="return-notice" id="returnNotice" hidden></div>
    <div class="figure-lightbox" id="figureLightbox" hidden role="button" tabindex="0" aria-label="Thu nhỏ hình">
      <div class="figure-lightbox-card">
        <div class="figure-zoom-content" id="figureZoomContent"></div>
        <div class="figure-zoom-hint">Chạm hình hoặc nền để thu nhỏ</div>
      </div>
    </div>
    <section class="stage"><div class="slide-shell" id="slide"><div class="placeholder">Chọn workspace và nạp một file Typst.</div></div></section>
  </main>
</div>`;

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const pathInput = $('#sourcePath') as HTMLInputElement;
const sourceArea = $('#sourceText') as HTMLTextAreaElement;
const workspaceFilter = $('#workspaceFilter') as HTMLInputElement;
const workspaceSelect = $('#workspaceFiles') as HTMLSelectElement;
const workspaceLoadButton = $('#loadWorkspaceFile') as HTMLButtonElement;
const recentWorkspaceButton = $('#openRecentWorkspace') as HTMLButtonElement;
const fontSizeInput = $('#fontSize') as HTMLInputElement;
const figureScaleSelect = $('#figureScale') as HTMLSelectElement;
const slideElement = $('#slide');
const appElement = $('.app');
const stageWrapElement = $('#stageWrap');
const stageElement = $('.stage');
const startPresentationButton = $('#startPresentation') as HTMLButtonElement;
const installAppButton = $('#installApp') as HTMLButtonElement;
const fullscreenRecoveryButton = $('#fullscreenRecovery') as HTMLButtonElement;
const returnNotice = $('#returnNotice');
const figureLightbox = $('#figureLightbox');
const figureZoomContent = $('#figureZoomContent');

function setStatus(message: string, error = false): void { statusMessage = message; statusError = error; const el = $('#status'); el.textContent = message; el.classList.toggle('error', error); }
function formatTime(seconds: number): string { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function questionSummary(q: QuizQuestion): string { if (q.kind === 'mcq') return `${q.choices.length} lựa chọn`; if (q.kind === 'true-false') return `${q.choices.length} mệnh đề Đ/S`; if (q.kind === 'short-answer') return 'Trả lời ngắn'; return 'Chưa nhận dạng'; }
function activeSourceLabel(): string { if (activeMode === 'workspace' && workspace) return `Local · ${workspace.name}`; if (activeMode === 'github') return `GitHub · ${upstream.commit.slice(0, 8)}`; if (activeMode === 'paste') return 'Paste source'; return 'Chưa có nguồn'; }

function updateFullscreenRecovery(): void {
  fullscreenRecoveryButton.hidden = !shouldOfferFullscreenRecovery({
    presentationMode,
    standalone: isStandalone(),
    fullscreenWasActive,
    hasFullscreenElement: Boolean(document.fullscreenElement),
    visible: document.visibilityState === 'visible',
  });
}

function showReturnNotice(message: string): void {
  if (returnNoticeTimer !== undefined) window.clearTimeout(returnNoticeTimer);
  returnNotice.textContent = message;
  returnNotice.hidden = false;
  returnNoticeTimer = window.setTimeout(() => {
    returnNotice.hidden = true;
    returnNoticeTimer = undefined;
  }, 2400);
}

async function requestPresentationFullscreen(): Promise<void> {
  if (isStandalone() || document.fullscreenElement || !stageWrapElement.requestFullscreen) {
    updateFullscreenRecovery();
    return;
  }

  try {
    await stageWrapElement.requestFullscreen();
    fullscreenWasActive = true;
  } catch {
    // Presentation mode remains usable even when the browser declines fullscreen.
  }
  updateFullscreenRecovery();
}

function enterPresentation(): void {
  if (!state.value.questions.length) return;
  presentationMode = true;
  // The presentation is an app screen, not a browser fullscreen session.
  // Switching tabs/apps must never force an extra fullscreen recovery tap.
  appElement.classList.add('presenting');
  renderApp();
  updateFullscreenRecovery();
}

async function exitPresentation(): Promise<void> {
  presentationMode = false;
  fullscreenWasActive = false;
  // Cancel any old slide update before opening the setup screen.
  renderRevision += 1;
  lastSlideSignature = '';
  appElement.classList.remove('presenting');
  updateFullscreenRecovery();
  renderApp();
  if (document.fullscreenElement) {
    try { await document.exitFullscreen(); } catch { /* Ignore browser-specific fullscreen exit errors. */ }
  }
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch] ?? ch)); }

type SlideInteraction =
  | { kind: 'mcq'; index: number }
  | { kind: 'tf'; index: number; value: boolean };

function anchorHref(anchor: Element): string {
  return anchor.getAttribute('href')
    ?? anchor.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
    ?? '';
}

function figureAnchorFromTarget(target: EventTarget | null): SVGGraphicsElement | undefined {
  if (!(target instanceof Element)) return undefined;
  const anchor = target.closest('a');
  if (!(anchor instanceof SVGGraphicsElement)) return undefined;
  return /quiz\.local\/figure/.test(anchorHref(anchor)) ? anchor : undefined;
}

function figureBoundsInRoot(element: SVGGraphicsElement): { x: number; y: number; width: number; height: number } | undefined {
  try {
    const box = element.getBBox();
    const matrix = element.getCTM();
    if (!matrix || box.width <= 0 || box.height <= 0) return undefined;

    const points = [
      [box.x, box.y],
      [box.x + box.width, box.y],
      [box.x, box.y + box.height],
      [box.x + box.width, box.y + box.height],
    ].map(([x, y]) => ({
      x: matrix.a * x! + matrix.c * y! + matrix.e,
      y: matrix.b * x! + matrix.d * y! + matrix.f,
    }));

    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return {
      x,
      y,
      width: Math.max(...xs) - x,
      height: Math.max(...ys) - y,
    };
  } catch {
    return undefined;
  }
}

function closeFigureZoom(): void {
  figureLightbox.hidden = true;
  figureZoomContent.replaceChildren();
}

function openFigureZoom(anchor: SVGGraphicsElement): void {
  const root = anchor.closest('svg');
  if (!(root instanceof SVGSVGElement)) return;

  const clone = root.cloneNode(true) as SVGSVGElement;
  const bounds = figureBoundsInRoot(anchor);
  if (bounds) {
    const pad = Math.max(bounds.width, bounds.height) * 0.08;
    clone.setAttribute('viewBox', `${bounds.x - pad} ${bounds.y - pad} ${bounds.width + pad * 2} ${bounds.height + pad * 2}`);
  }
  clone.removeAttribute('width');
  clone.removeAttribute('height');
  clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  clone.classList.add('figure-zoom-svg');

  figureZoomContent.replaceChildren(clone);
  figureLightbox.hidden = false;
}

function interactionFromTarget(target: EventTarget | null): SlideInteraction | undefined {
  if (!(target instanceof Element)) return undefined;
  const anchor = target.closest('a');
  if (!anchor) return undefined;

  const href = anchorHref(anchor);

  const choice = href.match(/quiz\.local\/choice\/(\d+)/);
  if (choice) {
    const index = Number(choice[1]);
    return Number.isInteger(index) ? { kind: 'mcq', index } : undefined;
  }

  const tf = href.match(/quiz\.local\/tf\/(\d+)\/(true|false)/);
  if (tf) {
    const index = Number(tf[1]);
    if (!Number.isInteger(index)) return undefined;
    return { kind: 'tf', index, value: tf[2] === 'true' };
  }

  return undefined;
}

slideElement.addEventListener('click', event => {
  const figureAnchor = figureAnchorFromTarget(event.target);
  if (figureAnchor) {
    event.preventDefault();
    event.stopPropagation();
    openFigureZoom(figureAnchor);
    return;
  }

  const interaction = interactionFromTarget(event.target);
  if (!interaction) return;

  event.preventDefault();
  if (interaction.kind === 'mcq') state.selectChoice(interaction.index);
  else state.selectTrueFalse(interaction.index, interaction.value);
});

figureLightbox.addEventListener('click', closeFigureZoom);
figureLightbox.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
    event.preventDefault();
    closeFigureZoom();
  }
});

function renderShortAnswerOverlay(question: QuizQuestion): void {
  if (question.kind !== 'short-answer') return;

  const overlay = document.createElement('div');
  overlay.className = 'short-answer-overlay';

  const label = document.createElement('div');
  label.className = 'short-answer-label';
  label.textContent = 'Câu trả lời của học sinh';

  const input = document.createElement('input');
  input.className = 'short-answer-input';
  input.type = 'text';
  input.inputMode = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'Nhập đáp án…';
  input.value = state.value.shortAnswerInput;
  input.disabled = state.value.revealAnswer;

  input.addEventListener('input', () => state.setShortAnswerInput(input.value));
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !state.value.revealAnswer) {
      state.setShortAnswerInput(input.value);
      state.reveal();
    }
  });

  overlay.append(label, input);

  if (state.value.revealAnswer) {
    const feedback = document.createElement('div');
    feedback.className = 'short-answer-feedback';

    const matches = shortAnswerMatches(state.value.shortAnswerInput, question.shortAnswer);
    if (matches === true) {
      feedback.classList.add('correct');
      feedback.textContent = 'Khớp đáp án';
    } else if (matches === false) {
      feedback.classList.add('mismatch');
      feedback.textContent = 'Chưa khớp · đối chiếu theo chuỗi';
    } else {
      feedback.classList.add('neutral');
      feedback.textContent = 'Chưa nhập đáp án';
    }

    overlay.append(feedback);
  }

  slideElement.append(overlay);
}

async function renderSlide(): Promise<void> {
  const q = state.question; const slide = $('#slide');
  if (!q) { lastSlideSignature = ''; slide.innerHTML = '<div class="placeholder">Chọn workspace và nạp một file Typst.</div>'; return; }
  const tfSignature = state.value.trueFalseSelections.map(value => value === null ? 'n' : value ? 't' : 'f').join('');
  const figureOverride = state.currentFigureScaleOverride();
  const figureScale = resolveFigureScale(state.value.fontSize, figureOverride);
  const signature = [activeMode, workspace?.cacheKey ?? '', q.id, state.value.selectedChoice ?? 'none', tfSignature, state.value.revealAnswer, state.value.showSolution, state.value.fontSize, figureScale].join('|');
  if (signature === lastSlideSignature) return;
  closeFigureZoom();
  lastSlideSignature = signature; const revision = ++renderRevision; slide.innerHTML = '<div class="placeholder">Đang compile Typst…</div>';
  try {
    const svg = await renderer.render(q, {
      selectedChoice: state.value.selectedChoice,
      trueFalseSelections: state.value.trueFalseSelections,
      revealAnswer: state.value.revealAnswer,
      showSolution: state.value.showSolution,
      fontSize: state.value.fontSize,
      figureScaleOverride: figureOverride,
      theme: 'light',
    });
    if (revision !== renderRevision) return;
    slide.innerHTML = svg;
    renderShortAnswerOverlay(q);
    setStatus(`${activeSourceLabel()} · ${q.kind} · ${state.value.fontSize}pt · hình ${Math.round(figureScale * 100)}%`);
  } catch (error) {
    if (revision !== renderRevision) return; const message = error instanceof Error ? error.message : String(error); slide.innerHTML = `<div class="placeholder"><div><strong>Compile Typst chưa thành công.</strong><br><br>${escapeHtml(message)}</div></div>`; setStatus(message, true);
  }
}

function renderQuestionList(): void {
  const list = $('#questionList');
  list.innerHTML = state.value.questions.map((q, i) => `<button class="question-item ${i === state.value.current ? 'active' : ''}" data-index="${i}"><strong>Câu ${i + 1} · ${escapeHtml(q.kind)}</strong><span class="muted">${escapeHtml(questionSummary(q))}${q.tags.length ? ` · ${escapeHtml(q.tags.join(', '))}` : ''}</span></button>`).join('');
  list.querySelectorAll<HTMLButtonElement>('.question-item').forEach(button => button.addEventListener('click', () => { lastSlideSignature = ''; state.goTo(Number(button.dataset.index ?? 0)); }));
}

function renderApp(): void {
  $('#counter').textContent = state.value.questions.length ? `${state.value.current + 1} / ${state.value.questions.length}` : '0 / 0';
  ($('#previous') as HTMLButtonElement).disabled = state.value.current <= 0; ($('#next') as HTMLButtonElement).disabled = state.value.current >= state.value.questions.length - 1;
  ($('#reveal') as HTMLButtonElement).textContent = !state.value.revealAnswer ? 'Hiện đáp án' : !state.value.showSolution ? 'Hiện lời giải' : 'Đã hiện lời giải';
  fontSizeInput.value = String(state.value.fontSize);
  figureScaleSelect.value = state.currentFigureScaleOverride() === null ? 'auto' : String(state.currentFigureScaleOverride());
  ($('#timerSeconds') as HTMLSelectElement).value = String(state.value.timerSeconds); $('#timer').textContent = formatTime(state.value.timerRemaining); $('#timer').classList.toggle('danger', state.value.timerRemaining <= 10); ($('#timerToggle') as HTMLButtonElement).textContent = state.value.timerRunning ? 'Pause' : 'Start'; $('#activeSource').textContent = activeSourceLabel();
  startPresentationButton.disabled = state.value.questions.length === 0;
  appElement.classList.toggle('presenting', presentationMode);
  renderQuestionList();
  $('#status').textContent = statusMessage;
  $('#status').classList.toggle('error', statusError);
  // Never compile while the setup screen hides the slide. The previous code
  // compiled once during setQuestions() and again during enterPresentation(),
  // racing on the same Typst WASM compiler when switching lessons.
  if (presentationMode) void renderSlide();
}

function refreshWorkspaceFileList(filter = ''): void {
  const needle = filter.trim().toLocaleLowerCase('vi'); filteredWorkspaceFiles = workspaceFiles.filter(path => !needle || path.toLocaleLowerCase('vi').includes(needle));
  workspaceSelect.innerHTML = filteredWorkspaceFiles.length ? filteredWorkspaceFiles.map(path => `<option value="${escapeHtml(path)}">${escapeHtml(path)}</option>`).join('') : '<option value="">Không tìm thấy file phù hợp</option>';
  workspaceSelect.disabled = !workspace || filteredWorkspaceFiles.length === 0;
  workspaceLoadButton.disabled = workspaceSelect.disabled;
  if (!workspaceSelect.disabled) {
    const remembered = localStorage.getItem(LAST_SOURCE_KEY);
    const rememberedIndex = remembered ? filteredWorkspaceFiles.indexOf(remembered) : -1;
    workspaceSelect.selectedIndex = rememberedIndex >= 0 ? rememberedIndex : 0;
  }
}
function updateWorkspaceInfo(message: string, connected: boolean): void { const info = $('#workspaceInfo'); info.textContent = message; info.classList.toggle('empty', !connected); info.classList.toggle('connected', connected); }

async function connectWorkspace(handle: FileSystemDirectoryHandle, requestPermission: boolean): Promise<void> {
  const candidate = new LocalWorkspace(handle); const permission = await candidate.permission(requestPermission); if (permission !== 'granted') throw new Error('Chưa được cấp quyền đọc workspace local.');
  const validation = await candidate.validate(); if (!validation.ok) throw new Error(`Thư mục này chưa phải root BienSoanTypst. Thiếu: ${validation.missing.join(', ')}`);
  setStatus(`Đang quét file .typ trong ${candidate.name}…`); const files = await candidate.listTypstFiles(); sourceLoadRevision += 1; workspace = candidate; workspaceFiles = files; activeMode = 'workspace'; renderer.setWorkspace(candidate); workspaceFilter.disabled = false; workspaceFilter.value = ''; refreshWorkspaceFileList(); updateWorkspaceInfo(`${candidate.name} · ${files.length} file .typ · chỉ đọc local`, true); setStatus(`Đã kết nối workspace local "${candidate.name}". Nội dung không được upload lên server.`);
  try { await saveWorkspaceHandle(handle); recentHandle = handle; recentWorkspaceButton.disabled = false; recentWorkspaceButton.textContent = `Mở lại: ${handle.name}`; } catch { setStatus(`Đã mở "${candidate.name}", nhưng trình duyệt không lưu được workspace gần đây. Phiên hiện tại vẫn dùng bình thường.`); }
  renderApp();
}

async function loadSelectedWorkspaceFile(): Promise<void> {
  const selectedWorkspace = workspace;
  if (!selectedWorkspace) {
    setStatus('Chưa có workspace local.', true);
    return;
  }
  const path = workspaceSelect.value;
  if (!path) {
    setStatus('Chưa chọn file Typst.', true);
    return;
  }

  const requestId = ++sourceLoadRevision;
  workspaceLoadButton.disabled = true;
  setStatus(`Đang đọc local: ${path}`);

  try {
    // Read and validate without mutating the active lesson. A failure leaves
    // the existing questions and the "Tiếp tục trình chiếu" button usable.
    const candidateText = await selectedWorkspace.readTextSource(path);
    if (requestId !== sourceLoadRevision) return;
    const doc = parseLoadableQuiz(candidateText, path);

    // Changing to another file is a transaction: commit only valid questions.
    // Typst compilation is started only after entering presentation mode.
    renderRevision += 1;
    lastSlideSignature = '';
    sourcePath = path;
    sourceText = candidateText;
    sourceArea.value = candidateText;
    pathInput.value = path;
    activeMode = 'workspace';
    // A freshly read file may have changed while keeping the same path.
    renderer.setWorkspace(selectedWorkspace);
    state.setQuestions(doc.questions);
    try { localStorage.setItem(LAST_SOURCE_KEY, path); } catch { /* Storage is optional. */ }
    setStatus(`Local · ${path} · ${doc.questions.length} câu hỏi. Đang mở trình chiếu.`);
    enterPresentation();
  } catch (error) {
    if (requestId === sourceLoadRevision) {
      setStatus(error instanceof Error ? error.message : String(error), true);
    }
  } finally {
    if (requestId === sourceLoadRevision) {
      workspaceLoadButton.disabled = !workspace || filteredWorkspaceFiles.length === 0;
    }
  }
}

function parseCurrentSource(): void {
  const candidateText = sourceArea.value;
  const path = pathInput.value.trim();
  try {
    const doc = parseLoadableQuiz(candidateText, path || undefined);
    renderRevision += 1;
    lastSlideSignature = '';
    sourceText = candidateText;
    sourcePath = path;
    activeMode = workspace ? 'workspace' : 'paste';
    renderer.setWorkspace(workspace);
    state.setQuestions(doc.questions);
    setStatus(`Đã parse ${doc.questions.length} câu hỏi.`);
    enterPresentation();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
}

$('#chooseWorkspace').addEventListener('click', async () => { try { const handle = await pickWorkspaceDirectory(); await connectWorkspace(handle, true); } catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; setStatus(error instanceof Error ? error.message : String(error), true); } });
recentWorkspaceButton.addEventListener('click', async () => { if (!recentHandle) return; try { await connectWorkspace(recentHandle, true); } catch (error) { setStatus(error instanceof Error ? error.message : String(error), true); } });
workspaceFilter.addEventListener('input', () => refreshWorkspaceFileList(workspaceFilter.value)); workspaceSelect.addEventListener('dblclick', () => void loadSelectedWorkspaceFile()); workspaceLoadButton.addEventListener('click', () => void loadSelectedWorkspaceFile());

$('#loadGithub').addEventListener('click', async () => {
  const path = pathInput.value.trim();
  if (!path) return setStatus('Cần nhập đường dẫn file trong BienSoanTypst.', true);
  setStatus('Đang tải source từ commit GitHub đã pin…');
  try {
    const candidateText = await upstream.loadTextSource(path);
    const doc = parseLoadableQuiz(candidateText, path);
    renderRevision += 1;
    lastSlideSignature = '';
    sourceText = candidateText;
    sourcePath = path;
    sourceArea.value = candidateText;
    renderer.setWorkspace(undefined);
    activeMode = 'github';
    workspace = undefined;
    state.setQuestions(doc.questions);
    setStatus(`GitHub dev/demo · ${path} · ${doc.questions.length} câu.`);
    enterPresentation();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
});

$('#parseSource').addEventListener('click', parseCurrentSource); $('#previous').addEventListener('click', () => state.previous()); $('#next').addEventListener('click', () => state.next()); $('#resetQuiz').addEventListener('click', () => state.resetToFirst()); $('#reveal').addEventListener('click', () => state.reveal()); fontSizeInput.addEventListener('change', () => state.setFontSize(Number(fontSizeInput.value))); figureScaleSelect.addEventListener('change', () => state.setFigureScaleOverride(figureScaleSelect.value === 'auto' ? null : Number(figureScaleSelect.value))); $('#timerSeconds').addEventListener('change', event => state.setTimer(Number((event.target as HTMLSelectElement).value))); $('#timerToggle').addEventListener('click', () => state.toggleTimer()); $('#timerReset').addEventListener('click', () => state.resetTimer());
startPresentationButton.addEventListener('click', enterPresentation);
$('#exitPresentation').addEventListener('click', () => void exitPresentation());
$('#fullscreen').addEventListener('click', async () => {
  if (document.fullscreenElement) {
    try { await document.exitFullscreen(); } catch { /* Remain in presentation screen. */ }
  } else {
    await requestPresentationFullscreen();
  }
});
fullscreenRecoveryButton.addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  void requestPresentationFullscreen();
});
installSwipeNavigation(stageElement, { previous: () => state.previous(), next: () => state.next() });

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement && presentationMode) fullscreenWasActive = true;
  updateFullscreenRecovery();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    preservedSlideScrollTop = slideElement.scrollTop;
    preservedSlideScrollLeft = slideElement.scrollLeft;
    timerPausedInBackground = state.pauseTimer() || timerPausedInBackground;
    return;
  }

  updateFullscreenRecovery();
  window.requestAnimationFrame(() => {
    slideElement.scrollTop = preservedSlideScrollTop;
    slideElement.scrollLeft = preservedSlideScrollLeft;
  });

  if (timerPausedInBackground) {
    timerPausedInBackground = false;
    showReturnNotice('Đã quay lại · timer đang tạm dừng');
  }
});
document.addEventListener('keydown', event => { const active = document.activeElement; if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return; if (event.code === 'Space') { event.preventDefault(); state.reveal(); } else if (event.code === 'ArrowRight') state.next(); else if (event.code === 'ArrowLeft') state.previous(); else if (event.key.toLowerCase() === 'f') void $('#stageWrap').requestFullscreen(); else if (event.key.toLowerCase() === 'r') state.toggleTimer(); });

async function initializeRecentWorkspace(): Promise<void> {
  if (!supportsDirectoryPicker()) { recentWorkspaceButton.disabled = true; ($('#chooseWorkspace') as HTMLButtonElement).disabled = true; updateWorkspaceInfo('Trình duyệt chưa hỗ trợ Local Workspace. Dùng Chrome/Edge mới qua HTTPS hoặc localhost.', false); return; }
  try {
    recentHandle = await loadWorkspaceHandle();
    if (recentHandle) {
      recentWorkspaceButton.disabled = false;
      const probe = new LocalWorkspace(recentHandle);
      const permission = await probe.permission(false);

      if (permission === 'granted') {
        recentWorkspaceButton.textContent = `Đang mở: ${recentHandle.name}`;
        await connectWorkspace(recentHandle, false);
        const remembered = localStorage.getItem(LAST_SOURCE_KEY);
        if (remembered && workspaceFiles.includes(remembered)) {
          workspaceSelect.value = remembered;
          await loadSelectedWorkspaceFile();
        }
      } else {
        recentWorkspaceButton.textContent = `Mở lại: ${recentHandle.name}`;
        updateWorkspaceInfo(`Workspace gần đây: ${recentHandle.name}. Android/Chrome cần cấp lại quyền đọc bằng một lần chạm.`, false);
      }
    }
  } catch { /* IndexedDB policy can block persistence; picker still works. */ }
}
setupPwa(installAppButton, setStatus);
renderApp(); void initializeRecentWorkspace();
