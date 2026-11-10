# Reader-review page setup

The public page is at `/reviews`, with a link next to the book PDF on the homepage.
The Vercel function at `/api/reviews` reads approved reviews and accepts account-free submissions.
**The form will remain disabled until its deployment environment is configured.**

## Private moderation store

1. Create a **private** GitHub repository dedicated to reader-review submissions, with Issues enabled. A private repository matters because pending reviews otherwise appear on the public GitHub Issues page before moderation.
2. Create the labels `book-review` and `book-review-approved` in that repository.
3. Create a fine-grained GitHub token with access **only** to that repository and **Issues: read and write** permission. Store it as a Vercel environment variable, never in site source.
4. Add the following environment variables to the Vercel project and redeploy:

   - `REVIEW_GITHUB_REPO`: `owner/private-reviews-repo`.
   - `REVIEW_GITHUB_TOKEN`: fine-grained token, Issues read/write.
   - `TURNSTILE_SITE_KEY`: public Cloudflare Turnstile site key.
   - `TURNSTILE_SECRET_KEY`: private Turnstile secret key.
   - `REVIEW_HOSTNAME`: hostname used in Turnstile verification (defaults to `wooten.link`). For preview deployment testing, change this to the preview hostname and authorize it in Turnstile.

## Moderation

- Each submission opens an Issue with label `book-review`; no submitted email address is requested.
- Check its contents and add `book-review-approved` to publish it. Remove the approval label to unpublish.
- The public page fetches only issues with **both** labels, sorted newest first, capped at 100 per request.
- Do not approve spam, abusive reviews, personal contact information, or sensitive financial details. Keep legitimate criticism regardless of rating. Do not offer incentives for favorable reviews.
- All approved content is escaped using `textContent` in the page, rather than inserted as HTML.
- Cloudflare Turnstile is validated on the server and its verified hostname must match `REVIEW_HOSTNAME`; a hidden honeypot provides a secondary low-friction spam check.
- Note that GitHub, Vercel, and Cloudflare may process normal request metadata such as IP addresses. Include the review form in the site's privacy disclosures if needed.

## Testing

Run `node --test test/reviews.test.js` for API validation, storage, captcha, and publication tests. Run `node --test test/*.test.js` for the full repository test suite.

After deploying, verify `/reviews`, approved review rendering, a valid submission, invalid captcha behavior, and approval/unapproval from GitHub. The code does not create the private repository, token, or Turnstile site automatically.
