// Presentation-only Typst runtime.
// Raw question content is compiled with the real upstream de-thi.typ/vietdoc.typ.

#let quiz-primary = rgb("#1d4ed8")
#let quiz-correct = rgb("#15803d")
#let quiz-wrong = rgb("#b91c1c")
#let quiz-border = rgb("#cbd5e1")
#let quiz-muted = rgb("#64748b")
#let quiz-soft = rgb("#f8fafc")

#let _quiz-header(number) = block(width: 100%)[
  #box(
    inset: (x: 9pt, y: 2.5pt),
    fill: quiz-primary,
    radius: 5pt,
  )[
    #text(size: 15pt, weight: "bold", fill: white)[Câu #number]
  ]
]

#let _quiz-option(
  label,
  body,
  correct: false,
  selected: false,
  reveal: false,
  font-size: 30pt,
) = {
  let is-correct = reveal and correct
  let is-wrong = reveal and selected and not correct
  let is-selected = selected and not reveal

  let option-fill = if is-correct {
    quiz-correct.lighten(89%)
  } else if is-wrong {
    quiz-wrong.lighten(91%)
  } else if is-selected {
    quiz-primary.lighten(92%)
  } else {
    white
  }

  let option-stroke = if is-correct {
    quiz-correct
  } else if is-wrong {
    quiz-wrong
  } else if is-selected {
    quiz-primary
  } else {
    quiz-border
  }

  let accent = if is-correct {
    quiz-correct
  } else if is-wrong {
    quiz-wrong
  } else {
    quiz-primary
  }

  block(
    width: 100%,
    inset: (x: 11pt, y: 6.5pt),
    fill: option-fill,
    stroke: 1.2pt + option-stroke,
    radius: 8pt,
  )[
    #grid(
      columns: (32pt, 1fr),
      column-gutter: 7pt,
      align: (center + top, left + top),
      [#text(size: font-size, weight: "bold", fill: accent)[#label]],
      [#text(
        size: font-size,
        weight: if is-correct or is-wrong or is-selected { "bold" } else { "regular" },
      )[#body]],
    )
  ]
}

#let _quiz-choice-grid(
  choices,
  correct: none,
  selected: none,
  reveal: false,
  font-size: 30pt,
) = layout(size => {
  let avail = size.width
  let gap = 10pt
  let natural-fit(n) = {
    let cell = (avail - gap * (n - 1)) / n
    choices.all(c => {
      let measured = measure(text(size: font-size)[#c], width: calc.max(cell - 58pt, 40pt))
      measured.height <= font-size * 2.2
    })
  }

  let cols = if choices.len() <= 2 and natural-fit(2) {
    2
  } else if choices.len() == 4 and natural-fit(2) {
    2
  } else {
    1
  }

  let letters = ("A", "B", "C", "D", "E", "F", "G", "H")

  grid(
    columns: range(cols).map(_ => 1fr),
    column-gutter: gap,
    row-gutter: 8pt,
    ..choices.enumerate().map(((i, c)) =>
      link(
        "https://quiz.local/choice/" + str(i),
        _quiz-option(
          letters.at(i, default: str(i + 1)),
          c,
          correct: correct != none and i == correct,
          selected: selected != none and i == selected,
          reveal: reveal,
          font-size: font-size,
        ),
      )
    ),
  )
})

#let _quiz-solution(body, font-size: 26pt) = block(
  width: 100%,
  inset: 9pt,
  fill: rgb("#eff6ff"),
  stroke: (left: 3pt + quiz-primary),
  radius: 6pt,
)[
  #text(size: 15pt, weight: "bold", fill: quiz-primary)[Lời giải]
  #v(4pt)
  #text(size: font-size)[#body]
]

#let quiz-mcq(
  number: 1,
  stem: [],
  choices: (),
  correct: none,
  selected: none,
  reveal: false,
  solution: [],
  show-solution: false,
  font-size: 30pt,
) = {
  let fs = font-size
  _quiz-header(number)
  v(6pt)
  text(size: fs, weight: "medium")[#stem]
  v(10pt)
  _quiz-choice-grid(
    choices,
    correct: correct,
    selected: selected,
    reveal: reveal,
    font-size: fs,
  )
  if show-solution and solution != [] {
    v(9pt)
    _quiz-solution(solution, font-size: calc.max(10pt, fs - 4pt))
  }
}

#let quiz-tf(
  number: 1,
  stem: [],
  statements: (),
  truths: (),
  reveal: false,
  solution: [],
  show-solution: false,
  font-size: 30pt,
) = {
  let fs = font-size
  let labels = ("a", "b", "c", "d", "e", "f")
  _quiz-header(number)
  v(6pt)
  text(size: fs, weight: "medium")[#stem]
  v(9pt)

  for (i, statement) in statements.enumerate() {
    let truth = truths.at(i, default: false)
    block(
      width: 100%,
      inset: 8pt,
      fill: if reveal {
        if truth { quiz-correct.lighten(90%) } else { quiz-wrong.lighten(92%) }
      } else {
        white
      },
      stroke: 1pt + if reveal {
        if truth { quiz-correct } else { quiz-wrong }
      } else {
        quiz-border
      },
      radius: 7pt,
    )[
      #grid(
        columns: if reveal { (38pt, 1fr, 76pt) } else { (38pt, 1fr) },
        column-gutter: 7pt,
        [#text(size: fs, weight: "bold", fill: quiz-primary)[#labels.at(i, default: str(i + 1)))]],
        [#text(size: fs)[#statement]],
        if reveal [
          #text(
            size: 16pt,
            weight: "bold",
            fill: if truth { quiz-correct } else { quiz-wrong },
          )[#if truth [ĐÚNG] else [SAI]]
        ],
      )
    ]
    v(6pt)
  }

  if show-solution and solution != [] {
    v(6pt)
    _quiz-solution(solution, font-size: calc.max(10pt, fs - 4pt))
  }
}

#let quiz-short(
  number: 1,
  stem: [],
  answer: [],
  reveal: false,
  solution: [],
  show-solution: false,
  font-size: 30pt,
) = {
  let fs = font-size
  _quiz-header(number)
  v(6pt)
  text(size: fs, weight: "medium")[#stem]
  v(12pt)

  if reveal {
    block(
      width: 100%,
      inset: 11pt,
      fill: quiz-correct.lighten(90%),
      stroke: 1.4pt + quiz-correct,
      radius: 9pt,
    )[
      #text(size: 15pt, weight: "bold", fill: quiz-correct)[Đáp án]
      #v(4pt)
      #text(size: fs, weight: "bold")[#answer]
    ]
  } else {
    block(
      width: 100%,
      inset: 11pt,
      fill: quiz-soft,
      stroke: 1pt + quiz-border,
      radius: 9pt,
    )[
      #text(size: fs, fill: quiz-muted)[Học sinh suy nghĩ và ghi đáp án.]
    ]
  }

  if show-solution and solution != [] {
    v(9pt)
    _quiz-solution(solution, font-size: calc.max(10pt, fs - 4pt))
  }
}
