# GitLab Organization Hierarchy

## Executive summary

GitLab’s organizational model is built on namespaces, groups, subgroups, and projects. A group is the main administrative container for related projects; a subgroup is simply a group nested under another group; and a project is the execution unit where code, merge requests, issues, CI/CD, packages, and many per-repository settings live. A namespace is the addressable container layer behind both personal spaces and group spaces, which is why the same project name can exist in different namespaces. In practice, a scalable GitLab organization is usually modeled as one or a small number of top-level groups, with subgroups used for real permission or ownership boundaries and projects used for delivery work.[^1]

The most important design constraint is inheritance. Membership, roles, and many settings flow downward from parent groups to subgroups and projects. GitLab explicitly documents that users keep the permissions of their highest role, that subgroup membership inherits from parent groups, and that you can raise access in a child but cannot effectively lower inherited access without removing the parent-level membership. This makes GitLab very powerful for centralized administration, but it also means broad parent-group membership is the fastest way to create accidental overexposure.[^2]

For most organizations, the most resilient pattern is: keep the tree as shallow as governance allows, use subgroups only for stable organizational or policy boundaries, keep projects as the primary unit of work ownership, and place shared assets such as CI/CD components, templates, labels, milestones, and security policy projects in dedicated higher-level groups or platform subgroups. GitLab’s own recent guidance recommends matching hierarchy to organizational structure, using higher levels for strategy and policy, and using lower levels for team execution; GitLab’s collaboration docs also recommend avoiding unnecessary groups and, in larger environments, separating user-management groups from project-organizing groups.[^3]

There is a documented subgroup nesting limit of 20 levels, but the more important operational limit is practical rather than formal: very large hierarchies make descendant queries, reporting, and background processing more expensive. GitLab has added internal hierarchy caching for large trees and engineering guidance for batching across very large group hierarchies, which is a strong signal that namespace structure materially affects performance and operational complexity.[^4]

For reorganization, the safest rule is: move when you can, copy when you must. Within the same instance, project transfer and group transfer are the most complete mechanisms; across instances, GitLab recommends direct transfer for groups and projects, with file export/import mainly for offline or selective moves. Same-instance project transfer preserves issues, merge requests, pipelines, wikis, history, and direct members; group transfer preserves subgroups, projects, explicit members, and settings, but inherited memberships are lost and visibility may be reduced to match the destination parent. GitLab also supports path redirects after renames and namespace moves, but those redirects last only as long as the original path is not claimed by another namespace or project.[^5]

GitLab.com and self-managed GitLab are similar in hierarchy semantics, but they differ materially in instance-wide controls, identity/SSO models, and some SaaS-specific limits. GitLab.com uses group-level SAML SSO and SCIM for top-level groups, while self-managed supports instance-wide SAML SSO and now also supports SCIM-based group synchronization when combined with SAML group links. GitLab.com also disables new Internal visibility for groups and projects, applies Free-tier top-level group limits, and handles some controls at the namespace level rather than with tenant-admin powers.[^6]

## Core concepts and terminology

The table below summarizes the official GitLab constructs that matter most in hierarchy design.

| Construct | What it is | Best use | What it is not | Primary sources |
| --- | --- | --- | --- | --- |
| Namespace | The container that organizes projects. GitLab has user namespaces and group namespaces. Personal namespaces cannot have subgroups. | Addressing, ownership, and separating otherwise identical project names across different spaces. | Not the same thing as a "team" by itself; it is the structural container underneath users and groups. |[^7] |
| Group | A container for one or more related projects, with shared membership, permissions, and higher-level visibility across issues, merge requests, and analytics. | Department, business unit, product area, platform area, or other durable administrative boundary. | Not the same as a single repository. If you use a group for one repo only, you are usually paying extra hierarchy complexity for little value. |[^8] |
| Subgroup | A group nested under another group; it can have its own members, settings, and projects, and can itself contain more subgroups. | Team-of-teams structures, restricted sub-areas, product lines, or policy boundaries. | Not a temporary planning tool. If the boundary is short-lived, use labels, milestones, boards, or work-item hierarchy instead of another subgroup. |[^9] |
| Project | The core collaboration unit where GitLab stores code and manages issues, merge requests, CI/CD, deployments, registry settings, and other repository-scoped features. | A repository or tightly-coupled delivery unit, usually owned by a team. | Not a broad permission umbrella for many unrelated repos; use groups for that. |[^10] |
| Fork | A copy of another project, created in a namespace of your choice. A fork copies the repository and some project settings, but not issues, merge requests, or wiki pages. It is designed for contribution back to the upstream project. | Open-source contribution, isolated experimentation, or work without write access to upstream. | Not a synchronization mechanism for non-collaborative mirroring or DR. |[^11] |
| Mirror | A repository synchronization relationship. GitLab can pull mirror from an upstream source or push mirror to a downstream destination. Mirroring syncs repository content like branches, tags, and commits automatically. | Cross-host sync, migration staging, backup-ish replication of repository data, or keeping an external source in sync. | Not the same as a fork: it is about repository synchronization, not contribution workflow or per-user working copies. |[^12] |

