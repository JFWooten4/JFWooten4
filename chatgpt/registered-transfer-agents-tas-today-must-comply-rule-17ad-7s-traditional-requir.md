# Executive Summary

Registered transfer agents (TAs) today must comply with Rule 17Ad-7’s traditional requirements: storing duplicate records, maintaining indexes, ensuring security/integrity, and escrowing critical access information (media format, field formats, source code, etc.) with an independent agent.[^1] These rules were written for on-premises or vendor‐licensed systems, not modern cloud architectures. By contrast, broker‐dealer and SBSD recordkeeping rules (17a-4 and 18a-6) were recently amended (Nov. 2022) to add flexibility: either a WORM-preservation method or a detailed audit-trail alternative, plus new "Alternative Undertakings" allowing cloud providers to avoid literal source‐code escrow in favor of access commitments.[^2][^3] They also permit either a Designated Third Party (D3P) or a Designated Executive Officer (DEO) to make regulator-access undertakings.[^4][^3]

This report analyzes current TA rules (17Ad-7) and the 2022 broker-dealer/SBSD amendments, then proposes how 17Ad-7 could be similarly modernized for cloud deployments. We compare existing vs. proposed obligations (with tables), outline concrete rule-draft options (including model rule language), and suggest sample contractual/undertaking language for cloud vendors and recordkeepers. We discuss operational requirements (e.g. appointing a DEO or D3P, escrow content, auditing/testing), and outline transitional steps (e.g. no-action request, compliance timeline). By analogy to the SEC’s 2022 reforms[^5][^4] and AWS’s guidance,[^6][^2] we aim to preserve the core goal of TA rule 17Ad-7 (regulator access and record integrity) while accommodating cloud and encryption.

## 1. Current 17Ad-7 Recordkeeping Requirements and Purpose

Rule 17Ad-7 implements Section 17 of the Exchange Act for transfer agents. It requires TAs to retain the records specified in Rule 17Ad-6, with these key features (see eCFR text[^1][^7][^8][^9]):

- Accessibility & Indexing: TAs must create and preserve an accurate index of all records stored on electronic media,[^10] and keep duplicate copies of all indexed records and indexes.[^11] Records must be immediately producible in legible form for SEC/ARA examiners.[^12][^13]

- Integrity and Audit: Electronic storage must ensure record security, detect unauthorized changes, and allow recovery of damaged records.[^14] An audit trail accounting for every input and change must exist and be preserved for the retention period.[^15]

- Escrow of Access Tools (Rule 17Ad-7(f)(5)(ii)): If records are on electronic/micrographic media, TAs must "place, or have a third party place", with an independent escrow agent, an up-to-date copy of the physical and logical format of the media, field formats, source code, and any documentation needed to access the records.[^1] In short, escrow must include everything needed to reconstruct or read the records if the TA (or its vendor) cannot.

- Third-Party Undertaking (Rule 17Ad-7(f)(6)): If any third party maintains or preserves TA records on electronic media, that third party must file a written undertaking with the SEC/ARA.[^7] The undertaking obligates the third party to permit examination and to "promptly furnish" true, correct, complete, and current hard copies of any or all requested records or parts thereof.[^16] (Notably, this is a "Traditional" undertaking – in hard-copy form – unlike the newer "Alternative Undertaking" for cloud in the broker-dealer context.) Such third-party use does not relieve the TA of its own recordkeeping duties.[^17]

- Outside-Service Bureau Agreement (Rule 17Ad-7(g)): If an outside service bureau, recordkeeping service, or issuer maintains TA records, the TA must have a written agreement with that provider. The agreement must allow SEC/ARA examinations at any time and obligate the provider to furnish complete, correct, current hard copies of the records upon demand.[^8]

- Regulation S-P Documentation (Rule 17Ad-7(k)): TAs must retain certain regulatory-privacy documentation (under SEC Reg S-P) for at least 3 years.[^18][^19] In particular, any contract or agreement for protecting customer data (e.g. breach-notice vendor contracts) must be kept for 3 years after termination.[^19]

These provisions date back to the late 1990s and early 2000s (most recently modified 2003[^20]) and reflect paper-to-digital transitions. The purpose of Rule 17Ad-7 is to ensure that TA records (ownership records, canceled certificates, etc.) are accurate, recoverable, and accessible to regulators even if systems fail or TAs cease operations.[^21][^1] The escrow/undertaking requirements in (f)(5)(ii)–(6) specifically safeguard against the risk that a TA or its vendor becomes insolvent, uncooperative, or technologically inaccessible: the SEC (or a SIPA trustee) could still obtain the records and the means to read them.

## 2. Recent Broker-Dealer/SBSD Rule Changes (17a-4, 18a-6)

For comparison, the SEC’s 2022 amendments to Rules 17a-4 (for broker-dealers) and 18a-6 (for SBSDs) introduced several new concepts to modernize electronic recordkeeping:[^5][^4]

- Audit-Trail Alternative to WORM: The amended rules allow records to be preserved in either (A) a non-rewritable, non-erasable (WORM) format or (B) a comprehensive audit trail that would permit full reconstruction of any modified record.[^2][^22] This recognizes modern database logs vs. old tape cartridges.

- Backup System Redundancy: New Rule 17a-4(f)(3)(v) requires either a backup electronic recordkeeping system meeting the same WORM/audit requirements or other redundancy measures to ensure continuous access.[^22] The TA rule already requires "duplicates," but not necessarily on a live alternate system.

