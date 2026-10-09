import type { QuizDocument } from '../model/quiz.ts';
import { parseTypstQuiz } from '../parser/typstQuizParser.ts';

/**
 * Validate an incoming bank before changing the currently presented quiz.
 * A non-quiz .typ file must never erase the working lesson.
 */
export function parseLoadableQuiz(source: string, sourcePath?: string): QuizDocument {
  const document = parseTypstQuiz(source, sourcePath);
  if (document.questions.length === 0) {
    throw new Error(
      'File Typst không có câu hỏi #ex hợp lệ. Bài đang trình chiếu được giữ nguyên; hãy chọn file ngân hàng câu hỏi khác.',
    );
  }
  return document;
}
