# Clefsmith

An Expo / React Native application that teaches sight-reading. Expo Router, the New
Architecture, and Continuous Native Generation: `ios/` and `android/` are generated and
not committed.

## Before you write

Read the document that covers what you are about to do. Do not read them all — that is
what this file is for.

| About to…                                        | Read                     |
| ------------------------------------------------ | ------------------------ |
| add a file under `src/`, or decide where it goes | `docs/architecture.md`   |
| write or move a test                             | `docs/testing.md`        |
| write any code at all                            | `docs/code-style.md`     |
| style a screen, or add a component or a token    | `docs/design-system.md`  |
| draw a staff, or add a musical glyph             | `docs/score-engine.md`   |
| add a level, a notation, or a progression rule   | `docs/training.md`       |
| run the speech bench, or record for it           | `bench/corpus/README.md` |
| run the e2e suite                                | `e2e/README.md`          |

Each of those documents states, for every rule it carries, the check that applies it — or
says in as many words that nothing checks it. If you find a rule with neither, the
document is wrong and that is worth reporting.

## The checks

`tools/verify` is the whole chain: format and lint, typecheck, tests, architecture, dead
code, documentation references, bench reproducibility. The pre-commit hook runs
`tools/verify staged`, the CI runs `tools/verify` over the whole repository. There is no
second list anywhere, and adding a check means adding it there.

Run it before claiming anything is done. A green chain is the floor, not the goal.

## Working rules

- **Prove, do not assert.** A check you have not seen fail is a check you have not seen.
  Break what it covers, watch it go red, put it back. This applies to a test, to a lint
  rule, and to a claim in a pull request body.
- **Surgical changes.** Touch what the task needs. An improvement to adjacent code is a
  separate change, and in this repository it is a separate pull request.
- **Say what you deviated from.** When the implementation ends up elsewhere than the
  ticket's design decisions, that belongs in the pull request body and in the ticket, not
  in silence.

## Sub-agents

Keep this context for deciding; delegate the reading. A codebase sweep, a documentation
lookup, a test run whose logs you do not need — those go to a sub-agent, and what comes
back is the conclusion, not the output. The main thread holds the decisions.

## Language

- **Code, comments, commit messages, repository documentation**: English.
- **Linear tickets of the `CLE` team** (titles, descriptions, comments): **French**.
  This overrides the global English-only rule for tickets — the whole project backlog is
  written in French and must stay consistent.
