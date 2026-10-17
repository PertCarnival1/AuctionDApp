# Simple Auction DApp

A basic auction application built using Solidity, Ganache, MetaMask and Ethers.js. Users can bid with test ETH, withdraw their money when they are outbid, and view the auction's current status. The seller can end the auction and withdraw the winning bid.

I built this as part of my Blockchain Technology assignment. The main focus was the smart contract and testing its rules; the frontend is a simple HTML/CSS/JavaScript page for interacting with it.

## 1. Problem addressed by the DApp

In a regular online auction, the website operator controls the bids and payments. Here, the smart contract holds the ETH being bid and enforces the auction rules. A seller cannot withdraw the winning amount while bidding is open, and an outbid participant can claim their refund directly from the contract.

The contract records who has the highest bid and prevents invalid bids or repeated withdrawals. It doesn't handle delivery of the item, so that part would still have to happen outside the DApp.

### Features

- The seller deploys an auction for an item with a starting price.
- Anyone except the seller can bid, provided their bid is higher than the previous bid.
- When a bidder is outbid, their previous bid becomes available for withdrawal.
- Only the seller can end the auction and collect the winning amount.
- The page displays the item, starting price, highest bid, bidder, status and any refund available to the connected wallet.
- MetaMask is used to approve and sign transactions.

This version supports **one auction per contract deployment**. It uses test ETH only.

### Smart contract functions

The contract is in [`auction.sol`](auction.sol).

| Function | Purpose |
|---|---|
| `constructor()` | Stores the item, starting price and seller address. |
| `placeBid()` | Accepts ETH and updates the highest bid and bidder. |
| `withdrawRefund()` | Returns the caller's previous bid if they have been outbid. |
| `endAuction()` | Closes bidding; only the seller can call it. |
| `withdrawProceeds()` | Sends the winning bid to the seller after closure, once. |
| Public getters | Read auction details and refund balances. |

The refund logic uses a `mapping(address => uint256)` to track what each bidder can withdraw. If Alice bids 2 ETH and Bob later bids 3 ETH, Alice's refund becomes 2 ETH. She can then call `withdrawRefund()` herself.

The contract clears the refund amount before transferring ETH, and it marks the seller's proceeds as withdrawn before paying them. This prevents a successful withdrawal from being repeated. ETH amounts are stored in wei internally; the frontend uses `ethers.parseEther()` and `ethers.formatEther()` so users can work in ETH.

## 2. Steps required to execute the application

### Requirements and tools

| Tool | Use |
|---|---|
| Solidity (`^0.8.20`) | Smart contract |
| Remix IDE | Compile, deploy and test the contract |
| Ganache Desktop | Local Ethereum blockchain and funded test accounts |
| MetaMask | Wallet connection and transaction approvals |
| Ethers.js v6 | Read contract data and send transactions from JavaScript |
| HTML, CSS, JavaScript | Frontend |
| VS Code Live Server | Run the website locally |

### Setup and deployment steps

1. Start Ganache Desktop. Check the RPC URL and chain ID in its settings.
2. In Remix, open `auction.sol` and compile it using Solidity 0.8.20 or newer (0.8.x). I used the **London EVM version** to avoid compatibility issues with Ganache Desktop.
3. In **Deploy & Run Transactions**, choose **Custom – External HTTP Provider** and enter the Ganache RPC URL. Select the Ganache account that will act as the seller.
4. Deploy `Auction` with an item name such as `Football Jersey` and starting bid `1`. Keep Remix's deployment **Value at 0 ETH**. The constructor takes the starting price in *whole ETH* and converts it to wei inside the contract.
5. In MetaMask, add a custom network with Ganache's RPC URL and chain ID. Import Ganache's development accounts for the seller and two bidders. These accounts come funded with fake ETH.
6. Copy the deployed contract's address from Remix into the `contractAddress` constant at the top of [`app.js`](app.js). If your chain ID differs from `1337`, update `GANACHE_CHAIN_ID` there as well.
7. Open the folder in VS Code and run `index.html` with **Live Server**. Connect MetaMask and refresh the auction details.

Ethers.js is loaded from a CDN in `index.html`, so an internet connection is needed to load that script even though Ganache itself runs locally.

**Don't upload Ganache private keys or seed phrases to GitHub.** The repository only needs the contract address, network details and source files.

### Connecting MetaMask and interacting with the contract

1. Open MetaMask and switch to the **Ganache Local** network (RPC and chain ID given below).

2. Import only Ganache's **local development accounts** for the seller and two bidders; never import a personal wallet's secret key into Ganache or commit any secret key to GitHub.

3. Start the frontend with VS Code **Live Server**, then click **Connect MetaMask** and approve access.

4. Click **Refresh Details** to read auction state. Switch to a bidder account to enter an amount in ETH and click **Place Bid**; confirm the transaction in MetaMask.

5. When another bidder outbids you, use **Withdraw Refund**. Switch to the seller account to use **End Auction** and then **Withdraw Proceeds**.

6. The frontend refreshes the auction details after successful transactions. If you start a new Ganache workspace or redeploy, update `contractAddress` in `app.js` first.

### Example interaction

The main workflow I tested was:

1. Seller deploys the auction with a 1 ETH starting price.
2. Alice bids 2 ETH through the frontend.
3. Bob bids 3 ETH and becomes the highest bidder.
4. Alice's refundable amount becomes 2 ETH, which she withdraws.
5. The seller closes the auction. Bob remains recorded as the winner.
6. The seller withdraws the winning 3 ETH.

