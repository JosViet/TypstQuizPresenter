#import "../typst-runtime/quiz-runtime.typ": quiz-mcq, quiz-tf, quiz-short

#quiz-mcq(
  number: 1,
  stem: [Cho $x = 1$. Chọn đáp án đúng.],
  choices: (
    [$0$],
    [$1$],
    [$2$],
    [$3$],
  ),
  correct: 1,
  reveal: true,
  solution: [$x = 1$.],
  show-solution: true,
  font-size: 34pt,
)

#pagebreak()

#quiz-tf(
  number: 2,
  stem: [Xét các mệnh đề sau.],
  statements: (
    [$1 < 2$],
    [$3 < 1$],
  ),
  truths: (true, false,),
  reveal: true,
  solution: [So sánh trực tiếp.],
  show-solution: true,
  font-size: 34pt,
)

#pagebreak()

#quiz-short(
  number: 3,
  stem: [Tính $2 + 3$.],
  answer: [$5$],
  reveal: true,
  solution: [$2 + 3 = 5$.],
  show-solution: true,
  font-size: 34pt,
)
