Re [ongoing developments](https://github.com/users/JFWooten4/projects/1/views/1?pane=issue&itemId=86699622), I need to figure out how deeply to dive into the present DEX functionality as a given starting point for discussion around next steps for SPEEDEX. For instance, should I dive into passive sell offers (with examples) or not.

## Pros

- Entranches the present system, making it reslient to change
  - Better specific dxamples can lead people to integrate those cases into their apps or businesses
  - The more people using SDEX specific fetures, the harder it will be to remove it later on
  - _see_ argumentsfor claimable balances and subsequent general defference to frontend
- More poeple can understand how to use these awesome tools in a singple a case-secific reference area, rather than scrolling through all teh boring txn info
- A lot of community members don't seem to understand the significance of the SDEX in the context of free markets and the entranched DTCC systrem so common globally
  - This can be used as a counterpoint to the CCP regime in _Liquidity is its own Incentive_
  - New community members could join with an understanding that the DEX and native AMMs are fkn cool
  - The censorship, centralization, and regulatory risks of Soroban implmenetations and offchain wprk can be easily explaining with the authoriziation determinism context of intermediate account trustlines (and trustlinng not the exchange here but the actual issuer with juristdictional perviuw, as required for a common conversaion schem)

## Cons

- Could seriously delay from EoY attempt, potentially caussing material mismatch between regualroy review in Jan
  - Unsure how long it will tkae ot complete hte review
  - A lot of code to review
  - Still have 2 more sections
- Could make it harder down the road to implement SPEEDEX if people are using these speicifcs
  - Now you need to port things over to SPEEDEX
  - This goes against the prevailing `create_SPEEDEX_offer` logic presented at the start
  - "SpeedX [sic] is one thing, it is really going to help democratize access to liquidity pools, it is also going to help set us up for the scalability needs of the network" &mdash;[Tomer](https://thecurrencyanalytics.com/altcoins/tomer-weller-on-speedx-on-stellar-lumens-xlm-network-during-meridian-2021-35843)

## Call

Full detail disclosure, exemplification
