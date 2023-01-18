const { expect } = require("chai");

describe("NFTAuctionhouse", function () {
    let deployer, addr1, addr2, nft, auctionhouse
    let feePercent = 1
    let URI = "sample URI"

    beforeEach(async function () {
        const NFT = await ethers.getContractFactory("NFT");
        const Auctionhouse = await ethers.getContractFactory("Auctionhouse");
        [deployer, addr1, addr2] = await ethers.getSigners();
        nft = await NFT.deploy();
        auctionhouse = await Auctionhouse.deploy(feePercent);
    });

    describe("Deployment", function () {

        it("Should track name and symbol of the nft collection", async function () {
            // This test expects the owner variable stored in the contract to be equal to our Signer's owner.
            const nftName = "DApp NFT"
            const nftSymbol = "DAPP"
            expect(await nft.name()).to.equal(nftName);
            expect(await nft.symbol()).to.equal(nftSymbol);
        });

        it("Should track feeAccount and feePercent of the auctionhouse", async function () {
            expect(await auctionhouse.feeAccount()).to.equal(deployer.address);
            expect(await auctionhouse.feePercent()).to.equal(feePercent);
        });
    })

    describe("Minting NFTs", function () {

        it("Should track each minted NFT", async function () {
            // addr1 mints an nft
            await nft.connect(addr1).mint(URI)
            expect(await nft.tokenCount()).to.equal(1);
            expect(await nft.balanceOf(addr1.address)).to.equal(1);
            expect(await nft.tokenURI(1)).to.equal(URI);
            expect(await nft.ownerOf(1)).to.equal(addr1.address);
            // addr2 mints an nft
            await nft.connect(addr2).mint(URI)
            expect(await nft.tokenCount()).to.equal(2);
            expect(await nft.balanceOf(addr2.address)).to.equal(1);
            expect(await nft.tokenURI(2)).to.equal(URI);
            expect(await nft.ownerOf(2)).to.equal(addr2.address);
        });
    })
})