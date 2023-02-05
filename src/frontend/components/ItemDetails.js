//Imports
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react'
import { Card } from 'react-bootstrap'

const ItemDetails = ({ auctionhouse, nft }) => {

  //Variables and setters methods
  const [loading, setLoading] = useState(true)
  const [itemDetails, setItemDetails] = useState([])
  const { itemId } = useParams();

  //Loads item details from blockchain and set values on variables
  const loadAuctionhouseItemDetails = async () => {

    //Get item
    const item = await auctionhouse.items(itemId)

    // get uri url from nft contract
    const uri = await nft.tokenURI(item.tokenId)

    // use fixedUri to fetch the nft metadata stored on ipfs 
    const fixedUri = "https://" + uri
    const response = await fetch(fixedUri)

    //Get item metadata
    const metadata = await response.json()

    //Set item details 
    itemDetails.name = metadata.name;
    itemDetails.description = metadata.description;
    itemDetails.image = "https://" + metadata.image;
    itemDetails.owner = item.owner;
    itemDetails.status = item.status;

    // Check if item auctioning, and pass some extra fiels
    if (itemDetails.status == 2) {
      const auctionCount = await auctionhouse.auctionCount()
      for (let y = 1; y <= auctionCount; y++) {

        //Get auction
        const auction = await auctionhouse.auctions(y)

        //Mapping items with auctions
        if (auction.itemId + '' === item.itemId + '') {

          //Fix DateTime
          let d = new Date(auction.endDateTime * 1000);

          //Set item extra details 
          itemDetails.auctionID = y;
          itemDetails.endDateTime = d;
          itemDetails.endDateTimeTimestamp = auction.endDateTime;

        }
      }
    }

    //Set data on variables
    setItemDetails(itemDetails)
    setLoading(false)
  }

  // Loader message
  useEffect(() => {
    loadAuctionhouseItemDetails()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )

  return (
    <div>
      <h1>{itemDetails.name}</h1>
      <img src={itemDetails.image} />
      <p><br></br>{itemDetails.description}</p>
      <p><b>OWNER: </b>{itemDetails.owner}</p>
      <Card.Text>
        {itemDetails.status.toNumber() == 2 && itemDetails.endDateTimeTimestamp * 1000 > Date.now() &&
          <p style={{ background: "green", color: "white", borderRadius: 12, padding: 5 }}>Item auctioning</p>
        }
        {itemDetails.status.toNumber() == 1 &&
          <p style={{ background: "red", color: "white", borderRadius: 12, padding: 5 }}>Item NOT auctioning</p>
        }
        {itemDetails.status.toNumber() == 2 && itemDetails.endDateTimeTimestamp * 1000 < Date.now() &&
          <p style={{ background: "blue", color: "white", borderRadius: 12, padding: 5 }}>Item auctioning, but bids not allow</p>
        }
        {itemDetails.status.toNumber() == 2 &&
          <Link as={Link} to={`/auctions/${JSON.stringify(itemDetails.auctionID)}`}>Auction details</Link>

        }
      </Card.Text>
    </div>
  );
}

export default ItemDetails;