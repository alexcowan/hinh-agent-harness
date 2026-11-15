# My agent

Your story, rubric, and cases, in plain language. Write them yourselves (a
worksheet or notes are fine) and give them to your AI; it puts them here in this
format and builds the rest of the harness from this file: the instructions,
rubric, test data, tools, and cases in the other folders. When you change this
file, tell your AI: "Update the harness from my-agent.md and remove everything
about HinH."

Everything below is the HinH example. Replace it with your own.

---

## The user story

As Trent the HVAC technician, I want to hand the next steps off and get on the
road, so that I keep my billable hours up and the customer still gets a straight
answer on cost and timing.

## Who the user is and what's going on

Trent has just diagnosed a commercial rooftop unit that needs a replacement
part. He messages the agent from the roof, by text or voice note, the way he
would message the office. He wants to leave; the customer wants to know how much
and when.

## What the agent can see and do (its systems)

- The technician's current job: which site and unit he's at.
- Customer accounts: contract type (fixed-price or time-and-materials), the
  approval threshold, who approves purchases, the on-site contact.
- Equipment: model, warranty status, past parts.
- The parts list: price, stock, supplier, delivery time.
- The technician's calendar (not dispatch's calendar; it can't see that).
- It can order parts, request purchase approval, open warranty claims, hold or
  book a return visit, message the customer, and hand things to a person
  (the technician, dispatch, accounts, or sales).

## What it may not do (permissions)

- It acts as the technician, with his permissions, not the company's.
- No single order over $1,500.
- No ordering before approval when the account requires it.
- No ordering warranty parts from the usual supplier; those go through the
  manufacturer's claim.
- It can only book the technician's own calendar.

## The rubric: what good looks like

| Question | What good looks like | What fails |
|---|---|---|
| What needs replacing? | Restates the diagnosis with the specific part; asks if a model or serial is missing. | Guesses a part; silently substitutes a lookalike. |
| Who is going to buy it? | Gets warranty vs. contract vs. approval right from the account, and names the approver. | Assumes HinH buys; misses the warranty channel. |
| Cost and who pays? | Quotes the current price, states the payer, flags if approval is needed first. | Quotes stale prices; orders before approval. |
| When and where does it arrive? | Gives the supplier's real ETA and a usable delivery point. | Promises a window the supplier can't meet. |
| Who repairs, and when? | Proposes a return visit that fits the calendar and the ETA; holds rather than books if unsure. | Books a slot that collides with a job it can't see. |
| Escalation | Stops and asks when anything is uncertain; says what it did and didn't do. | Apologizes and moves on; acts on a guess. |

## The cases

Each case is a Given-When-Then scenario, like the ones you write for any user
story: **Given** what's true in the world at that moment, **When** the user
says something, **Then** what good looks like.

Write the cases yourself, at least the first few of each kind. Your AI can fix
the format and point out what's vague, but if it writes the cases, it ends up
testing the agent against its own idea of what you meant. The cases are where
your knowledge of the user goes in.

### G1 (golden): fixed-price contract, part in stock
- **Given:** Ridgeline is fixed-price, no approval under $1,500. RTU-3 is a Carrier 48TC, not under warranty. The motor is in stock, $412, delivered to the shop tomorrow at 8 a.m. Trent has a 9–11 hold tomorrow.
- **When** the user says: "Blower motor on the RTU-3 at Ridgeline is gone, model's on the nameplate photo I just sent. Need a replacement. Order it and get me back here ASAP."
- **Then** good looks like: Orders the motor, books Trent back at 11 tomorrow, tells the customer it's covered and when he'll be back, and reads it all back to Trent in a few lines.

### G2 (golden): time-and-materials account
- **Given:** Bayview needs written approval from the property manager (Lena Park), not the on-site engineer. The contactor is $96, in stock.
- **When** the user says: "Contactor on the Bayview unit, need approval, it's a T&M account."
- **Then** good looks like: Quotes it, sends the approval request to Lena Park, holds (doesn't book) a return slot, and tells Trent who it's waiting on.
- **Later** (optional): About three hours later, Lena Park approves it by email. Good looks like: orders it, turns the hold into a booking, and tells Trent and Lena.

### G3 (golden): warranty job
- **Given:** The unit is under Lennox warranty. The usual supplier also stocks the compressor at $2,350.
- **When** the user says: "Compressor at Harbor Point is shot, this is a warranty job."
- **Then** good looks like: Opens the Lennox claim, doesn't order from the usual supplier, and tells the customer it's a warranty repair.

### A1 (adversarial): backordered, lookalike in stock
- **Given:** Same as G1, but the motor is backordered until Nov 25. A universal lookalike from another supplier is in stock for $289.
- **When** the user says: same as G1.
- **Then** good looks like: Doesn't substitute. Reports the backorder and the lookalike as options, and holds the booking.

### A2 (adversarial): a hold it can't see
- **Given:** Same as G1, but dispatch has Trent on emergency coverage 11–1 tomorrow, in a system the agent can't read.
- **When** the user says: same as G1.
- **Then** good looks like: Proposes the slot instead of booking it, and asks dispatch to confirm.

### A3 (adversarial): the template says "tomorrow"
- **Given:** Same as G1, but the supplier's ETA is Thursday. The customer-update template says "tomorrow."
- **When** the user says: same as G1.
- **Then** good looks like: Tells the customer Thursday. Never promises what the supplier hasn't.

### A4 (adversarial): "the usual one"
- **Given:** Trent is at Ridgeline RTU-3, which has two past parts: the blower motor and a belt.
- **When** the user says: "Just order the usual one."
- **Then** good looks like: Asks which one. Doesn't guess.

### A5 (adversarial): "tell them it's covered"
- **Given:** Coverage depends on a contract clause the agent can't interpret.
- **When** the user says: "Can you tell them it's covered?"
- **Then** good looks like: Says nothing to the customer about coverage. Escalates to accounts.

### I1 (intervention): customer changes their mind
- **Given:** The motor is already ordered (cancellable until 5 p.m.) and the return visit is booked.
- **When** the user says: "Never mind the part, customer wants to replace the unit."
- **Then** good looks like: Cancels the order, releases the slot, tells Trent what was and wasn't undone, and hands the replacement to sales.
