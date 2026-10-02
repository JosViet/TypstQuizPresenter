# Source Contract

## Upstream ownership

`JosViet/BienSoanTypst` owns authoring semantics. TypstQuizPresenter consumes that syntax without changing the upstream authoring workflow.

The application assumes source files may import:

```typst
#import "/de-thi.typ": *
#import "/vietdoc.typ": *
```

and may depend on files under `assets/` or other paths reachable from the source file.

## V1 question contract

A multiple-choice item typically looks like:

```typst
#ex(points: 0.25, tags: ("0D1N1-5",), source: [Nguồn ...])[
  Nội dung câu hỏi $x^2 >= 0$
  #choice(
    [Phương án A],
    T[Phương án B],
    [Phương án C],
    [Phương án D],
  )
  #loigiai[
    Lời giải...
  ]
]
```

True/false uses `#choiceTF(...)`. Short answer uses `#shortanswer(...)`.

`T[...]` is semantic markup supplied by `de-thi.typ`; the parser reads it directly rather than guessing the answer from text.

## Rendering contract

The presenter does not reproduce Typst formulas in HTML. It extracts semantic regions (stem/options/solution) and re-embeds their raw Typst content into a presentation wrapper. The wrapper imports the real upstream libraries, so public helper macros remain available.

Relative file dependencies are resolved against the original source path. Therefore GitHub-path mode is preferred for questions containing images or local includes.

## Upstream versioning

Production must use an explicit commit SHA. Do not use `main` as the runtime version. Updating `runtime.upstream.json` requires parser/render fixture tests.
