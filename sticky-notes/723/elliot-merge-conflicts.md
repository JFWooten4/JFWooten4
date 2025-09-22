docs/learn/fundamentals/transactions/list-of-operations.mdx has Revoke Sponsorship`

- docs/learn/encyclopedia/storage/README.mdx (now also docs/learn/encyclopedia/contract-development/README.mdx)
  - This should be the description for the DEX section, not data
  - I guess the reorg removed this page
     - I FUKN GOT MOVED UP TO CORE CONCEPTS LOLLLLL ---- change the sidebar_label to `Stellar DEX` to match other CC's
- docs/learn/fundamentals/stellar-consensus-protocol.mdx
  - Replace H1 with vid thumbnail
- docs/learn/fundamentals/stellar-data-structures/accounts.mdx
   - Let's just make everyone's life easier with `—` 💜
- docs/tokens/control-asset-access.mdx 
  [fn]([^unless-regulated]: If you are issuing regulated assets, make sure to assign `low` signature threshold keys before removing access to `high` threshold master keypair. If you do intend to limit an asset's supply, then the `low` threshold signers should not be able to combine up to a `medium` threshold, which could issue new tokens. Relevantly, assuming `high` > `medium` weight for issuer account thresholds, you will not be able to change the `low` threshold signers after locking.) and [pg](It is possible to lock down the issuer account of an asset so that the asset’s supply cannot increase. To do this, first set the issuer account’s master weight to 0 using the Set Options operation.[^unless-regulated] This prevents the issuer account from being able to sign transactions and therefore, making the issuer unable to issue any more assets. Be sure to do this only after you’ve issued all desired assets to the distributor account. If the asset has a Stellar Asset Contract, also make sure the admin for the contract was not updated from the default (which is the issuer) using the `set_admin` contract call. If the admin was not the issuer, then the admin would be able to mint the asset even with the issuer account locked.)

Longer explanations from `docs/learn/fundamentals/transactions/list-of-operations.mdx` at https://github.com/stellar/stellar-docs/pull/723/commits/4617740397abd294cd1eb49be772585977ebe5dc

