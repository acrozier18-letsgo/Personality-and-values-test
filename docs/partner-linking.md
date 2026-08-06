# Partner linking: from file share to email invite

The Together page gets a partner's profile through a `PartnerLinkProvider`
(`src/partner/types.ts`). Two exist:

| Provider | Status | What it needs |
|---|---|---|
| `fileLinkProvider` | Working | Nothing. One person exports, the other imports. |
| `emailLinkProvider` | Reports itself unavailable | Everything in this document. |

The UI already renders the email flow (disabled, with the reason shown) and calls
`emailLinkProvider.unavailableReason()` for the copy. Turning it on is a matter of
implementing the four methods and flipping `isAvailable()` to `true` — no changes
to `Together.tsx` or any component.

## Why this needs a server at all

Selfscape is a static site. Today every answer lives in one browser's
localStorage and the only network call is to OpenAI. An email invite requires
three things a static site structurally cannot do:

1. **Deliver mail.** Needs a server-held API credential. A key shipped to the
   browser is a key anyone can use to send mail as you.
2. **Hold a profile between two sessions.** The inviter's browser is closed when
   the recipient clicks accept. Something has to store the profile in between.
3. **Record consent.** "Confirm or decline" is only meaningful if the decision is
   recorded somewhere neither party can forge.

This is the one change that breaks the current promise on the landing page —
*"Your email and answers stay on your device — nothing is sent to a server."*
That copy has to change at the same time, and the change should be explicit in
the UI, not quiet.

## Recommended shape

Extend the existing Cloudflare Worker (`proxy/`) rather than adding a platform.
It is already deployed, already holds a server-side secret, and already sits on
the app's origin path.

- **Storage**: Cloudflare D1 (SQLite). The data is relational and small.
- **Email**: Resend or Postmark. Both are a single `fetch` from a Worker.
- **Auth**: magic-link tokens. Do not build passwords for this.

### Schema

```sql
CREATE TABLE person (
  id            TEXT PRIMARY KEY,          -- uuid
  email         TEXT NOT NULL UNIQUE,      -- lowercased
  display_name  TEXT NOT NULL DEFAULT '',
  created_at    INTEGER NOT NULL
);

-- The shared payload, encrypted at rest. See "Encryption" below.
CREATE TABLE profile (
  person_id     TEXT PRIMARY KEY REFERENCES person(id) ON DELETE CASCADE,
  ciphertext    BLOB NOT NULL,             -- encrypted PartnerProfileFile JSON
  iv            BLOB NOT NULL,
  includes_intimacy INTEGER NOT NULL,      -- surfaced without decrypting
  answered_count    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE link (
  id            TEXT PRIMARY KEY,
  from_person   TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  to_email      TEXT NOT NULL,
  to_person     TEXT REFERENCES person(id) ON DELETE CASCADE,  -- null until accepted
  status        TEXT NOT NULL,             -- pending | accepted | declined | revoked | expired
  token_hash    TEXT NOT NULL,             -- sha256 of the emailed token, never the token
  created_at    INTEGER NOT NULL,
  responded_at  INTEGER,
  expires_at    INTEGER NOT NULL           -- created_at + 14 days
);
CREATE INDEX link_to_email ON link(to_email, status);
CREATE UNIQUE INDEX link_pair ON link(from_person, to_email) WHERE status IN ('pending','accepted');
```

A `link` row is **directional and mutual on accept**: accepting means both
parties may read each other's profile. A one-way share would let someone collect
a partner's answers without offering their own, which is exactly the dynamic this
feature should not create.

### Endpoints

All under `/api/`, all requiring a session cookie except where noted.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/request` | `{email}` → mails a magic link. Always returns 200, never reveals whether the address is registered. |
| `POST` | `/auth/verify` | `{token}` → sets an HttpOnly, Secure, SameSite=Lax session cookie. |
| `PUT` | `/profile` | Upload the encrypted `PartnerProfileFile`. Replaces any previous one. |
| `DELETE` | `/profile` | Erase it. Must also cascade-revoke every link. |
| `POST` | `/links` | `{email}` → create a pending link, mail the invite. Maps to `invite()`. |
| `GET` | `/links` | Pending + accepted links for the caller. Maps to `pendingInvites()`. |
| `POST` | `/links/:id/accept` | Recipient consents. Requires their session, not the token alone. |
| `POST` | `/links/:id/decline` | Recipient refuses. Row keeps `declined` so it can't be silently retried. |
| `DELETE` | `/links/:id` | Either party revokes at any time. Maps to `revoke()`. |
| `GET` | `/links/:id/profile` | The other party's encrypted profile. 403 unless `status = 'accepted'`. Maps to `fetchLinked()`. |

### Consent rules

These are the requirements, not suggestions — the whole feature is a mechanism
for handing someone a detailed psychological profile of a real person.

- An invite email must name who sent it and show what will be shared (statement
  count, and whether intimacy answers are included) **before** the accept button.
- Accepting requires the recipient to be signed in as that address. A leaked
  invite link must not be enough on its own.
- Either party can revoke at any time, unilaterally, without notifying the other
  first. Revocation deletes the counterpart's cached copy on next load.
- Deleting your profile revokes every link. No tombstones, no "for analytics".
- Invites expire at 14 days. Expired means expired — require a fresh invite.
- No enumeration: `POST /links` must behave identically whether or not the
  address has an account.

### Encryption

Store the profile encrypted with a key the server does not hold, so a database
compromise does not leak anyone's answers:

- On accept, the two clients agree a per-link key (ECDH over WebCrypto, public
  keys exchanged through the server).
- The profile is encrypted client-side with AES-GCM before `PUT /profile`.
- The server sees ciphertext, an IV, and the two unencrypted counters it needs
  for the invite preview.

If that is more than you want to build initially, encrypt at rest with a Worker
secret and say plainly in the UI that the server can technically read profiles.
Do not imply end-to-end encryption you haven't implemented.

## Wiring it up

1. Implement the four methods on `emailLinkProvider` in `src/partner/link.ts`.
2. Flip `isAvailable()` to check for a configured API base
   (`Boolean(import.meta.env.VITE_API_URL)`), so the file flow keeps working in
   local dev and on any deploy without a backend.
3. In `PartnerConnect.tsx`, replace the disabled email block with a live one
   driven by `activeLinkProvider()`. The file flow stays — it is the fallback
   when someone doesn't want an account, and it should never be removed.
4. Update the landing-page copy about nothing being sent to a server.
5. Add a privacy page covering retention, deletion, and what the server can see.

## What not to do

- **Don't put profiles in the URL.** ~450 answers compresses to roughly 1–2 kB of
  base64, which survives some messaging apps and is silently truncated by others.
  Worse, it lands in browser history, server logs, and referrer headers.
- **Don't email the profile as an attachment.** It ends up in two mail providers'
  storage forever, outside anyone's ability to revoke.
- **Don't auto-link on signup by matching email domains or contacts.** Linking is
  always an explicit act by both people.
