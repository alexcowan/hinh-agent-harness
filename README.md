# HinH Agent Harness

**Try it in your browser first:** https://alexcowan.github.io/hinh-agent-harness/

**AI assistants:** read `AGENTS.md` before anything else. It says how to help a
student build their own, one level at a time.

A working example of a test harness for an agentic UX, built on HVAC in a Hurry
(HinH): a field technician hands the next steps of a repair to an agent and gets
on the road. It is the running example in the tech note *Designing Agentic UXs*
(Exhibit 3).

## Make your own

Your job is the user story, the rubric, and the cases. Your AI's job is
everything else: the code, the test data, and the commands. Write your cases
yourselves, as Given-When-Then scenarios; 2–3 golden and 2–3 adversarial is
enough to start. An AI that writes them ends up grading its own idea of what you
meant.

Then paste this into your AI coding assistant, filling in the brackets:

> Here is a working example of a test harness for an agentic UX:
> https://github.com/alexcowan/hinh-agent-harness. Read its AGENTS.md, then help
> us build one like it for our agent, one level at a time. Ask us what you need
> to know about our setup.
> Our user story: [paste your user story]
> Our design brief: [link to your design brief]
> Our rubric: [paste your rubric]
> Our cases: [paste your golden and adversarial cases, as Given-When-Then]

It will ask what it needs and take you as far as your setup allows:

1. **It runs.** You play your cases on the Wizard of Oz page, writing the agent's
   replies yourself. No API key needed.
2. **The AI is connected.** The harness drafts replies; you send, edit, or
   override them. Needs an OpenAI or Anthropic API key, kept in an environment
   variable or Codespaces secret, never in a file.
3. **Two-player mode.** A teammate plays the user from their own computer. A
   Codespace is the easiest way to share the link.
4. **Evals.** Your AI runs every case and tells you which rubric rows fail most
   often.

If it isn't working, ask your AI to explain what's failing before trying again.

## Things to keep true

- Keep your repository private. Session logs live in it.
- Logs use testers' initials, never names.
- After a two-player session, make the page private again (`npm run unshare`,
  or ask your AI).

## What's where

| File | What it is | Who changes it |
|---|---|---|
| `my-agent.md` | Your story, rubric, and cases, in plain language | You (your AI keeps the format) |
| `harness/` | Instructions, rubric, tools, permissions | Your AI, from `my-agent.md` |
| `cases/`, `fixtures/` | Case files and made-up test data | Your AI, from `my-agent.md` |
| `src/tools.js` | The tools, with the permission checks | Your AI, from `my-agent.md` |
| `src/` (the rest), `public/` | The orchestrator, eval, and Wizard of Oz pages | Nobody, usually |
| `logs/`, `results/` | What your sessions and evals leave behind | Generated |
| `docs/` | The browser demo | Nobody |
