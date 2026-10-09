import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PresenterState } from '../src/presenter/presenterState.ts';
import { parseLoadableQuiz } from '../src/presenter/loadQuiz.ts';

const firstBank = `
#ex[Chọn kết quả của $1 + 1$]
#choice([$1$], T[$2$], [$3$], [$4$])
#ex[Xét $2 > 1$]
#choiceTF(T[Đúng], [Sai])
`;

const secondBank = `
#ex[Giải phương trình $x + 2 = 4$.]
#shortanswer("2")
#loigiai[$x = 2$]
`;

test('switching from lesson A to B commits only a valid, nonempty bank', () => {
  const state = new PresenterState(() => {});
  state.setQuestions(parseLoadableQuiz(firstBank, 'Toan10/dataTN/A.typ').questions);
  assert.equal(state.value.questions.length, 2);

  state.goTo(1);
  state.reveal();
  assert.equal(state.value.current, 1);
  assert.equal(state.value.revealAnswer, true);

  // Going to configuration does not clear the current bank.
  assert.equal(state.value.questions.length, 2);

  const newDoc = parseLoadableQuiz(secondBank, 'Toan10/dataTN/B.typ');
  state.setQuestions(newDoc.questions);
  assert.equal(state.value.questions.length, 1);
  assert.equal(state.value.current, 0);
  assert.equal(state.value.revealAnswer, false);
  assert.equal(state.question?.kind, 'short-answer');
  assert.equal(state.question?.sourcePath, 'Toan10/dataTN/B.typ');
});

test('a failed/empty source does not erase the previously loaded lesson', () => {
  const state = new PresenterState(() => {});
  state.setQuestions(parseLoadableQuiz(firstBank).questions);
  state.goTo(1);
  assert.throws(
    () => parseLoadableQuiz('// file không có #ex\n#let x = 1', 'empty.typ'),
    /không có câu hỏi #ex hợp lệ/,
  );
  assert.equal(state.value.questions.length, 2);
  assert.equal(state.value.current, 1);
});
