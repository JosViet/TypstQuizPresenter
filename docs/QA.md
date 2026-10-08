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


## Galaxy Tab / PWA

- Chrome/Chromium HTTPS: workspace picker opens and validates root folder
- recent workspace automatically reconnects when permission is granted
- permission prompt path remains one-tap when permission is prompt/denied
- presentation mode hides sidebar and keeps touch controls >= 44px
- swipe left/right changes question; vertical/short gestures are ignored
- installed PWA opens in landscape standalone mode where supported
- second launch works with hosted app resources cached offline after one online warm-up
- service worker never receives local File System Access content


## Cross-app resilience

- switch from a fullscreen Chrome presentation to another app, then return: current question/state remains unchanged
- Chrome-tab fullscreen loss shows a single large tap target to restore fullscreen
- tapping the recovery surface re-enters fullscreen without resetting the slide
- installed PWA/standalone mode never shows fullscreen recovery
- slide scroll position is restored after returning from background
- running timer pauses on background and keeps its remaining seconds
- timer stays paused after return until the teacher starts it again


## Figure UX

- 30pt text renders instrumented figures at 100% in Auto mode
- 36pt text renders instrumented figures at 120% in Auto mode
- Auto scale clamps at 70% minimum and 150% maximum
- manual 80/100/120/140 override affects only the current question and is restored when returning to it
- immini figure content is wrapped once; nested canvas is not double-scaled
- standalone canvas is clickable and scalable
- tapping a figure opens a zoom overlay without navigating away
- tapping the enlarged figure/backdrop closes the overlay
- changing question or re-rendering closes any active zoom overlay
- MCQ/TF links remain interactive and are not mistaken for figure links
- nested choice inside immini leaves a balanced, renderable stem


## CeTZ figure label regression (v0.7.2)

- the 30pt quiz stem still displays a CeTZ figure whose internal label text is 11pt before scaling
- the CI Typst smoke file asserts this typography inside a CeTZ figure and compiles an actual CeTZ drawing
- resizing the complete figure scales both geometry and labels uniformly, without inheriting the question font size
- manual visual check: Toan12/dataDVKT/2C2-B6-DVKT5.typ, question 9 with point labels A', B', C', D'


## v0.8 setup/presentation screen flow

- On initial load the configuration screen is full-width; quiz stage is hidden
- Loading a valid local Typst file auto-switches to the slide-only screen without requesting fullscreen
- Leaving for another Android app and returning does not alter the app's presentation screen
- The toolbar offers a configuration return control and an explicit optional fullscreen control
- Returning to configuration does not discard the current question; continuing restores the same question
- Empty or failed parses do not auto-enter presentation
- Figure manual overrides list 160%, 180% and 200%; Auto can reach 200% at 60pt
- Test at Galaxy Tab S10 landscape and Chrome tab after switching to classroom name picker/score app


## v0.8.1 — Fraction overflow regression

- Reproduce Toan12/dataDVKT/2C2-B6-DVKT5.typ, question 12, including options with inline $dfrac(a^2,2)$ and negative fraction.
- The MCQ option reserves font-relative vertical padding so numerator and denominator do not touch/overflow the rounded choice border.
- Typst CLI smoke includes the exact math pattern and checks minimum measured option height.
- Check at 24/30/36pt on Galaxy Tab S10; regular text options should still align badges vertically.
