import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { assert } from "console";
import { MintNFT } from "../typechain-types";
import { NFTDutchAuction } from "../typechain-types/contracts/NFTDutchAuction";
// import { Signer } from "ethers";

// testing  MintNFT contract
describe("MintNFT", function () {
  let MintNFTFactory: any;
  let mintNFTToken: any;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    MintNFTFactory = await ethers.getContractFactory("MintNFT");
    [owner, addr1] = await ethers.getSigners();
    mintNFTToken = await MintNFTFactory.deploy(10);
    await mintNFTToken.deployed();
  });

  describe("deployment with max supply", function () {
    it("should set the max supply", async function () {
      expect(await mintNFTToken.maxSupply()).to.equal(10);
    });
  });

  describe("safeMint", function () {
    it("should mint a new NFT to the owner", async function () {
      const uri = "https://example.com/token/1";
      await mintNFTToken.safeMint(owner.address, uri);
      expect(await mintNFTToken.balanceOf(owner.address)).to.equal(1);
    });

    it("should not mint more tokens than the max supply", async function () {
      const uri = "https://example.com/token/1";
      for (let i = 0; i < 10; i++) {
        await mintNFTToken.safeMint(owner.address, uri);
      }
      await expect(mintNFTToken.safeMint(owner.address, uri)).to.be.revertedWith(
        "Max number of tokens minted"
      );
    });
  });
});

describe("Deploying Contract", function () {
  async function deployDutchAuction() {
    // signers are objects that represent an ethereum account
    const [owner, account1, account2] = await ethers.getSigners();
    // ContractFactory is an abstraction used to deploy new smart contracts, so whatever is in " " is a factory for instances of our token contract
    const basicDutchAuctionFactory = await ethers.getContractFactory("NFTDutchAuction");
    // calling deploy() on a ContractFactory will start the deployment and return a promise that resovles to a contract
    // this is the object that has a method for each of your smart contract functions
    const basicDutchAuctionToken = await basicDutchAuctionFactory.connect(owner).deploy(owner.address, 0, 100, 10, 10);
    // gets the balance of the owner account by calling balanceOf() method
    const ownerBalance  = await basicDutchAuctionToken.balanceOf(owner.address);
    // gets balance of 2 accounts
    const accountOneBalance = await basicDutchAuctionToken.balanceOf(account1.address);
    const accountTwoBalance = await basicDutchAuctionToken.balanceOf(account2.address);
    return { basicDutchAuctionToken, owner, account1, account2, accountOneBalance, accountTwoBalance};
  }
  // await tells the compiler not to go line by line
  it('reserve price - 100 wei' , async function(){
    const { basicDutchAuctionToken, owner } = await loadFixture(deployDutchAuction);
    expect(await basicDutchAuctionToken.getReservePrice()).to.equal(100);
  });

  it('num blocks auction open for - 10' , async function(){
    const { basicDutchAuctionToken, owner } = await loadFixture(deployDutchAuction);
    expect(await basicDutchAuctionToken.getNumBlocksAuctionOpen()).to.equal(10);
  });

  it('offer price decrement - 10 wei' , async function(){
    const { basicDutchAuctionToken, owner } = await loadFixture(deployDutchAuction);
    expect(await basicDutchAuctionToken.getPriceDecrement()).to.equal(10);
  });

  it("checking if initial price is 200 wei", async function () {
    const { basicDutchAuctionToken, owner } = await loadFixture(deployDutchAuction);
    expect(await basicDutchAuctionToken.getCurrentPrice()).to.equal(200);
  });

  describe("Set Mint Contract Address", function () {
    it("checking mint contract address function", async function () {
      const { basicDutchAuctionToken, owner } = await loadFixture(deployDutchAuction);
      expect(await basicDutchAuctionToken.setMintContractAddress(owner.address));
    });
  });

  describe("Checking Seller", function () {
    it('is owner of this contract the seller', async function(){
      const { basicDutchAuctionToken, owner } = await loadFixture(deployDutchAuction);
      expect( await basicDutchAuctionToken.getSellerAddress()).to.equal(owner.address);
    });

    it('bid from seller account', async function(){
      const { basicDutchAuctionToken, owner } = await loadFixture(deployDutchAuction);
      expect( basicDutchAuctionToken.connect(owner).bid({value: 200})).to.be.revertedWith("Owner cannot submit bid on own item");
    });

    describe('Checking Bidders', function () {
        /*
        it('checks if bidder has more than 0 wei', async function(){
          const { basicDutchAuctionToken, account1 } = await loadFixture(deployDutchAuction);
          expect( await basicDutchAuctionToken.balanceOf(account1.address)).to.greaterThan(ethers.utils.parseUnits("0", 1)).to.be.revertedWith("Your accounts balance is not greater than 0");
        });
        */
      
        it('bid accepted - 200 wei - sufficient amount', async function(){
          const { basicDutchAuctionToken, account1 } = await loadFixture(deployDutchAuction);
          expect( basicDutchAuctionToken.connect(account1).bid({value: 200}));
        });
      
        it('bid rejected - 100 wei - insufficient amount', async function(){
          const { basicDutchAuctionToken, owner } = await loadFixture(deployDutchAuction);
          expect( basicDutchAuctionToken.connect(owner).bid({value: 100})).to.be.revertedWith("You have not bid sufficient funds");
        });

        it('multiple bids - first bid greater than current price, second bid lower', async function(){
          const { basicDutchAuctionToken, account1, account2 } = await loadFixture(deployDutchAuction);
          expect( basicDutchAuctionToken.connect(account1).bid({from: account1.address, value: 220}
        ));
        expect( basicDutchAuctionToken.connect(account2).bid({from: account2.address, value: 180}
          ));
        });
    
        it('multiple bids - both bids higher than current price', async function(){
          const { basicDutchAuctionToken, account1, account2 } = await loadFixture(deployDutchAuction);
          expect( basicDutchAuctionToken.connect(account1).bid({from: account1.address, value: 300}
            ));
          expect( basicDutchAuctionToken.connect(account2).bid({from: account2.address, value: 280}
            ));
        });

        it('check for winner', async function(){
          const { basicDutchAuctionToken, owner } = await loadFixture(deployDutchAuction);
          expect( basicDutchAuctionToken.getWinner()).to.be.revertedWith('You are the winner');
        });

        it('auction ended - winner already chosen', async function(){
          const { basicDutchAuctionToken, account1, account2 } = await loadFixture(deployDutchAuction);
          const winner = account1;
          expect(basicDutchAuctionToken.connect(account2).bid({from: account2.address, value: 220}
          ));
        });

        it('auction ended - reject bid because select number of blocks passed', async function(){
          const { basicDutchAuctionToken, account1 } = await loadFixture(deployDutchAuction);
          expect( basicDutchAuctionToken.connect(account1).bid({from: account1.address, value: 200})).to.be.revertedWith("Auction has closed - total number of blocks the auction is open for have passed");
        });
    });
  });
});



