import './styles.css';
import { parseTypstQuiz } from './parser/typstQuizParser.ts';
import type { QuizQuestion } from './model/quiz.ts';
import { PresenterState } from './presenter/presenterState.ts';
import { LocalWorkspace } from './runtime/localWorkspace.ts';
import { TypstQuizRenderer } from './runtime/typstRenderer.ts';
import { UpstreamClient } from './runtime/upstreamClient.ts';
import { loadWorkspaceHandle, pickWorkspaceDirectory, saveWorkspaceHandle, supportsDirectoryPicker } from './runtime/workspaceStore.ts';
import { installSwipeNavigation } from './presenter/touchNavigation.ts';
import { isStandalone, setupPwa } from './pwa.ts';

const app = document.querySelector<HTMLDivElement>('#app')!;
const renderer = new TypstQuizRenderer();
const upstream = new UpstreamClient();
let renderRevision = 0;
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
      <button class="btn present full" id="startPresentation" disabled>Bắt đầu trình chiếu</button>
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
      <button class="btn" id="previous">←</button><span class="counter" id="counter">0 / 0</span><button class="btn" id="next">→</button><button class="btn primary" id="reveal">Hiện đáp án</button>
      <span class="spacer"></span><span class="active-source" id="activeSource">Chưa có nguồn</span>
      <label class="muted">Cỡ chữ</label><input id="fontSize" class="font-size-input" type="number" min="10" max="72" step="0.5" value="30" inputmode="decimal" />
      <label class="muted">Timer</label><select id="timerSeconds" style="width:auto"><option>30</option><option selected>45</option><option>60</option><option>90</option></select>
      <button class="btn" id="timerToggle">Start</button><button class="btn" id="timerReset">Reset</button><span class="timer" id="timer">00:45</span><button class="btn preparation-only" id="fullscreen">Fullscreen</button><button class="btn presentation-only danger-soft" id="exitPresentation">Thoát</button>
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
const slideElement = $('#slide');
const appElement = $('.app');
const stageWrapElement = $('#stageWrap');
const stageElement = $('.stage');
const startPresentationButton = $('#startPresentation') as HTMLButtonElement;
const installAppButton = $('#installApp') as HTMLButtonElement;

function setStatus(message: string, error = false): void { statusMessage = message; statusError = error; const el = $('#status'); el.textContent = message; el.classList.toggle('error', error); }
function formatTime(seconds: number): string { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function questionSummary(q: QuizQuestion): string { if (q.kind === 'mcq') return `${q.choices.length} lựa chọn`; if (q.kind === 'true-false') return `${q.choices.length} mệnh đề Đ/S`; if (q.kind === 'short-answer') return 'Trả lời ngắn'; return 'Chưa nhận dạng'; }
function activeSourceLabel(): string { if (activeMode === 'workspace' && workspace) return `Local · ${workspace.name}`; if (activeMode === 'github') return `GitHub · ${upstream.commit.slice(0, 8)}`; if (activeMode === 'paste') return 'Paste source'; return 'Chưa có nguồn'; }

async function enterPresentation(): Promise<void> {
  if (!state.value.questions.length) return;
  presentationMode = true;
  appElement.classList.add('presenting');
  renderApp();

  if (!isStandalone() && !document.fullscreenElement && stageWrapElement.requestFullscreen) {
    try { await stageWrapElement.requestFullscreen(); } catch { /* Presentation mode still works without fullscreen. */ }
  }
}

async function exitPresentation(): Promise<void> {
  presentationMode = false;
  appElement.classList.remove('presenting');
  if (document.fullscreenElement) {
    try { await document.exitFullscreen(); } catch { /* Ignore browser-specific fullscreen exit errors. */ }
  }
  renderApp();
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch] ?? ch)); }

function choiceIndexFromTarget(target: EventTarget | null): number | undefined {
  if (!(target instanceof Element)) return undefined;
  const anchor = target.closest('a');
  if (!anchor) return undefined;
  const href = anchor.getAttribute('href') ?? anchor.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? '';
  const match = href.match(/quiz\.local\/choice\/(\d+)/);
  if (!match) return undefined;
  const index = Number(match[1]);
  return Number.isInteger(index) ? index : undefined;
}

slideElement.addEventListener('click', event => {
  const index = choiceIndexFromTarget(event.target);
  if (index === undefined) return;
  event.preventDefault();
  state.selectChoice(index);
});

