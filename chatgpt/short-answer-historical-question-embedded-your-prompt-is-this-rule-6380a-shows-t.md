# Millisecond Timestamps, Clock Synchronization, and Sequencing in FINRA and SEC Trade Reporting

## Executive summary

The short answer to the historical question embedded in your prompt is this: Rule 6380A shows two separate history entries tied to SR-FINRA-2013-050 because FINRA implemented that filing in phases. Under SR-FINRA-2014-039, the ADF/TRF millisecond-reporting tranche became effective on November 10, 2014; under SR-FINRA-2015-008, the remaining ADF/TRF amendments from the same 2013-050 filing were delayed and then implemented on July 13, 2015. FINRA’s rulebook history for Rule 6380A therefore correctly shows both "SR-FINRA-2013-050 and SR-FINRA-2014-039 eff. Nov. 10, 2014" and "SR-FINRA-2013-050 and SR-FINRA-2015-008 eff. July 13, 2015," with separate version ranges for those periods.[^1]

The regulatory arc started with SEC Rule 613 in 2012, which required the CAT plan to create an accurate, time-sequenced order record and required synchronized business clocks and timestamps in millisecond or finer increments. FINRA then moved its own trade-reporting and OATS rules toward millisecond reporting through SR-FINRA-2013-050, which the SEC approved in Release No. 34-71623 on February 27, 2014. OATS millisecond reporting became effective on April 7, 2014 for firms whose systems already captured milliseconds; ADF/TRF millisecond reporting followed on November 10, 2014 after the implementation delay in SR-FINRA-2014-039; and the rest of the ADF/TRF changes from 2013-050 took effect on July 13, 2015 under SR-FINRA-2015-008.[^2]

The 50 millisecond clock-deviation threshold was not part of the original 2014 millisecond trade-reporting change. It came later. FINRA proposed the tighter standard in Regulatory Notice 14-47 and then adopted it through SR-FINRA-2016-005, with the SEC approval described in Regulatory Notice 16-23. FINRA’s stated rationale was that 50 milliseconds was the best balance between better surveillance of high-speed and algorithmic trading and implementation costs; the same notice emphasized that the tolerance includes (i) difference from NIST, (ii) transmission delay, and (iii) local clock drift. FINRA also noted that NIST’s Internet Time Service itself uses a 50 millisecond advance to compensate for network delay, which supported FINRA’s view that a tighter universal regulatory tolerance was not yet necessary.[^3]

For CAT, the SEC’s 2016 approval of the CAT NMS Plan settled on 50 milliseconds for Industry Members and 100 microseconds for Participants, while preserving one second for clocks used solely for Manual Order Events and, after amendment, for the time of allocation on Allocation Reports. The SEC explained that 50 milliseconds was acceptable for the initial phases of CAT reporting, but also recognized that it was not perfect: because one clock may be +50 ms and another −50 ms, two compliant clocks can differ by 100 ms, and a routed order can therefore appear—if one looks only at raw timestamps—to have been received before it was sent. That limitation is central to understanding both the operational effect of the rule and the remaining room for apparent sequencing errors.[^4]

In practice, millisecond reporting and 50 ms synchronization improved the audit trail, late-trade marking, and cross-system comparisons, but they also forced firms to solve a real engineering problem: the timestamp that governs surveillance must be the event timestamp, not the later post-trade message timestamp. That is why FINRA specified special handling for ISO block trades, reversals, non-business-day reports, step-outs and step-ins, and why FINRA later required firms to report trade-report timestamps using the same granularity they use for CAT execution events. The common failure modes in the public record are not subtle: inaccurate timestamps, inconsistent granularity across linked reports, delayed error repair, inadequate vendor oversight, and mismatches between trade-report timestamps and OATS/CAT timestamps.[^5]

Public evidence also shows that the industry was already moving beyond milliseconds by the CAT era. In FINRA’s 2020 filing on finer timestamp granularity, FINRA reported that, on an average day in July 2020, 38.6% of Industry Member order execution events had timestamp granularity finer than milliseconds, and 47.2% of firms reporting execution events used finer-than-millisecond granularity; seven firms were already reporting in nanoseconds. That supports a practical conclusion: the original millisecond shift solved a material audit-trail problem, but it did not end the need for better synchronization, tighter internal logging, or better dispute-resolution procedures for cross-firm sequencing.[^6]

## Regulatory development

### Core development path

