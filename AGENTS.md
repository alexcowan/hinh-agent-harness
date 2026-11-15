# Instructions for AI coding assistants

This repo is a harness for an agentic UX, used by MBA students. The student's
job is the user story, the rubric, and the cases. Your job is everything else.
Keep the student out of the terminal: run commands yourself, and explain what
you did in a sentence or two of plain language, not code.

## The source of truth is `my-agent.md`

The student writes `my-agent.md` in plain language. Everything else is generated
from it. When the student asks you to "update the harness from my-agent.md" (or
anything like it), regenerate these files so they match it exactly:

| File | What to put in it |
|---|---|
| `harness/instructions.md` | What the agent is for, how it should work, and how it reports back, written from the story and "What it may not do". Always end with a short readback the user can check in ten seconds. |
| `harness/rubric.json` | One entry per rubric row: `id` (short slug), `question`, `good`, `fails`. |
| `harness/permissions.json` | The limits from "What it may not do", as values `src/tools.js` can check. |
| `fixtures/<name>.json` | Made-up but realistic test data covering "What the agent can see and do". Must include `now` and `current_job`. Rename `src/world.js`'s fixtures path if the file name changes. |
| `harness/tools.json` | One tool per thing the agent can look up or do, each with a plain one-sentence description and JSON-schema parameters. |
| `src/tools.js` | An implementation for every tool in `tools.json`, running against the fixtures. Every action must check `permissions.json` and refuse with a clear "Not permitted: ..." message, exactly as the HinH version does. Never move a permission rule into the instructions only. |
| `cases/<ID>.json` | One file per case: `id`, `type` (golden, adversarial, intervention), `title`, `trigger` (what the user says, word for word), `visible_context`, `good`, `tester_brief` (what to tell a classmate playing the user), and `fixtures` (only the changes to the base test data that make "What's true" true). |
| `tests/tools.test.js` | Tests that each permission rule is enforced, and that each case's fixtures load. |

Then run `npm test` and fix anything that fails. Tell the student which cases you
couldn't represent in the test data, if any, instead of quietly dropping them.

If `my-agent.md` is missing something you need (for example, a case with no
"What's true"), ask the student one plain question rather than inventing it.

Do not change `src/harness.js`, `src/server.js`, `src/eval.js`, `src/grader.js`,
or `public/` unless the student asks.

## Commands to run for the student

- Start the Wizard of Oz pages: `npm start` (in a Codespace this starts on its own).
- Let a classmate reach them: `npm run share`. It prints the links. If it can't
  change the port's visibility, tell the student to open the Ports tab,
  right-click port 3000, and choose Port Visibility, Public.
- Run the eval: `npm run eval` (all cases) or `npm run eval -- --case A1`.
- Save sessions and results to GitHub: `npm run save`.
- When they're done with a session: `npm run unshare` to make the port private.

## Turning sessions into cases

When asked to learn from a Wizard of Oz session, read the log in `logs/`. For
every reply the wizard edited or overrode, propose a new case for `my-agent.md`
in the same format as the others, and add it there only after the student agrees.
Then regenerate the case files.

## Things to keep true

- Never put an API key in a file. Keys live in Codespaces secrets.
- Logs use initials, never names.
- Language models are called "AI" in anything the student reads.
