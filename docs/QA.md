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
- MCQ choice links compile and can carry selected/correct/wrong visual state

## Projector UX

- 1920×1080 fullscreen
- 1366×768 fullscreen
- numeric font control accepts values below 30pt and fractional .5pt values
- selected MCQ is highlighted before reveal
- selected wrong MCQ is red after reveal; correct choice is green
- 16:9 page starts near the top with compact vertical margins
- Space reveals answer then solution
- Left/Right arrows navigate
- timer does not trigger unnecessary recompilation