The basic development path is: Rule 613 created the CAT timing obligation, SR-FINRA-2013-050 aligned FINRA trade reporting and OATS with millisecond-capable firms, SR-FINRA-2014-039 split implementation into a first ADF/TRF millisecond phase and later remainder, SR-FINRA-2015-008 delayed the remainder to July 13, 2015, and SR-FINRA-2016-005/Rule 4590 tightened clock synchronization to 50 milliseconds for relevant computer clocks. The SEC’s 2016 CAT Plan approval then embedded a parallel 50 ms standard for Industry Members and a finer 100 microsecond standard for Participants.[^7]

The SEC’s Rule 613 materials make clear that timing was always part of the CAT design. The SEC’s Rule 613 overview states that the rule requires synchronized business clocks and timestamps in millisecond or finer increments, while the 2012 adopting release explains that the Commission viewed then-current industry practice as more rigorous than one second and cited the use of far more precise synchronization technology by exchanges and high-frequency traders.[^8]

### Filing comparison table

| Filing or rule action | SEC release or source | What changed | Key effective dates or milestones | Why it matters |
| --- | --- | --- | --- | --- |
| SEC Rule 613 adopting release | Release No. 34-67457; SEC Rule 613 page | Required the CAT plan to create an accurate, time-sequenced order record; required synchronized business clocks and timestamps in millisecond or finer increments.[^9] | Adopted July 18, 2012.[^10] | Established the federal timing framework later reflected in CAT and FINRA compliance rules.[^11] |
| SR-FINRA-2013-050 | SEC approval 34-71623 | Added millisecond reporting if the firm’s system captures milliseconds for trade reports and OATS; added extra time fields for Stop Stock/PRP/ISO scenarios; addressed reversals, non-business-day and T+365 reporting, and step-out/step-in mechanics.[^12] | SEC approved Feb. 27, 2014; OATS millisecond reporting effective Apr. 7, 2014.[^13] | First major FINRA move from seconds-only trade-reporting conventions toward millisecond-capable audit-trail consistency.[^14] |
| SR-FINRA-2014-039 | SEC notice 34-73289 | Delayed implementation of 2013-050 trade-reporting amendments; split ADF/TRF millisecond reporting from the remaining ADF/TRF changes.[^15] | ADF/TRF millisecond reporting effective Nov. 10, 2014; ORF rule changes effective Nov. 17, 2014; remaining ADF/TRF changes postponed to a later window.[^16] | This is the reason one Rule 6380A history line shows Nov. 10, 2014.[^17] |
| SR-FINRA-2015-008 | SEC notice 34-74807 | Further delayed the remaining ADF/TRF amendments from 2013-050, while keeping the earlier millisecond tranche already in place.[^18] | Immediate-effectiveness notice dated Apr. 24, 2015; implementation of remaining ADF/TRF amendments on July 13, 2015.[^19] | This is the reason the second Rule 6380A history line shows July 13, 2015.[^17] |
| SR-FINRA-2016-005 / Rule 4590 | Reg. Notice 16-23; Rule 4590 | Tightened synchronization for relevant computer clocks from one second to 50 milliseconds; preserved one second for manual clocks and other non-covered clocks.[^20] | Effective Aug. 15, 2016; phase-in for ms-capturing systems by Feb. 20, 2017 and others by Feb. 19, 2018.[^21] | Created FINRA’s standalone 50 ms business-clock rule and aligned it with CAT-era expectations.[^22] |
| CAT NMS Plan approval | SEC approval 34-79318 and Plan text | Set 50 ms for Industry Members, 100 μs for Participants, 1 second for Manual Order Events and allocation-time clocks; required certification and violation reporting.[^23] | Approved Nov. 15, 2016.[^24] | Converted Rule 613’s high-level timing concept into the operational CAT timing regime.[^25] |

### Rule 6380A history and why there are two amendment lines

Rule 6380A’s current history line is unusually explicit. It separately records: "Amended by SR-FINRA-2013-050 and SR-FINRA-2014-039 eff. Nov. 10, 2014" and "Amended by SR-FINRA-2013-050 and SR-FINRA-2015-008 eff. July 13, 2015." The rulebook also shows distinct version ranges for Nov. 10, 2014–Jul. 12, 2015 and Jul. 13, 2015–Aug. 23, 2015. That history is not duplicative; it reflects two separate operative tranches from the same original 2013-050 filing.[^17]

