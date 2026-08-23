# Why Rule 613 Required Full Order Lifecycle Data Beyond OATS

## Executive summary

The SEC did not conclude that OATS was useless. It concluded that OATS was partial: useful for some FINRA surveillance, but structurally incapable of giving regulators a single, accurate, timely, cross-market reconstruction of who did what, when, where, and through whom across the full order lifecycle. That conclusion appears most clearly in the Rule 613 adopting release’s discussion around Note 63, where the Commission says that even expanded OATS still did not include exchange activity outside FINRA/Nasdaq membership, exchange quotes, market-maker principal orders, or options data, and therefore did not provide a "complete picture of the market."[^1]

The deeper point is that "comprehensive order lifecycle data" in Rule 613 meant more than a broker-dealer order log. OATS could capture many member-level events—origination/receipt, routing, modification, cancellation, execution—but it did so with important blind spots: fragmented venue coverage, inconsistent customer identification, incomplete quote data, exemptions for ordinary-course market-maker principal activity, reduced/manual matching for some ECN and manual workflows, and no single cross-market, customer-linked, synchronized event stream. Those omissions matter because modern manipulation and market stress do not stay inside one firm or one venue. They propagate across venues, brokers, and products, and often become visible only when event-level records can be linked across the entire chain.[^2]

The SEC’s rationale also was rooted in experience. The 1996 NASD order and the contemporaneous Section 21(a) report documented failed firm-quote enforcement, late and inaccurate trade reporting, unreliable timestamping, missing or deficient order tickets, inadequate documentation of telephone orders, and the practical impossibility of efficient surveillance through scattered paper and partial electronic records. The Flash Crash reinforced the point: SEC staff tried to reconstruct equity order books using OATS plus other SRO data, but the combined data were not sufficiently complete or consistent to reconstruct the books accurately; it took nearly five months to build only an estimated 90% view of that day’s equity activity.[^3]

Rule 613 therefore required a central repository with linked order identifiers, customer identifiers, synchronized timestamps, routing details, modifications, cancellations, executions, and compatible quotation/transaction data. The Commission explained that this would enable better risk-based examinations, cross-market manipulation detection, faster triage of tips and complaints, more accurate market-event reconstruction, and new surveillance methods based on complete activity rather than fragmented snapshots.[^4]

At the same time, the SEC recognized the costs and risks of building such a system. In response, the adopted rule backed away from mandatory real-time reporting to an 8:00 a.m. Eastern next-trading-day deadline, allowed normalization either at the source or at the repository, required security and confidentiality policies, contemplated annual independent security evaluation, and required searchable retention for at least five years. The regulatory logic was therefore not "collect everything immediately regardless of cost." It was: collect the minimum data needed to reconstruct and surveil the full order lifecycle across the national market system, while moderating implementation burdens and protecting sensitive data.[^5]

## Note 63 and the adopting release

The crucial passage appears at pages 26–28 of the Rule 613 adopting release. The Commission first acknowledges that FINRA had expanded OATS to all NMS stocks, but then explains why that still did not solve the regulatory problem:

"Although these developments with respect to the scope of FINRA’s OATS rules reduce the number of audit trails with disparate requirements, they still do not result in a comprehensive audit trail that provides regulators with accurate, complete, accessible, and timely data on the overall markets for which regulators have oversight responsibilities. In particular, data collected by FINRA pursuant to FINRA’s Rule 7400 series (‘OATS data’) does not provide a complete picture of the market because though OATS collects data from FINRA members with respect to orders and trades involving NMS stocks, OATS does not include trade or order activity that occurs on exchanges, or at broker-dealers that are not FINRA or Nasdaq members. Nor does OATS include exchange quotes, principal orders submitted by FINRA members registered as market makers, or options data."[^6]

Note 63 then ties those omissions to OATS’s own definitional boundaries and exemptions:

