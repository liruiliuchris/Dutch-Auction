import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { assert } from "console";

describe("Auction", function () {
  let seller: any;
  let account: any;

  let erc20ContractCreator: any;
  let mintERC20Token: any;

  let mintNFTToken: any;
  let nftContractCreator: any;
  
  let nftDutchAuctionToken: any;

  // deploys the VToken contract
  it("VToken Contract Deployment", async function ()  {
    const [owner, address1] = await ethers.getSigners();
    seller = owner;
    account = address1;
    const MintERC20Factory = await ethers.getContractFactory("VToken");
    erc20ContractCreator = await MintERC20Factory.deploy(10000);
    mintERC20Token = await erc20ContractCreator.deployed();
  });
  // checks to see if the name and symbol is correct
  it("Should set the correct name and symbol", async () => {
    expect(await mintERC20Token.name()).to.equal("VToken");
    expect(await mintERC20Token.symbol()).to.equal("VT");
  });
  // mints 5000 VTokens
  it("Should mint 5,000 VTokens", async function () {
    expect(mintERC20Token.mintERC20(account.address, 5000));
    console.log("Mints 5,000 VToken to", (account.address));
  });
  it("Should set the max supply correctly to 10,000", async () => {
    const maxSupply = 10000;
    expect(await mintERC20Token.maxSupply()).to.equal(maxSupply);
  });
  // checks to see if the program will error out if we set max supply to 0
  it("Should not allow max supply to be set to 0", async () => {
    const maxSupply = 0;
    const badMintERC20Factory = await ethers.getContractFactory("VToken", erc20ContractCreator);
    expect(badMintERC20Factory.deploy(0)).to.be.revertedWith("Max token supply must be greater than 0");
  });
  // checks to see if the program will error out if we set max supply to over 10000
  it("Should not allow max supply to be greater than 10,000", async () => {
    const maxSupply = 10001;
    const tooLargeMintERC20Factory = await ethers.getContractFactory("VToken", erc20ContractCreator);
    expect(tooLargeMintERC20Factory.deploy(10001)).to.be.revertedWith("Max token supply must be less than or equal to 10,000");
  });
  // checks to see if tokens are being minted after max supply has been minted
  it("Should not mint tokens after max supply have been minted", async function () {
    expect(mintERC20Token.mintERC20(seller.address, 10000)).to.be.revertedWith("Number of tokens minted to this address should be less than the max supply");
  });

// deploys MintNFT contract
  it("MintNFT Contract Deployment", async function ()  {
    const [owner, address1] = await ethers.getSigners();
    seller = owner;
    account = address1;
    const MintDutchAuctionFactory = await ethers.getContractFactory("MintNFT");
    nftContractCreator = await MintDutchAuctionFactory.deploy(10);
    mintNFTToken = await nftContractCreator.deployed();
  });
  // checks if max supply for the NFTs are set to 10
  it("Should set max supply of NFTs minted to 10(index 0-9)", async function () {
    expect(await mintNFTToken.maxSupply()).to.equal(10);
  });
  // checks if there are more NFTs than the max supply being minted
  it("Should not mint more tokens than the max supply", async function () {
    for (let i = 0; i < 10; i++) {
      await mintNFTToken.safeMint(seller.address);
    }
    await expect(mintNFTToken.safeMint(seller.address)).to.be.revertedWith(
      "Max number of tokens minted"
    );
  });
  // mints NFT
  it("Should test NFT minting", async function () {
    await expect(mintNFTToken.safeMint(seller.address));
    console.log("Mints NFT to", (seller.address));
  });
  // checks safeMint function from external address
  it("Should test safeMint from bidders account", async function ()  {
    await expect(mintNFTToken.connect(account).safeMint(account.address));
  });
  // deploys NFTDutchAuction contract and proxy and initializes with given variables
  it("NFTDutchAuction Contract Deployment through Proxy", async function () {
    const MintDutchAuctionFactory = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
    const mintNFTDutchAuction = await upgrades.deployProxy(
    MintDutchAuctionFactory,
    [mintERC20Token.address, mintNFTToken.address, 0, 200, 50, 4],
    {
      kind: "uups",
      initializer: "initialize(address, address, uint256, uint256, uint256, uint256)"
    });
    nftDutchAuctionToken = await mintNFTDutchAuction.deployed();
    console.log(nftDutchAuctionToken);
    console.log("NFTDutchAuction contract address is", (nftDutchAuctionToken.address));
    console.log("MintNFT contract address is", (mintNFTToken.address));
    console.log("VToken contract address is", (mintERC20Token.address));
    console.log("NFT owner/seller address is", (seller.address));
    console.log("VToken creator/bidder address is", (account.address));
    });

  // checks sellers balance
  it("Should check if sellers balance is currently 0", async function () {
    expect(await mintERC20Token.balanceOf(seller.address)).to.equal(0);
  });
  // checks if the initial price is 400
  it("Should check if initial price is 400 VToken", async function () {
    expect(await nftDutchAuctionToken.getCurrentPrice()).to.equal(400);
  });
  // checks approval from NFTDutchAuction contract for MintNFT
  it("Approval from NFTDutchAuction contract for bid", async function () {
    await mintNFTToken.approve(nftDutchAuctionToken.address, 0);
    console.log("MintNFT contract",(mintNFTToken.address),"approving NFTDutchAuction contract",nftDutchAuctionToken.address,"from NFT seller",seller.address);
  });
  // checks approval from NFTDutchAuction contract for VToken 
  it("Approval from ERC20 contract for bid", async function () {
    await mintERC20Token.connect(account).approve(nftDutchAuctionToken.address, 450);
    console.log("VToken contract",(mintERC20Token.address),"approving NFTDutchAuction contract",nftDutchAuctionToken.address,"from VToken owner",account.address);
  });
  // bids 450 VToken before contract being approved
  it("Should not allow bidding before contract approval", async function () {
    await expect(nftDutchAuctionToken.bid(450)).to.be.revertedWith("Owner cannot submit bid on own item");
  });
  // bids 400 VToken after contract is approved
  it("Should test the bid functionality after approving", async function () {
    await nftDutchAuctionToken.connect(account).bid(400);
  });
  // checks reserve price variable
  it('reserve price - 200 VToken' , async function(){
    expect(await nftDutchAuctionToken.getReservePrice()).to.equal(200);
  });
  // checks numBlocksOpenFor variable
  it('num blocks auction open for - 50' , async function(){
    expect(await nftDutchAuctionToken.getNumBlocksAuctionOpen()).to.equal(50);
  });
  // checks priceDecrement variable
  it('offer price decrement - 4 VToken' , async function(){
    expect(await nftDutchAuctionToken.getPriceDecrement()).to.equal(4);
  });
  // checks if the owner of NFTDutchContract is also the seller
  it('is owner of this contract the seller', async function(){
    expect( await nftDutchAuctionToken.getSellerAddress()).to.equal(seller.address);
  });
  // checks if the seller has received the tokens from the buyer
  it("Checking to see if the NFT seller received the VTokens", async function () {
    expect(await mintERC20Token.balanceOf(seller.address)).to.equal(await nftDutchAuctionToken.getCurrentPrice());
  });
});