FINRA’s own explanation in SR-FINRA-2014-039 was that the ADF/TRF millisecond-reporting requirement would become effective on November 10, 2014, while the remaining ADF/TRF amendments would be implemented later. FINRA’s explanation in SR-FINRA-2015-008 then states that the remaining ADF/TRF changes approved under SR-FINRA-2013-050 would be implemented on July 13, 2015. In other words, the November 2014 and July 2015 entries correspond to different subsets of the 2013-050 package.[^26]

### Timeline

The following timeline consolidates the rule-development and effective-date sequence discussed above. The dates and milestones are drawn from the SEC and FINRA sources cited in the surrounding text.[^27]

|  |
| --- |

## Technical design

### How millisecond timestamps were specified

FINRA’s original 2013 design choice was deliberately incremental. SR-FINRA-2013-050 did not require every firm to redesign its execution stack to capture milliseconds. Instead, it required a firm to report in milliseconds if its system already captures milliseconds; firms whose systems did not capture milliseconds could continue to report in seconds. FINRA justified that approach by pointing out that sequencing consolidated exchange and OTC activity is difficult when exchange trades are timestamped in milliseconds but OTC trade reports are still timestamped only to the second.[^28]

That design then flowed into rule text and FAQs. Current Rule 6380A supplementary material states that required time fields must be reported in hours, minutes, seconds and milliseconds if the member’s system captures milliseconds, and FINRA’s trade-reporting FAQ confirms that firms are not forced to begin capturing milliseconds solely because of the rule, but ATSs and other systems that already capture milliseconds are expected to report them. FINRA’s FAQ also confirms that, once a firm reports in milliseconds, the 10-second late-reporting determination is made at the millisecond level, not merely by rounding to the second.[^29]

FINRA later tightened the design further for CAT convergence. In Regulatory Notice 20-41, FINRA explained that trade-report time fields must use the same timestamp granularity used for CAT order execution events, and that firms currently reporting CAT order execution events in milliseconds or finer increments must ensure their FINRA Facility trade reports use matching granularity for the same event. That is a subtle but important engineering rule: it is not just about precision; it is about cross-system comparability.[^30]

CAT’s own timestamp standard is broader than the older FINRA trade-reporting standard. Rule 6860 requires Industry Members to record and report CAT data in milliseconds, but if their systems use finer increments they must report in that finer increment up to nanoseconds. Manual Order Events may be reported in increments up to one second, although the Electronic Capture Time for a manual event still must be reported in milliseconds; allocation-report times also may be reported in one-second increments.[^31]

### How the 50 millisecond threshold was rationalized and measured

The central measurement point is straightforward in rule text: the 50 ms tolerance is not merely local oscillator drift. Under both FINRA Rule 4590 and CAT Rule 6820, the tolerance includes the difference from NIST, the transmission delay from the source, and the amount of local clock drift. Both rules also require synchronization before market open and checking/re-synchronization throughout the day.[^32]

FINRA’s rationale for 50 milliseconds was pragmatic rather than theoretical. In Regulatory Notice 14-47, FINRA said that a 50 ms drift tolerance was the best option to facilitate surveillance of high-frequency and algorithmic trading and noted its view that 50 ms was the appropriate CAT synchronization standard under Rule 613. The same notice expressly asked whether 100 or 200 milliseconds would be cheaper, but emphasized that a tighter standard was becoming necessary as more firms captured and reported milliseconds. FINRA also noted that NIST’s Internet Time Service advances the time code by 50 milliseconds to compensate for network delay, which is why FINRA concluded that a tighter universal tolerance was not yet necessary or appropriate.[^33]

The SEC largely accepted that cost-benefit framing. In the CAT NMS Plan approval order, the Commission said that a 50 ms standard for Industry Members would let regulators sequence orders and events with an accuracy level acceptable for the initial phases of CAT reporting, while recognizing that some firms and exchanges already operated at materially finer tolerances. The SEC therefore approved 50 ms for Industry Members while requiring 100 microseconds for Participants and directing future reassessment. The 2017 clock-synchronization assessment then concluded that the Participants did not believe the standard should be tightened at that time.[^34]

A key technical implication follows directly from the Plan text: 50 ms is a compliance envelope, not a sequencing guarantee. Because one compliant clock can be +50 ms and another can be −50 ms, the CAT Plan itself explains that two separate clocks can vary by 100 ms. The Plan uses a concrete example in which one firm reports routing an order at 10:40:00.005 while the receiving firm reports receipt at 10:39:59.983, creating the appearance that the order arrived before it was sent. That is why the regulatory system needs linkages, reconciliations, and logic beyond a single timestamp column.[^35]

