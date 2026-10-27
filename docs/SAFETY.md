# How Eidolon keeps content safe (measures in place)

A plain-language record of the safeguards built into Eidolon. Useful to point to for providers (fal.ai, Tripo, Stripe), a lawyer, or anyone who asks.

## Who can use it
- Adults only. Sign-up requires confirming 18+ and agreeing to the Terms, Acceptable Use and Privacy Policy. The date and version accepted are saved with the account.
- Free accounts cannot generate anything. Only signed-in paid accounts can.

## Before a prompt reaches the image or 3D engine (server side, cannot be bypassed from the browser)
- Prompts are checked automatically. Minors, sexual or nude content: instant account lock for review. Real people and celebrities, and trademarked characters or brands: blocked, with strikes.
- Harmless phrases (for example "baby blue", "kid gloves") are allowed so normal prompts are not blocked by mistake.
- The server quietly adds "adult, original character design" to every image prompt, to keep subjects adult and to steer away from copying famous characters.
- Gore words are allowed (dark fantasy) but noted for the owner to review.

## After a prompt is sent
- fal.ai's own safety checker is always on. If it flags an image, the image is discarded, the attempt is logged, and the account gets a small strike. Repeated flags lock the account.
- 3D models are made only from images created inside Eidolon (already moderated), or from text that passes the same checks.

## Review and enforcement
- Every blocked prompt is logged with the exact words that triggered it, shown highlighted in the owner-only Admin moderation tab.
- Locked accounts are reviewed by a person. Serious violations may lead to closure.
- Provider keys are held only on the server (Supabase Secrets). Users never see them and cannot call the providers directly.
- All creations are stored in our own storage and can be removed at any time.

## Reports and takedowns
- The Legal page tells people how to report a creation that breaks the rules or copies their work. Reports go to the contact email in `src/lib/legal.ts`.

## Limits and spending
- Monthly plan allowances and a daily per-account cap limit abuse and cost.