- Designated Third Party (D3P) vs. Designated Executive Officer (DEO): The previous requirement that broker-dealers use a D3P for undertakings remains an option, but now broker-dealers may instead assign a Designated Executive Officer (a senior manager) to make the regulator-access undertakings.[^4] A D3P is defined as an unaffiliated person "who has access to and the ability to provide records" from the electronic system.[^4] The DEO alternative allows an internal resource to fulfill that role.

- Electronic Production Format: Rule 17a-4(j) and 18a-6(g) now require that, upon request, records (and audit trails) preserved electronically be furnished in a reasonably usable electronic format in addition to human-readable form.

- Alternative Undertaking for Cloud: Crucially, the Commission adopted a new "Alternative Undertaking" in place of the traditional outside-recordkeeper undertaking (17a-4(i) and 18a-6(f)) for cloud providers.[^6][^5] Under this approach, a cloud or other third-party recordkeeper may file an undertaking acknowledging (1) the records are the BD’s property, (2) the BD has independent access to them, and (3) the provider will "facilitate within its ability, and not impede or prevent," examination, access, download or transfer of the records by regulators.[^5][^23] The provider thus does not promise to decrypt or hand over the data itself, but only not to block lawful access. AWS, for example, will file letters of undertaking under 17a-4(i)(1)(ii)(A) on behalf of broker-dealers, but explicitly does not act as a D3P or escrow agent.[^6]

Taken together, these BD/SBSD changes were intended to make the rules technology-neutral and cloud-friendly.[^24][^5] They do not apply to transfer agents. Table 1 (below) and the sections that follow compare the "before" (current TA rule) vs. BD analogues.

## 3. Key Differences: 17Ad-7 vs. 17a-4/18a-6

The TA rules (17Ad-7) differ from the modernized BD rules in several respects:

- Escrow of Software/Source Code: Current TA rule 17Ad-7(f)(5)(ii) requires literal escrow of any proprietary software and media format (including source code) needed to read records.[^1] BD rules impose no such escrow obligation when using a cloud provider. Instead, BD rules rely on the Alternative Undertaking.[^5] In short, TA rules assume the TA (or its vendor) holds and could escrow code, whereas BD rules recognize cloud providers typically cannot furnish their code.

- Designation of Access Agent: TA rules do not provide for a designated internal officer; they effectively assume the TA firm or its vendor will produce records. In BD rules, a broker-dealer may now choose either a D3P or an internal DEO to guarantee record access.[^4] In practice, small broker-dealers can assign a compliance or IT manager as DEO. No analogous "DEO" concept exists in 17Ad-7; introducing one could similarly reduce reliance on external parties.

- Audit Trail vs. WORM: The revised BD rules explicitly allow an audit-trail alternative to WORM-preservation.[^2] The TA rule has no such alternative; it effectively requires either WORM or a similar unalterable process (through controls and audit logs) to "assure authenticity".[^14] TAs wishing to use dynamic databases must rely on meeting the existing audit/logging rules, but these are not codified as an "alternative standard" in the way 17a-4 now does.

- Backup/Redundancy: 17Ad-7(f)(2)(v) already mandates maintaining duplicates of records and index,[^11] but does not require a live alternate system. The new broker-dealer rule 17a-4(f)(3)(v) requires either an alternate recordkeeping system or "other redundancy".[^22] In practice, cloud‐based TAs should likewise replicate data across regions or systems for resilience, even though the TA rule doesn’t specify it.

- Outside-Recordkeeper Undertaking: Both TA and BD rules historically require an undertaking if an outside service keeps the records. Under 17Ad-7(f)(6), a third-party recordkeeper must file a "traditional" undertaking to furnish hard copies.[^16] Under the new 17a-4(i) and 18a-6(f), a cloud provider can instead submit the Alternative Undertaking described above.[^5] Thus, BD rules have a tailored, cloud-specific mechanism for third-party providers that TA rules lack.

- Material Accessibility: The BD amendments require all records and audit trails be producible in a reasonably usable electronic format on request. The TA rule (17Ad-7) does not explicitly say this, but the spirit of (f)(6) suggests hard copies only. Clarification might be needed to ensure TAs produce electronic data natively, not just printed images.

Table 1 summarizes these points, and Table 2 (below) compares vendor roles and undertakings under current vs. proposed schemes.

## 4. Technical Realities of Cloud Recordkeeping

Cloud environments introduce new considerations:

- Customer-Controlled Encryption: TAs increasingly use cloud storage (e.g. AWS S3, Azure Blob) with data encrypted by customer-managed keys (AWS KMS, etc.). By design, the cloud provider cannot decrypt or read the records without customer permission. Under these conditions, the provider cannot honestly sign a "traditional undertaking" promising to deliver plaintext records on demand.[^24] This was a key motivator for the SEC’s Alternative Undertaking: recognizing that "the cloud service provider can block [access]" at the infrastructure layer unless it cooperates.[^24] An Alternative Undertaking acknowledges this model: the regulated firm retains control and keys, and the provider merely agrees not to impede lawful access.

- WORM vs. Object Lock: Many cloud storage services (AWS S3, Azure Blob, etc.) now offer WORM-like features (e.g. S3 Object Lock, S3 Glacier Vault Lock, FSx SnapLock) that satisfy a "non-erasable, non-rewritable" requirement.[^2] For example, AWS S3 Object Lock in Compliance mode prevents object deletion or overwrite for a set retention period.[^2] The 2022 SEC rule explicitly noted these technologies can meet the traditional WORM requirement (though it also allowed an audit option).[^2] Transfer agents could adopt the same: e.g. use S3 Object Lock or Azure Immutable Blobs for archival data to demonstrate immutability.

