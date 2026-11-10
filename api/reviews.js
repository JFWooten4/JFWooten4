// Reader book reviews: anonymous submissions, private GitHub moderation, and approved public reviews.
// Required deployment configuration is documented in REVIEWS_SETUP.md.
const API_ROOT = "https://api.github.com";
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MODERATION_LABEL = "book-review";
const APPROVED_LABEL = "book-review-approved";

function configuration(env) {
  const repo = String(env.REVIEW_GITHUB_REPO || "");
  return {
    repo: /^[a-z\d_.-]+\/[a-z\d_.-]+$/i.test(repo) ? repo : "",
    token: env.REVIEW_GITHUB_TOKEN || "",
    siteKey: env.TURNSTILE_SITE_KEY || "",
    secret: env.TURNSTILE_SECRET_KEY || "",
    hostname: String(env.REVIEW_HOSTNAME || "wooten.link").toLowerCase(),
  };
}

function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(data));
}

function normalizeReview(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const review = typeof value.review === "string" ? value.review.trim() : "";
  const rating = value.rating === null || value.rating === "" || value.rating === undefined
    ? null : Number(value.rating);
  if (name.length > 60 || review.length < 20 || review.length > 2000 ||
      (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5))) {
    return null;
  }
  return { name: name || "Anonymous reader", rating, review };
}

function publishedReviews(issues) {
  return issues.filter((issue) =>
    !issue.pull_request &&
    Array.isArray(issue.labels) &&
    [MODERATION_LABEL, APPROVED_LABEL].every((label) =>
      issue.labels.some((item) => item.name === label)
    )
  ).map((issue) => {
    try {
      const item = JSON.parse(issue.body);
      if (item.schema !== "book-review-v1") return null;
      const review = normalizeReview(item);
      return review && {
        ...review,
        id: issue.number,
        date: issue.created_at.slice(0, 10),
      };
    } catch (_) {
      return null;
    }
  }).filter(Boolean);
}

function createHandler({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return async function reviewsHandler(req, res) {
    const cfg = configuration(env);
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      return reply(res, 405, { error: "Method not allowed." });
    }
    if (!cfg.repo || !cfg.token) {
      return reply(res, 503, { error: "Book reviews are not configured yet." });
    }

    const issueUrl = `${API_ROOT}/repos/${cfg.repo}/issues`;
    const ghHeaders = {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (req.method === "GET") {
      try {
        const params = new URLSearchParams({
          state: "all",
          labels: [MODERATION_LABEL, APPROVED_LABEL].join(","),
          per_page: "100",
          sort: "created",
          direction: "desc",
        });
        const response = await fetchImpl(`${issueUrl}?${params}`, {
          headers: ghHeaders,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Could not load reviews.");
        const issues = await response.json();
        if (!Array.isArray(issues)) throw new Error("Unexpected review store response.");
        return reply(res, 200, {
          reviews: publishedReviews(issues),
          submissionsEnabled: Boolean(cfg.siteKey && cfg.secret),
          siteKey: cfg.siteKey && cfg.secret ? cfg.siteKey : null,
        });
      } catch (error) {
        console.error("Book review listing failed:", error.message);
        return reply(res, 502, { error: "Reviews could not be loaded. Please try again." });
      }
    }

    if (!cfg.secret || !cfg.siteKey) {
      return reply(res, 503, { error: "Review submissions are not configured yet." });
    }
    if (String(req.headers?.["content-type"] || "").split(";")[0].trim() !== "application/json") {
      return reply(res, 415, { error: "Expected JSON submission." });
    }
    if (Number(req.headers?.["content-length"] || 0) > 6000) {
      return reply(res, 413, { error: "Submission is too large." });
    }

    let input;
    try {
      input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!input || typeof input !== "object" || Array.isArray(input) ||
          JSON.stringify(input).length > 6000) throw new Error("Invalid payload");
    } catch (_) {
      return reply(res, 400, { error: "Invalid submission." });
    }

    // Trap automated submissions without exposing an extra obstacle to readers.
    if (input.website) return reply(res, 201, { ok: true });

    const review = normalizeReview(input);
    if (!review) {
      return reply(res, 400, { error: "Enter 20–2000 characters and an optional 1–5 star rating." });
    }
    const captcha = typeof input.captcha === "string" ? input.captcha : "";
    if (!captcha || captcha.length > 2048) {
      return reply(res, 400, { error: "Please complete spam verification." });
    }

    try {
      const verify = await fetchImpl(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: cfg.secret, response: captcha }),
      });
      if (!verify.ok) throw new Error("Verification service unavailable");
      const verdict = await verify.json();
      if (!verdict.success || String(verdict.hostname || "").toLowerCase() !== cfg.hostname) {
        return reply(res, 400, { error: "Spam verification failed. Please retry." });
      }

      const result = await fetchImpl(issueUrl, {
        method: "POST",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Book review: ${review.name.slice(0, 60)}`,
          body: JSON.stringify({ schema: "book-review-v1", ...review }),
          labels: [MODERATION_LABEL],
        }),
      });
      if (!result.ok) throw new Error(`Review storage rejected request (${result.status})`);
      return reply(res, 201, { ok: true, message: "Thanks! Your review has been submitted for moderation." });
    } catch (error) {
      console.error("Book review submission failed:", error.message);
      return reply(res, 502, { error: "Your review could not be submitted. Please try again." });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
module.exports.normalizeReview = normalizeReview;
module.exports.publishedReviews = publishedReviews;
