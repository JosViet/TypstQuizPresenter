#import "@preview/cetz:0.5.2": canvas as cetz-canvas, draw as cetz-draw
#let draw = cetz-draw
#import "../typst-runtime/quiz-runtime.typ": quiz-mcq, quiz-tf, quiz-short, quiz-figure

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
  selected: 2,
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
  selections: (false, false,),
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


#pagebreak()

#quiz-figure(scale-factor: 120%)[
  #rect(width: 50pt, height: 30pt, fill: rgb("#dbeafe"))
]


#pagebreak()

#quiz-mcq(
  number: 4,
  stem: [
    Câu có hình CeTZ thật.
    #align(center)[
      #quiz-figure(scale-factor: 120%)[
        // The question is 30pt, but CeTZ labels should inherit 11pt.
        #context { assert(text.size == 11pt) }
        #cetz-canvas(length: 0.68cm, {
          import draw: *
          let A = (0, 0)
          let B = (3, 0)
          let C = (2, 2)
          line(A, B, C, close: true)
          content(A, [$A$], anchor: "east")
          content(B, [$B$], anchor: "west")
          content(C, [$C$], anchor: "south")
        })
      ]
    ]
  ],
  choices: (
    [$30 degree$],
    [$45 degree$],
    [$60 degree$],
    [$120 degree$],
  ),
  correct: 2,
  reveal: false,
  solution: [],
  show-solution: false,
  font-size: 30pt,
)