async function renderSlide(): Promise<void> {
  const q = state.question; const slide = $('#slide');
  if (!q) { lastSlideSignature = ''; slide.innerHTML = '<div class="placeholder">Chọn workspace và nạp một file Typst.</div>'; return; }
  const signature = [activeMode, workspace?.cacheKey ?? '', q.id, state.value.selectedChoice ?? 'none', state.value.revealAnswer, state.value.showSolution, state.value.fontSize].join('|');
  if (signature === lastSlideSignature) return; lastSlideSignature = signature; const revision = ++renderRevision; slide.innerHTML = '<div class="placeholder">Đang compile Typst…</div>';
  try {
    const svg = await renderer.render(q, { selectedChoice: state.value.selectedChoice, revealAnswer: state.value.revealAnswer, showSolution: state.value.showSolution, fontSize: state.value.fontSize, theme: 'light' });
    if (revision !== renderRevision) return; slide.innerHTML = svg; setStatus(`${activeSourceLabel()} · ${q.kind} · ${state.value.fontSize}pt`);
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
  fontSizeInput.value = String(state.value.fontSize); ($('#timerSeconds') as HTMLSelectElement).value = String(state.value.timerSeconds); $('#timer').textContent = formatTime(state.value.timerRemaining); $('#timer').classList.toggle('danger', state.value.timerRemaining <= 10); ($('#timerToggle') as HTMLButtonElement).textContent = state.value.timerRunning ? 'Pause' : 'Start'; $('#activeSource').textContent = activeSourceLabel();
  startPresentationButton.disabled = state.value.questions.length === 0;
  appElement.classList.toggle('presenting', presentationMode);
  renderQuestionList(); $('#status').textContent = statusMessage; $('#status').classList.toggle('error', statusError); void renderSlide();
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
  setStatus(`Đang quét file .typ trong ${candidate.name}…`); const files = await candidate.listTypstFiles(); workspace = candidate; workspaceFiles = files; activeMode = 'workspace'; renderer.setWorkspace(candidate); workspaceFilter.disabled = false; workspaceFilter.value = ''; refreshWorkspaceFileList(); updateWorkspaceInfo(`${candidate.name} · ${files.length} file .typ · chỉ đọc local`, true); setStatus(`Đã kết nối workspace local "${candidate.name}". Nội dung không được upload lên server.`);
  try { await saveWorkspaceHandle(handle); recentHandle = handle; recentWorkspaceButton.disabled = false; recentWorkspaceButton.textContent = `Mở lại: ${handle.name}`; } catch { setStatus(`Đã mở "${candidate.name}", nhưng trình duyệt không lưu được workspace gần đây. Phiên hiện tại vẫn dùng bình thường.`); }
  renderApp();
}

async function loadSelectedWorkspaceFile(): Promise<void> {
  if (!workspace) return setStatus('Chưa có workspace local.', true); const path = workspaceSelect.value; if (!path) return setStatus('Chưa chọn file Typst.', true); setStatus(`Đang đọc local: ${path}`);
  try { sourcePath = path; sourceText = await workspace.readTextSource(path); sourceArea.value = sourceText; pathInput.value = path; activeMode = 'workspace'; renderer.setWorkspace(workspace); const doc = parseTypstQuiz(sourceText, sourcePath); state.setQuestions(doc.questions); lastSlideSignature = ''; localStorage.setItem(LAST_SOURCE_KEY, path); setStatus(`Local · ${path} · tìm thấy ${doc.questions.length} câu hỏi.`); } catch (error) { setStatus(error instanceof Error ? error.message : String(error), true); }
}

function parseCurrentSource(): void {
  sourceText = sourceArea.value; sourcePath = pathInput.value.trim(); activeMode = workspace ? 'workspace' : 'paste'; renderer.setWorkspace(workspace);
  try { const doc = parseTypstQuiz(sourceText, sourcePath || undefined); state.setQuestions(doc.questions); lastSlideSignature = ''; setStatus(`Đã parse ${doc.questions.length} câu hỏi.`); } catch (error) { setStatus(error instanceof Error ? error.message : String(error), true); }
}

$('#chooseWorkspace').addEventListener('click', async () => { try { const handle = await pickWorkspaceDirectory(); await connectWorkspace(handle, true); } catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; setStatus(error instanceof Error ? error.message : String(error), true); } });
recentWorkspaceButton.addEventListener('click', async () => { if (!recentHandle) return; try { await connectWorkspace(recentHandle, true); } catch (error) { setStatus(error instanceof Error ? error.message : String(error), true); } });
workspaceFilter.addEventListener('input', () => refreshWorkspaceFileList(workspaceFilter.value)); workspaceSelect.addEventListener('dblclick', () => void loadSelectedWorkspaceFile()); workspaceLoadButton.addEventListener('click', () => void loadSelectedWorkspaceFile());

$('#loadGithub').addEventListener('click', async () => {
  const path = pathInput.value.trim(); if (!path) return setStatus('Cần nhập đường dẫn file trong BienSoanTypst.', true); setStatus('Đang tải source từ commit GitHub đã pin…');
  try { renderer.setWorkspace(undefined); activeMode = 'github'; workspace = undefined; sourceText = await upstream.loadTextSource(path); sourcePath = path; sourceArea.value = sourceText; const doc = parseTypstQuiz(sourceText, sourcePath); state.setQuestions(doc.questions); lastSlideSignature = ''; setStatus(`GitHub dev/demo · ${path} · ${doc.questions.length} câu.`); } catch (error) { setStatus(error instanceof Error ? error.message : String(error), true); }
});

$('#parseSource').addEventListener('click', parseCurrentSource); $('#previous').addEventListener('click', () => state.previous()); $('#next').addEventListener('click', () => state.next()); $('#reveal').addEventListener('click', () => state.reveal()); fontSizeInput.addEventListener('change', () => state.setFontSize(Number(fontSizeInput.value))); $('#timerSeconds').addEventListener('change', event => state.setTimer(Number((event.target as HTMLSelectElement).value))); $('#timerToggle').addEventListener('click', () => state.toggleTimer()); $('#timerReset').addEventListener('click', () => state.resetTimer());
startPresentationButton.addEventListener('click', () => void enterPresentation());
$('#exitPresentation').addEventListener('click', () => void exitPresentation());
$('#fullscreen').addEventListener('click', async () => { const target = stageWrapElement; if (!document.fullscreenElement) await target.requestFullscreen(); else await document.exitFullscreen(); });
installSwipeNavigation(stageElement, { previous: () => state.previous(), next: () => state.next() });
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
