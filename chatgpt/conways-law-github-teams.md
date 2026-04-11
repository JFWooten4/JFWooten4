# Executive Summary

Conway’s Law, introduced by Melvin Conway in 1967, observes that software architecture mirrors an organization’s communication structure.[^1][^2] In practice, GitHub (and by extension, Microsoft) has designed features like teams, CODEOWNERS, review requests, and assignee fields that reflect this principle. Teams are used to model departmental or product-group boundaries with cascading permissions and mentions, while CODEOWNERS files bind code areas to teams or individuals.[^3][^4] When a pull request (PR) is created, it can be routed to a team (a "team review request") rather than a person, and GitHub’s auto-assignment feature can then replace the team with specific team members.[^5] In this way, the product API/UX (e.g. requesting reviews, branch protection, CODEOWNERS rules) directly encodes organization relationships and code ownership. For example, requiring review from @org/backend-team ties that module to the backend engineering group.[^6]

This alignment has trade-offs: using teams for review "routes" (versus individual assignees) scales well for large groups but can create notification noise or unclear ownership. GitHub provides settings (e.g. "only notify requested team members") and auto-assignment algorithms (round-robin or load-balancing) to mitigate these issues.[^7][^8] We compare the mechanisms in use (team mention, team review request, CODEOWNERS, individual assignee) in the table below, and illustrate the PR flow with a mermaid diagram. In conclusion, Conway’s Law suggests that tooling should empower code modularity and clear communication paths: product managers should match team structure to code architecture, use team features to reflect those boundaries, and carefully tune notifications/accountability.

# Conway’s Law and Organizational Modularity

Conway’s Law states that "organizations which design systems … are constrained to produce designs which are copies of the communication structures of these organizations".[^1] In other words, if a company’s teams and departments are siloed, the software’s modules and APIs will reflect those silos. For decades this socio-technical insight has been supported by studies: MIT/Harvard researchers using the "mirroring hypothesis" found strong evidence that "product developed by the loosely-coupled organization is significantly more modular than the product from the tightly-coupled organization," highlighting the impact of "organizational design decisions on the technical structure of the artifacts".[^9] (A complementary view is that product architecture and team communication co-evolve.) In practice, architects and managers often design teams to align with code modules (sometimes summarized as "you are your architecture").[^10]

Key concepts from organizational design include: - Modularity and Boundaries: Breaking a system into modules reduces cross-team communication needs. Tools like GitHub’s team structure and CODEOWNERS enable defining module "owners" (teams or individuals) for different code areas.[^4][^11] - Coordination Costs: Every additional communication path between people adds overhead (roughly O(n²) for n people). Small, independent teams face lower coordination cost. Features like auto-assigning a subset of reviewers from a team help minimize the overhead of involving an entire team.[^5] - Socio-Technical Systems: Effective engineering matches technical and social design. GitHub’s teams and review settings are classic "socio-technical congruence" levers: they align who must talk (i.e. review code) with who can talk (i.e. team membership).

Thus, Conway’s Law is not just a slogan but a practical lens: GitHub’s team-model, review workflows, and permission controls manifest these theories. By examining GitHub’s documentation and Microsoft’s own practices, we see that product features explicitly map to communication patterns and code ownership.

# GitHub & Microsoft Team/Org Models and Workflows

GitHub organizations allow nested teams that mirror a company’s hierarchy (e.g. "Engineering" > "Backend Team" > "API Team"), with "cascading" repo permissions.[^12] Teams can have admin, write, or read access to repos and can be set as code owners for parts of a codebase.[^3][^4] The official docs summarize:

- Teams & Mentions: Teams represent groups of organization members and are used both for access control and for communication. Any org member can notify a whole team by mentioning its name (e.g. @org/backend-team).[^13] Teams can be visible (any member can see/mention it) or secret (only team members/owners can see).[^14] For example, a frontend team could have write access to the web UI repo; mentioning it alerts all frontend devs.

