# Why there is no front end

A risk system is a register, a few lists hanging off it (controls, actions, incidents, obligations) and a calendar of reviews, tests and notices. What a GRC subscription charges for is the screens over those lists: forms to fill in, a heat map, a committee pack, a dashboard of what is late.

Those screens were needed because the database was hard to talk to. It is not any more. Open this folder in Claude Code and ask "which risks are over appetite with nothing being done about them?" or "what notice clocks are running?" and it runs the query and answers. Ask a question nobody built a dashboard for and you still get an answer.

## What you gain

- **Answers to your own questions.** The ten in the README are the start. Ask for the next one in plain words.
- **No seats.** Every risk owner, control tester and committee member can ask. The bill does not grow with the people who need to look.
- **Your register in a database you own.** Plain tables. Back them up, report from them, leave any time.
- **Rules you can read.** Every compliance check is written down in `docs/compliance.md` with its source, and in one SQL view you can change.

## What you give up

- **A form for every field.** Risk owners record a review by asking for it, not by filling in a screen. Some people will want a screen.
- **A phone app.** It runs where Claude Code runs.
- **Workflow approvals with email notifications.** Approvals here are records with an actor. Nothing sends email.
- **A vendor help desk.** This is open source. Enterprise DNA supports the installed version.

Enterprise DNA builds a web front end, approvals and notifications onto the same database for businesses that want them. The register underneath stays yours.

Installed and run for you: https://enterprisedna.co/omni/instead-of/camms
