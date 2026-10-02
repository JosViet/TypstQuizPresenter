# Parser Specification

## Goals

Extract quiz semantics without evaluating Typst.

## Scanner rules

The scanner must preserve nesting across:
- `[...]`
- `(...)`
- `{...}`
- quoted strings with escapes
- line comments `// ...`
- block comments `/* ... */`
- math spans `$...$`

Macros inside comments/strings are ignored.

## Question detection

A question starts at `#ex` followed by optional argument parentheses and a required content block.

Metadata currently extracted when statically recognizable:
- `points`
- `tags`
- `source`

Unknown metadata remains in `rawArgs`.

## Answer modes

### Multiple choice

`#choice(...)`

Top-level arguments are options. `T[...]` marks a correct option.

### True/False

`#choiceTF(...)`

Each top-level argument is a statement. `T[...]` means true.

### Short answer

`#shortanswer(...)`

The first positional argument is retained as raw Typst answer content.

### Solution

`#loigiai[...]` is extracted separately and revealed only when requested.

## Non-goals for V1

- evaluating arbitrary Typst code to discover dynamically generated questions;
- expanding loops that generate `#ex` at runtime;
- executing custom functions to infer answers;
- mutating upstream source.