### What firms actually implemented

The public record shows a layered implementation model. At the FINRA business-clock level, firms needed a time source referenced to NIST, daily synchronization procedures, intra-day checks, and logs documenting synchronization times and exceptions. At the CAT level, firms also needed certifications, violation reporting once thresholds existed, and retention of logs for at least five years. FINRA and the SROs additionally expected firms to document who owned synchronization and how failures would be detected and self-reported.[^36]

At the application level, firms had to ensure that the execution system timestamp and the regulatory-report timestamp matched for the same event. The OATS technical specifications stated that if a firm reports execution time in milliseconds to a FINRA transaction reporting system, OATS includes milliseconds as part of order-trade matching, and the FINRA transaction-report execution timestamp and OATS execution timestamp must be identical to the millisecond. FINRA’s trade-reporting FAQ repeats the same operational requirement.[^37]

The CAT-era evolution then pushed some firms beyond milliseconds. FINRA reported in SR-FINRA-2020-029 that, on an average day in July 2020, 12,617,227 out of 32,667,792 Industry Member order execution events—38.6%—already had timestamp granularity finer than milliseconds; 79 of 167 firms—47.2%—used finer-than-millisecond granularity, and seven firms reported nanosecond timestamps producing 1,792,160 events, or 5.5% of all execution events.[^6]

The chart below visualizes one of those public datapoints: the share of Industry Member execution events, on an average day in July 2020, that were already finer than milliseconds. The denominator is execution events, not firms.[^6]

|  |
| --- |

## Operational impact

### What changed operationally and what did not

Millisecond reporting changed regulatory reconstruction much more than it changed matching-engine priority. On price/time venues, the exchange’s own system timestamp determines queue rank; for example, NASDAQ BX rules state that the system time-stamps an order and that timestamp determines time ranking, while NYSE’s own public explanation notes that most securities markets use price/time priority based on time of arrival. FINRA and CAT timestamps therefore do not replace exchange matching logic; they create a surveillance and evidentiary layer for reconstructing events across venues and intermediaries.[^38]

What millisecond reporting does change materially is the ability to compare events across systems and to mark "late" trade reports more precisely. FINRA’s FAQ makes this explicit: for firms that report in milliseconds, a trade stamped 10:01:00:999 must be reported by 10:01:10:999; a report at 10:01:11:000 is late. That precision matters in active names, in internal best-execution reviews, and in surveillance models that compare executions, routes, and public prints.[^39]

### Routing across multiple intermediaries

The public FINRA FAQs show why sequencing disputes often become attribution disputes. If BD2 merely provides a routing mechanism and BD3 executes an order sent by BD1, then the trade-report parties are BD1 and BD3. But if BD2 makes the routing and execution decision, then the trade-report parties are BD2 and BD3. That distinction matters because the relevant timestamps, controls, and supervisory responsibility follow the actual decision-making path, not simply the communications path.[^40]

The CAT Plan’s 100 ms possible cross-firm divergence makes this more consequential. When different intermediaries are each compliant within 50 ms but use different business clocks, one firm’s route timestamp can appear later than another firm’s receipt timestamp. For that reason, a robust reconstruction cannot rely on raw timestamps alone; it needs route/event identifiers, venue records, and knowledge of which intermediary actually controlled routing and execution.[^41]

### Edge cases that specifically required rule text and FAQs

ISO block trades are the cleanest example of why one timestamp was not enough. FINRA required such reports to include the time that all material terms of the transaction are known as the execution time, and, if different, a separate "ISO time" or reference time showing when the firm determined what ISOs to route to better-priced protected quotations—the time often described as the market "snapshot." This allows FINRA to test Order Protection Rule compliance without conflating the snapshot/routing decision with the later finalized execution.[^42]

Step-outs and step-ins are another important example. FINRA’s FAQ states that the execution time on a non-tape report for a step-out is the time when the position was allocated to another party, not the time of the underlying execution. In the "bulk step-out" example, underlying executions occur at 12:00:00, 12:01:00, and 12:04:00, but if the allocation occurs at 12:21:00, the step-out report uses 12:21:00. FINRA also requires the receiving firm to report a step-in when both sides use clearing-only reports. This is crucial operationally: step-out/step-in timestamps are post-trade processing times, not price-priority timestamps for the original fills.[^43]