- Review Requests: Team-based review requests notify everyone in the team to review a PR. The docs note that org members can request reviews from specific teams (so long as the team has read access).[^15] This is treated as a formal review request: the PR shows the team as requested reviewer. Teams can also be given "Code Owners" status via a CODEOWNERS file, which automatically requests them when relevant files change.[^4]

- CODEOWNERS: A CODEOWNERS file in a repo maps file globs to owners (usernames or @org/team names). When a PR changes owned files, those owners are automatically requested for review.[^4] Admins can require CODEOWNERS’ approval via branch protection rules. Thus, CODEOWNERS provides persistent, declarative ownership aligned with organizational structure: e.g. all *.py in /backend/ might map to @org/backend-team.[^4]

- Auto-Assignment & Team Settings: To handle large teams, GitHub allows configuring auto-assignment. When a team is requested to review, the team reviewer can be replaced with specific team members (selected round-robin or by load).[^5] This routes the responsibility to individuals for accountability. Teams can also set "Only notify requested team members" to reduce noise.[^16]

- Assignee Field: In contrast, the Assignees field (on issues/PRs) is strictly individual. Up to ten individual users (organization members with write/read access) can be assigned to an issue/PR.[^17] The assignee feature clarifies who is working on it. Teams cannot be assignees – GitHub enforces that only user accounts are assignable.[^17]

The Microsoft perspective echoes these structures. In its large-scale GitHub usage (as documented by Microsoft’s OSPO), teams are synced from corporate identity and used for access control. Guidance from GitHub’s Enterprise Cloud documentation explicitly recommends granting repo permissions solely to teams (synced via Azure AD),[^18] and organizing teams around projects for visibility.[^19] It also mentions that branch protection can require PR approvals from teams defined in CODEOWNERS,[^6] indicating that using team-based reviews is a best practice for mapping organizational review flows to the codebase.

# Team vs Individual Assignment: Product Signals

GitHub’s UI and API clearly distinguish routing a review to a team from assigning a person:

- Team Mentions: Using @org/team-name in a comment or PR description is an ephemeral notification. It does not appear as a formal reviewer or assignee – it simply pings team members.[^13] Mentions are one-off broadcasts.

- Team Review Request: In the "Reviewers" box of a PR, one can select an entire team. This adds the team under "Review requested". By default, GitHub notifies all members, but team settings can limit notifications.[^7] The team remains listed until either someone reviews or (with auto-assign) it’s replaced. Importantly, reviewers API treats teams differently from users (e.g. requested_team_reviewers vs requested_reviewers fields).

- CODEOWNERS Triggered Request: A CODEOWNERS entry behaves similarly to a team review request. When the PR opens, GitHub automatically adds the team (or individuals) listed in CODEOWNERS as requested reviewers for the matching files.[^4] With branch protection, the team request can’t be auto-removed unless an individual fulfills it.[^5]

- Individual Assignees: Using the sidebar "Assignees" field assigns specific people. This is purely an accountability marker – it does not trigger notifications unless those users subscribe to the issue/PR. It differs semantically: an assignee is responsible for resolution, whereas a reviewer is responsible for approving.

These mechanisms create distinct workflows. For example, a PR touching backend/ may auto-request @org/backend-team via CODEOWNERS. The team lead may then rely on auto-assignment to pick one or two backend engineers to actually do the review (the team reviewer disappears and individuals are shown instead).[^5] Meanwhile, another engineer could manually add @org/frontend-team as a reviewer if the change crosses boundary. Meanwhile, the author might assign the PR to themselves as assignee to indicate they’ll shepherd it to merge.[^17]

# Design Choices & Conway’s Law

Mirroring team boundaries in tools: These features map onto Conway’s Law. A team mention or review request enforces a communication linkage: it says "the backend team needs to see this change" – aligning the artifact (the PR) with the organizational boundary (backend team). CODEOWNERS codifies long-term ownership of code by organization groups, so the code structure enforces team review channels.[^4][^6] In effect, the product APIs expose the org chart: "is_team: true" in the review request, or requiring @org/security-team approval on security-sensitive files, ensures the team responsible is in the loop.