- Audit Trails and Logs: Even with WORM, modern systems should log every data modification. Cloud services provide audit logs (AWS CloudTrail, database transaction logs, etc.) capturing all API calls and record changes. Rule 17Ad-7 already requires an audit system for record changes.[^15] In practice, a TA using a cloud DB would ensure its logs and backup snapshots meet retention. Under a proposed audit-trail alternative, the TA would need to configure continuous logging and demonstrate that any record change can be reconstructed, similar to the 17a-4(e)(3)(v) requirements for BDs.[^25]

- Export and Format: Cloud platforms allow bulk export of data (AWS Snowball, data sync, DB dump, etc.). A TA should maintain procedures (scripts, workflows) to export records in human-readable and electronic form. These procedures themselves (e.g. ETL scripts, database schema docs) may need to be kept in escrow or escrow-equivalent documentation (see below).

- Provider Limitations: As noted, a cloud provider can technically block access by revoking API keys or throttling, unless contractually restricted. The AWS guidance states that broker-dealers "must have the cloud provider execute the Traditional Undertaking," but since cloud providers typically cannot commit to decrypt, the Commission instead created the Alternative Undertaking.[^24] Transfer agents face the same issue: an AWS or other provider can control physical servers (e.g. freeze an account), so any solution must legally or contractually bind them to obey the TA’s requests.

In sum, cloud recordkeeping is entirely feasible (indeed, common), but compliance requires (a) using WORM or audit features to meet preservation requirements, (b) documenting system schemas and export processes, and (c) ensuring vendors agree to cooperative access. AWS’s SEC-focused documentation highlights these points.[^2][^26]

## 5. Mapping Broker-Dealer Amendments to Transfer Agents (Gaps & Analogies)

Using the broker-dealer reforms as a model, we identify the following analogues and gaps for Rule 17Ad-7:

- Alternative Undertaking for Cloud Providers: Current TA Rule: No provision for an alternative undertaking; it only knows a "traditional" undertaking requiring hard-copy delivery.[^16] BD Analogue: The Alternative Undertaking (Rule 17a-4(i) as amended) lets a cloud provider acknowledge TA ownership and independent access.[^5] Proposal: Add a similar provision in 17Ad-7. For example, a new paragraph 17Ad-7(f)(5)(iii) could allow that if TA records are on third-party infrastructure (e.g. a CSP), then instead of escrowing source code, the CSP may file an Alternative Undertaking: "This third party acknowledges that [TA]’s records are its property, that [TA] has independent access, and that the third party will facilitate (and not impede) SEC/ARA examination, access, download, or transfer of the records, providing them in human-readable and electronic form as requested".[^5][^23] This mirrors the SEC’s language for broker-dealers.

- Audit-Trail Alternative: Current TA Rule: Implicitly expects some immutability ("controls" to assure authenticity[^14]) but no explicit audit-alternative. BD Analogue: Permit audit logs + test data reconstruction instead of physical WORM.[^27] Proposal: Amend 17Ad-7(f) to explicitly allow an audit-trail system as an alternative to WORM or escrow. For instance, similar to 17a-4(f)(3)(iv)–(v), require an audit trail capturing all changes and an ability to recreate originals. The TA could preserve transaction logs and digital hashes to meet this.

- Designated Officer/Third Party: Current TA Rule: No role like "Designated Third Party" or "Designated Officer" is mentioned. BD Analogue: 17a-4(f)(3)(v)(A) defines "Designated Third Party"[^4] and allows a DEO as alternative. Proposal: Amend 17Ad-7 to permit a TA to designate (in writing) an unaffiliated third party or a senior executive to make the required undertakings (e.g. the Alternative Undertaking above). A new rule text could mirror 17a-4’s format, defining the term "Designated Third Party" for TAs and allowing a "Designated Transfer Agent Officer." This would let a TA rely on an internal compliance officer instead of hiring an external D3P.

- Escrow Package Content: Current TA Rule: Requires escrow of everything needed to read records (which assumes the TA has it).[^1] Gap: Cloud providers won’t hand over their proprietary database engines or encryption modules. Proposal: Clarify that escrow covers only the TA’s own data formats and access tools. For example, allow escrow of data schemas, field layouts, export scripts, and decryption keys (if applicable), but not the provider’s server code. In practice, TA could escrow a "records-access package" (see Compliance section) with all TA-controlled artifacts. The remainder (infrastructure, OS, etc.) can be covered by the Alternative Undertaking clause.

- Outside Service Bureau Agreements: Current TA Rule: 17Ad-7(g) already requires a written contract with any service bureau, allowing SEC exam and production.[^8] BD Analogue: 17a-4(i) (old rule) similarly required an undertaking. Proposal: Maintain (g) as-is, but ensure it explicitly references modern cloud storage. For instance, explicitly include in (g)(2) that the provider will furnish digital copies via electronic means if feasible, not only hard copy.

- Reg S-P Compliance: Current TA Rule: 17Ad-7(k) requires retaining breach-notice contracts and policies for 3 years.[^19] BD Analogue: Broker-dealers have their own Reg S-P retention, but it is similar. Proposal: Reinforce (k) by noting that cloud vendors often act as data processors under Reg S-P, so the TA should treat those agreements as S-P contracts subject to (k)(5).[^19]