Non-business-day and after-hours reports introduce another systematic latency. Current Rule 6380A supplementary material and the FINRA trade-reporting FAQ allow certain trades executed on weekends, holidays, or after the facility close to be reported the next business day on an "as/of" basis within specified morning windows. The reporting delay is therefore built into the rule and does not itself mean the underlying execution was late or lower priority; it means the reporting clock is being treated differently from the execution clock.[^44]

Reversals also became more structured under the 2013-050 package. FINRA’s 2015 filing explains that reversal reports must identify the original trade by including the original control number and report date. That requirement improves traceability, but it also means that post-trade correction workflows are increasingly multi-message and linkage-dependent rather than single-message events.[^45]

### Post-trade messaging and how multi-request workflows create latency

The most important analytical point here is that post-trade messaging latency can change the order in which reports are observed without changing the order in which the underlying executions actually occurred. The regulatory system therefore needs both a timestamping regime and a data-model regime that can preserve the distinction between the underlying event and the later report, correction, or allocation.[^46]

Three examples from the primary materials show the problem clearly:

First, in a bulk step-out, three underlying executions may occur several minutes before the later allocation. The step-out report then carries the allocation time, not the original execution times. If a reviewer mistakenly orders events by step-out time alone, the original executions will appear later than they actually were. FINRA’s FAQ is explicit on this point.[^43]

Second, in an ISO block trade, the report may need both the final execution time and a separate earlier snapshot/routing time used to determine outbound ISOs. If a post-trade system stores only one of those times—or stores the later message-arrival time instead—the sequence of compliance-relevant events can be distorted. FINRA added the extra time field precisely to avoid that distortion.[^42]

Third, in the CAT context, a routed order may cross firms whose clocks are each compliant but still differ by up to 100 ms. The CAT Plan’s own example shows how message-level ordering can look paradoxical when only raw timestamps are compared. This is the structural reason post-trade querying, exception handling, and dispute review must use linked event records, not only arrival order in a portal or a reporting queue.[^35]

## Compliance and evidence

### Implementation, testing, and supervisory expectations

FINRA’s 2015 delay filing shows that implementation was not just a rule-text exercise; it was a testing exercise. In SR-FINRA-2015-008, FINRA said the July 13, 2015 date would give firms about seven months from updated TRF technical specifications and more than three months of testing, with testing having begun on March 2, 2015. FINRA also stated that all firms had to cut over together because ADF/TRF systems could not support some firms reporting under the new regime while others remained under the old one.[^47]

For clock synchronization, FINRA and the exchanges issued joint guidance in Regulatory Notice 17-09. That notice required firms with relevant millisecond-capturing business clocks to comply with synchronization, documentation, and certification requirements by March 15, 2017, to synchronize before market open and check at predetermined intervals throughout the day, and to file annual certifications thereafter. The same notice also explained that violation-reporting obligations would not begin until the Operating Committee published the applicable thresholds.[^48]

FINRA later sharpened supervisory expectations in Regulatory Notice 20-31, which states that a firm’s clock-synchronization procedures should specify how and when clocks are synchronized, who is responsible, how synchronization is evidenced, and how the firm will self-report violations. FINRA’s 2024, 2025, and 2026 oversight publications reinforce the same theme: firms should have named owners, daily portal reviews, comparative reconciliations, and explicit controls over reporting agents and time-synchronization vendors.[^49]

### Common findings and recurring implementation issues

The recurring findings in the recent FINRA oversight reports are highly consistent. FINRA reported deficiencies involving incomplete submission of reportable events, failure to repair errors by the T+3 deadline, failure to submit corrections for inaccurate data, inaccurate or incomplete CAT order reporting, and unreasonable supervision, including weak supervision of third-party reporting agents and clock-synchronization arrangements. FINRA’s published effective practices include comparative review of CAT data against order/trade records, daily review of the CAT Reporter Portal, and written vendor agreements allocating error-management responsibilities.[^50]

FINRA’s more specific clock-synchronization best-practice language is also notable. In the 2026 oversight report, FINRA highlighted as an effective practice obtaining daily synchronization logs from third-party synchronization vendors and reviewing them to ensure drifts remain within acceptable thresholds, specifically citing 50 milliseconds. That is valuable because it shows how FINRA expects firms to evidence control when timing is outsourced.[^51]