A useful practical distinction is this: groups are for administration and boundaries; projects are for execution. GitLab’s current docs describe groups as the place to manage permissions and view activity across multiple projects, while projects are described as the central collaboration hub for code, issues, merge requests, and CI/CD. That implies a clean design heuristic: if the thing you are modeling needs a shared membership or policy surface across multiple repos, it is group-shaped; if it is the place where engineers actually push code and run pipelines, it is project-shaped.[^13]

A second distinction that matters operationally is forks versus mirrors.

| Comparison point | Fork | Mirror | Sources |
| --- | --- | --- | --- |
| Purpose | Contribute changes back to an upstream project; personal or team working copy | Synchronize repository state between systems or locations |[^14] |
| Content copied/synced | Repository plus some settings; not issues, merge requests, or wiki pages | Branches, tags, and commits are synced automatically |[^14] |
| Workflow model | MR-based contribution to upstream | Source-of-truth synchronization, either inbound or outbound |[^15] |
| Best fit | OSS contribution, isolated experimentation, no-write-access collaboration | Migration, cross-host replication, external repository integration |[^16] |
| Important caveat | If you already have write access, GitLab says you usually do not need a fork | Mirrors are repository-only and can diverge or hit restrictions depending on direction and provider |[^17] |

## Permissions, inheritance, and access control

GitLab’s current default roles are Minimal Access, Guest, Planner, Reporter, Security Manager, Developer, Maintainer, and Owner. GitLab also supports custom roles, and users with administrator access have all permissions. Most organizations should think about these roles less as a linear ladder and more as functional clusters: "identity only," "planning," "read/report," "security/compliance," "delivery," "repository operations," and "full namespace control." GitLab explicitly documents that users keep the permissions of their highest assigned role across group/project combinations.[^18]

| Role | Operational intent | Key powers | Key limits | Sources |
| --- | --- | --- | --- | --- |
| Minimal Access | Identity placeholder at top-level namespace | Limited group visibility; useful as SSO landing role | Does not automatically get access to projects or subgroups |[^19] |
| Guest | Lightweight participation | View/comment on issues and epics | No code push; repository access is limited by project visibility/offering |[^20] |
| Planner | Planning-heavy role | Create/manage issues, epics, milestones, iterations | Not a code-push role |[^18] |
| Reporter | Read/report role | View code, create issues, generate reports | No code push or protected-branch management |[^20] |
| Security Manager | Security/compliance specialist | Manage vulnerabilities, compliance configuration, audit views | No code push |[^21] |
| Developer | Delivery role | Push to non-protected branches, create MRs, run pipelines | Cannot manage project settings broadly |[^20] |
| Maintainer | Repository/operator role | Manage branches, MRs, CI/CD settings, project members | Cannot delete project; cannot grant/remove Owner in projects |[^22] |
| Owner | Namespace control | Full project/group control, including transfer, deletion, and visibility changes | On SaaS, still not the same as instance administrator |[^23] |

The inheritance rules are what make or break a GitLab org design. GitLab documents that subgroup members inherit access from parent groups; a direct invite to a child can raise access above what is inherited; removing that direct child-role causes the user to fall back to the inherited parent role; and a lower direct role in a child does not reduce a higher inherited parent role. GitLab’s own setup tutorial repeatedly warns that adding users high in the tree propagates their membership widely, which is why it recommends adding users to the minimum number of groups and subgroups necessary.[^24]

Projects follow the same logic: members can be added directly to a project or inherited from parent groups. That means a project can be both team-owned through group inheritance and selectively broadened with direct project members where needed. This is useful for cross-functional work, but it is also one of the main ways access models become hard to reason about at scale.[^25]

Visibility adds another layer. GitLab supports Private, Internal, and Public visibility, but Internal is only available on GitLab Self-Managed and GitLab Dedicated; new GitLab.com groups and projects do not use Internal visibility. GitLab also documents a strict hierarchical rule: users cannot create a subgroup or project with a visibility level higher than the immediate parent group, and a private group can contain only private subgroups and projects. At the project level, many individual features can also be set independently to disabled/private/enabled/public (for example, forks, issues, merge requests, registry, releases, and repository visibility knobs).[^26]

