#import "/de-thi.typ": *
#import "/vietdoc.typ": *

// Comment containing fake #ex[ignored]
#let helper(x) = [Giá trị (#x, 2)]

#ex(points: 0.25, tags: ("NESTED", "MCQ"), source: [Nested fixture])[
  Cho biểu thức #helper($x + 1$). Chọn đáp án đúng.
  #choice(
    [$(x + 1)^2$],
    T[$x^2 + 2x + 1$],
    [#text(weight: "bold")[$x^2 + 1$]],
    [$x^2 + (2, 1).at(0)$],
  )
  #loigiai[Áp dụng hằng đẳng thức $(a+b)^2$.]
]

#ex(points: 1, tags: ("TF",))[
  Xét hai mệnh đề.
  #choiceTF(T[$2 < 3$], [$5 < 1$])
  #loigiai[So sánh trực tiếp.]
]

#ex(points: 0.5, tags: ("SHORT",))[
  Tính $3^2$.
  #shortanswer([$9$], chars: "9")
  #loigiai[$3^2=9$.]
]
