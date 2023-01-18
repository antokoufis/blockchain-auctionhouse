const { expect } = require("chai");

describe("NFTAuctionhouse", function () {
    let deployer, addr1, addr2, nft, auctionhouse
    let feePercent = 1

    beforeEach(async function () {
        const NFT = await ethers.getContractFactory("NFT");
        const Auctionhouse = await ethers.getContractFactory("Auctionhouse");
        [deployer, addr1, addr2] = await ethers.getSigners();
        nft = await NFT.deploy();
        auctionhouse = await Auctionhouse.deploy(feePercent);
    });

    describe("Deployment", function () {

        it("Should track name and symbol of the nft collection", async function () {
            // This test expects the owner variable stored in the contract to be equal
            // to our Signer's owner.
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
})