In summary, nearly all elements of the BD reforms have TA counterparts or analogues (see Table 1). The main "gaps" in TA rules are the lack of (1) a cloud-tailored undertaking option and (2) an official audit-trail alternative. The proposals below give multiple ways to address these gaps, from targeted new paragraphs in 17Ad-7 to model clauses for vendor agreements.

## 6. Proposed Amendments and Alternative Undertakings

We outline several concrete amendment options and model language. These are illustrative; any final text would be subject to SEC rulemaking.

A. Amend Rule 17Ad-7(f)(5) (Escrow Exception / Alternative Undertaking). Add a new subparagraph, for example:

"(iii) Alternative to source-code escrow: If any required records are maintained on servers or storage owned/operated by a third party (e.g. a cloud service provider), then instead of physically escrowing the third party’s software, the third party may satisfy the escrow requirement by filing an Alternative Undertaking with the Commission. In that undertaking the third party must: (1) acknowledge that all records and indexes are the property of the transfer agent and subject to Rule 17Ad-7; (2) affirm that the transfer agent has independent access (without need for third-party intervention) to the records stored; (3) consent to fulfilling all obligations set forth below; and (4) undertake to facilitate, and not impede or prevent, any examination, access, download, or transfer of the records by the SEC (or its designees) under the law, including providing the records in a human-readable format and a reasonably usable electronic format upon request. The undertaking may also state that in a SIPA liquidation of the transfer agent, the third party will likewise assist a trustee in accessing and transferring the records."

This language mirrors the SEC’s Alternative Undertaking for broker-dealers[^5] but tailored to 17Ad-7. Key points: the third party is not promising to decrypt or deliver the data itself as plaintext. Rather, it agrees not to block lawful access or deletion locks, and it acknowledges the TA’s ownership and right to access.

B. Amend Rule 17Ad-7(f)(6) (Third-Party Maintenance Undertaking). The current rule already requires a third party to permit exam and furnish hard copies.[^16] To modernize, one could add optional language similar to the cloud undertaking: for example, add "(i)(A)" and "(i)(B)" subparts allowing an Alternative Undertaking if the records are maintained electronically. E.g.:

"(i)(B) If the records maintained on behalf of [TA] by a third party are stored in an electronic format on third-party infrastructure, [Name of Third Party] may, in lieu of the hard-copy undertaking, file an Alternative Undertaking (as described in paragraph (f)(5)(iii) above) acknowledging [TA]’s ownership and facilitating regulator access."

This would parallel 17Ad-7(g)’s outside agreement — essentially letting a cloud recordkeeper adopt the same alternative as a cloud provider in 17a-4(i).

C. Introduce Designated Officer Concept. Optionally, amend 17Ad-7 to allow TAs to designate an internal officer to handle access obligations. For example, insert:

"(m) Designated Access Officer. Every registered transfer agent using electronic records shall designate an executive officer (and may designate up to two written alternates) who has the authority and ability to access and provide the required records and indexes on request. This officer may rely on designated staff or specialists reporting to the officer to retrieve or download the records. In the event the transfer agent fails to provide records to the SEC or ARA, the Commission may treat this designated officer (or alternate) as the person responsible for furnishing the records, in the same manner as a "Designated Third Party" under Rule 17a-4(f)(3)(v)(A)."

This would be a novel insertion into 17Ad-7, but it follows the 17a-4 model of letting a senior manager stand in for an outside custodian. It could eliminate the need for a TA to hire an unaffiliated D3P.

D. Model Alternative Undertaking (Cloud Service Provider). Based on the above, a cloud vendor’s undertaking might read:

Example Cloud Undertaking: "With respect to any electronic books and records of [TA] stored on behalf of [TA] by [Vendor], [Vendor] hereby acknowledges that: (1) [TA] is subject to all provisions of SEC Rule 17Ad-7 governing these records; (2) [TA] has independent access to the records maintained on [Vendor]’s system, without any required intervention by [Vendor]; and (3) [TA] consents to [Vendor] fulfilling the obligations in this undertaking. [Vendor] agrees to facilitate, within its ability, and not to impede or prevent, the examination, access, download, or transfer of [TA]’s records by the SEC or its designees as permitted under the law. [Vendor] will furnish copies of the records in a reasonably usable electronic format (and human-readable format) upon lawful request, subject only to normal authentication. In the event of a liquidation under SIPA (if applicable to [TA]), [Vendor] will likewise assist any trustee in accessing or transferring the records as permitted by law."

This is analogous to the template in the BD final rule.[^5] It requires the cloud provider to not impede (e.g. not block API access, decrypt on demand, or restrict copies) but does not require the provider to produce proprietary system code.

E. Model Undertaking for Third-Party Recordkeepers. If a non-cloud vendor (e.g. a traditional service bureau) holds records, an updated undertaking could combine the old and new approaches:

"With respect to any books and records of [TA] maintained or preserved on behalf of [TA] by [Third Party], [Third Party] hereby undertakes to: (i) permit examination of such books and records at any time by representatives or designees of the Commission; and (ii) promptly furnish to the Commission true, correct, complete, and current copies of any or all such books and records upon request. If any such records are stored in an electronic format on third-party infrastructure, [Third Party] may satisfy its obligations by an Alternative Undertaking consistent with paragraph (f)(5)(iii), which shall be filed with the Commission."

This uses the traditional language (from current 17Ad-7(f)(6)[^16]) and adds a clause allowing the cloud-style undertaking as an option if the vendor’s system is like a cloud.

F. Model Contract Clause (Outside Service Bureau/Cloud). We also suggest TA service contracts include language echoing the SEC’s access conditions. For example, under 17Ad-7(g) the written agreement could state:

