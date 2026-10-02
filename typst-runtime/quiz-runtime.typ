// Presentation-only Typst runtime.
// This file intentionally does not replace de-thi.typ or vietdoc.typ.
// Raw question content is compiled with those upstream libraries already imported.

#let quiz-primary = rgb("#1d4ed8")
#let quiz-correct = rgb("#15803d")
#let quiz-wrong = rgb("#b91c1c")
#let quiz-border = rgb("#cbd5e1")
#let quiz-muted = rgb("#64748b")
#let quiz-soft = rgb("#f8fafc")

#set page(
  width: 13.333in,
  height: auto,
  margin: (x: 30pt, y: 24pt),
)
#set text(fill: rgb("#0f172a"))
#set par(justify: false, leading: 0.72em)

#let _quiz-header(number) = block(width: 100%)[
  #box(
    inset: (x: 12pt, y: 5pt),
    fill: quiz-primary,
    radius: 6pt,
  )[
    #text(size: 18pt, weight: "bold", fill: white)[Câu #number]
  ]
]

#let _quiz-option(label, body, correct: false, reveal: false, font-size: 34pt) = {
  let active = reveal and correct
  block(
    width: 100%,
    inset: (x: 13pt, y: 10pt),
    fill: if active { quiz-correct.lighten(88%) } else { white },
    stroke: 1.2pt + if active { quiz-correct } else { quiz-border },
    radius: 8pt,
  )[
    #grid(
      columns: (34pt, 1fr),
      column-gutter: 8pt,
      align: (center + top, left + top),
      [#text(size: font-size, weight: "bold", fill: if active { quiz-correct } else { quiz-primary })[#label]],
      [#text(size: font-size, weight: if active { "bold" } else { "regular" })[#body]],
    )
  ]
}

#let _quiz-choice-grid(choices, correct: none, reveal: false, font-size: 34pt) = layout(size => {
  let avail = size.width
  let gap = 12pt
  let natural-fit(n) = {
    let cell = (avail - gap * (n - 1)) / n
    choices.all(c => {
      let measured = measure(text(size: font-size)[#c], width: calc.max(cell - 62pt, 40pt))
      measured.height <= font-size * 2.35
    })
  }
  let cols = if choices.len() <= 2 and natural-fit(2) { 2 }
    else if choices.len() == 4 and natural-fit(2) { 2 }
    else { 1 }
  let letters = ("A", "B", "C", "D", "E", "F", "G", "H")
  grid(
    columns: range(cols).map(_ => 1fr),
    column-gutter: gap,
    row-gutter: 10pt,
    ..choices.enumerate().map(((i, c)) => _quiz-option(
      letters.at(i, default: str(i + 1)),
      c,
      correct: correct != none and i == correct,
      reveal: reveal,
      font-size: font-size,
    )),
  )
})

#let _quiz-solution(body, font-size: 30pt) = block(
  width: 100%,
  inset: 12pt,
  fill: rgb("#eff6ff"),
  stroke: (left: 3pt + quiz-primary),
  radius: 6pt,
)[
  #text(size: 18pt, weight: "bold", fill: quiz-primary)[Lời giải]
  #v(6pt)
  #text(size: font-size)[#body]
]

#let quiz-mcq(
  number: 1,
  stem,
  choices,
  correct: none,
  reveal: false,
  solution: [],
  show-solution: false,
  font-size: 34pt,
) = {
  let fs = calc.max(30pt, font-size)
  _quiz-header(number)
  v(14pt)
  text(size: fs, weight: "medium")[#stem]
  v(18pt)
  _quiz-choice-grid(choices, correct: correct, reveal: reveal, font-size: fs)
  if show-solution and solution != [] {
    v(16pt)
    _quiz-solution(solution, font-size: calc.max(30pt, fs - 4pt))
  }
}

#let quiz-tf(
  number: 1,
  stem,
  statements,
  truths,
  reveal: false,
  solution: [],
  show-solution: false,
  font-size: 34pt,
) = {
  let fs = calc.max(30pt, font-size)
  let labels = ("a", "b", "c", "d", "e", "f")
  _quiz-header(number)
  v(14pt)
  text(size: fs, weight: "medium")[#stem]
  v(16pt)
  for (i, statement) in statements.enumerate() {
    let truth = truths.at(i, default: false)
    block(
      width: 100%,
      inset: 11pt,
      fill: if reveal { (if truth { quiz-correct.lighten(90%) } else { quiz-wrong.lighten(92%) }) } else { white },
      stroke: 1pt + if reveal { (if truth { quiz-correct } else { quiz-wrong }) } else { quiz-border },
      radius: 7pt,
    )[
      #grid(
        columns: if reveal { (42pt, 1fr, 90pt) } else { (42pt, 1fr) },
        column-gutter: 8pt,
        [#text(size: fs, weight: "bold", fill: quiz-primary)[#labels.at(i, default: str(i + 1)))]],
        [#text(size: fs)[#statement]],
        if reveal [#text(size: 20pt, weight: "bold", fill: if truth { quiz-correct } else { quiz-wrong })[#if truth [ĐÚNG] else [SAI]]],
      )
    ]
    v(9pt)
  }
  if show-solution and solution != [] {
    v(8pt)
    _quiz-solution(solution, font-size: calc.max(30pt, fs - 4pt))
  }
}

#let quiz-short(
  number: 1,
  stem,
  answer: [],
  reveal: false,
  solution: [],
  show-solution: false,
  font-size: 34pt,
) = {
  let fs = calc.max(30pt, font-size)
  _quiz-header(number)
  v(14pt)
  text(size: fs, weight: "medium")[#stem]
  v(24pt)
  if reveal {
    block(
      width: 100%,
      inset: 16pt,
      fill: quiz-correct.lighten(90%),
      stroke: 1.4pt + quiz-correct,
      radius: 9pt,
    )[
      #text(size: 18pt, weight: "bold", fill: quiz-correct)[Đáp án]
      #v(5pt)
      #text(size: fs, weight: "bold")[#answer]
    ]
  } else {
    block(
      width: 100%,
      inset: 16pt,
      fill: quiz-soft,
      stroke: 1pt + quiz-border,
      radius: 9pt,
    )[
      #text(size: fs, fill: quiz-muted)[Học sinh suy nghĩ và ghi đáp án.]
    ]
  }
  if show-solution and solution != [] {
    v(16pt)
    _quiz-solution(solution, font-size: calc.max(30pt, fs - 4pt))
  }
}
