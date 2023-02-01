// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";


contract BasicDutchAuction {

    address payable public addressOfOwner;
    address payable public winnerAddress;
    uint256 public auctionEndBlock;
    uint256 public reservePrice;
    // address judgeAddress;
    uint256 public numBlocksActionOpen;
    uint256 offerPriceDecrement;
    uint startBlockNumber;
    uint winningBidAmount;
    bool public auctionEnded;
    bool confirmed;
    uint public initialPrice;
    uint public currentPrice;



    constructor(uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {
        reservePrice = _reservePrice;
        numBlocksActionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        addressOfOwner = payable(msg.sender);
        startBlockNumber = block.number;
        auctionEndBlock = block.number + numBlocksActionOpen;
        initialPrice = _reservePrice + (_offerPriceDecrement * _numBlocksAuctionOpen);
        currentPrice = initialPrice;
        auctionEnded = false;
    }

    function bid() public payable returns(address) {
        // check if the auction has ended
        require(!auctionEnded, "Auction has ended");
        // check if the block number is within the time limit
        require(block.number < auctionEndBlock, "Auction has ended");
        // check if the bid is higher than the reserve price
        require(msg.value >= currentPrice, "Bid is lower than current price");

        require(winnerAddress == address(0), "Auction has already been won");
	
	// if the bid value is higher end the auction
        auctionEnded = true;

        winnerAddress = payable(msg.sender);
        addressOfOwner.transfer(msg.value);
        winningBidAmount = msg.value;
        return winnerAddress;
        // return address(0);
    }

    function updatePrice() internal {
        if (block.number >= auctionEndBlock) {
            auctionEnded = true;
            return;
        }
        currentPrice -= offerPriceDecrement;
    }

    // third party can finalize the auction
    // function finalize() public {
    //     // using the finlalize to transfer the amount
    //     require(auctionEnded && !confirmed);
    //     require(msg.sender == winnerAddress);
    //     confirmed = true;
    //     addressOfOwner.transfer(winningBidAmount);
    // }

    // function refund(uint256 refundAmount) public {
    //     // initiate the refund amount
    //     require(auctionEnded && !confirmed);
    //     require(msg.sender == judgeAddress);
    //     confirmed = true;
    //     winnerAddress.transfer(refundAmount);
    // }

    function refundBid() public {
        require(auctionEnded && msg.sender != winnerAddress, "Auction has not ended or you are the winning bidder.");
        address payable refundCaller = payable(msg.sender);
        refundCaller.transfer(address(this).balance);
    }
}