| Visibility / control | Operational meaning | Where it matters most | Sources |
| --- | --- | --- | --- |
| Private | Only members can access the project/group | Default for internal company work and regulated repos |[^27] |
| Internal | Any authenticated user except external users can access | Useful on self-managed intranets; not available for new GitLab.com resources |[^28] |
| Public | Anonymous access allowed | OSS and public docs/examples |[^27] |
| Project feature visibility | Per-feature control over issues, MRs, forks, repository, releases, etc. | Fine-grained hardening inside a project |[^29] |
| Prevent forking outside top-level group | Stops new forks from leaving the hierarchy | Strongly recommended for internal codebases unless broad external collaboration is expected |[^30] |
| Prevent sharing outside hierarchy | Stops projects/subgroups from inviting groups outside the top-level namespace | Important when you want clean, bounded access models |[^31] |
| Membership lock | Prevents adding new users directly to projects in a group | Useful during audits or where project-level invites must be blocked |[^30] |
| Email-domain allowlist | Restricts membership by primary email domain across a top-level namespace and inherited subgroups | Useful for enterprise perimeter control, but not a full guarantee against historical or shared-access exceptions |[^32] |

One subtle but important point: project sharing and group sharing behave differently. When you invite a group to a project, access can reach direct members, inherited members, and even members from groups shared with the invited group; each user keeps the lower of their invited-group role and the maximum role granted at the project. When you invite a group to another group, only the direct members of the invited group get access. This is why project sharing is powerful for cross-functional collaboration but also a frequent source of access sprawl.[^31]

## Structuring organizations that scale

GitLab’s own recent hierarchy guidance maps the structure to Agile layers: project level for day-to-day team work, subgroup level for "team of teams" coordination, and group level for broader strategic and policy alignment. GitLab also recommends different patterns depending on whether access is granted broadly through organizational subgroups or individually at whatever level is needed. That leads to a clear design principle: structure your GitLab tree around stable organizational and permission boundaries, not around every temporary initiative or workflow variation.[^33]

The most defensible default pattern is:

- Use one top-level group per company, business unit, or major trust boundary. GitLab’s self-managed docs explicitly recommend one top-level group if you want an organization-wide view for security, compliance, and analytics.[^34]

- Use subgroups for durable boundaries such as departments, value streams, portfolios, or restricted domains. GitLab’s own examples position subgroups as the right place for granular permissions and cross-project coordination.[^35]

- Use projects as the ownership and delivery unit. Repos, merge requests, pipelines, packages, and repo-specific controls live there.[^29]

- Put reusable assets high enough to cascade cleanly: group labels, group milestones, custom project templates, CI/CD components, and security policy projects. Group labels and milestones are explicitly reusable across the group and its projects or subgroups.[^36]

- If you manage many users, consider separating access-management groups from project-organizing groups, then sharing them in carefully where needed. GitLab’s sharing docs explicitly recommend this pattern for larger user populations.[^31]

- Prefer a shallower tree. GitLab allows 20 nested subgroup levels, but very large hierarchies trigger special internal optimizations and require more careful backend batching, which is a strong operational signal not to over-nest.[^4]

| Organization size | Recommended hierarchy | Why it works | Main watch-outs | Sources |
| --- | --- | --- | --- | --- |
| Small team | One top-level group with projects directly underneath; optionally one small templates or shared subgroup | Low admin overhead, easy direct membership, simple reporting | Do not create subgroups unless they reflect real access boundaries |[^37] |
| Medium organization | One top-level group, department/product subgroups, plus a platform or shared-services subgroup for components/templates | Clear ownership boundaries and reusable standards without deep nesting | Avoid adding everyone to the parent group if subteams need different access |[^38] |
| Large enterprise | One enterprise root group, major department/value-stream subgroups, dedicated security/compliance and platform subgroups, optionally separate access groups for users | Centralized policy, org-wide visibility, cleaner role management, better separation of duties | Parent-group membership can easily overgrant; shared projects/groups need tight governance |[^39] |

For a cross-functional project, my recommendation is usually one of two patterns, depending on whether the initiative is temporary or persistent. If the collaboration is temporary, keep repos in their owning team subgroups and share a project or invite carefully-scoped groups to avoid namespace churn. If the collaboration is persistent and needs shared backlog/reporting/policy at a stable boundary, create a dedicated program or product subgroup and let its projects become the shared home. This recommendation is an inference from GitLab’s documented behavior for group/project sharing, inheritance, and its hierarchy best-practice blog, rather than a single GitLab "must use this model" rule.[^40]