At the more granular technical level, the OATS specifications show exactly how timestamp problems turn into surveillance problems. The OATS technical specifications explain that if the OATS execution timestamp does not match the execution time on the trade report, the execution event can fail matching criteria, producing unmatched reports and secondary data errors. FINRA’s trade-reporting FAQ similarly states that the trade-report execution time and the corresponding OATS execution timestamp must be identical and at the same level of granularity.[^37]

### Empirical evidence and surveillance-relevant data

The best public quantitative evidence on the costs and practicality of tighter synchronization is the 2017 CAT Clock Synchronization Assessment. It reports that about 49% of respondents were already assessing synchronization practices daily. For a hypothetical 5 ms threshold, about 92% of respondents said they could implement within one year or less; for 1 ms, about 95% said the same; for 100 microseconds, about 70% said within a year and about 25% said 1–2 years. But uncertainty remained substantial: about 35% did not know their initial compliance cost for tighter thresholds, and about 40% did not know their ongoing cost.[^52]

The best public quantitative evidence on actual timestamp granularity in production is FINRA’s 2020 filing on finer timestamp granularity. As noted above, FINRA reported that on an average day in July 2020, 38.6% of order execution events were already reported at granularity finer than milliseconds, and 47.2% of firms using such reporting captured finer-than-millisecond timestamps; seven firms reported nanoseconds and together accounted for 5.5% of all execution events. That is strong evidence that the industry had materially outgrown milliseconds in some workflows even while 50 ms remained the regulatory synchronization envelope for Industry Members.[^6]

The enforcement record also shows how large timestamp failures can become when event-time integrity is not controlled. In one FINRA AWC involving a major ATS operator, the firm transmitted about 15.1 billion OATS ROEs that failed to report timestamps in milliseconds even though the ATS captured milliseconds, and it submitted about 38.6 million TRF trade reports that also failed to report execution timestamps in milliseconds during the relevant review period. FINRA stated that these failures made the audit trail inaccurate. In another AWC, FINRA found roughly 3.3 billion inaccurate or incomplete OATS ROEs, including over 1 billion inaccurate timestamps, plus about 332 million unreported ROEs, again emphasizing that such failures hamper automated surveillance and create false positives.[^53]

Taken together, those public data points support a clear analytical conclusion: the shift to millisecond reporting materially improved the regulatory baseline, but timestamp precision alone does not solve sequencing integrity. Sequencing integrity depends on four things working together: synchronized clocks, accurate event-source timestamps, correctly linked multi-message workflows, and disciplined exception repair. Public sources support each of those elements; no public source reviewed here provides a broad marketwide estimate of how often cross-firm sequencing disputes are caused solely by the 50 ms tolerance. That gap is important and should be acknowledged.[^54]

## Practical guidance

The most defensible operational posture is to treat 50 ms as a regulatory minimum, not a design target. The public record shows that many firms were already operating with finer internal granularity by 2020, and the SEC itself framed 50 ms as acceptable for CAT’s initial phases rather than an endpoint. Firms that want to minimize execution-order disputes should therefore design for materially tighter internal synchronization than the regulatory floor wherever their systems and market connections allow.[^55]

A practical control framework follows directly from the cited rules and guidance.

First, firms should establish a single authoritative time hierarchy—whether through in-house architecture or contracted providers—that explicitly measures the three components included in the tolerance: source offset, transmission delay, and local drift. Procedures should require synchronization before market open and intra-day rechecks, with escalation thresholds below the regulatory maximum so that remediation happens before 50 ms is reached.[^56]

Second, firms should stamp time at the event source—for example, the execution engine, OMS, routing gateway, or allocation engine that actually owns the event—and preserve both the original event time and any later reporting or transformation time. This is the only reliable way to keep bulk step-outs, ISO decision times, reversals, and "as/of" reporting from being mistaken for the original execution sequence.[^57]

Third, firms should enforce cross-system timestamp equivalence for the same event. FINRA has been explicit that related trade-report and OATS/CAT timestamps must match at the same granularity where they refer to the same execution. A reconciliation process should therefore compare execution-source logs, venue drop copies, FINRA Facility reports, and CAT submissions on a routine basis rather than waiting for a regulatory inquiry.[^58]

Fourth, firms should treat vendor oversight as a timing control, not merely a vendor-management control. FINRA’s recent guidance specifically points to collecting daily synchronization logs from third-party synchronization vendors and reviewing them against the 50 ms threshold. Written agreements with reporting agents or clock vendors should allocate responsibility for synchronization evidence, exception handling, correction timeliness, and self-reporting.[^59]

