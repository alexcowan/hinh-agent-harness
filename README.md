# HinH Agent Harness

A working example of a harness for an agentic UX, built on HVAC in a Hurry (HinH):
a field technician hands the next steps of a repair to an agent and gets on the
road. Use it two ways:

- **See one working.** Open it as is and run the HinH cases.
- **Make your own.** Click **Use this template** (top right), describe your agent
  in `my-agent.md`, and let your AI build the rest.

Your job is the user story, the rubric, and the cases. Your AI's job is
everything else: the code, the test data, and the commands. The instructions it
follows are in `AGENTS.md`.

## 1. Describe your agent

Open `my-agent.md`. It holds the HinH example in plain language: the story, what
the agent can see and do, what it may not do, the rubric, and the cases.
Replace it with yours. Three golden and three adversarial cases is a good start.

Then tell your AI:

> Update the harness from my-agent.md.

It rewrites the instructions, rubric, test data, tools, and case files to match,
and runs the tests. You can do this in a Codespace (below) or with Codex on the
web pointed at your repo, which opens a pull request for you to review and merge.

## 2. Open it in a Codespace

On GitHub: **Code → Codespaces → Create codespace on main**. It opens in your
browser with everything installed, and the Wizard of Oz page starts on its own.
If VS Code asks whether you trust the authors of the files, click **Trust Folder &
Continue**.
Your free GitHub account includes enough hours for this.

Codex is installed in the Codespace. In the terminal at the bottom, type `codex`
and sign in. After that, ask it for whatever you need in plain language,
for example:

> Share the Wizard of Oz page with a classmate.
> Run the eval on all my cases.
> Save my sessions to GitHub.

## 3. Run a Wizard of Oz session

1. Ask your AI to share the page (or run `npm run share`). Open the wizard link
   it gives you.
2. Enter your tester's **initials** (not their name), pick a case if they're
   playing one, and read them the brief.
3. Send them the tester link. The first time they open it, GitHub shows a
   warning page about a development port; they click **Continue**.
   Each time they write, the harness drafts a reply
   and shows you what it did behind the scenes. **Send** it as is, edit it, or
   click **Write my own instead**.
4. At the end, score the session against your rubric and click **End session**.
5. Ask your AI to save your sessions (`npm run save`) and make the page private
   again (`npm run unshare`).

Then ask your AI: *"Read my latest session log and propose new cases for every
reply I edited or overrode."* Every override is a place your harness fell short.

If your repository is public, its logs are public too. Keep it private, or tell
your AI to leave the logs out.

## Connecting an AI to the harness (optional)

Without an AI key, everything still works: you write every reply in the Wizard
of Oz page, and the eval gives you a sheet to grade by hand. To have the harness
draft replies and grade evals, add a key as a Codespaces secret: on GitHub,
**Settings → Secrets and variables → Codespaces → New repository secret**, named
`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`. Never put a key in a file.

## Running the eval

Ask your AI to run it, or `npm run eval`. Each case runs three times, because
every run is a fresh sample; the report in `results/` shows rates (2/3 passed),
not single verdicts. Before you trust the AI grader, grade a few runs yourself
and compare.

## What's where

| File | What it is | Who changes it |
|---|---|---|
| `my-agent.md` | Your story, rubric, and cases, in plain language | You |
| `harness/` | Instructions, rubric, tools, permissions | Your AI, from `my-agent.md` |
| `cases/`, `fixtures/` | Case files and made-up test data | Your AI, from `my-agent.md` |
| `src/tools.js` | The tools, with the permission checks | Your AI, from `my-agent.md` |
| `src/` (the rest), `public/` | The orchestrator, eval, and Wizard of Oz pages | Nobody, usually |
| `logs/`, `results/` | What your sessions and evals leave behind | Generated |