"See FINRA Rule 7410(j) (defining ‘Order’ for purposes of OATS, to mean ‘any oral, written, or electronic instruction to effect a transaction in an NMS stock or an OTC equity security that is received by a member from another person for handling or execution, or that is originated by a department of a member for execution by the same or another member, other than any such instruction to effect a proprietary transaction originated by a trading desk in the ordinary course of a member’s market making activities.’ Additionally, Nasdaq, Nasdaq OMX BX, Inc. (‘BX’) and Phlx equities (‘PSX’) members that are registered as market makers in a certain security are similarly exempted from recording OATS audit trail data for the security in which they are registered to make a market."[^6]

The footnote continues by explaining that some non-FINRA exchange members were often required only to record OATS-style data and provide it on request, rather than report it continuously through OATS. The immediately following paragraph then states that FINRA’s own augmentation of OATS with exchange data still did not produce fully accurate lifecycle linking and still fell short for cross-market analysis or tracking an order "through its entire cycle from generation through routing to execution, modification or cancellation." FINRA told SEC staff that about 2% of reportable OATS data related to exchange orders could not be linked with matching exchange data during the observed period.[^1]

Analytically, this passage explains why the SEC did not view "expanded OATS" as equivalent to "CAT." The problem was not simply field count. It was the absence of a single, standardized, continuously reported, cross-market lifecycle that covered all relevant venues, parties, and event types. That is why the release immediately pivots from this critique to saying that CAT would improve audit-trail quality by adding unique customer identifiers, synchronized event timing, comprehensive lifecycle reporting, and inclusion of all NMS securities in one trail.[^7]

## What OATS and earlier systems captured and what they omitted

OATS was created as a remedial response to the 1996 NASD settlement order. In approving OATS in 1998, the SEC described the minimum required functionality as an "accurate, time-sequenced record of orders and transactions, beginning with the receipt of an order at the first point of contact between the broker-dealer and the customer or counterparty and further documenting the life of the order through the process of execution," plus market-wide clock synchronization. The approved OATS rules applied to NASD members and to executed and unexecuted orders for Nasdaq equity securities.[^8]

Within that scope, OATS captured a substantial amount of order-event data. The 1998 approval order says the required information related to the order’s origin, the terms of the order, internal or external transmission, and whether the order was modified, canceled, or executed. The order terms included the symbol, share quantity, side, short-sale designation, market/limit/stop/stop-limit status, price fields, time-in-force, special handling instructions, display instructions, expiration, account type, and program/index-arbitrage status. OATS also required transmission records and synchronized clocks.[^9]

That said, OATS never eliminated the foundational limitations that later drove CAT. Even after FINRA expanded OATS in 2010 to all NMS stocks, the SEC called that change only an "interim measure" and a "positive step toward a cross-market audit trail," not the destination. The 2010 approval order explained that OATS would improve FINRA’s oversight because FINRA was "currently unable to view a complete order and transaction audit trail for all over-the-counter transactions in NMS stocks." In other words, the OATS expansion itself was evidence that the prior architecture remained incomplete.[^10]

There were at least five important limits.

First, scope remained fragmented. OATS initially covered Nasdaq equity securities; by 2010 it covered all NMS stocks for FINRA members, but Note 63 explains that it still did not cover order or trade activity on exchanges or at broker-dealers outside FINRA/Nasdaq membership, and it did not include options data. Nor was there any combined equity-and-options audit trail across products, which the SEC identified as a "significant impediment" to cross-product investigations.[^11]

Second, quote and market-center coverage were incomplete. The SEC expressly said OATS did not include exchange quotes. More broadly, FINRA’s description of the pre-CAT cross-market environment said ISG data did not capture quote/orders away from a market’s inside market, identified trades only to the clearing broker rather than the executing broker, had non-mandatory fields, lacked validation, and had no service-level commitments for timely, accurate submission. That is exactly the opposite of what a robust order-book reconstruction system needs.[^12]

Third, customer identity was missing or non-uniform. Existing SRO audit trails generally identified the broker-dealer handling the order, not the account holder or the person exercising trading discretion. The adopting release says this made it difficult even to determine whether a suspicious cross-broker pattern existed, because the same actor could appear under many different names across firms. The result was false positives, missed misconduct, and repeated post hoc requests for EBS or broker records.[^13]

