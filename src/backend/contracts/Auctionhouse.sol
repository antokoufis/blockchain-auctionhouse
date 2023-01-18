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
}
