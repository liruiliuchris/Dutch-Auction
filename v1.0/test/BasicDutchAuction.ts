import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from 'chai';
import { ethers } from 'hardhat';
// import { ethers } from "@nomiclabs/buidler";
import { Contract, Signer } from 'ethers';

describe('Deploy the Dutch Auction Contract', function () {


  async function deployContractDA() {

    const RESERVE_PRICE = 1000;
    const NUM_BLOCKS_AUCTION_OPEN = 10;
    const PRICE_DECREMENT = 100;
    // Contracts are deployed using the first signer/account by default
    const Contract = await ethers.getContractFactory('BasicDutchAuction');
    const contract = await Contract.deploy(
      RESERVE_PRICE,
      NUM_BLOCKS_AUCTION_OPEN,
      PRICE_DECREMENT,
    );
    await contract.deployed();
    return { contract, RESERVE_PRICE, NUM_BLOCKS_AUCTION_OPEN, PRICE_DECREMENT };
  }

  it('Should Deploy contract correctly', async function () {
    const { contract } = await loadFixture(deployContractDA);

    expect(await contract.deployed());
  });

  it("Should set the right curPrice", async function () {
    const { contract, RESERVE_PRICE, NUM_BLOCKS_AUCTION_OPEN, PRICE_DECREMENT } = await loadFixture(deployContractDA);
    const curPrice = RESERVE_PRICE + (PRICE_DECREMENT * NUM_BLOCKS_AUCTION_OPEN);
    expect(await contract.currentPrice()).to.equal(curPrice);
  });


  describe('Working of the BasicDutchAuction', () => {
    let contract: Contract;
    let owner: Signer;
  
    beforeEach(async () => {
      [owner] = await ethers.getSigners();
      const Contract = await ethers.getContractFactory('BasicDutchAuction');
      contract = await Contract.deploy(1000, 100, 10);
      await contract.deployed();
    });
  
    it('should deploy the contract', async () => {
      expect(contract.address).to.not.be.null;
    });
  
    it('should set the correct reserve price', async () => {
      expect(await contract.reservePrice()).to.equal(1000);
    });
  
    it('should set the correct initial price', async () => {
      expect(await contract.initialPrice()).to.equal(1000 + (100 * 10));
    });
  
    it('should set the correct current price', async () => {
      expect(await contract.currentPrice()).to.equal(1000 + (100 * 10));
    });
  
    // it('should accept a valid bid', async () => {
    //   const result = await contract.bid({ value: 1500 });
    //   expect(result.hash).to.not.be.null;
    // });
  
    // it('should set the correct winning address', async () => {
    //   await contract.bid({ value: 1500 });
    //   expect(await contract.winnerAddress()).to.equal(await owner.getAddress());
    // });
  
    // it('should set the correct winning bid amount', async () => {
    //   await contract.bid({ value: 1500 });
    //   expect(await contract.winningBidAmount()).to.equal(1500);
    // });
  
    // it('should end the auction', async () => {
    //   await contract.bid({ value: 1500 });
    //   expect(await contract.auctionEnded()).to.be.true;
    // });
  
    // it('should refund a bid', async () => {
    //   const bidAmount = 1000;
    //   const balanceBefore = await owner.getBalance();
    //   await contract.bid({ value: bidAmount });
    //   await contract.refundBid();
    //   const balanceAfter = await owner.getBalance();
    //   expect(balanceAfter.sub(balanceBefore).toNumber()).to.equal(bidAmount);
    // });
  
  });

  // describe('Working of the Dutch Auction', function () {
  //   let dutchAuction:  ethers.Contract;
  //   let wallet: ethers.Signer;

  //   beforeEach(async () => {
  //     [wallet] = await ethers.getSigners();
  //     dutchAuction = await deployContractDA();
  //   });

  // });
    
});





