# Test Results — Simple Auction DApp

## Test environment

- **Solidity:** `^0.8.20`, compiled in Remix IDE (London EVM target for local Ganache compatibility).
- **Direct contract tests:** Remix VM (validations and readable revert reasons).
- **Integrated demonstration:** Ganache Desktop, MetaMask, and the HTML/JavaScript frontend.
- **Ganache network:** `http://127.0.0.1:7545`, chain ID `1337`.
- **Local deployed contract (demonstration instance):** `0x50F3a788E790C2f7Dd61f1862B58Ed316709CFBb`.
- **Sample item and minimum starting bid:** Football Jersey, `1 ETH`.

The Ganache demo instance shown in the evidence is **already closed and settled**, not available for another live bidding demo without redeployment.

## Successful test sequence — Ganache + frontend

| Step | Actor | Action | Observed result | Screenshot |
|---|---|---|---|---|
| 1 | Seller | Deploy `Auction` in Remix connected to Ganache (Value = `0 ETH`) | Contract created | [`02`](screenshots/02_remix_ganache_deployment.png) / [`03`](screenshots/03_ganache_contract_creation.png) |
| 2 | Seller | Connect the wallet and load the auction | Item = Football Jersey; starting bid = `1.0 ETH`; auction Open | [`05`](screenshots/05_wallet_connected_frontend.png) / [`06`](screenshots/06_onchain_data_frontend.png) |
| 3 | Alice | Call `placeBid` from the frontend, sending `2 ETH` | Bid accepted; Alice became current highest bidder | [`08`](screenshots/08_alice_successful_bid.png) |
| 4 | Bob | Bid `3 ETH` | Bob became highest bidder; Alice could claim `2 ETH` | [`09`](screenshots/09_bob_successful_bid.png) / [`10`](screenshots/10_alice_refund_available.png) |
| 5 | Alice | Call `withdrawRefund` | `2 ETH` returned (excluding gas); refundable amount reset to zero | [`11`](screenshots/11_alice_refund_completed.png) |
| 6 | Seller | Call `endAuction` | Auction marked Closed; winner and winning amount retained | [`12`](screenshots/12_auction_closed.png) |
| 7 | Seller | Call `withdrawProceeds` | Approximately `3 ETH` received, minus gas | [`13`](screenshots/13_seller_proceeds_received.png) |

## Invalid or unauthorized tests — Remix VM

| Test | Trigger | Required condition | Expected result | Observed result | Evidence |
|---|---|---|---|---|---|
| Bid below minimum | Bid `< startingBid` | `msg.value >= startingBid` | Revert | `Below starting bid` | [`14`](screenshots/14_invalid_below_starting_bid.png) |
| Bid after closure | Bid with `ended == true` | `!ended` | Revert | `Auction has ended` | [`15`](screenshots/15_invalid_bid_after_closure.png) |
| Unauthorized closure | Non-seller calls `endAuction()` | `msg.sender == seller` | Revert | `Only seller can end auction` | [`16`](screenshots/16_unauthorized_auction_closure.png) |
| Repeated payout | Seller calls `withdrawProceeds()` after it succeeded | `!proceedsWithdrawn` | Revert | `Already withdrawn` | [`17`](screenshots/17_invalid_double_withdrawal.png) |
| Repeated refund | Bidder calls `withdrawRefund()` when credited refund is zero | `amount > 0` | Revert | `No refund available` | [`18`](screenshots/18_invalid_double_refund.png) |

### Why some Ganache error messages were less clear

During the later tests performed via Remix's *external HTTP provider* connected to Ganache, the RPC/error-handling interface sometimes showed **`Gas estimation failed`**, **`missing revert data`**, or a Remix JavaScript exception (`error.indexOf is not a function`). These messages are not evidence that the Solidity validation failed; they appeared when the attempted operation could not proceed. The Remix VM images above contain the clearest `require` messages. **A preflight gas-estimation failure should not be presented as a mined failed transaction.**