From teams to individuals: Recognizing that actual work is done by people, GitHub introduced auto-assignment. This reflects the idea that teams contain individuals who do tasks. The API/UX therefore provides a two-step flow (illustrated below) – a PR can be routed to a team (broadly notifying them) then optionally decomposed into individual reviewer assignments.[^5] This enforces both Conway’s Law (keep team boundaries) and accountability (someone specific reviews).

```text
flowchart LR A[PR Created] --> B[Team Review Requested] B --> C{Auto-Assign Enabled?} C -- Yes --> D[Team Removed, Assignees Added] C -- No --> E[Team Remains as Reviewer] D --> F[Individual Reviews in Progress] E --> F F --> G[Reviewer(s) Approve] G --> H[PR Merged or Further Review Needed]
```

The flow above shows how a team review request (B) can lead either to auto-assigned individuals (D) or keep the team label (E). In all cases, a team request ensures the team’s code ownership guides the flow, embodying Conway’s Law.

# Trade-offs of Team vs Individual Routing

Using teams for PR review has several trade-offs:

- Scalability: Teams can represent large groups (e.g. 20+ engineers) and allow PRs to reach many experts at once. This scales better than assigning all experts as individuals on each PR. However, large team pings can overwhelm notifications. GitHub’s "only notify requested members" setting and auto-assignment mitigate this by narrowing notifications when desired.[^7]

- Accountability: Team routing initially diffuses responsibility ("which person will review?"). Auto-assignment and explicit assignees address this: once an individual is assigned, that person is accountable. The assignee field itself (distinct from reviewers) ensures clear ownership of the PR/issue.[^17] But relying solely on teams might obscure who will merge the PR unless someone is individually tagged or assigned later.

- Notification Noise: Notifying a whole team can create noise if most members aren’t needed. Conversely, only pinging one person (missing a needed reviewer) risks missing critical reviews. GitHub lets teams control notifications (e.g. "only notify member if also requested").[^7] Some organizations require explicitly picking team members to notify, combining both (code owners + manual assignment).

- Cross-Team Coordination: When a PR affects multiple domains, teams intersect. For example, a UX change that also needs backend changes might require reviews from both frontend-team and backend-team. GitHub allows multiple reviewers including teams and individuals simultaneously. Organizing via teams can highlight these cross-team dependencies more clearly than issuing to individual experts in each team ad hoc.

- Tooling Complexity: Supporting teams in the API and UI adds complexity (multiple reviewer types, notification settings, sync with IdP groups, etc.). Features like auto-assignment introduce user-configurable routing algorithms (round-robin, load-balance).[^8] However, these exist precisely to cope with complexity at scale. Without team concepts, orgs would have to manage cumbersome lists of individuals and risk stale ownership data.

# Examples and Scenarios

Example – Microsoft/Internal Projects: Microsoft’s own repositories (often under microsoft/<product>) typically use teams for review. For instance, the Azure DevOps team might have subteams @Azure/Backend and @Azure/Frontend added as CODEOWNERS for their respective directories. A PR touching multiple services would automatically request both teams. The Azure OSPO blog notes that internally Microsoft provides a portal listing "the teams that control each repo" for transparency.[^20] In addition, Microsoft’s GitHub Enterprise strategy advocates "one org, many teams" to avoid silos,[^21] leveraging teams (and code owner sync) instead of separate orgs.

Case Study – Kubernetes (Open Source): The Kubernetes project uses OWNERS files (similar to CODEOWNERS) to assign code areas to subteams. Its docs explain: "OWNERS files designate responsibility over different parts of the codebase and serve as the implementation for the two-phase code review process.".[^11] For example, code under /pkg/registry might list a SIG (special interest group) as owner. A PR merging into that path automatically assigns an approver from that group. This matches Kubernetes’ organization of contributors (SIGs) with code modules, exemplifying Conway’s Law in an open-source setting.