"The service provider acknowledges that all records are the TA’s property subject to SEC and regulatory authority. The provider will maintain and produce all such records in human-readable form and/or electronic format upon demand by the SEC or appropriate regulatory agency. The provider agrees not to block the TA’s or regulators’ access to the records, and to comply with any Alternative or Traditional Undertaking previously filed with the SEC."

This helps ensure that cloud or outsourcing agreements legally bind the vendor to cooperate with audits and data exports.

## 7. Compliance and Operational Considerations

If the above changes were implemented (whether by rule or practice), TAs and vendors would need to operationalize them. Key steps include:

- Designated Responsible Person: The TA should designate a senior compliance or IT officer (a "Designated Executive Officer" or "Records Officer") to oversee electronic recordkeeping and regulatory access. This person will ensure all record repositories are documented and current. The DEO must know where each class of required records resides, how to export or restore them, and who (internal staff or external vendor) has the actual technical access. In flat or small organizations, the owner, CIO, or compliance chief can fill this role. At least one or two backup officers should be named (akin to 17a-4’s allowance of two designates[^28]). These officers will coordinate with regulators during exams or inquiries.

- Escrow ("Records-Access Package"): The TA should assemble a comprehensive escrow of all TA-controlled materials needed for access. This package, held by an independent escrow agent or custodian, might include:

- System inventory and architecture diagrams (mapping record categories to software/storage locations).

- Data dictionaries, schema definitions, field and file formats for all record types.

- Database schemas, table structures, index definitions, and any custom data definitions.

- Any source code or scripts that the TA controls, such as data export or report-generation programs. (Cloud provider code need not be included.)

- Instructions or scripts for performing data exports (e.g. SQL dump procedures, API calls) and rebuilds.

- Documentation of file formats (e.g. XML/JSON schemas, CSV layouts) used by the TA’s systems.

- The TA’s own application code (if any) and version logs for the recordkeeping system.

- Access-control and identity management procedures, including how to obtain or reset credentials to each system.

- Key management and recovery procedures for any encryption (e.g. how to retrieve backup copies of decryption keys, with proper custody safeguards).

- Backup and recovery procedure manuals (e.g. how to restore from disaster recovery images).

- Audit-log retention procedures and descriptions (how audit trails are stored and can be queried).

- A list of responsible persons (with contact info) for each record repository or system.

- A regulator-production playbook, documenting step-by-step how to comply with a records request (who to call, what steps to perform, etc.).

This list is inspired by the draft no-action letter above. Importantly, it does not include the cloud vendor’s proprietary code or hypervisor details (which the TA cannot obtain). Instead, the escrow plus a cloud Alternative Undertaking should cover the provider’s side. The TA must update this escrow whenever systems change (software upgrades, schema changes, migrations). Upon a regulator’s request, the TA or escrow agent would furnish these materials (and possibly an environment) so the SEC can read the archived records.

- Testing and Audits: Regularly test the recordkeeping system to ensure data can be exported and reconstructed. For example, schedule periodic exercises where a sample of old records is retrieved from backup or archive and converted to paper or a common format (mimicking an SEC request). Audit the audit trails themselves to ensure they are capturing changes correctly. These drills also verify that the DEO and designated specialists know how to execute record retrieval procedures. Document the results of each test as part of an ongoing compliance file.

- Third-Party Undertakings: If any vendor maintains records (e.g. a data center, cloud provider, or software-as-a-service), the TA must ensure the vendor has executed the appropriate undertaking. For traditional vendors, that means the written undertaking under 17Ad-7(f)(6) (as above). For cloud providers, the TA would have secured the Alternative Undertaking (as in Section 6.D) via contract addendum or AWS Artifact (if available). The TA should file or furnish copies of these undertakings to regulators or examiners as needed.

- Reg S-P Contracts (17Ad-7(k)): TAs must keep copies of any contracts entered pursuant to Reg S-P (§248.30(a)(5)) for at least 3 years.[^19] In cloud context, the cloud services agreement and any encryption/SLA documents may count. Maintain a file of these contracts, plus any documented policies and breach-notice communications, as required by 17Ad-7(k).

- Configuration Controls: Use cloud features to enforce compliance. For instance, turn on AWS S3 Object Lock in Compliance mode for relevant buckets, or enable immutable storage in Azure/AWS backups. Monitor the configuration so that retention settings cannot be shortened without proper authorization. Log all changes to policies (e.g. AWS Config rules, Azure Policy) and keep those logs in escrow.

- Vendor Contracts: In contracting with cloud or recordkeeping providers, include SEC-specific clauses. For example, mirror the Alternative Undertaking commitments in the agreement so the provider is contractually bound to honor SEC data requests. Clause examples: "[Vendor] agrees that if [TA]’s electronic records are examined by the SEC or other regulators, [Vendor] will comply with lawful requests and not impede access, as described in Rule 17Ad-7 undertakings."

- Encryption Key Handling: If data is encrypted, ensure there is a documented key escrow or multi-party control scheme so that decryption keys can be obtained if needed (without violating SEC rules). The procedures for key retrieval should be included in the escrow package.

- Duplicate Records and Redundancy: Maintain duplicate record copies as required.[^11] Ideally store these in a separate system or region. Even if not explicitly mandated as a separate system, doing so (as BDs are now required) reduces risk.

- Regulatory Notifications: Keep evidence of regulatory interactions (e.g. exam requests, production letters) and the actual responses, as part of the compliance documentation.

