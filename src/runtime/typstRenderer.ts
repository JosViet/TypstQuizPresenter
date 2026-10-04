import { $typst } from '@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs';
import compilerWasm from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';
import rendererWasm from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';
import quizRuntimeSource from '../../typst-runtime/quiz-runtime.typ?raw';
import type { QuizQuestion } from '../model/quiz.ts';
import { buildQuizDocument, generatedMainPath, type QuizRenderOptions } from './quizDocument.ts';
import { LocalWorkspace } from './localWorkspace.ts';
import { UpstreamClient } from './upstreamClient.ts';

export class TypstQuizRenderer {
  private initialized = false;
  private mountedKey = '';
  private upstream = new UpstreamClient();
  private workspace?: LocalWorkspace;

  setWorkspace(workspace?: LocalWorkspace): void {
    this.workspace = workspace;
    this.mountedKey = '';
  }

  private async init(): Promise<void> {
    if (this.initialized) return;
    $typst.setCompilerInitOptions({ getModule: () => compilerWasm });
    $typst.setRendererInitOptions({ getModule: () => rendererWasm });
    await $typst.addSource('/__quiz_runtime.typ', quizRuntimeSource);
    this.initialized = true;
  }

  async mountRuntime(sourcePath?: string): Promise<void> {
    await this.init();

    const provider = this.workspace ?? this.upstream;
    const providerKey = this.workspace ? this.workspace.cacheKey : this.upstream.commit;
    const key = `${providerKey}:${sourcePath ?? 'pasted'}`;
    if (this.mountedKey === key) return;

    await $typst.resetShadow();
    await $typst.addSource('/__quiz_runtime.typ', quizRuntimeSource);

    const bundle = await provider.loadRuntimeFor(sourcePath);
    for (const file of bundle.files) {
      if (file.kind === 'source') await $typst.addSource(file.path, file.text ?? '');
      else if (file.bytes) await $typst.mapShadow(file.path, file.bytes);
    }

    this.mountedKey = key;
  }

  async render(question: QuizQuestion, options: QuizRenderOptions): Promise<string> {
    await this.mountRuntime(question.sourcePath);
    const mainPath = generatedMainPath(question);
    await $typst.addSource(mainPath, buildQuizDocument(question, options));
    return $typst.svg({ mainFilePath: mainPath });
  }
}
