// Presentation-only Typst runtime.
// Raw question content is compiled with the real upstream de-thi.typ/vietdoc.typ.

#let quiz-primary = rgb("#1d4ed8")
#let quiz-correct = rgb("#15803d")
#let quiz-wrong = rgb("#b91c1c")
#let quiz-border = rgb("#cbd5e1")
#let quiz-muted = rgb("#64748b")
#let quiz-soft = rgb("#f8fafc")

// The exercise stem is usually set to 30pt or more for classroom display.
// CeTZ point-label() inherits that font size, but its geometry uses a fixed
// coordinate unit (often 0.6–0.7cm). Reset figure typography to the original
// document base size BEFORE scaling the whole figure. This keeps labels and
// geometry proportional, including after a teacher adjusts font size.
#let quiz-figure(scale-factor: 100%, body) = {
  link(
    "https://quiz.local/figure",
    scale(
      x: scale-factor,
      y: scale-factor,
      origin: center + horizon,
      reflow: true,
      text(size: 11pt, body),
    ),
  )
}

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
  base-accent: quiz-primary,
  correct: false,
  selected: false,
  reveal: false,
  font-size: 30pt,
) = {
  let is-correct = reveal and correct
  let is-wrong = reveal and selected and not correct
  let is-selected = selected and not reveal

  let accent = if is-correct {
    quiz-correct
  } else if is-wrong {
    quiz-wrong
  } else {
    base-accent
  }

  let option-fill = if is-correct {
    quiz-correct.lighten(89%)
  } else if is-wrong {
    quiz-wrong.lighten(91%)
  } else if is-selected {
    base-accent.lighten(91%)
  } else {
    white
  }

  let option-stroke = if is-correct {
    quiz-correct
  } else if is-wrong {
    quiz-wrong
  } else if is-selected {
    base-accent
  } else {
    quiz-border
  }

  let badge-size = calc.max(28pt, calc.min(42pt, font-size * 1.15))

  block(
    width: 100%,
    // Inline display-sized math (e.g. dfrac) may extend above and below
    // the typographic line box. Reserve extra *measured* vertical space so
    // numerators/denominators stay inside the interactive option border.
    inset: (x: 11pt, y: calc.max(16pt, font-size * 0.6)),
    fill: option-fill,
    stroke: 1.2pt + option-stroke,
    radius: 9pt,
  )[
    #grid(
      columns: (badge-size + 8pt, 1fr),
      column-gutter: 8pt,
      align: (center + horizon, left + top),
      [
        #box(
          width: badge-size,
          height: badge-size,
          fill: accent,
          radius: badge-size / 2,
          align(center + horizon)[
            #text(
              size: calc.max(14pt, font-size * 0.62),
              weight: "bold",
              fill: white,
            )[#label]
          ],
        )
      ],
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
      let measured = measure(text(size: font-size)[#c], width: calc.max(cell - 70pt, 40pt))
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
  let palette = (
    rgb("#2563eb"),
    rgb("#7c3aed"),
    rgb("#ea580c"),
    rgb("#0891b2"),
    rgb("#db2777"),
    rgb("#16a34a"),
    rgb("#ca8a04"),
    rgb("#4f46e5"),
  )

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
          base-accent: palette.at(i, default: quiz-primary),
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

#let _quiz-tf-chip(
  label,
  selected: false,
  correct: false,
  reveal: false,
) = {
  let is-correct = reveal and correct
  let is-wrong = reveal and selected and not correct
  let is-selected = selected and not reveal

  let fill-color = if is-correct {
    quiz-correct.lighten(88%)
  } else if is-wrong {
    quiz-wrong.lighten(90%)
  } else if is-selected {
    quiz-primary.lighten(90%)
  } else {
    quiz-soft
  }

  let border-color = if is-correct {
    quiz-correct
  } else if is-wrong {
    quiz-wrong
  } else if is-selected {
    quiz-primary
  } else {
    quiz-border
  }

  let text-color = if is-correct {
    quiz-correct
  } else if is-wrong {
    quiz-wrong
  } else if is-selected {
    quiz-primary
  } else {
    quiz-muted
  }

  box(
    width: 100%,
    inset: (x: 8pt, y: 5pt),
    fill: fill-color,
    stroke: 1.2pt + border-color,
    radius: 7pt,
    align(center)[
      #text(size: 15pt, weight: "bold", fill: text-color)[#label]
    ],
  )
}

// Keep the entire true/false statement row comfortably inside the border
// when inline math has tall numerators or denominators. Align the statement,
// letter and buttons around the same vertical center, even on multi-line rows.
#let _quiz-tf-row(
  label,
  statement,
  index: 0,
  truth: false,
  selected: none,
  reveal: false,
  font-size: 30pt,
) = block(
  width: 100%,
  inset: (x: 11pt, y: calc.max(16pt, font-size * 0.6)),
  fill: white,
  stroke: 1pt + quiz-border,
  radius: 7pt,
)[
  #grid(
    columns: (36pt, 1fr, 58pt, 58pt),
    column-gutter: 7pt,
    align: (center + horizon, left + horizon, center + horizon, center + horizon),
    [#text(size: font-size, weight: "bold", fill: quiz-primary)[#label]],
    [#text(size: font-size)[#statement]],
    link(
      "https://quiz.local/tf/" + str(index) + "/true",
      _quiz-tf-chip(
        "Đ",
        selected: selected == true,
        correct: truth,
        reveal: reveal,
      ),
    ),
    link(
      "https://quiz.local/tf/" + str(index) + "/false",
      _quiz-tf-chip(
        "S",
        selected: selected == false,
        correct: not truth,
        reveal: reveal,
      ),
    ),
  )
]

#let quiz-tf(
  number: 1,
  stem: [],
  statements: (),
  truths: (),
  selections: (),
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
    _quiz-tf-row(
      labels.at(i, default: str(i + 1)),
      statement,
      index: i,
      truth: truths.at(i, default: false),
      selected: selections.at(i, default: none),
      reveal: reveal,
      font-size: fs,
    )
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