Taken together, these measures (DEO appointment, escrow package, audits, undertakings, contracts) ensure that whether records live on AWS, on-premises, or anywhere, the SEC/ARA can access them in compliance with 17Ad-7. The key is documenting every element of access, since the old rule otherwise assumes the TA has a physical "repository" to open.

## 8. Enforcement Considerations and Transition

If a transfer agent were to move records to the cloud without modifying its practices, strict reading of Rule 17Ad-7 could expose it to enforcement: for example, failing to escrow required software or source code (because the TA doesn’t possess it) would violate (f)(5)(ii). However, given the SEC’s recent accommodation of cloud providers for broker-dealers,[^24][^5] SEC staff likely would be open to analogous arrangements for TAs. Indeed, one could seek a no-action letter under Rule 17Ad-7(f)(5)(ii), showing that the TA’s alternative controls (escrow of documentation + provider undertaking) meet the rule’s objective of regulator access. The draft in Section 9 below illustrates such a request.

Transition: Any formal rule amendment would likely include a compliance date in the future (e.g. 6–12 months after publication). TAs should proactively update their systems and contracts, so that by the effective date they can demonstrate compliance via the new framework. This might involve: signing new vendor agreements (AWS Artifact or others) to secure undertakings, updating internal policies, and assembling the escrow package.

In the absence of a rule change, TAs can still implement many of these steps voluntarily (cloud contracts, internal documentation, encryption/WORM configs) to strengthen their recordkeeping. They should also engage with regulators early – for example, requesting guidance or no-action relief – to clarify that these modern measures are acceptable substitutes for literal code escrow. As with the 2022 broker-dealer amendments, the SEC seems motivated to permit technology-neutral compliance paths,[^24][^5] so documenting an equivalent alternate approach is key.

Risk Analysis: Until explicitly permitted, some risk remains. A strict examiner could demand the escrowed materials per the letter of 17Ad-7(f)(5)(ii). Conversely, with a strong alternative framework (detailed in Sections 6–7) and SEC precedent for accommodation,[^24][^6] that risk is mitigated. Ultimately, a formal rule amendment or no-action letter would provide certainty. In the meantime, careful internal controls and documentation are the best protection.

## 9. Sample No-Action Request and Model Clauses

As a practical tool, a TA moving records to the cloud might ask the SEC staff in writing for assurance that its alternative compliance plan satisfies Rule 17Ad-7(f)(5)(ii). A sample approach (not exhaustive) is:

Example No-Action Outline: "We request that the staff agree not to recommend enforcement under Rule 17Ad-7(f)(5)(ii) with respect to [TA]’s cloud-hosted records, provided [TA] (1) retains all required records for the full retention period, (2) maintains access controls and audit logs that meet or exceed the security/integrity standards of Rule 17Ad-7(f), (3) establishes an independent escrow of system documentation (schemas, formats, export instructions, etc.), and (4) obtains from its cloud provider a contractual undertaking (the ‘Alternative Undertaking’) acknowledging [TA]’s ownership and independent access and promising to facilitate regulator access and not impede production of the records in human-readable and electronic form. [TA] further will obtain any required third-party recordkeeper undertakings under Rule 17Ad-7(f)(6) and outside-bureau agreements under 17Ad-7(g), and will keep copies of its Reg S-P service agreements as required by 17Ad-7(k)."

This framing emphasizes that every core objective of 17Ad-7 is still met (retention, integrity, duplication, examiner access) by alternate means. The actual letter would cite the proposed rule provisions (if any) or analogize to 17a-4’s Alternative Undertaking conditions.[^5]

Model Undertaking – Cloud Provider: A TA might require its cloud vendor to sign an undertaking like:

"With respect to all books and records of [TA] maintained by [Vendor] on electronic media, [Vendor] hereby acknowledges that [TA] is subject to SEC Rule 17Ad-7 and that [TA] has independent access to the records. [Vendor] undertakes to facilitate within its ability, and not to impede or prevent, any examination, access, download, or transfer of these records by the SEC, its designees, or the appropriate regulatory agency, as permitted under the law. [Vendor] will promptly furnish the records (in human-readable and electronic formats) as requested by the SEC. In the event [TA] enters SIPA liquidation, [Vendor] agrees to similarly assist the trustee in accessing or transferring the records."

This is essentially the same as in Section 6.D above, and mirrors AWS’s published model (see AWS’s SEC 17a-4 FAQs[^6]).

Model Undertaking – Third-Party Recordkeeper: For a non-cloud vendor:

"With respect to any books and records of [TA] stored or preserved by [Vendor] on electronic media, [Vendor] hereby permits examination by SEC/ARA staff at any time and undertakes to furnish true, correct, complete, and current copies of any such records (or any part thereof) in response to requests. If [Vendor] uses cloud infrastructure to store these records, [Vendor] may satisfy this obligation by the Alternative Undertaking described above."

Model Contract Excerpt (Rule 17Ad-7(g) Agreement):

"Contractor acknowledges that all records on electronic or micrographic media prepared for [TA] are subject to examination by the SEC and [Appropriate Regulatory Agency] at any time. Contractor agrees to provide, upon demand, complete and accurate reproductions of such records (in digital or hard-copy form, as requested) at its principal place of business. Contractor further agrees to comply with any Alternative Undertaking on file with the SEC regarding these records."

By including such terms, the TA ensures its vendors are legally bound by the same rules that the TA itself must follow.

## 10. Comparative Tables

Table 1. Transfer Agent Recordkeeping: Current vs. Proposed vs. Broker-Dealer