Fourth, important order classes and workflows were excluded or reduced. Note 63 points out that OATS excluded ordinary-course market-making proprietary transactions. The 1998 approval order also says that for manual orders and all orders received by ECNs, the electronically recorded/transmitted data were limited to information "readily available at the trading desk." It further states that for manually transmitted orders and orders transmitted to ECNs, neither an order identifier nor an order origination date would be passed when the order was routed, with the expectation that NASDR could manually match them. That is a meaningful limitation for automated reconstruction.[^14]

Fifth, timeliness and data integration were inadequate for modern surveillance. OATS reports were not a live consolidated event stream. By 2011, OATS reporting was codified for submission by 8:00 a.m. Eastern the next calendar day after the OATS business day, not real time. And even after FINRA received the file, the SEC noted it took roughly an hour to acknowledge receipt and roughly another 24 hours to determine syntax errors while performing massive validation. In a system already missing parts of the market, that lag further weakened rapid response and reconstruction.[^15]

The predecessor systems before and alongside OATS had even sharper weaknesses. The 2012 release says EBS and equity-cleared reports comprised only trade executions, not orders or quotes; lacked key elements such as the time of execution and, for cleared reports, the customer’s identity; and reflected an outdated regulatory data infrastructure that forced regulators to "cobble together disparate data."[^16]

## Failures that motivated CAT

The 1996 NASD order and Section 21(a) report supplied the original template for why a fuller audit trail was necessary. The settlement order required NASD to build an audit trail sufficient to reconstruct markets promptly, surveil effectively, and enforce its rules, beginning at the first point of customer or counterparty contact and continuing through execution or non-execution, with synchronized clocks. That language is strikingly close to the later CAT concept because the underlying regulatory failures were already visible in 1996.[^17]

Those failures were concrete, not theoretical. The Appendix to the Section 21(a) report says the Commission staff had "significant difficulties reconstructing activity in the Nasdaq market," because order tickets were too often unavailable or inconvenient to retrieve, timestamping was unreliable, and telephone orders at OTC trading desks were inadequately documented. The report adds that high market volume and market dispersion made rule enforcement through on-site inspections and hard-copy order-ticket review inefficient, and that automated surveillance could only be implemented with an improved audit trail.[^18]

Trade-reporting failures were another major driver. The 21(a) Appendix says numerous broker-dealers repeatedly failed to report transactions accurately and on time; examinations found wrong execution times on order tickets, missing execution times, missing order tickets, and late trades that were not marked late. The report concluded that late and inaccurate trade reporting distorted the tape, misled investors, and hampered monitoring of limit-order protection, markups, and potential manipulation.[^19]

Firm-quote enforcement failures mattered as well. The Appendix says a significant number of market makers failed to comply consistently with firm-quote obligations, that NASD did not generate automated surveillance reports designed to identify potential backing away, and that its policies and practices favored market makers over strict enforcement. That is important because a surveillance system that cannot reliably tie order presentment, quote status, and execution response together will systematically under-enforce quoting obligations.[^20]

The Flash Crash showed that similar problems persisted in a more automated environment. In the Rule 613 adopting release, the SEC explains that Commission staff tried to use OATS and several SRO audit trails to reconstruct order books for thousands of equities, but the combined data sets were not accurate or complete enough. Two major problems were the inability to eliminate duplicate orders and the inability to sequence events accurately across multiple data sources. Even after processing more than 5.3 billion records, staff needed nearly five months to produce an estimated 90% equity-market reconstruction for May 6, 2010.[^21]

The release also describes broader surveillance failures caused by fragmentation. Existing customer-blind audit trails produced false positives when activity was aggregated at the broker-dealer level, and false negatives when manipulative activity across multiple broker-dealers was obscured by other customers’ benign activity. Meanwhile, existing cross-market systems such as ISG were incomplete and lacked validated, mandatory, fully attributed data. The Commission therefore concluded that existing audit trails were not "an efficient or adequate method" of monitoring NMS markets.[^13]

## Why full lifecycle fields were necessary

Rule 613’s data model was built around reportable events: original receipt or origination, routing, receipt of a routed order, modification, cancellation, and execution. It also defined the "material terms of the order" to include price, size, side, order type, time-in-force, and other handling terms, and it required unique order identifiers and party identifiers so that all reportable events for an order could be linked together.[^22]

