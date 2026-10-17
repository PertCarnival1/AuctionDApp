// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Auction {
    address payable public seller;
    string public itemName;
    uint256 public startingBid;
    uint256 public highestBid;
    address public highestBidder;
    bool public ended;
    mapping(address => uint256) public refunds;
    bool public proceedsWithdrawn;

    constructor(string memory _itemName, uint256 _startingBidInEth) {
        require(bytes(_itemName).length > 0, "Item name required");
        require(_startingBidInEth > 0, "Starting bid must be positive");
        seller = payable(msg.sender);
        itemName = _itemName;
        startingBid = _startingBidInEth * 1 ether;
    }

    function placeBid() external payable {
        require(!ended, "Auction has ended");
        require(msg.sender != seller, "Seller cannot bid");
        require(msg.sender != highestBidder, "Already highest bidder");
        require(msg.value >= startingBid, "Below starting bid");
        require(msg.value > highestBid, "Bid must exceed highest bid");
        if (highestBidder != address(0)) {
            refunds[highestBidder] += highestBid;
        }
        highestBid = msg.value;
        highestBidder = msg.sender;
    }

    function withdrawRefund() external {
        uint256 amount = refunds[msg.sender];
        require(amount > 0, "No refund available");
        refunds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund failed");
    }

    function endAuction() external {
        require(msg.sender == seller, "Only seller can end auction");
        require(!ended, "Auction already ended");
        ended = true;
    }

    function withdrawProceeds() external {
        require(msg.sender == seller, "Only seller");
        require(ended, "Auction must be ended");
        require(!proceedsWithdrawn, "Already withdrawn");
        require(highestBid > 0, "No winning bid");
        proceedsWithdrawn = true;
        (bool success, ) = seller.call{value: highestBid}("");
        require(success, "Payment failed");
    }
}