| Aspect | Current Rule 17Ad-7 | Proposed/Modernized TA | Broker-Dealer Rule (17a-4/18a-6) |
| --- | --- | --- | --- |
| Data Formats & Preservation | Requires "non-rewriteable" controls, index, duplicate copies;[^29][^11] no explicit audit-alternative. | Add explicit audit-trail option; use cloud WORM features (e.g. S3 Object Lock[^2]) or logs. | WORM or full audit trail (sec. 17a-4(f)(3)(v)(i)–(iii)[^30]) |
| Index & Duplicates | Must index records and keep duplicate copies.[^11] | Maintain indexing and duplicates; may replicate across systems for redundancy. | Must index; separate duplicate storage;[^11] BD requires separate backup system (17a-4(f)(3)(v)(A)). |
| Escrow Requirements | Must escrow media format, field format, source code, and all access documentation.[^1] | Allow cloud provider to file Alternative Undertaking instead of code escrow.[^5] Escrow TA-owned docs only. | Escrow only if using micrographic media; cloud data covered by Alternative Undertaking (17a-4(i) alt).[^5] |
| Third-Party Undertaking | Third party maintaining records must file written undertaking to permit exam and furnish hard copies.[^16] | Permit cloud providers to file Alternative Undertaking (avoid plaintext promise); update wording for digital delivery. | Cloud provider may file Alternative Undertaking (amended 17a-4(i), 18a-6(f)). |
| Designated Officer/Agent | No specific provision for a DEO or D3P in 17Ad-7. | (Optional) Allow TA to designate an executive officer (and/or D3P) to fulfill undertakings. | Broker-dealers may use either a D3P (defined as non-affiliate with access[^4]) or a DEO. |
| Contractual Agreement | Outside recordkeepers/issuers require written agreement for SEC exam and hard-copy records.[^8] | Maintain this requirement; explicitly extend to digital copies (if possible). | 17a-4(i) required a traditional undertaking; now allow cloud alt. |
| Reg S-P Records (k) | Must retain S-P policies and breach-notice contracts for 3 years.[^19] | Same; treat cloud service agreement as S-P vendor contract. | Broker-dealers retain Reg S-P docs per 17a-3/3a; similar principles. |

Table 2. Vendor/Service Provider Roles & Obligations

| Role / Entity | Current TA Rule (17Ad-7) | Proposed TA Rule | Broker-Dealer Rule Analogue |
| --- | --- | --- | --- |
| TA (Securities Issuer) | Owner of records; subject to 17Ad-6/7; responsible for compliance. | Same, but may designate DEO to handle access duties. | Same responsibilities; may designate DEO. |
| Cloud Provider (CSP) | Implicit "third party" only via 17Ad-7(f)(6) – must file undertaking (hard-copy). | CSP executes Alternative Undertaking (no-code escrow) if TA’s records are on its servers.[^5] | CSP can file Alternative Undertaking under 17a-4(i)/18a-6(f).[^6] AWS clearly states it will file 17a-4(i) undertaking but not act as D3P.[^6] |
| Third-Party Recordkeeper | Must sign traditional undertaking permitting exam and paper copy.[^16] | Could sign either traditional or Alternative Undertaking if also a cloud provider. | Under 17a-4, a third-party recordkeeper files a traditional undertaking (or the Alternative if qualified). |
| Service Bureau / Issuer | Must agree in writing to SEC/ARA exam and furnish hard copies.[^8] | Same obligation; ensure contracts include digital delivery. | Similar requirement existed under 17a-4(i). Cloud bureaus align with Alternative Undertaking. |
| Designated 3rd Party (D3P) | Not used in TA rules. | Optionally, a TA could designate a non-affiliated D3P with access. | Defined in 17a-4(f)(3)(v)(A) as non-affiliate with access;[^4] may sign undertakings. |
| Designated Executive Officer (DEO) | No current concept. | Optionally, TA designates an officer (with reporting specialists) to provide records on demand. | New in 17a-4: senior officer can replace D3P to sign undertakings. |
| SEC/ARA (Regulators) | Examines TA records; relies on TA to have records/restoration. | Same, but may accept records delivered over cloud/API if rulemodernized. | Same examination powers; may compel production in digital format under updated rules. |

## 11. Illustrative Diagrams (Mermaid Code)

For clarity we include conceptual flowcharts (in Mermaid syntax) showing record production flows and an implementation timeline. These diagrams are not official graphics but outline the processes described above.

#### Figure 1: Records Production Flow (Conceptual)

```text
flowchart LR TA["Transfer Agent (TA)"] AWS["Cloud Storage/Provider"] D3P["Designated Third Party (if any)"] RegSEC["Regulators (SEC/ARA)"] TA -->|Stores records via API| AWS AWS -->|Independent access via APIs| TA TA -->|Produce data (PDF/CSV/EDI)| RegSEC D3P -->|Fallback download + deliver| RegSEC AWS -->|Alternative Undertaking: facilitate access| RegSEC
```

- Explanation: The TA’s records live on the cloud (AWS). The TA can retrieve them directly (with its keys). Regulators normally get records from the TA. If the TA fails (e.g. insolvency), a Designated Third Party (if appointed) could obtain the data from AWS and provide it to regulators. AWS (the provider) has an Alternative Undertaking assuring it will help regulators obtain the data (via networks or trustee) and not impede access.[^5][^24]

#### Figure 2: Hypothetical Implementation Timeline

|  |
| --- |