The following schematic is a faithful abstraction of that event structure. It is not a literal SEC schema, but it closely reflects Rule 613’s event-based design and linkage requirements.[^23]

|  |
| --- |

Why does each field matter?

Order identifiers and linkages. The rule defines a CAT-Order-ID as a unique identifier, or series of identifiers, that allows the repository to "efficiently and accurately link all reportable events for an order." Without that linkage, regulators cannot reliably follow child orders, routed fragments, partial fills, or later modifications and cancellations. This is exactly what impeded Flash Crash reconstruction and cross-market matching under augmented OATS.[^24]

Customer and participant identifiers. Rule 613 uses Customer-ID and CAT-Reporter-ID rather than the shorthand "buyer/seller ID" in every context. But functionally, those identifiers are how the rule captures the key parties behind origination, routing, modification/cancellation instructions, execution, and certain post-trade allocations. The Commission said these identifiers were necessary because no amount of technical sophistication can detect multi-broker "network" insider trading, wash trading, or order layering if responsibility cannot be tied consistently to the same actor across brokers.[^25]

Event timestamps and synchronized clocks. Lifecycle surveillance depends on the order in which events occur. The SEC explained that synchronized timing is needed to reconstruct broad market events, identify causation, and avoid the sequencing failures that plagued the Flash Crash inquiry. The adopted rule did not itself hard-code one exact sub-second threshold; instead, it required clock synchronization consistent with industry standards and expected the NMS plan to specify the standard and address time drift.[^26]

Price, size, side, order type, and time-in-force. These are needed to replay the book and evaluate trading intent and effect. The adopting release specifically says order type is "important" and quotes a commenter that it is "essential" to reconstruct the state of the limit order book. Price and remaining size on modifications, plus material-term changes, are essential for detecting layering/spoofing-style behavior and for determining whether a displayed order was truly available on the terms the market saw.[^27]

Routing fields. The rule requires the routing time, the routing CAT-Reporter-ID, the receiving CAT-Reporter-ID, and, for internal routing, the desk or department. Those elements enable venue-path analysis and cross-market linkage. The SEC gave a manipulation example in which principal sell orders across venues create a misleading appearance of sell-side pressure before a buy order takes advantage of the induced move; it said existing audit trails made that activity difficult to identify but CAT could support routine surveillance for it.[^28]

Modification and cancellation fields. The rule requires the date/time of the modification or cancellation, price and remaining size if modified, other changes in material terms, and the identity of the person giving the instruction. Those fields matter because many manipulative strategies exploit not just executions, but the strategic placement, amendment, and withdrawal of orders. The adopting release’s order-layering discussion is the clearest example.[^29]

Execution fields and compatible quote data. Execution price, size, capacity, reporting status, and linked quotation data are needed for best-execution, trade-through, and Regulation SHO analysis. The SEC separately required the repository to retain NBBO, transaction reports, and last-sale reports in compatible formats because that would let regulators compare execution outcomes to contemporaneous market conditions and detect unreported trades or other abuse.[^30]

From an analytic perspective, these fields enable methods that were either impossible or unreliable under OATS and its predecessors: event-stream replay, cross-broker entity resolution, venue-path tracing, order-to-execution ratio metrics, queue-dynamics reconstruction, duplicate-order elimination, and cross-market anomaly detection. That last sentence is an inference from the SEC’s stated goals, the required fields, and the examples the release gives for manipulation, examinations, and market-event reconstruction.[^31]

## Privacy, security, and operational design choices

The SEC was explicit that a consolidated audit trail raised major privacy and information-security concerns. Commenters warned of "serious privacy concerns," identity-theft risk, uncertainty over encryption, and uncertainty about who would have access to customer data. The Commission accepted that these concerns were real and revised the rule to add stronger privacy and confidentiality mechanisms.[^32]

