People use both the liquidity pools and the orderbook.


Only in scenario 3 does it make sense to go to the effort to combine the liquidity of the pools and the orderbooks. If we do end up with scenario 3 it is straightforward to combine the liquidity sources after the fact as described in CAP 37. Our general philosophy has always been that we should maintain flexibility as much as possible when we add things and start with the minimal necessary set of features. It seems like it just makes sense to roll out the simple version first and if it gets adoption and it seems necessary we can improve it.



So for now:

- We would like to proceed with something similar to CAP 38

- There will only be one pool per asset pair

- We will interleave liquidity later if both forms of liquidity are being used. 

- We will work on doing something to make the flooding arbitrage transactions less attractive




from. https://groups.google.com/g/stellar-dev/c/Ofb2KXwzva0/m/76y0zk85BgAJ