- Explanation: This Gantt-chart style timeline imagines a mid-2026 proposal, a one-year compliance period, and key tasks for the TA (policy update, documentation, contracts) to align with an assumed 1/1/2027 effective date.

## 12. Recommended Next Steps

For a transfer agent (or its vendor) considering these issues now:

- Assess Current Systems: Inventory all required record types and where they reside (cloud vs. local). Determine who controls the encryption keys and where indexes/audit logs live.

- Engage Counsel/Compliance: Consult with securities counsel experienced in SEC recordkeeping to evaluate how 17Ad-7 applies to cloud storage. Consider submitting an informational request or no-action letter similar to the sample above.

- Vendor Coordination: Work with cloud service and software vendors. For AWS, consider AWS Artifact and the 17a-4 addendum to get the Alternative Undertaking on file.[^6] If using other cloud/SaaS, negotiate equivalent undertakings.

- Documentation: Begin building the escrow package outlined above. Even before any rule change, having these docs and procedures in place will greatly facilitate future compliance.

- Internal Controls: Strengthen audit logging and backup/regeneration processes. For example, enable AWS CloudTrail, multi-region replication, and S3 Object Lock for critical buckets. Test record extraction.

- Monitor Rulemaking: Keep an eye on SEC rulemaking bulletins. If the SEC proposes amendments to 17Ad-7, submit comments. If not, consider advocating for modernizing guidance (perhaps through a trade group or FS-ISAC).

- Training: Train the designated records officers and specialists on the new processes and responsibilities (data export, dealing with SEC exam requests in a cloud context).

By proactively aligning with the spirit of 17a-4’s amendments,[^5][^4] a TA can reduce compliance risk and ensure that cloud-based systems meet SEC recordkeeping goals. The proposed language and models above provide a starting point for discussions with regulators and for drafting actual policies.

Sources: SEC rules and Federal Register (especially Rule 17Ad-7 and the 2022 17a-4/18a-6 Adopting Release[^5][^4]), SEC historical releases,[^21] and AWS compliance documentation.[^6][^2]

[^1]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^2]: SEC Rules 17a-4 and 18a-6 - Amazon Web Services (AWS). <https://aws.amazon.com/compliance/secrule17a-4f>
[^3]: Final Rule: Electronic Recordkeeping Requirements for Broker-Dealers, Security-Based Swap Dealers, and Major Security-Based Swap Participants. <https://www.sec.gov/files/rules/final/2022/34-96034.pdf>
[^4]: Final Rule: Electronic Recordkeeping Requirements for Broker-Dealers, Security-Based Swap Dealers, and Major Security-Based Swap Participants. <https://www.sec.gov/files/rules/final/2022/34-96034.pdf>
[^5]: Final Rule: Electronic Recordkeeping Requirements for Broker-Dealers, Security-Based Swap Dealers, and Major Security-Based Swap Participants. <https://www.sec.gov/files/rules/final/2022/34-96034.pdf>
[^6]: SEC Rules 17a-4 and 18a-6 - Amazon Web Services (AWS). <https://aws.amazon.com/compliance/secrule17a-4f>
[^7]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^8]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^9]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^10]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^11]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^12]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^13]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^14]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^15]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^16]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^17]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^18]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^19]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^20]: SEC.gov | Recordkeeping Requirements for Registered Transfer Agents. <https://www.sec.gov/rules-regulations/2003/12/recordkeeping-requirements-registered-transfer-agents>
[^21]: SEC.gov | Recordkeeping Requirements for Registered Transfer Agents. <https://www.sec.gov/rules-regulations/2003/12/recordkeeping-requirements-registered-transfer-agents>
[^22]: Final Rule: Electronic Recordkeeping Requirements for Broker-Dealers, Security-Based Swap Dealers, and Major Security-Based Swap Participants. <https://www.sec.gov/files/rules/final/2022/34-96034.pdf>
[^23]: Final Rule: Electronic Recordkeeping Requirements for Broker-Dealers, Security-Based Swap Dealers, and Major Security-Based Swap Participants. <https://www.sec.gov/files/rules/final/2022/34-96034.pdf>
[^24]: Final Rule: Electronic Recordkeeping Requirements for Broker-Dealers, Security-Based Swap Dealers, and Major Security-Based Swap Participants. <https://www.sec.gov/files/rules/final/2022/34-96034.pdf>
[^25]: Final Rule: Electronic Recordkeeping Requirements for Broker-Dealers, Security-Based Swap Dealers, and Major Security-Based Swap Participants. <https://www.sec.gov/files/rules/final/2022/34-96034.pdf>
[^26]: SEC Rules 17a-4 and 18a-6 - Amazon Web Services (AWS). <https://aws.amazon.com/compliance/secrule17a-4f>
[^27]: SEC Rules 17a-4 and 18a-6 - Amazon Web Services (AWS). <https://aws.amazon.com/compliance/secrule17a-4f>
[^28]: Final Rule: Electronic Recordkeeping Requirements for Broker-Dealers, Security-Based Swap Dealers, and Major Security-Based Swap Participants. <https://www.sec.gov/files/rules/final/2022/34-96034.pdf>
[^29]: eCFR :: 17 CFR 240.17ad-7 -- (Rule 17Ad-7) Record retention.. <https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR97c9b2f89790a51/section-240.17ad-7>
[^30]: Final Rule: Electronic Recordkeeping Requirements for Broker-Dealers, Security-Based Swap Dealers, and Major Security-Based Swap Participants. <https://www.sec.gov/files/rules/final/2022/34-96034.pdf>
