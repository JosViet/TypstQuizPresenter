# QA Checklist

## Parser

- MCQ with 4 options
- inline `#choice(...)`
- nested brackets/functions
- commas inside math/functions
- `T[...]` in MCQ and true/false
- short-answer string and content forms
- comments containing fake macro text

## Runtime

- `/de-thi.typ` resolves
- `/vietdoc.typ` resolves
- recursive local `.typ` imports resolve
- images resolve relative to original question file
- CeTZ-heavy question compiles
- correct answer reveal does not alter source content

## Projector UX

- 1920×1080 fullscreen
- 1366×768 fullscreen
- question/options remain >= 30pt
- long questions scroll rather than shrink below 30pt
- Space reveals answer then solution
- Left/Right arrows navigate
- timer does not trigger unnecessary recompilation