Fifth, firms should preserve the identifiers and metadata that make sequencing disputes resolvable: OATS Trade IDs or equivalent linkages, route IDs, control numbers on reversals, separate ISO snapshot times where required, and step-in/step-out pairing information. Timestamp quality without linkage quality is not enough, especially when routed orders cross firms whose clocks may be compliant but differ by up to 100 ms.[^60]

Finally, written supervisory procedures should explicitly cover who reviews timing issues, how often, what is sampled, how portal or feedback reports are reviewed, how T+3 CAT corrections are handled, and how self-reporting occurs. FINRA’s oversight reports and Regulatory Notice 20-31 make clear that supervision failures are now a first-order regulatory issue in this area, not merely a secondary one.[^61]

## Open questions and limitations

This report relies primarily on public SEC releases, FINRA filings, FINRA rule text, FINRA FAQs, CAT Plan materials, and FINRA oversight publications. Those sources are strong on rule development, operative dates, technical requirements, survey evidence, and examples of implementation failures, but they are much thinner on public marketwide statistics measuring how often 50 ms tolerance alone causes actual execution-order disputes. The strongest public evidence on sequencing error is therefore indirect: the CAT Plan’s own 100 ms divergence example, FINRA’s enforcement matters involving inaccurate timestamps, and exam findings showing incomplete or inaccurate event reporting.[^62]

I also did not identify, in the sources reviewed here, a standalone SEC "interpretive FAQ" focused solely on Rule 613 clock synchronization comparable to FINRA’s public FAQ regime. The SEC’s timing guidance is instead spread across the Rule 613 adopting release, the CAT NMS Plan approval order, the clock synchronization assessment, and related exemptive and implementation materials, while day-to-day operational guidance appears more heavily in FINRA/CAT notices and FAQs.[^63]

