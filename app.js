const contractAddress = "0x50F3a788E790C2f7Dd61f1862B58Ed316709CFBb";
const contractABI = [
    "function itemName() view returns (string)",
    "function startingBid() view returns (uint256)",
    "function highestBid() view returns (uint256)",
    "function highestBidder() view returns (address)",
    "function ended() view returns (bool)",
    "function proceedsWithdrawn() view returns (bool)",
    "function seller() view returns (address)",
    "function refunds(address) view returns (uint256)",
    "function placeBid() payable",
    "function withdrawRefund()",
    "function endAuction()",
    "function withdrawProceeds()"
];

const GANACHE_CHAIN_ID = 1337n;
let provider;
let signer;
let contract;
let userAddress;

function showMessage(message) {
    document.getElementById("message").textContent = message;
}

async function connectWallet() {
    try {
        if (!window.ethereum) {
            showMessage("Please install MetaMask.");
            return;
        }
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const network = await provider.getNetwork();
        if (network.chainId !== GANACHE_CHAIN_ID) {
            showMessage("Please switch MetaMask to Ganache Local.");
            return;
        }
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        document.getElementById("walletAddress").textContent = "Connected: " + userAddress;
        showMessage("Wallet connected successfully!");
        await loadAuctionDetails();
    } catch (error) {
        console.error(error);
        showMessage("Wallet connection failed: " + (error.shortMessage || error.message));
    }
}

async function loadAuctionDetails() {
    if (!contract) {
        showMessage("Connect MetaMask first.");
        return;
    }
    try {
        const [item, starting, highest, bidder, isEnded, withdrawn, sellerAddress, refund] = await Promise.all([
            contract.itemName(), contract.startingBid(), contract.highestBid(),
            contract.highestBidder(), contract.ended(), contract.proceedsWithdrawn(),
            contract.seller(), contract.refunds(userAddress)
        ]);
        document.getElementById("itemName").textContent = item;
        document.getElementById("startingBid").textContent = ethers.formatEther(starting) + " ETH";
        document.getElementById("highestBid").textContent = ethers.formatEther(highest) + " ETH";
        document.getElementById("highestBidder").textContent =
            bidder === ethers.ZeroAddress ? "No bids yet" : bidder;
        document.getElementById("auctionStatus").textContent = isEnded ? "Closed" : "Open";
        document.getElementById("refundAmount").textContent = ethers.formatEther(refund) + " ETH";
        const isSeller = userAddress.toLowerCase() === sellerAddress.toLowerCase();
        const isHighestBidder = userAddress.toLowerCase() === bidder.toLowerCase();
        document.getElementById("bidBtn").disabled = isEnded || isSeller || isHighestBidder;
        document.getElementById("refundBtn").disabled = refund === 0n;
        document.getElementById("endBtn").disabled = !isSeller || isEnded;
        document.getElementById("withdrawBtn").disabled =
            !isSeller || !isEnded || withdrawn || highest === 0n;
    } catch (error) {
        console.error(error);
        showMessage("Failed to load auction details. Check Ganache and the contract address.");
    }
}

async function sendTransaction(transactionPromise, description) {
    try {
        showMessage("Waiting for MetaMask: " + description);
        const tx = await transactionPromise;
        showMessage("Transaction submitted. Waiting for confirmation...");
        const receipt = await tx.wait();
        if (receipt.status !== 1) {
            throw new Error("Transaction failed.");
        }
        showMessage(description + " successful!");
        await loadAuctionDetails();
    } catch (error) {
        console.error(error);
        showMessage(error.reason || error.shortMessage || error.message || "Transaction failed.");
    }
}

async function placeBid() {
    if (!contract) {
        showMessage("Connect MetaMask first.");
        return;
    }
    const amount = document.getElementById("bidAmount").value.trim();
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        showMessage("Enter a valid positive bid amount.");
        return;
    }
    try {
        const value = ethers.parseEther(amount);
        await sendTransaction(contract.placeBid({ value }), "Bid");
    } catch (error) {
        showMessage("Invalid ETH amount: " + error.message);
    }
}

async function withdrawRefund() {
    if (!contract) {
        showMessage("Connect MetaMask first.");
        return;
    }
    await sendTransaction(contract.withdrawRefund(), "Refund withdrawal");
}

async function endAuction() {
    if (!contract) {
        showMessage("Connect MetaMask first.");
        return;
    }
    await sendTransaction(contract.endAuction(), "Auction closure");
}

async function withdrawProceeds() {
    if (!contract) {
        showMessage("Connect MetaMask first.");
        return;
    }
    await sendTransaction(contract.withdrawProceeds(), "Seller withdrawal");
}

async function refreshConnection() {
    provider = undefined;
    signer = undefined;
    contract = undefined;
    userAddress = undefined;
    document.getElementById("walletAddress").textContent = "Wallet not connected";
    await connectWallet();
}

if (window.ethereum) {
    window.ethereum.on("accountsChanged", refreshConnection);
    window.ethereum.on("chainChanged", refreshConnection);
}

document.getElementById("connectBtn").addEventListener("click", connectWallet);
document.getElementById("refreshBtn").addEventListener("click", loadAuctionDetails);
document.getElementById("bidBtn").addEventListener("click", placeBid);
document.getElementById("refundBtn").addEventListener("click", withdrawRefund);
document.getElementById("endBtn").addEventListener("click", endAuction);
document.getElementById("withdrawBtn").addEventListener("click", withdrawProceeds);