/*
describe("NFT Dutch Auction", function() {

    let nftDutchAuctionFactory: any;
    let nftDutchAuctionToken: any;
    let owner: any;
    let address1: any;
    let address2: any;

    beforeEach(async function () {
      nftDutchAuctionFactory = await ethers.getContractFactory("NFTDutchAuction");
      [owner, address1, address2] = await ethers.getSigners();
      const nftDutchAuctionToken = await nftDutchAuctionFactory.connect(owner).deploy(owner.address, 0, 100, 10, 10);
      await nftDutchAuctionToken.deployed();
    });
    
    describe("Deployment", async function () {
      // await tells the compiler not to go line by line
      it('reserve price - 100 wei' , async function(){
        expect(nftDutchAuctionToken.getReservePrice()).to.equal(100);
      });

      it('num blocks auction open for - 10' , async function(){
        expect(await nftDutchAuctionToken.getNumBlocksAuctionOpen()).to.equal(10);
      });

      it('offer price decrement - 10 wei' , async function(){
        expect(await nftDutchAuctionToken.getPriceDecrement()).to.equal(10);
      });

      it("checking if initial price is 200 wei", async function () {
        expect(await nftDutchAuctionToken.getCurrentPrice()).to.equal(200);
      });
  });
  
  
    describe("Checking Seller", async function () {
  
    });
    describe("Checking Bidders", async function () {
  
    });
});
*/