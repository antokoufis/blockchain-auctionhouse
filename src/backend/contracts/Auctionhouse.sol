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

    // itemId -> Item
    mapping(uint256 => Item) public items;
    // auctionId -> Auction
    mapping(uint256 => Auction) public auctions;

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
        require(item.status == 1);
        require(item.owner == msg.sender);
        require(_startingPrice > 0);
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

    function getTotalPrice(uint256 _price) public view returns (uint256) {
        return ((_price * (100 + feePercent)) / 100);
    }
}
