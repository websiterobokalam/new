# Certificates, calendars, contact form and newsletter

## Certificates

**When they're issued** (automatically):
- **Course certificate:** when a learner has attended every session of a course. This happens when the Kalamite records the last session, or when ops record attendance for a single-session class.
- **Kalamite certificate:** "Certified Kalamite", issued when a Kalamite goes live, after every check and Kalam Academy, including child safety and POCSO.

**What's on them:**
- Each has a random ID like `RK-7KQ2M-9XB4D`, made from letters and digits that are hard to confuse.
- A learner's certificate shows their **first name only**. The family decides who gets the ID.

**Where they appear:**
- Parents: on the learner page (*Certificates*). Kalamites: on *Growth*.
- Both can open the printable certificate and save it as a PDF.
- An email with the link goes out when the certificate is issued.

**Checking a certificate:**
- `/validate`: anyone types the ID (case, spaces and dashes don't matter) and sees whether it's genuine, who it was issued to, and for what.
- Certificates from before November 2026 are pointed to validate.robokalam.com.

**Ops → Certificates:**
- see recent certificates
- issue one by hand for an attended booking (for example after an offline class)
- revoke one with a reason, which the public check then shows

**Erasure:** erasing a learner revokes their certificates and replaces the name with "Deleted". Certificates are included in the family's data export.

## Calendars

- **Add to calendar:** next to each confirmed class in the family home, on each accepted gig, and in the booking email. You get an `.ics` file with a reminder 30 minutes before.
- **Subscribe:** "Put every class in your calendar" (families) and "Put every gig in your calendar" (live Kalamites) give a private feed for Google, Apple or Outlook calendar. New classes appear on their own.
  - The link is signed per account and can be reset; the old link then stops working.
  - A wrong link returns the same 404 as no link, so guessing learns nothing.

## Contact form

The `/contact` page has a form:
- topic, name, email, optional mobile and organisation, message
- an adults-only confirmation, plus a reminder not to include a child's full name or contact details

What happens to a message:
1. It's stored first.
2. The sender gets an acknowledgement with a reference.
3. The details go to the right team inbox: schools and partnerships go to `SCHOOLS_EMAIL`, everything else to `OPS_EMAIL`.

Bots are filtered by a hidden field and a rate limit.

**Ops → Enquiries and newsletter:** reply from your mailbox (the email link pre-fills the subject), then mark the message *answered* or *spam*.

## Newsletter

- **Where people sign up:** the blog, every blog post, and `/newsletter`. The footer links to it.
- **Adults only, double opt-in:**
  - Nobody is on the list until they click the link we email them.
  - At most one confirmation email per address per day.
  - The form never reveals whether an address is already subscribed.
- **Unsubscribing:** a link, plus mail apps' one-click unsubscribe (RFC 8058).
- **Account holders and enquirers are never added automatically.**
- **Ops → Enquiries and newsletter:** shows counts and lets you download a CSV of confirmed subscribers. Each row has that person's own unsubscribe link; put it in every newsletter you send from your email tool.