These example diagrams are templates, not mandated GitLab patterns.

A small team normally does well with the simplest possible structure.[^37]

|  |
| --- |

A medium organization benefits from department or product subgroups plus one shared platform area.[^41]

|  |
| --- |

A large enterprise usually needs a root group for policy and visibility, separate durable domains, and explicit homes for governance assets.[^42]

|  |
| --- |

## Migration and refactoring strategies

GitLab offers four main reorganization tools, and choosing the right one is the difference between a clean refactor and a messy partial migration.

| Method | Best for | What it preserves well | Important caveats | Sources |
| --- | --- | --- | --- | --- |
| Project transfer | Moving one project within the same GitLab instance | Issues, merge requests, issue threads, pipelines and CI/CD config, dashboards, wikis, repo history, project access tokens, direct members, invitations | Archived or pending-deletion projects cannot transfer; package and endpoint changes may require repair work |[^43] |
| Group transfer | Moving a subgroup/top-level group within the same GitLab instance | All subgroups and projects, explicit group memberships/roles, group settings/configuration | Inherited memberships are lost; visibility may be reduced to match destination; repo URLs change; package restrictions apply |[^44] |
| Direct transfer migration | Copying groups/projects across instances or into new namespace layouts; GitLab recommends this over file exports for most migrations | Broad group/project copy, many-group operations, cross-instance moves, GitLab.com destinations | It copies, not moves; do not modify source groups/projects after migration starts because changes may not be copied |[^45] |
| File export/import | Offline migrations, selective moves, environments where direct transfer is not feasible | Most project data, including repositories, issues, merge requests, comments | Export/import groups first to preserve relationships; project CI/CD variables may need separate API handling |[^46] |

If the move is within the same instance, prefer a transfer over export/import. GitLab says transfer is faster and more complete for same-instance moves. For cross-instance moves, GitLab recommends direct transfer first and file exports second.[^47]

Here is the safest migration/refactor sequence.

|  |
| --- |

Several migration details deserve special attention.

A same-instance project transfer is surprisingly complete: GitLab explicitly lists issues, merge requests, CI/CD pipelines/configuration, dashboards, wikis, code/history, project access tokens, direct members, and pending invitations among transferred data. That makes project transfer the cleanest way to refactor ownership without losing collaboration history.[^48]

A group transfer is also comprehensive, but it is not semantically lossless. GitLab explicitly warns that inherited memberships are lost during transfer, only direct group members are transferred, and visibility may be reduced to match a more restrictive destination parent. In other words, group transfer preserves content well but can change who can see it and how they inherit access.[^49]

For renames and path changes, GitLab supports redirects for namespaces and the projects underneath them. Git remotes continue to redirect after a rename, and automation can continue to work, but only until somebody else claims the old path. GitLab’s own group-management docs therefore recommend that if you need to keep control over the old path and preserve redirects, it is often safer to create a new group and transfer projects into it than to just rename the existing group path.[^50]

For relationships and CI/CD, export/import is where people often get surprised. GitLab explicitly advises exporting/importing groups first so project imports can preserve group-level relationships such as links between project issues and group epics. It also separately notes that after project import/export you may need the project-level CI/CD variables API to preserve project variables.[^51]

For blockers, watch packages and state. Projects or groups can fail transfers because of package naming/endpoint constraints, especially around npm package rules when root namespace changes. Archived projects/groups also cannot be transferred, and on GitLab.com a subscribed top-level group cannot simply be transferred until the subscription is handled appropriately.[^52]

## GitLab.com, self-managed, CI/CD, and compliance differences

The underlying hierarchy model is shared across offerings, but the implementation surface is not.

| Topic | GitLab.com | Self-managed GitLab | Sources |
| --- | --- | --- | --- |
| Internal visibility | New groups/projects do not use Internal visibility | Internal visibility supported |[^53] |
| SAML SSO model | Top-level group SAML SSO | Instance-wide SAML SSO |[^54] |
| SCIM model | Group-level SCIM for top-level groups; adds/removes/reactivates users, but does not update users | SCIM user provisioning plus SCIM group synchronization when SAML group links are configured first |[^55] |
| Organization-wide admin controls | Namespace/group owners control what SaaS exposes to them | Full Admin area for instance-wide visibility defaults, project creation rules, deletion restrictions, mirroring policies, and more |[^56] |
| Free-tier topology limits | New Free-tier accounts after Jan. 27, 2026 are limited to three top-level groups | No equivalent SaaS namespace cap documented here |[^57] |
| Service account creation | Top-level group Owners can create service accounts | By default, administrators create them; can optionally allow top-level group Owners |[^58] |
| Instance audit events | Not tenant-admin exposed as an instance feature | Instance audit events available in Admin area |[^59] |
| Group migration controls | Direct transfer copy with groups/projects available by default on GitLab.com | Group-item migration may need administrator enablement |[^47] |

