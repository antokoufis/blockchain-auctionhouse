// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Auctionhouse is ReentrancyGuard {
    // the account that receives fees
    address payable public immutable feeAccount;
    // the fee percentage on sales
    uint256 public immutable feePercent;
    // structs counters
    uint256 public itemCount;
    uint256 public auctionCount;
    uint256 public bidCount;

    // Item struct
    struct Item {
        uint256 itemId;
        IERC721 nft;
        uint256 tokenId;
        address payable owner;
        uint256 status; //1 = Available for Auction, 2 =  NOT available for Auction
    }

    // Auction struct
    struct Auction {
        uint256 auctionId;
        uint256 itemId;
        address payable auctioneer;
        uint256 startingPrice;
        uint256 endDateTime;
        uint256 winningBid;
        uint256 status; //1 = Available for bidding, 2 = Not Available for bidding
    }

    //Bid struct
    struct Bid {
        uint256 bidId;
        uint256 auctionId;
        uint256 bidPrice;
        uint256 timestamp;
        address payable bidder;
        uint256 status; //1 = Active, 2 = Returned
    }

    // itemId -> Item
    mapping(uint256 => Item) public items;
    // auctionId -> Auction
    mapping(uint256 => Auction) public auctions;
    // bidId -> Bid
    mapping(uint256 => Bid) public bids;

    event ListedItems(
        uint256 itemId,
        address indexed nft,
        uint256 tokenId,
        address indexed owner
    );

    event ListedAuctions(
        uint256 indexed auctionId,
        uint256 indexed itemId,
        address indexed auctioneer,
        uint256 startingPrice,
        uint256 endDateTime,
        uint256 winningBid,
        uint256 status
    );

    event ListedBid(
        uint256 indexed bidId,
        uint256 indexed auctionId,
        uint256 bidPrice,
        uint256 timestamp,
        address payable bidder,
        uint256 status
    );

    constructor(uint256 _feePercent) {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    function makeItem(IERC721 _nft, uint256 _tokenId) external nonReentrant {
        itemCount++;
        items[itemCount] = Item(
            itemCount,
            _nft,
            _tokenId,
            payable(msg.sender),
            1
        );

        emit ListedItems(itemCount, address(_nft), _tokenId, msg.sender);
    }

    function makeAuction(
        uint256 _itemId,
        uint256 _startingPrice,
        uint256 _endDateTime
    ) external nonReentrant {
        auctionCount++;
        Item storage item = items[_itemId];
        require(item.status == 1, "Item status must be 1, to be auctioned");
        require(item.owner == msg.sender, "Auctioneer must be item owner");
        require(_startingPrice > 0, "Auction price must be not 0");
        require(
            _endDateTime > block.timestamp,
            "End datetime must be greater than now"
        );
        auctions[auctionCount] = Auction(
            auctionCount,
            _itemId,
            payable(msg.sender),
            getTotalPrice(_startingPrice),
            _endDateTime,
            0,
            1
        );

        item.status = 2;
        IERC721 _nft = item.nft;
        _nft.transferFrom(msg.sender, address(this), item.tokenId);

        emit ListedAuctions(
            auctionCount,
            _itemId,
            msg.sender,
            _startingPrice,
            _endDateTime,
            0,
            1
        );
    }

    function makeBid(uint256 _auctionId, uint256 _bidPrice)
        external
        payable
        nonReentrant
    {
        Auction storage auction = auctions[_auctionId];
        require(
            auction.auctioneer != msg.sender,
            "Auctioneer can NOT be bidder"
        );
        require(
            auction.endDateTime > block.timestamp,
            "End datetime must be greater than now"
        );
        require(auction.status == 1, "Auction status must be 1, to be bidden");

        if (auction.winningBid == 0) {
            require(
                auction.startingPrice < _bidPrice,
                "Price must be greater than starting price"
            );
            bidCount++;

            bids[bidCount] = Bid(
                bidCount,
                _auctionId,
                _bidPrice,
                block.timestamp,
                payable(msg.sender),
                1
            );
            payable(address(this)).transfer(msg.value);
            auction.winningBid = bidCount;
        } else {
            Bid storage bid = bids[auction.winningBid];
            require(
                bid.bidPrice < _bidPrice,
                "Price must be greater than winning bid price"
            );
            bidCount++;

            bids[bidCount] = Bid(
                bidCount,
                _auctionId,
                _bidPrice,
                block.timestamp,
                payable(msg.sender),
                1
            );

            bid.bidder.transfer(bid.bidPrice);
            bid.status = 2;
            payable(address(this)).transfer(msg.value);
            auction.winningBid = bidCount;
        }
        emit ListedBid(
            bidCount,
            _auctionId,
            _bidPrice,
            block.timestamp,
            payable(msg.sender),
            1
        );
    }

    function receiveItem(uint256 _auctionId) external payable nonReentrant {
        Auction storage auction = auctions[_auctionId];
        Item storage item = items[auction.itemId];
        require(
            auction.endDateTime < block.timestamp,
            "The auction datetime must have passed"
        );
        if (auction.winningBid == 0) {
            require(
                auction.auctioneer == msg.sender,
                "Auctioneer must be the sender"
            );
        } else {
            Bid storage bid = bids[auction.winningBid];
            require(bid.bidder == msg.sender, "Winner must be the sender");
            item.owner.transfer(bid.bidPrice - getTotalFee(bid.bidPrice));
            feeAccount.transfer(getTotalFee(bid.bidPrice));
            item.owner = bid.bidder;
        }

        auction.status = 2;
        item.status = 1;

        IERC721 _nft = item.nft;
        _nft.transferFrom(address(this), msg.sender, item.tokenId);
    }

    receive() external payable {}

    function getTotalPrice(uint256 _price) public view returns (uint256) {
        return ((_price * (100 + feePercent)) / 100);
    }

    function getTotalFee(uint256 _price) public view returns (uint256) {
        return ((_price * (feePercent)) / 100);
    }
}
