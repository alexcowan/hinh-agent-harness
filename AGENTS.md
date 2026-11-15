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
| `harness/app.json` | The names shown on the Wizard of Oz pages: `agent_name` and `user_page_title`. |
| `harness/instructions.md` | What the agent is for, how it should work, and how it reports back, written from the story and "What it may not do". Always end with a short readback the user can check in ten seconds. |
| `harness/rubric.json` | One entry per rubric row: `id` (short slug), `question`, `good`, `fails`. |
| `harness/permissions.json` | The limits from "What it may not do", as values `src/tools.js` can check. |
| `fixtures/<name>.json` | Made-up but realistic test data covering "What the agent can see and do". Exactly one .json file in `fixtures/`; name it after the student's product. |
| `harness/tools.json` | One tool per thing the agent can look up or do, each with a plain one-sentence description and JSON-schema parameters. |
| `src/tools.js` | An implementation for every tool in `tools.json`, running against the fixtures. Every action must check `permissions.json` and refuse with a clear "Not permitted: ..." message, exactly as the HinH version does. Never move a permission rule into the instructions only. |
| `cases/<ID>.json` | One file per case: `id`, `type` (golden, adversarial, intervention), `title`, `trigger` (what the user says, word for word), `visible_context`, `good`, `tester_brief` (what to tell a classmate playing the user), `fixtures` (only the changes to the base test data that make "What's true" true), and, only if the case has a **Later** line, `later` (that line, starting with how much time passed in brackets, e.g. "[About three hours later] Lena Park approves the part."). Records the agent creates should carry an id field (`id` or `something_id`) so a Later event can change them. |
| `tests/` | `tools.test.js`: tests that each permission rule is enforced and each case's fixtures load. `harness.test.js` and `tests/scripts/`: rewrite for one of the student's golden cases, or delete them. |

When `my-agent.md` describes the student's own product, remove everything about the HinH example: delete `fixtures/hinh.json` and the HinH case files, and leave no HinH names (HinH, Trent, Ridgeline, and so on) anywhere you generate.

Then run `npm run check`. It runs the tests and looks for HinH material left over. Fix anything it reports and run it again until it passes. Tell the student which cases you
couldn't represent in the test data, if any, instead of quietly dropping them.

If `my-agent.md` is missing something you need (for example, a case with no
"What's true"), ask the student one plain question rather than inventing it.

Do not change `src/harness.js`, `src/server.js`, `src/eval.js`, `src/grader.js`,
or `public/` unless the student asks.

## Commands to run for the student

- Check that it works (and, once it's theirs, that no HinH is left): `npm run check`.

- Start the Wizard of Oz pages: `npm start` (in a Codespace this starts on its own).
  Give the student the wizard link (`/wizard`). The tester's link comes from
  the wizard page once a session starts.
- Let a classmate reach them:
  - In a Codespace (`CODESPACE_NAME` is set): `npm run share`. It prints the
    links. If it can't change the port's visibility, tell the student to open
    the Ports tab, right-click port 3000, and choose Port Visibility, Public.
  - On the student's own computer: the links work only on that computer. Say
    so plainly. For a classmate in the room, the simplest way is to open the
    tester's link in a second browser window on the same computer and hand it
    over. For a tester on another device, suggest opening the repository in a
    Codespace and sharing from there. Don't set up tunnels or change network
    settings unless the student asks.
- Run the eval: `npm run eval` (all cases) or `npm run eval -- --case A1`.
- Save sessions and results to GitHub: `npm run save`.
- When they're done with a session: `npm run unshare` to make the port private.

## Turning sessions into cases

When asked to learn from a Wizard of Oz session, read the log in `logs/`. For
every reply the wizard edited or overrode, propose a new case for `my-agent.md`
in the same format as the others, and add it there only after the student agrees.
Then regenerate the case files.

## Things to keep true

- Never put an API key in a file. In a Codespace, keys live in Codespaces
  secrets; on the student's own computer, in an environment variable.
- Logs use initials, never names.
- Language models are called "AI" in anything the student reads.