On the CI/CD side, hierarchy matters in three concrete ways.

First, runners. GitLab’s group runners are available to all projects in that group, and subgroups can use runners registered to parent groups. GitLab also documents that secrets configured for a parent group are available to subgroup jobs. This is powerful for shared build fleets and common credentials, but it is another inheritance surface that argues for disciplined parent-group scoping.[^60]

Second, variables. Group variables are available to all projects in the group, and variables from subgroups are recursively inherited. GitLab also provides a top-level group setting for the default minimum role allowed to use pipeline variables in newly created projects, which is useful for preventing casual misuse of manual pipeline variables.[^61]

Third, templates and reusable pipeline logic. GitLab supports multiple reuse mechanisms:

- Custom project templates for groups, implemented by pointing the group at a subgroup containing template projects.[^62]

- include / include:project for central YAML reuse, with GitLab explicitly recommending include:project over external HTTP fetches when possible.[^63]

- CI/CD components, which are versionable, catalog-publishable reusable pipeline units and are now generally available. GitLab’s docs recommend pinning component versions and reviewing third-party components carefully.[^64]

For compliance-oriented CI/CD, the modern direction is clear. Compliance frameworks can now enforce compliance pipeline configuration and security policies, but GitLab also states that compliance pipelines are deprecated and that pipeline execution policies should be used for all new implementations. Pipeline execution policies let security/compliance teams enforce CI/CD jobs across multiple projects from a single policy, and GitLab documents important caveats around job-name collisions, variable precedence, and the fact that policy configuration is stored as plaintext in Git, so sensitive secrets should not be embedded there.[^65]

On the audit/compliance/identity side, the key features are mature enough to design around, but they are not all equivalent.

Group and project audit events are available on paid tiers, but their search is limited, and API queries are constrained to 30-day windows. GitLab explicitly recommends streaming audit events to external destinations for more powerful searching and analysis. Top-level group audit streaming now supports HTTP destinations, Google Cloud Logging, and AWS S3, and supports filtering by event type and by group/project namespace. Self-managed also exposes instance audit events in the Admin area.[^66]

For identity management, GitLab.com’s model is top-level group SAML SSO plus SCIM. SAML is configured only on the top-level group, and SCIM synchronizes membership there; GitLab.com SCIM creates, removes/deactivates, and reactivates users, but GitLab says it does not support updating users. On self-managed, SAML SSO is instance-wide, while SAML Group Sync and SCIM group synchronization can be used to map IdP groups to GitLab groups. GitLab explicitly notes that SAML Group Sync is configured by default on GitLab.com but must be set up manually on self-managed, and that self-managed SCIM group synchronization requires SAML group links to be configured first.[^67]

## Common pitfalls, recommendations, and admin checklist

The most common failure mode in GitLab hierarchy design is not that the tree is "wrong" structurally; it is that the tree makes access semantics opaque.

| Pitfall | Why it hurts | Better approach | Sources |
| --- | --- | --- | --- |
| Adding large populations to a parent group "for convenience" | Inherited membership spreads farther than expected, and lower child roles cannot effectively reduce higher inherited access | Add people to the minimum number of groups needed; keep parent groups small and policy-focused |[^68] |
| Using subgroups for every repo, sprint, or short-lived initiative | Produces deep trees without durable value; descendant queries and large hierarchy operations get more complex | Keep subgroups for durable ownership/policy boundaries; use projects, labels, milestones, boards, and epics for work decomposition |[^69] |
| Treating project sharing as harmless | Shared projects can pull in direct, inherited, and other shared-group members depending on setup | Share only when needed, cap maximum roles carefully, and review all access sources periodically |[^31] |
| Assuming group transfer keeps inherited memberships intact | GitLab explicitly says inherited memberships are lost in group transfer | Rebuild/verify inherited access after transfer, especially in large trees |[^49] |
| Renaming namespace paths casually | Redirects work only while the old path is unclaimed | If preserving old-path control matters, create a new group and transfer projects instead of just renaming |[^50] |
| Using Minimal Access as if it were ordinary membership | Minimal Access does not grant project/subgroup access and has documented UX quirks | Use it intentionally as an SSO landing role, then grant explicit child access where appropriate |[^19] |
| Keeping compliance pipelines for new designs | GitLab says they are deprecated | Use pipeline execution policies for new compliance enforcement |[^70] |
| Forgetting that custom project templates copy a lot | Templates can copy issues, MRs, labels, milestones, and CI/CD config | Treat templates as curated starter projects, not arbitrary clone sources |[^71] |

