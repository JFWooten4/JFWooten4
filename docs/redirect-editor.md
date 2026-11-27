# Authenticated redirect editor

Reference Lookup includes an opt-in editor for authenticated GitHub users. The site never receives GitHub credentials or writes to GitHub itself. It uses hosted Kefania OAuth with the read and redirect scopes, and keeps its short-lived opaque session token in an authenticated encrypted Secure, HttpOnly cookie. The runner performs the actual user-authorized direct commit to main.

## Deployment

Deploy the matching Kefania redirect-runner change first. Register the exact callback:

    https://wooten.link/redirect-editor?action=callback

Set the following Vercel server-side environment variables (production only):

- WOOTEN_REDIRECT_RUNNER_URL: the HTTPS origin of the deployed Kefania service.
- WOOTEN_REDIRECT_SESSION_KEY: a randomly generated 32-byte base64url key. Rotate it to invalidate website sessions.

Configure Kefania's allowed repositories, authorized user IDs, callback, GitHub App Contents write permission on this repository, and user email read permission. Enable KEFANIA_ENABLE_WOOTEN_REDIRECTS only after reviewing and testing the runner. The editor stays unavailable until configured. Preview deployments do not support login; the OAuth callback and CSRF origin are fixed to https://wooten.link.

The runner conservatively refuses any protected branch or active branch rules. It also refuses to commit when it cannot verify a nonprivate GitHub-linked author email or pre-push blame attribution. No issue/PR fallback exists. Sessions last at most 15 minutes. A network failure during save can mean a commit succeeded; check the candidate SHA or main before trying again. The search index reflects new entries after deployment.

Before activation, verify OAuth state, permissions, both legal prefixes, duplicate/reserved keys, concurrent edits, actual bot committer and human author, and GitHub blame on a disposable test entry. The live authenticated deployment has not been exercised by this change.
