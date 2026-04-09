# Email Flow Polish — Design Spec

**Date:** 2026-04-01
**Scope:** Polish existing email drip sequence — rewrite premium welcome for activation, fix two live copy bugs, add day-60 free-user nurture email.

---

## Background

The app already has a working email drip (Resend + Supabase Edge Functions):
- Onboarding sequence: welcome (day 1), habit tips (day 3), upgrade pitch (day 7), community nudge (day 14), milestone (day 30)
- Re-engagement: 7 and 14 days inactive
- Stripe webhook: upgrade confirmation, cancellation, abandoned checkout

Three gaps to close:

1. **Premium welcome email** lists features but gives no activation instructions — users don't know what to do first and churn before discovering value.
2. **Day 7 CTA** links to `/settings` (wrong page — users land in account settings, not the upgrade flow).
3. **Day 14 copy** references a "referral link" that doesn't exist — users who look for it lose trust.
4. **No day-60 email** — users who ignored day 7 and day 30 pitches have never been approached with a different angle.

---

## Change 1: Premium Welcome Email Rewrite

**File:** `supabase/functions/stripe-webhook/index.ts`
**Trigger:** `checkout.session.completed` event (already fires this email)

### Current state
Lists 5 premium features with descriptions, shows billing amount ($3/mo), single CTA "Open JW Study →".

### New design

**Structure:**
1. **Header** — "You're Premium! 🎉" celebration (keep existing gradient)
2. **Start here block** — single recommended first action: "Set up your first reading plan." Brief 1-sentence why ("It gives you a daily assignment so you always know what to read next.") + primary CTA button: `Start My Reading Plan →` linking to `https://nwtprogress.com?page=readingPlans`
3. **Feature access guide** — condensed list, each item shows HOW to access it, not just what it is:
   - 📅 Reading Plans → already linked above
   - 📝 Study Notes → open any chapter, tap "Add Note"
   - 📋 Meeting Prep → tap Meeting Prep in the sidebar
   - ✨ AI Study Tools → open any chapter, tap "Ask AI"
   - 💬 Messages / 👥 Groups → tap the Community icon
4. **Footer** — manage subscription link (keep existing)

**Remove:** The billing box showing "$3.00 / month — recurring." Reminding users of the cost immediately after welcoming them undermines the celebratory tone. They already know they're paying.

### Deep link handler
Add to `AuthedApp.jsx`: on mount, read `?page=` query param and navigate to that page if it matches a valid page key. This enables email deep links into any feature.

```js
// in AuthedApp, after auth is confirmed:
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");
  if (page && VALID_PAGES.includes(page)) navigate(page);
}, []);
```

`VALID_PAGES` = `["readingPlans", "studyNotes", "quiz", "forum", "blog", "main"]`

---

## Change 2: Day 7 CTA URL Fix

**File:** `supabase/functions/onboarding-emails/index.ts`
**Function:** `day7Html`

### Current state
CTA button links to `${SITE}/settings`.

### Fix
Change to `${SITE}?upgrade=1`.

Add a companion handler in `AuthedApp.jsx` (same `useEffect` as above, extended):
```js
const upgrade = params.get("upgrade");
if (upgrade === "1") openUpgrade();
```

This auto-opens the upgrade modal when the user lands from the day-7 email CTA.

---

## Change 3: Day 14 Copy Fix

**File:** `supabase/functions/onboarding-emails/index.ts`
**Function:** `day14Html`

### Current state
Item 3 in the list: `["3", "Invite a friend", "Know someone who'd benefit? Share your referral link and study together."]`

### Fix
Replace with: `["3", "Join a Study Group", "Find one in the Community tab or create one for your congregation — group progress tracking included."]`

No other changes to day 14.

---

## Change 4: Day 60 Free-User Email

**File:** `supabase/functions/onboarding-emails/index.ts`

### New cohort
Add to the `cohorts` array:
```ts
{
  step: "day60",
  daysAgo: 60,
  subject: "Two months in — here's what premium members are doing",
  buildHtml: day60Html,
  premiumOnly: false, // free users only — see filtering note below
}
```

### Filtering
The function must skip users who are already premium. Add a check: after fetching the profile cohort, filter out users where `stripe_subscription_status = 'active'`. The `profiles` table already has `stripe_subscription_status`. Extend the Supabase query:
```ts
.neq("stripe_subscription_status", "active")
```

Apply this filter to the day 60 cohort only (not retroactively to other cohorts — they already gate on not-yet-sent, which is fine).

### Email content (`day60Html`)

**Angle:** Social proof + loss framing. By day 60 the user has seen two feature-list pitches and passed. Lead with what other users are doing, not what the product does.

- **Header:** "Two months — here's what you're missing 📅" (softer than "you're missing out")
- **Body:** 2 short paragraphs:
  - "Premium members on JW Study have been building a daily reading habit with structured plans, keeping study notes that compound over months, and connecting with their congregation through study groups."
  - "You've been on free for two months. Premium is $3/mo — less than a coffee. Your 7-day free trial is still available."
- **CTA:** `Start Free Trial →` → `${SITE}?upgrade=1`
- **No feature list** — they've seen it. Keep the email short.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/stripe-webhook/index.ts` | Rewrite `checkout.session.completed` email HTML |
| `supabase/functions/onboarding-emails/index.ts` | Fix day 7 CTA URL, fix day 14 copy, add day 60 cohort + `day60Html` function |
| `src/AuthedApp.jsx` | Add `?page=` and `?upgrade=1` query param handler on mount |

---

## Out of Scope

- Re-engagement email improvements (reEngage7/14 reset logic) — separate initiative
- Behavior-triggered email versions of in-app prompts (book complete, streak milestone, quiz badge) — separate initiative
- Email open/click analytics — needs Resend webhook setup, separate initiative
- Other language versions of updated emails — falls back to English via existing i18n fallback