Hypothetical Scenario: Suppose AcmeCorp has a frontend team and a backend team. They maintain one monorepo with frontend/ and backend/ folders. They configure CODEOWNERS so frontend/ is owned by @Acme/frontend-team and backend/ by @Acme/backend-team. Now: - A PR touching only frontend/app.js will auto-request @Acme/frontend-team. The frontend team’s leader might manually assign an individual reviewer (Alice) from the team (auto-assign is ON). That person reviews and merges. - A PR touching both frontend/ and backend/ triggers both teams. Perhaps frontend and backend leads coordinate who reviews which parts. Each team assigns one of its members, keeping the organizational structure aligned with the code architecture. - If instead AcmeCorp had a "cross-functional product teams" model (each team owns full-stack features), they might not use CODEOWNERS. Instead, they’d manually request reviews from the product team’s peer members and assign the PR to themselves for accountability. The tooling (team mention vs CODEOWNERS) shifts to match that structure.

These scenarios show how different org structures interact with GitHub’s features. If the org is highly modular (by layer), CODEOWNERS and team reviews enforce boundaries. If it’s more matrixed (cross-functional), teams might be used more flexibly (e.g. @Acme/project-alpha team spanning roles). Either way, the pattern of PR reviews will "mirror" the communication paths of the teams involved.

# Comparison of Team vs Individual Assignment

| Mechanism | Purpose | Persistence | Accountability | API/Model | Typical Use Cases |
| --- | --- | --- | --- | --- | --- |
| Team Mention | Notify a group of people. | Ephemeral (in comment). | Shared (whole team). | Not formal field; just @org/team text in comment. | Quick alerts, asking questions to a whole team. |
| Team Review Request | Formally request review from a group (matches code areas to teams). | Temporary (until reviewed or auto-assigned). | Shared (team-level); can be converted to individuals. | requested_team_reviewers field in API. | Routing PRs to domain experts (e.g. via CODEOWNERS). |
| CODEOWNERS | Declare persistent ownership of code paths. | Persistent (file in repo). | Shared (team or users as defined). | Admin feature triggering review requests; branch-protection integration. | Enforcing reviews/approvals by owners of file areas. |
| Assignee (User) | Assign responsibility to a person. | Visible until changed. | Individual (explicit). | assignees field; up to 10 users. | Clarifying who will address issue/PR, operational follow-up. |

(Table: @mentions are lightweight notifications; team reviews and CODEOWNERS drive the formal review process; assignees denote work responsibility. See docs.[^13][^17][^4][^5])

# Conclusion & Recommendations

GitHub’s team-review and assignment design embodies Conway’s Law: it provides explicit constructs so that "the structure of a system is a copy of the communication structure of the organization".[^1][^9] By using teams and CODEOWNERS, organizations shape their technical architecture to match how teams communicate. However, this also means that reorganizing a team or changing process often necessitates changes in the code collaboration workflow (or vice versa). For product managers and engineering leaders, the implications are: - Align teams with code modules: Define teams (and org units) to own coherent code areas. Use CODEOWNERS to enforce this mapping, and branch protection rules to require the appropriate team’s review.[^6][^4] - Use team reviews for breadth, individual assignment for depth: Request reviews from teams to cover all relevant experts, but enable auto-assignment to ensure a specific reviewer is accountable.[^5] This balances Conway’s Law (team-level routing) with accountability and reduced noise. - Optimize notifications: Leverage settings like "only notify requested team members" to cut noise when possible.[^7] Encourage team maintainers to configure who gets pinged. If a repo’s contributors know specific point people, they should add them in addition to (or instead of) the team. - Monitor coordination overhead: Be aware that each extra review team or assignee adds coordination cost. Limit the number of reviewers, use clear ownership, and possibly subdivide very large teams if reviews become bottlenecked. - Tooling sync with org changes: If the organization restructures, update CODEOWNERS and teams promptly. Outdated mappings (e.g. removed team still in CODEOWNERS) break the mirror. Similarly, if code is refactored (modules change), ensure new owners are assigned.

