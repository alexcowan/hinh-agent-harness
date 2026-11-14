# HinH Agent Harness

A working example of a harness for an agentic UX, built on HVAC in a Hurry (HinH).
A field technician finishes a diagnosis, hands the next steps to an agent, and gets
on the road. The agent works out the part, who buys it, the cost, the delivery, and
the return visit, and escalates when it isn't sure.

The repo has the pieces of a harness as plain files you can read and change, plus
two ways to test it:

- **An eval** that runs every case through the agent several times and grades
  each run against the rubric.
- **A Wizard of Oz page** where a classmate plays the technician and you play the
  agent. If an AI is connected, the harness drafts each reply and you send it as
  is, edit it, or write your own. Every session is logged.

Use **Use this template** (top right on GitHub) to make your own copy, then change
the files to fit your user story.

## What's where

| File | What it is |
|---|---|
| `harness/instructions.md` | What the agent is for and how it should behave. |
| `harness/rubric.json` | The rubric: each question, what good looks like, what fails. |
| `harness/tools.json` | The tools the agent can call: one entry per system it can reach. |
| `harness/permissions.json` | What the agent may do. It acts with the technician's permissions, not the company's. |
| `cases/*.json` | Golden (G), adversarial (A), and intervention (I) cases. |
| `fixtures/hinh.json` | Made-up test data: accounts, equipment, parts, calendar. Each case can change parts of it. |
| `src/harness.js` | The orchestrator: the loop that calls the AI and runs its tool calls. |
| `src/tools.js` | The tools themselves, run against the test data, with the permission checks. |
| `src/eval.js`, `src/grader.js` | The eval runner and the AI grader. |
| `src/server.js`, `public/` | The Wizard of Oz pages. |
| `logs/` | One file per Wizard of Oz session. |
| `results/` | One report per eval run. |

## Run it in a Codespace

1. On GitHub, click **Code → Codespaces → Create codespace on main**. It opens
   VS Code in your browser with everything installed. Your free GitHub account
   includes enough Codespaces hours for this.
2. In the terminal at the bottom, run:

   ```
   npm start
   ```

3. A box pops up saying your app is available on port 3000. Click **Open in Browser**.
   That's the wizard page.
4. To let a classmate reach it, open the **Ports** tab (next to Terminal),
   right-click port 3000, and choose **Port Visibility → Public**.

When you're done, set the port back to **Private** (or stop the Codespace), and
commit your logs (see below).

## Connect an AI (optional)

Without an AI, everything still works: in the Wizard of Oz page you write every
reply yourself, and the eval writes a sheet for grading by hand.

To have the harness draft replies and run evals, add an API key as a Codespaces
secret: on GitHub, **Settings → Secrets and variables → Codespaces → New
repository secret**, named `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`. Restart the
Codespace so it picks the key up. To choose a model, add a second secret
`AI_MODEL` (for example `gpt-5-mini`). Never put a key in a file in the repo.

## Run a Wizard of Oz session

1. On the wizard page, enter your subject's **initials** (not their name), and
   pick a case if you want them to play one. Read them the brief.
2. Copy the tester link and send it to them (Teams, text, whatever works).
3. When they send a message, the harness drafts a reply and shows you the tool
   calls it made. **Send** it as is, edit it first, or click **Write my own
   instead**. If you override it, the draft's actions are thrown away.
4. When you're done, score the session against the rubric, add a note, and click
   **End session**.

The log file is named with the date, time, and initials, like
`logs/2026-11-17-1405-JS.jsonl`. If you won't remember who that was, keep a
short note somewhere private (or ask your AI to), but not in the repo.

Every edit or override is a place where the harness fell short, so it's a
candidate for a new case. To turn a session into cases, ask your AI something like:
*"Read logs/2026-11-17-1405-JS.jsonl. For every reply I edited or overrode, draft
a new case file in the format of cases/A1.json."*

**Commit your logs.** In the Codespace terminal:

```
git add logs results
git commit -m "Wizard of Oz session with JS"
git push
```

If your repository is public, its logs are public too. Keep the repo private, or
leave the logs out of your commits.

## Run an eval

```
npm run eval                 # every case, 3 runs each
npm run eval -- --case A1    # one case
npm run eval -- --runs 5     # more runs per case
```

Each run is a fresh sample, so the report shows rates (2/3 passed), not single
verdicts. The report goes in `results/`: a `.md` file to read and a `.json` file
for tools and AI.

**Check the grader before you trust it.** Grade a few runs yourself against the
rubric, then compare with the AI grader. Where you disagree, tighten the rubric
wording or the grader prompt in `src/grader.js`.

## Make it yours

1. Rewrite `harness/instructions.md` for your user story.
2. Replace the rows in `harness/rubric.json` with your rubric.
3. Replace `fixtures/hinh.json` with made-up data for your product.
4. Change `harness/tools.json` and `src/tools.js` to the systems your agent
   would reach. Ask your AI to do this: "Change the tools to fit
   harness/instructions.md and fixtures/..., keeping the permission checks."
5. Write your cases in `cases/`. Start with three golden and three adversarial.
6. Run `npm test` after any change to the tools. The tests in `tests/` check
   that the permission boundary still holds; update them to match your tools.

## Run it on your own computer instead

Install Node.js 20 or later, then `npm start` in this folder and open
http://localhost:3000. A classmate can't reach your laptop this way, so use a
Codespace for Wizard of Oz sessions.