Rule 613 addressed those concerns in several ways. It required the NMS plan to include policies and procedures, including standards, to ensure the security and confidentiality of all information reported to the central repository. It also required the plan to discuss the security and confidentiality framework in enough detail for the Commission and the public to evaluate it, and it required the plan to address whether there would be an annual independent security evaluation of the repository or, if not, what alternative security-evaluation measures would be used.[^33]

The Commission also tried to reduce the privacy footprint of customer identifiers. It said the unique customer identifier need not "travel with the order"; instead, it could be reported only by the broker-dealer that originated or first received the order. The Commission also stated that it intended to assert all appropriate FOIA exemptions for CAT customer information and required penalties for non-compliance with information-security policies.[^34]

Operationally, the SEC responded to industry burden in a similarly pragmatic way. The proposal had contemplated real-time reporting, but commenters argued that real-time reporting would require significant technological upgrades, could strain order-handling systems, could create latency, and might reduce data quality because there would be less opportunity for validation. The Commission accepted much of that critique. In the adopting release, it changed the rule so that order-event data had to be reported by 8:00 a.m. Eastern Time on the next trading day, while still requiring firms to record the data contemporaneously with the event.[^35]

The SEC also relaxed the implementation architecture. Rather than forcing all reporting entities to emit data in one native standard format, Rule 613(c)(2) allowed data either to be reported in a uniform electronic format or in a form that the central repository could normalize into one. The Commission explained that this flexibility could avoid forcing broker-dealers and SROs to make substantial changes to their order-management and execution systems.[^36]

On retention and accessibility, the Commission again balanced ambition against cost. It ultimately required the central repository to retain CAT data in a convenient, searchable electronic format for at least five years, but it dropped the proposed requirement that older data be immediately available or queryable within one hour. That modification reflects the Commission’s effort to preserve regulatory utility while moderating infrastructure burdens.[^37]

Finally, Rule 613 did not stop at data collection. It required SROs to develop or enhance surveillance systems to make use of CAT data and to implement those systems within fourteen months after the NMS plan became effective. That requirement is important because the SEC’s objective was not just a warehouse; it was a surveillance architecture capable of using full-lifecycle data in practice.[^38]

## Timeline and OATS–CAT comparison

The sequence of regulatory developments shows a clear progression: remedial audit trail mandates after a governance and enforcement failure, incremental SRO audit trails, a major stress event exposing fragmentation, and finally Rule 613’s requirement for a linked, central repository.[^39]

|  |
| --- |

The comparison below focuses on the regulatory baselines most relevant to the 2012 adopting release. For CAT, the row reflects Rule 613 as adopted in 2012 for NMS securities; later CAT implementation details that went beyond the rule text are outside this report unless expressly noted.[^40]

| System | Scope | Participants reporting | Core fields and lifecycle coverage | Key omissions or caveats | Reporting timing | Retention | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OATS | Initially Nasdaq equity securities for NASD members; by 2010 expanded to all NMS stocks for FINRA members, alongside OTC equity coverage in the OATS rules.[^41] | FINRA/NASD "Reporting Members," with reporting agents permitted.[^42] | Captured order receipt/origination, transmission, modification, cancellation, and execution; included symbol, shares, side, short-sale flag, order type, price, time-in-force, special handling, account type, routing, and timestamps.[^43] | No continuous inclusion of exchange activity outside FINRA/Nasdaq membership; no exchange quotes; no options data; ordinary-course market-maker principal orders excluded; manual/ECN workflows had reduced data, and some routed workflows lacked passed identifiers/origination dates.[^14] | Same-day reporting in the 1998 approval order; later codified as 8:00 a.m. Eastern next day after the OATS business day.[^44] | I did not find a distinct OATS central-repository retention period in the cited OATS approval sources; the approval order instead tied members to recordkeeping obligations and general Exchange Act books-and-records rules.[^45] |[^46] |
| CAT under Rule 613 | All NMS securities in one audit trail.[^47] | All SROs and their members report to a central repository; SROs also must enhance surveillance systems to use the data.[^48] | Customer-ID, CAT-Order-ID, CAT-Reporter-ID; material terms including price, size, side, order type, time-in-force, and handling instructions; reportable events including origination/receipt, routed-order receipt, routing, modification, cancellation, and execution; compatible NBBO and transaction data retained with audit-trail data.[^49] | Not every commenter-proposed field was adopted exactly as proposed; for example, the rule did not hard-code a fixed list of order types, did not require every customer detail commenters suggested, and left some timing granularity details to the NMS plan.[^50] | Order-event data by 8:00 a.m. Eastern on the next trading day; supplemental/customer-account data also by 8:00 a.m. Eastern after receipt of the data.[^51] | Central repository must retain the data in searchable electronic form for not less than five years.[^52] |[^53] |