In sum, GitHub’s design choices make Conway’s Law a feature, not a bug: the PR review process is explicitly organized around teams and their communication paths. Properly used, these features can reduce friction by notifying the right people and signaling ownership. Product and engineering leaders should therefore "design for mirroring": coordinate team structure and code structure, use these team features to encode that structure in the development workflow, and tune settings to manage the trade-offs of scale, noise, and accountability.[^22][^9]

[^1]: Conway's Law. <https://www.melconway.com/Home/Conways_Law.html>
[^2]: What Is Conway’s Law (and What It Means for Your Organization)? – Microsoft 365. <https://www.microsoft.com/en-us/microsoft-365-life-hacks/organization/what-is-conways-law>
[^3]: About organization teams - GitHub Docs. <https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams>
[^4]: About code owners - GitHub Docs. <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners>
[^5]: Managing code review settings for your team - GitHub Docs. <https://docs.github.com/en/organizations/organizing-members-into-teams/managing-code-review-settings-for-your-team>
[^6]: assets.ctfassets.net. <https://assets.ctfassets.net/wfutmusr1t3h/ooXuGRtFrKHrFZ8cIdbUC/4333e8014b2e950d9381bdb102415e3a/GitHub-Enterprise-Cloud_ebook.pdf>
[^7]: Managing code review settings for your team - GitHub Docs. <https://docs.github.com/en/organizations/organizing-members-into-teams/managing-code-review-settings-for-your-team>
[^8]: Managing code review settings for your team - GitHub Docs. <https://docs.github.com/en/organizations/organizing-members-into-teams/managing-code-review-settings-for-your-team>
[^9]: Conway's law - Wikipedia. <https://en.wikipedia.org/wiki/Conway%27s_law>
[^10]: Conway's law - Wikipedia. <https://en.wikipedia.org/wiki/Conway%27s_law>
[^11]: OWNERS Files | Kubernetes Contributors. <https://www.kubernetes.dev/docs/guide/owners>
[^12]: About organization teams - GitHub Docs. <https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams>
[^13]: About organization teams - GitHub Docs. <https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams>
[^14]: About organization teams - GitHub Docs. <https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams>
[^15]: About organization teams - GitHub Docs. <https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams>
[^16]: Managing code review settings for your team - GitHub Docs. <https://docs.github.com/en/organizations/organizing-members-into-teams/managing-code-review-settings-for-your-team>
[^17]: Assigning issues and pull requests to other GitHub users - GitHub Docs. <https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/assigning-issues-and-pull-requests-to-other-github-users>
[^18]: assets.ctfassets.net. <https://assets.ctfassets.net/wfutmusr1t3h/ooXuGRtFrKHrFZ8cIdbUC/4333e8014b2e950d9381bdb102415e3a/GitHub-Enterprise-Cloud_ebook.pdf>
[^19]: assets.ctfassets.net. <https://assets.ctfassets.net/wfutmusr1t3h/ooXuGRtFrKHrFZ8cIdbUC/4333e8014b2e950d9381bdb102415e3a/GitHub-Enterprise-Cloud_ebook.pdf>
[^20]: Scaling from 2,000 to 25,000 engineers on GitHub at Microsoft | Jeff Wilcox. <https://jeffwilcox.blog/2019/06/scaling-25k>
[^21]: Orgs and Teams Best Practices · GitHub. <https://gist.github.com/joshjohanning/f3df54ddea5562f717e6f54f15714a23>
[^22]: Managing code review settings for your team - GitHub Docs. <https://docs.github.com/en/organizations/organizing-members-into-teams/managing-code-review-settings-for-your-team>
