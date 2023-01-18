const { expect } = require("chai");
const toWei = (num) => ethers.utils.parseEther(num.toString())

describe("NFTAuctionhouse", function () {
    let deployer, addr1, addr2, addr3, nft, auctionhouse
    let feePercent = 1
    let URI = "sample URI"

    beforeEach(async function () {
        const NFT = await ethers.getContractFactory("NFT");
        const Auctionhouse = await ethers.getContractFactory("Auctionhouse");
        [deployer, addr1, addr2, addr3] = await ethers.getSigners();
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

    describe("Making items", function () {
        beforeEach(async function () {
            await nft.connect(addr1).mint(URI)
        })

        it("Should track newly created item and emit ListedItems event", async function () {

            await expect(auctionhouse.connect(addr1).makeItem(nft.address, 1))
                .to.emit(auctionhouse, "ListedItems")
                .withArgs(
                    1,
                    nft.address,
                    1,
                    addr1.address,
                )

            expect(await auctionhouse.itemCount()).to.equal(1)
            // Get item from items mapping then check fields to ensure they are correct
            const item = await auctionhouse.items(1)
            expect(item.itemId).to.equal(1)
            expect(item.nft).to.equal(nft.address)
            expect(item.tokenId).to.equal(1)
            expect(item.owner).to.equal(addr1.address)
            expect(item.status).to.equal(1)
            expect(await nft.ownerOf(1)).to.equal(addr1.address);
        });
    });

    describe("Making auctions", function () {
        beforeEach(async function () {
            // addr1 mints an nft
            await nft.connect(addr1).mint(URI)
            // addr1 making an item
            await auctionhouse.connect(addr1).makeItem(nft.address, 1)
            // addr1 approves marketplace to spend nft
            await nft.connect(addr1).setApprovalForAll(auctionhouse.address, true)
        })

        it("Should track newly created auction and emit ListedAuctions event", async function () {

            await expect(auctionhouse.connect(addr1).makeAuction(1, toWei(0.12), 1704598623))
                .to.emit(auctionhouse, "ListedAuctions")
                .withArgs(
                    1,
                    1,
                    addr1.address,
                    toWei(0.12),
                    1704598623,
                    0,
                    1
                )
            // Owner of NFT should now be the marketplace
            expect(await nft.ownerOf(1)).to.equal(auctionhouse.address);
            expect(await auctionhouse.auctionCount()).to.equal(1)
            // Get item from items mapping then check fields to ensure they are correct
            const auction = await auctionhouse.auctions(1)
            expect(auction.auctionId).to.equal(1)
            expect(auction.itemId).to.equal(1)
            expect(auction.auctioneer).to.equal(addr1.address)
            expect(auction.startingPrice).to.equal(toWei(0.1212))
            expect(auction.endDateTime).to.equal(1704598623)
            expect(auction.winningBid).to.equal(0)
            expect(auction.status).to.equal(1)

            const item = await auctionhouse.items(auction.itemId)
            expect(item.status).to.equal(2)
        });
    });

    describe("Making bids", function () {
        beforeEach(async function () {
            // addr1 mints an nft
            await nft.connect(addr1).mint(URI)
            // addr1 making an item
            await auctionhouse.connect(addr1).makeItem(nft.address, 1)
            // addr1 making an auction
            // addr1 approves marketplace to spend nft
            await nft.connect(addr1).setApprovalForAll(auctionhouse.address, true)
            await auctionhouse.connect(addr1).makeAuction(1, toWei(0.12), 1704598623)
        });

        it("Should track that bidder is NOT auctionner", async function () {
            await expect(auctionhouse.connect(addr1).makeBid(1, toWei(0.14), { value: toWei(0.14) }))
                .to.be.revertedWith("Auctioneer can NOT be bidder")
        });

        it("Should track newly created bid and emit ListedItems event", async function () {
            await expect(auctionhouse.connect(addr2).makeBid(1, toWei(0.15), { value: toWei(0.15) }))
                .to.emit(auctionhouse, "ListedBid")

            // Get item from items mapping then check fields to ensure they are correct
            const bid = await auctionhouse.bids(1)

            expect(bid.bidId).to.equal(1)
            expect(bid.auctionId).to.equal(1)
            expect(bid.bidPrice).to.equal(toWei(0.15))
            expect(bid.bidder).to.equal(addr2.address)
            expect(bid.status).to.equal(1)
            const auction = await auctionhouse.auctions(bid.auctionId)
            expect(auction.winningBid).to.equal(1)
        });

        it("Should new bid price is bigger than starting price", async function () {
            await expect(auctionhouse.connect(addr2).makeBid(1, toWei(0.11), { value: toWei(0.11) }))
                .to.be.revertedWith("Price must be greater than starting price")
        });

        it("Should track newly created bid and emit ListedItems event", async function () {
            await expect(auctionhouse.connect(addr2).makeBid(1, toWei(0.15), { value: toWei(0.15) }))
                .to.emit(auctionhouse, "ListedBid")
            await expect(auctionhouse.connect(addr3).makeBid(1, toWei(0.20), { value: toWei(0.20) }))
                .to.emit(auctionhouse, "ListedBid")

            // Get item from items mapping then check fields to ensure they are correct
            const bid = await auctionhouse.bids(2)

            expect(bid.bidId).to.equal(2)
            expect(bid.auctionId).to.equal(1)
            expect(bid.bidPrice).to.equal(toWei(0.20))
            expect(bid.bidder).to.equal(addr3.address)
            expect(bid.status).to.equal(1)
            const auction = await auctionhouse.auctions(bid.auctionId)
            expect(auction.winningBid).to.equal(2)
        });

        it("Should not add new bid, because the new bid price is smaller tha previous", async function () {
            await expect(auctionhouse.connect(addr2).makeBid(1, toWei(0.15), { value: toWei(0.15) }))
                .to.emit(auctionhouse, "ListedBid")
            await expect(auctionhouse.connect(addr3).makeBid(1, toWei(0.14), { value: toWei(0.14) }))
                .to.be.revertedWith("Price must be greater than winning bid price")
        });

    });

    describe("End of auction", function () {
        beforeEach(async function () {
            // addr1 mints an nft
            await nft.connect(addr1).mint(URI)
            // addr1 making an item
            await auctionhouse.connect(addr1).makeItem(nft.address, 1)
            // addr1 making an auction
            // addr1 approves marketplace to spend nft
            await nft.connect(addr1).setApprovalForAll(auctionhouse.address, true)
            await auctionhouse.connect(addr1).makeAuction(1, toWei(0.12), 1704598623)
            await auctionhouse.connect(addr2).makeBid(1, toWei(0.15), { value: toWei(0.15) })
        });

        it("Should transfer Function", async function () {
            await auctionhouse.connect(addr2).receiveItem(1)

            const auction = await auctionhouse.auctions(1)
            const item = await auctionhouse.items(auction.itemId);

            expect(addr1).to.equal(addr2.address)
            expect(item.owner).to.equal(addr2.address)
            expect(auction.status).to.equal(2)

        });

    });
})