My actionable recommendations for administrators are straightforward:

- Prefer one top-level group per true organizational or trust boundary. On self-managed, that also gives you the clearest security/compliance/analytics roll-up.[^34]

- Make subgroups match stable responsibility boundaries such as departments, product lines, value streams, or restricted domains.[^33]

- Treat projects as the primary ownership and delivery unit. A repo usually belongs in a project, not in its own bespoke subgroup.[^29]

- Use parent groups for standards: labels, milestones, templates, components, merge checks, and security policy projects.[^72]

- For large orgs, separate access groups from project groups and share with care.[^31]

- Lock down forking, sharing outside hierarchy, and manual project invites if you are minimizing access sprawl.[^73]

- For regulated environments, pair SAML/SCIM, audit event streaming, compliance frameworks, and pipeline execution policies.[^74]

- Keep the tree shallower than the hard limit, even though 20 levels are allowed. The fact that GitLab implements special large-hierarchy optimizations is a sign to avoid unnecessary depth.[^4]

An admin checklist that will prevent most hierarchy problems:

- [ ] Define the top-level group strategy first: one org root, or one root per trust/business boundary.[^75]

- [ ] Decide which boundaries justify a subgroup and which should stay as projects.[^76]

- [ ] Keep parent-group membership small; avoid "everyone belongs to root" unless that is truly intended.[^77]

- [ ] Put shared labels, milestones, templates, components, and policy projects in reusable higher-level homes.[^36]

- [ ] Set access controls deliberately: visibility, sharing restrictions, forking restrictions, domain allowlists, and membership lock where needed.[^78]

- [ ] For GitLab.com, design around group-level SAML/SCIM and the lack of new Internal visibility.[^79]

- [ ] For self-managed, use instance-wide admin settings to standardize project creation, visibility defaults, deletion protection, and mirroring policy.[^56]

- [ ] Before any reorg, inventory members, variables, runners, package endpoints, policy projects, integrations, and old URLs.[^80]

- [ ] For cross-instance migration, prefer direct transfer; for same-instance reparenting, prefer transfer; for offline/selective cases, use export/import.[^81]

- [ ] After any move, test remotes, permissions, pipelines, packages, and policy enforcement before declaring success.[^82]

## Open questions and limitations

This report reflects current official GitLab documentation and recent official GitLab blog guidance as of May 21, 2026, without assuming one pinned GitLab version. Some features in this report are tier- or offering-specific, and a few are recent enough that version notes matter—for example the newer Planner and Security Manager roles, the deprecation path from compliance pipelines to pipeline execution policies, and the newer self-managed SCIM group synchronization behavior. Where GitLab does not publish a simple end-user "performance limit" beyond the 20-level nesting cap, the recommendations here rely partly on GitLab’s official engineering documentation about large-hierarchy optimization and batching. In other words, the advice to keep trees shallow is operationally well-supported, but GitLab’s public docs do not give a single universal "safe descendant count" for every deployment.[^83]

