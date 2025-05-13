Re [ongoing developments](https://github.com/users/JFWooten4/projects/1/views/1?pane=issue&itemId=86699622), I need to figure out how deeply to dive into the present DEX functionality as a given starting point for discussion around next steps for SPEEDEX. For instance, should I dive into passive sell offers (with examples) or not?

## Pros

- Entrenches the present system, making it resilient to change
  - Better specific examples can lead people to integrate those cases into their apps or businesses
  - The more people using SDEX-specific features, the harder it will be to remove it later on
  - _see_ arguments for claimable balances and subsequent general deference to frontend
- More people can understand how to use these awesome tools in a single case-specific reference area, rather than scrolling through all the boring txn info
- A lot of community members don't seem to understand the significance of the SDEX in the context of free markets and the entrenched DTCC system so common globally
  - This can be used as a counterpoint to the CCP regime in _Liquidity is its own Incentive_
  - New community members could join with an understanding that the DEX and native AMMs are fkn cool
  - The censorship, centralization, and regulatory risks of Soroban implementations and off-chain work can be easily explained with the authorization determinism context of intermediate account trustlines (and trusting not the exchange here but the actual issuer with jurisdictional purview, as required for a common conversation scheme)

## Cons

- Could seriously delay from EoY attempt, potentially causing material mismatch between regulatory review in Jan[^hoi]
  - Unsure how long it will take to complete the review
  - A lot of code to review
  - Still have 2 more sections
- Could make it harder down the road to implement SPEEDEX if people are using these specifics
  - Now you need to port things over to SPEEDEX
  - This goes against the prevailing `create_SPEEDEX_offer` logic presented at the start
  - "SpeedX [sic] is one thing, it is really going to help democratize access to liquidity pools, it is also going to help set us up for the scalability needs of the network" &mdash; [Tomer](https://thecurrencyanalytics.com/altcoins/tomer-weller-on-speedx-on-stellar-lumens-xlm-network-during-meridian-2021-35843)

## Call

Full detail disclosure, exemplification

[^hoi]: John from the future just chiming in here that I put forth material efforts, and this ended up coming true. The extra EoY workload delayed any January filing, pushing TAR1 back to May, which turned out well. 💜