[^1]: <https://www.finra.org/rules-guidance/rulebooks/finra-rules/6380a>
[^2]: <https://www.sec.gov/files/rules/sro/finra/2014/34-71623.pdf>
[^3]: <https://www.finra.org/sites/default/files/notice_doc_file_ref/Notice_Regulatory_14-47.pdf>
[^4]: <https://www.sec.gov/files/rules/sro/nms/2016/34-79318.pdf>
[^5]: <https://www.finra.org/sites/default/files/RuleFiling/p384587.pdf>
[^6]: <https://www.finra.org/sites/default/files/2020-09/SR-FINRA-2020-029.pdf>
[^7]: <https://www.sec.gov/files/rules/sro/finra/2014/34-71623.pdf>
[^8]: <https://www.sec.gov/about/divisions-offices/division-trading-markets/rule-613-consolidated-audit-trail>
[^9]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^10]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^11]: <https://www.sec.gov/about/divisions-offices/division-trading-markets/rule-613-consolidated-audit-trail>
[^12]: <https://www.sec.gov/files/rules/sro/finra/2014/34-71623.pdf>
[^13]: <https://www.sec.gov/files/rules/sro/finra/2014/34-71623.pdf>
[^14]: <https://www.finra.org/sites/default/files/RuleFiling/p384587.pdf>
[^15]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/finra?field_display_title_value=&file_number=&month=All&order=field_release_number&page=82&release_number=&sort=asc&title=&year=All>
[^16]: <https://www.finra.org/sites/default/files/rule_filing_file/SR-FINRA-2014-039_0.pdf>
[^17]: <https://www.finra.org/rules-guidance/rulebooks/finra-rules/6380a>
[^18]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/finra?field_display_title_value=&file_number=&month=All&order=field_publish_date&page=77&release_number=&sort=asc&year=All>
[^19]: <https://www.sec.gov/rules-regulations/self-regulatory-organization-rulemaking/finra?field_display_title_value=&file_number=&month=All&order=field_publish_date&page=77&release_number=&sort=asc&year=All>
[^20]: <https://www.finra.org/sites/default/files/notice_doc_file_ref/Regulatory-Notice-16-23.pdf>
[^21]: <https://www.finra.org/sites/default/files/notice_doc_file_ref/Regulatory-Notice-16-23.pdf>
[^22]: <https://www.finra.org/sites/default/files/notice_doc_file_ref/Notice_Regulatory_14-47.pdf>
[^23]: <https://www.sec.gov/files/rules/sro/nms/2016/34-79318.pdf>
[^24]: <https://www.sec.gov/files/rules/sro/nms/2016/34-79318.pdf>
[^25]: <https://www.sec.gov/files/rules/sro/nms/2016/34-79318.pdf>
[^26]: <https://www.finra.org/sites/default/files/rule_filing_file/SR-FINRA-2014-039_0.pdf>
[^27]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
[^28]: <https://www.finra.org/sites/default/files/RuleFiling/p384587.pdf>
[^29]: <https://www.finra.org/rules-guidance/rulebooks/finra-rules/6380a>
[^30]: <https://www.finra.org/sites/default/files/2020-12/Regulatory-Notice-20-41.pdf>
[^31]: <https://www.finra.org/rules-guidance/rulebooks/finra-rules/6860>
[^32]: <https://www.finra.org/rules-guidance/rulebooks/finra-rules/4590>
[^33]: <https://www.finra.org/sites/default/files/notice_doc_file_ref/Notice_Regulatory_14-47.pdf>
[^34]: <https://www.sec.gov/divisions/marketreg/consolidated-audit-trail-clock-synchronization-assessment-051517.pdf>
[^35]: <https://www.sec.gov/files/rules/sro/nms/2016/34-79318-exhibit-a.pdf>
[^36]: <https://www.finra.org/rules-guidance/rulebooks/finra-rules/4590>
[^37]: <https://www.finra.org/sites/default/files/TechSpec_20150825.pdf>
[^38]: <https://www.nasdaqtrader.com/content/marketregulation/bserules/bxrules.pdf>
[^39]: <https://www.finra.org/filing-reporting/market-transparency-reporting/trade-reporting-faq>
[^40]: <https://www.finra.org/filing-reporting/market-transparency-reporting/trade-reporting-faq>
[^41]: <https://www.sec.gov/files/rules/sro/nms/2016/34-79318-exhibit-a.pdf>
[^42]: <https://www.finra.org/sites/default/files/RuleFiling/p384587.pdf>
[^43]: <https://www.finra.org/filing-reporting/market-transparency-reporting/trade-reporting-faq>
[^44]: <https://www.finra.org/rules-guidance/rulebooks/finra-rules/6380a>
[^45]: <https://www.finra.org/sites/default/files/rule_filing_file/SR-FINRA-2015-008.pdf>
[^46]: <https://www.finra.org/rules-guidance/rulebooks/finra-rules/6380a>
[^47]: <https://www.finra.org/sites/default/files/rule_filing_file/SR-FINRA-2015-008.pdf>
[^48]: <https://www.finra.org/sites/default/files/notice_doc_file_ref/Regulatory-Notice-17-09.pdf>
[^49]: <https://www.finra.org/rules-guidance/notices/20-31>
[^50]: <https://www.finra.org/sites/default/files/2025-01/2025-annual-regulatory-oversight-report.pdf>
[^51]: <https://www.finra.org/sites/default/files/2025-12/2026-annual-regulatory-oversight-report.pdf>
[^52]: <https://www.sec.gov/divisions/marketreg/consolidated-audit-trail-clock-synchronization-assessment-051517.pdf>
[^53]: <https://www.finra.org/sites/default/files/GSEC_AWC_072715.pdf>
[^54]: <https://www.sec.gov/files/rules/sro/nms/2016/34-79318-exhibit-a.pdf>
[^55]: <https://www.sec.gov/divisions/marketreg/consolidated-audit-trail-clock-synchronization-assessment-051517.pdf>
[^56]: <https://www.finra.org/rules-guidance/rulebooks/finra-rules/4590>
[^57]: <https://www.finra.org/filing-reporting/market-transparency-reporting/trade-reporting-faq>
[^58]: <https://www.finra.org/sites/default/files/TechSpec_20150825.pdf>
[^59]: <https://www.finra.org/sites/default/files/2025-12/2026-annual-regulatory-oversight-report.pdf>
[^60]: <https://www.finra.org/sites/default/files/TechSpec_20150825.pdf>
[^61]: <https://www.finra.org/sites/default/files/2024-01/2024-annual-regulatory-oversight-report.pdf>
[^62]: <https://www.sec.gov/files/rules/sro/nms/2016/34-79318-exhibit-a.pdf>
[^63]: <https://www.sec.gov/files/rules/final/2012/34-67457.pdf>