## Conclusion and limitations

The SEC’s reasoning was straightforward once the market is viewed as an interconnected event system rather than as separate broker or venue silos. OATS could capture many order-handling events within FINRA-member workflows, and for that reason it was a meaningful regulatory advance. But Rule 613 was adopted because OATS was not comprehensive in the way modern surveillance required: it did not continuously cover all relevant venues and products, did not include all quote activity, did not consistently identify the relevant parties behind the orders, and could not reliably link a full order path across the national market system. The Commission therefore required a central repository capable of linking every reportable event for an order, attributing those events to customers and market participants, and situating them against synchronized timestamps and compatible quote/trade data.[^54]

That is why the Commission’s CAT rationale was not simply "more data is better." It was that without full lifecycle data, regulators will predictably miss misconduct, mis-sequence events, overuse manual requests, and reconstruct crises too slowly. The 1996 NASD matter, the deficiencies of order tickets and telephone-order records, the incompleteness of ISG/EBS/cleared-report data, and the Flash Crash all pointed in the same direction. Rule 613 translated that lesson into architecture: linked identifiers, synchronized time, uniform lifecycle events, central storage, queryability, and surveillance systems designed to use the data.[^55]

A few boundaries are worth stating explicitly. This report is centered on the 2012 Rule 613 adopting release and the primary OATS sources the user specified. It therefore does not attempt a full treatment of every later CAT NMS Plan technical specification or post-2012 amendment. Likewise, for OATS retention, I did not find a separate central-repository retention rule stated in the cited 1998 approval order materials, so I have not inferred one. Finally, when the user’s shorthand referred to "buyer/seller IDs," the most precise Rule 613 terminology is Customer-ID, CAT-Reporter-ID, clearing/prime-broker identifiers where applicable, and certain account-allocation fields; the rule did not always use the exact phrase "buyer/seller ID."[^56]

[^1]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^2]: <https://www.finra.org/sites/default/files/2020-08/SR-FINRA-2020-024.pdf>
[^3]: <https://www.sec.gov/files/litigation/admin/3437538.txt>
[^4]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^5]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^6]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^7]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^8]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/sr-nasd-97-56>
[^9]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/sr-nasd-97-56>
[^10]: <https://www.sec.gov/files/rules/sro/finra/2010/34-63311.pdf>
[^11]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/sr-nasd-97-56>
[^12]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^13]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^14]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^15]: <https://www.finra.org/sites/default/files/RuleFiling/p124957.pdf>
[^16]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^17]: <https://www.sec.gov/files/litigation/admin/3437538.txt>
[^18]: <https://www.sec.gov/litigation/investreport/nd21a-appx.txt>
[^19]: <https://www.sec.gov/litigation/investreport/nd21a-appx.txt>
[^20]: <https://www.sec.gov/litigation/investreport/nd21a-appx.txt>
[^21]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^22]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^23]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^24]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^25]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^26]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^27]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^28]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^29]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^30]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^31]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^32]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^33]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^34]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^35]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^36]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^37]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^38]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^39]: <https://www.sec.gov/files/litigation/admin/3437538.txt>
[^40]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^41]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/sr-nasd-97-56>
[^42]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/sr-nasd-97-56>
[^43]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/sr-nasd-97-56>
[^44]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/sr-nasd-97-56>
[^45]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/sr-nasd-97-56>
[^46]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/sr-nasd-97-56>
[^47]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^48]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^49]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^50]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^51]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^52]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^53]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^54]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^55]: <https://www.sec.gov/litigation/investreport/nd21a-appx.txt>
[^56]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/sr-nasd-97-56>