All payments here use **Ganache test ETH**, not real money. Wallet balances also change slightly due to transaction gas fees.

## 3. Deployment network and smart contract address

The screenshots were taken with the following Ganache setup:

| Setting | Value |
|---|---|
| RPC URL | `http://127.0.0.1:7545` |
| Chain ID | `1337` |
| Contract | `Auction` |
| Contract address | `0x50F3a788E790C2f7Dd61f1862B58Ed316709CFBb` |
| Item | Football Jersey |
| Starting bid | 1 ETH |

**Note:** This address belongs to a local Ganache deployment that has already finished. To run a new auction, deploy the contract again and replace the address in `app.js`. It is not a public Sepolia or Mainnet deployment.

## 4. Test cases for valid, invalid, and unauthorised inputs

I tested the Solidity functions in **Remix VM** and the end-to-end application using **Ganache, MetaMask and the frontend**. The observed results are listed below.

### Valid inputs and successful operations

| Test | Expected | Observed |
|---|---|---|
| Alice bids 2 ETH | Alice becomes highest bidder | Passed |
| Bob bids 3 ETH | Bob becomes highest bidder; Alice gets refund entitlement | Passed |
| Alice withdraws refund | Alice gets 2 ETH back and refund becomes zero | Passed |
| Seller closes auction | Status changes to Closed | Passed |
| Seller withdraws proceeds | Seller receives winning 3 ETH | Passed |

### Invalid inputs and repeated operations

| Test | Expected | Observed |
|---|---|---|
| Bid below starting price | Rejected | `Below starting bid` |
| Bid after closure | Rejected | `Auction has ended` |
| Seller withdraws twice | Rejected | `Already withdrawn` |
| Bidder withdraws refund twice | Rejected | `No refund available` |

### Unauthorised operation

| Test | Expected | Observed |
|---|---|---|
| Non-seller ends auction | Rejected | `Only seller can end auction` |

The failed-operation screenshots with readable Solidity revert reasons are from Remix VM. When I repeated some invalid operations through Remix connected to Ganache, Remix sometimes displayed a gas-estimation or error-formatting warning instead of the original revert string. A failed gas estimate is not necessarily a mined failed transaction.

For more test details, see [TEST_RESULTS.md](TEST_RESULTS.md).

## 5. Screenshots

The screenshots below follow the six evidence categories listed in the assignment instructions. All images are stored under [`screenshots/`](screenshots/).

### 1. Smart contract compilation

Solidity compilation in Remix:

![Solidity compilation in Remix](screenshots/01_compilation.png)

### 2. Smart contract deployment

Auction deployment in Remix:

![Auction deployment in Remix](screenshots/02_remix_ganache_deployment.png)

Contract creation transaction in Ganache:

![Contract creation transaction in Ganache](screenshots/03_ganache_contract_creation.png)

### 3. MetaMask wallet connection

Frontend connected to MetaMask:

![Frontend connected to MetaMask](screenshots/05_wallet_connected_frontend.png)

### 4. Successful transactions

Alice places a 2 ETH bid:

![Alice places a 2 ETH bid](screenshots/08_alice_successful_bid.png)

Bob becomes the highest bidder with 3 ETH:

![Bob becomes the highest bidder with 3 ETH](screenshots/09_bob_successful_bid.png)

Alice's refund available:

![Alice's refund available](screenshots/10_alice_refund_available.png)

Alice withdraws her refund:

![Alice withdraws her refund](screenshots/11_alice_refund_completed.png)

Auction closed:

![Auction closed](screenshots/12_auction_closed.png)

Seller receives winning bid:

![Seller receives winning bid](screenshots/13_seller_proceeds_received.png)

### 5. Failed transactions

Bid below starting price rejected:

![Bid below starting price rejected](screenshots/14_invalid_below_starting_bid.png)

Bid after closure rejected:

![Bid after closure rejected](screenshots/15_invalid_bid_after_closure.png)

Non-seller cannot close auction:

![Non-seller cannot close auction](screenshots/16_unauthorized_auction_closure.png)

Seller cannot withdraw twice:

![Seller cannot withdraw twice](screenshots/17_invalid_double_withdrawal.png)

Bidder cannot withdraw refund twice:

![Bidder cannot withdraw refund twice](screenshots/18_invalid_double_refund.png)

### 6. Blockchain data displayed through the user interface

Auction information retrieved from contract:

![Auction information retrieved from contract](screenshots/06_onchain_data_frontend.png)

## 6. Repository files

```text
SimpleAuctionDApp/
├── auction.sol
├── index.html
├── style.css
├── app.js
├── README.md
├── TEST_RESULTS.md
└── screenshots/
    ├── 01_compilation.png
    ├── ...
    └── additional/       (remaining original screenshots)
```

## Notes

- The seller ends the auction manually; there is no built-in timer.
- The highest bidder cannot increase their own bid until someone else outbids them. This is a rule in the current contract.
- Refunds must be claimed by the bidder; they aren't sent automatically.
- The contract handles bids and ETH transfers, not delivery or verification of the physical item.
- If you restart Ganache with a different workspace, the old contract address may no longer be valid. Redeploy the contract and update `app.js`.