[^1]: https://docs.gitlab.com/user/namespace/. <https://docs.gitlab.com/user/namespace>
[^2]: https://docs.gitlab.com/user/permissions/. <https://docs.gitlab.com/user/permissions>
[^3]: https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale/. <https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale>
[^4]: https://docs.gitlab.com/user/group/subgroups/. <https://docs.gitlab.com/user/group/subgroups>
[^5]: https://docs.gitlab.com/user/project/working_with_projects/. <https://docs.gitlab.com/user/project/working_with_projects>
[^6]: https://docs.gitlab.com/user/group/saml_sso/. <https://docs.gitlab.com/user/group/saml_sso>
[^7]: https://docs.gitlab.com/user/namespace/. <https://docs.gitlab.com/user/namespace>
[^8]: https://docs.gitlab.com/user/group/. <https://docs.gitlab.com/user/group>
[^9]: https://docs.gitlab.com/user/group/. <https://docs.gitlab.com/user/group>
[^10]: https://docs.gitlab.com/api/projects/. <https://docs.gitlab.com/api/projects>
[^11]: https://docs.gitlab.com/user/project/repository/forking_workflow/. <https://docs.gitlab.com/user/project/repository/forking_workflow>
[^12]: https://docs.gitlab.com/user/project/repository/mirror/. <https://docs.gitlab.com/user/project/repository/mirror>
[^13]: https://docs.gitlab.com/user/group/. <https://docs.gitlab.com/user/group>
[^14]: https://docs.gitlab.com/user/project/repository/forking_workflow/. <https://docs.gitlab.com/user/project/repository/forking_workflow>
[^15]: https://docs.gitlab.com/user/project/repository/forking_workflow/. <https://docs.gitlab.com/user/project/repository/forking_workflow>
[^16]: https://docs.gitlab.com/user/project/repository/forking_workflow/. <https://docs.gitlab.com/user/project/repository/forking_workflow>
[^17]: https://docs.gitlab.com/user/project/repository/forking_workflow/. <https://docs.gitlab.com/user/project/repository/forking_workflow>
[^18]: https://docs.gitlab.com/user/permissions/. <https://docs.gitlab.com/user/permissions>
[^19]: https://docs.gitlab.com/user/permissions/. <https://docs.gitlab.com/user/permissions>
[^20]: https://docs.gitlab.com/user/permissions/. <https://docs.gitlab.com/user/permissions>
[^21]: https://docs.gitlab.com/user/permissions/. <https://docs.gitlab.com/user/permissions>
[^22]: https://docs.gitlab.com/user/permissions/. <https://docs.gitlab.com/user/permissions>
[^23]: https://docs.gitlab.com/user/permissions/. <https://docs.gitlab.com/user/permissions>
[^24]: https://docs.gitlab.com/user/permissions/. <https://docs.gitlab.com/user/permissions>
[^25]: https://docs.gitlab.com/user/project/members/. <https://docs.gitlab.com/user/project/members>
[^26]: https://docs.gitlab.com/user/public_access/. <https://docs.gitlab.com/user/public_access>
[^27]: https://docs.gitlab.com/user/public_access/. <https://docs.gitlab.com/user/public_access>
[^28]: https://docs.gitlab.com/user/public_access/. <https://docs.gitlab.com/user/public_access>
[^29]: https://docs.gitlab.com/api/projects/. <https://docs.gitlab.com/api/projects>
[^30]: https://docs.gitlab.com/user/group/access_and_permissions/. <https://docs.gitlab.com/user/group/access_and_permissions>
[^31]: https://docs.gitlab.com/user/project/members/sharing_projects_groups/. <https://docs.gitlab.com/user/project/members/sharing_projects_groups>
[^32]: https://docs.gitlab.com/user/group/access_and_permissions/. <https://docs.gitlab.com/user/group/access_and_permissions>
[^33]: https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale/. <https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale>
[^34]: https://docs.gitlab.com/user/group/manage/. <https://docs.gitlab.com/user/group/manage>
[^35]: https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale/. <https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale>
[^36]: https://docs.gitlab.com/user/project/labels/. <https://docs.gitlab.com/user/project/labels>
[^37]: https://docs.gitlab.com/user/group/. <https://docs.gitlab.com/user/group>
[^38]: https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale/. <https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale>
[^39]: https://docs.gitlab.com/user/group/manage/. <https://docs.gitlab.com/user/group/manage>
[^40]: https://docs.gitlab.com/user/project/members/sharing_projects_groups/. <https://docs.gitlab.com/user/project/members/sharing_projects_groups>
[^41]: https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale/. <https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale>
[^42]: https://docs.gitlab.com/user/group/manage/. <https://docs.gitlab.com/user/group/manage>
[^43]: https://docs.gitlab.com/user/project/working_with_projects/. <https://docs.gitlab.com/user/project/working_with_projects>
[^44]: https://docs.gitlab.com/user/group/manage/. <https://docs.gitlab.com/user/group/manage>
[^45]: https://docs.gitlab.com/user/group/import/. <https://docs.gitlab.com/user/group/import>
[^46]: https://docs.gitlab.com/user/project/settings/import_export/. <https://docs.gitlab.com/user/project/settings/import_export>
[^47]: https://docs.gitlab.com/user/group/import/. <https://docs.gitlab.com/user/group/import>
[^48]: https://docs.gitlab.com/user/project/working_with_projects/. <https://docs.gitlab.com/user/project/working_with_projects>
[^49]: https://docs.gitlab.com/user/group/manage/. <https://docs.gitlab.com/user/group/manage>
[^50]: https://docs.gitlab.com/user/project/repository/. <https://docs.gitlab.com/user/project/repository>
[^51]: https://docs.gitlab.com/api/group_import_export/. <https://docs.gitlab.com/api/group_import_export>
[^52]: https://docs.gitlab.com/user/project/working_with_projects/. <https://docs.gitlab.com/user/project/working_with_projects>
[^53]: https://docs.gitlab.com/administration/settings/visibility_and_access_controls/. <https://docs.gitlab.com/administration/settings/visibility_and_access_controls>
[^54]: https://docs.gitlab.com/user/group/saml_sso/. <https://docs.gitlab.com/user/group/saml_sso>
[^55]: https://docs.gitlab.com/user/group/saml_sso/scim_setup/. <https://docs.gitlab.com/user/group/saml_sso/scim_setup>
[^56]: https://docs.gitlab.com/administration/settings/visibility_and_access_controls/. <https://docs.gitlab.com/administration/settings/visibility_and_access_controls>
[^57]: https://docs.gitlab.com/user/free_user_limit/. <https://docs.gitlab.com/user/free_user_limit>
[^58]: https://docs.gitlab.com/user/profile/service_accounts/. <https://docs.gitlab.com/user/profile/service_accounts>
[^59]: https://docs.gitlab.com/administration/compliance/audit_event_reports/. <https://docs.gitlab.com/administration/compliance/audit_event_reports>
[^60]: https://docs.gitlab.com/ci/runners/runners_scope/. <https://docs.gitlab.com/ci/runners/runners_scope>
[^61]: https://docs.gitlab.com/ci/variables/. <https://docs.gitlab.com/ci/variables>
[^62]: https://docs.gitlab.com/user/group/custom_project_templates/. <https://docs.gitlab.com/user/group/custom_project_templates>
[^63]: https://docs.gitlab.com/ci/yaml/includes/. <https://docs.gitlab.com/ci/yaml/includes>
[^64]: https://docs.gitlab.com/ci/components/. <https://docs.gitlab.com/ci/components>
[^65]: https://docs.gitlab.com/user/compliance/compliance_frameworks/. <https://docs.gitlab.com/user/compliance/compliance_frameworks>
[^66]: https://docs.gitlab.com/user/compliance/audit_events/. <https://docs.gitlab.com/user/compliance/audit_events>
[^67]: https://docs.gitlab.com/user/group/saml_sso/. <https://docs.gitlab.com/user/group/saml_sso>
[^68]: https://docs.gitlab.com/tutorials/manage_user/. <https://docs.gitlab.com/tutorials/manage_user>
[^69]: https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale/. <https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale>
[^70]: https://docs.gitlab.com/user/application_security/policies/pipeline_execution_policies/. <https://docs.gitlab.com/user/application_security/policies/pipeline_execution_policies>
[^71]: https://docs.gitlab.com/user/group/custom_project_templates/. <https://docs.gitlab.com/user/group/custom_project_templates>
[^72]: https://docs.gitlab.com/user/project/labels/. <https://docs.gitlab.com/user/project/labels>
[^73]: https://docs.gitlab.com/user/group/access_and_permissions/. <https://docs.gitlab.com/user/group/access_and_permissions>
[^74]: https://docs.gitlab.com/user/group/saml_sso/. <https://docs.gitlab.com/user/group/saml_sso>
[^75]: https://docs.gitlab.com/user/group/. <https://docs.gitlab.com/user/group>
[^76]: https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale/. <https://about.gitlab.com/blog/best-practices-to-set-up-organizational-hierarchies-that-scale>
[^77]: https://docs.gitlab.com/tutorials/manage_user/. <https://docs.gitlab.com/tutorials/manage_user>
[^78]: https://docs.gitlab.com/user/public_access/. <https://docs.gitlab.com/user/public_access>
[^79]: https://docs.gitlab.com/user/group/saml_sso/. <https://docs.gitlab.com/user/group/saml_sso>
[^80]: https://docs.gitlab.com/user/project/working_with_projects/. <https://docs.gitlab.com/user/project/working_with_projects>
[^81]: https://docs.gitlab.com/user/group/import/. <https://docs.gitlab.com/user/group/import>
[^82]: https://docs.gitlab.com/user/project/working_with_projects/. <https://docs.gitlab.com/user/project/working_with_projects>
[^83]: https://docs.gitlab.com/user/permissions/. <https://docs.gitlab.com/user/permissions>
