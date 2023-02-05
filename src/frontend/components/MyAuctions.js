//Imports
import { useState, useEffect } from 'react'
import { Row, Col, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const MyAuctions = ({ auctionhouse, nft }) => {

  //Variables and setters methods
  const [loading, setLoading] = useState(true)
  const [auctions, setAuctions] = useState([])
  const [itemDetails, setItemDetails] = useState([])

  //Loads auctions from blockchain and set values on variables
  const loadAuctionhouseAuctions = async () => {

    //Get auctions counter
    const auctionCount = await auctionhouse.auctionCount()
    let auctions = []

    for (let i = 1; i <= auctionCount; i++) {

      //Get auction
      const auction = await auctionhouse.auctions(i)

      //Get user address
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      //Checks that the user is the auctioneer 
      if (auction.auctioneer.toLowerCase() === accounts[0]) {

        //Set item details 
        const item = await auctionhouse.items(auction.itemId)
        const uri = await nft.tokenURI(item.tokenId)
        const fixedUri = "https://" + uri
        const response = await fetch(fixedUri)
        const metadata = await response.json()

        // Add auctions details to auctions array
        auctions.push({
          auctionId: auction.auctionId,
          itemId: auction.itemId,
          auctioneer: auction.auctioneer,
          startingPrice: auction.startingPrice,
          endDateTime: auction.endDateTime,
          winningBid: auction.winningBid,
          status: auction.status,
          itemName: metadata.name,
          itemDescription: metadata.description,
          itemImage: "https://" + metadata.image,
          itemOwner: item.owner,
          itemStatus: item.status
        })

      }
    }

    //Set data on variables
    setLoading(false)
    setAuctions(auctions)
    setItemDetails(itemDetails)
  }

  // Loader message
  useEffect(() => {
    loadAuctionhouseAuctions()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <h1>My Auctions</h1>
        {auctions.length > 0 ?
          <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
            <div className="content mx-auto">
              <Row xs={1} md={2} className="g-4 py-5">
                {auctions.map((auction, idx) => (
                  <Col key={idx} className="overflow-hidden">
                    <Card>
                      <Card.Body color="secondary">
                        <Card.Title>{auction.itemName}</Card.Title>
                        <Card.Img variant="top" src={auction.itemImage} />
                        <p> </p>
                        <Card.Text>
                          {auction.status.toNumber() == 1 && auction.endDateTime.toNumber() * 1000 > Date.now() &&
                            <p style={{ background: "green", color: "white", borderRadius: 12, padding: 5 }}>Running</p>
                          }
                          {auction.status.toNumber() == 1 && auction.endDateTime.toNumber() * 1000 < Date.now() &&
                            <p style={{ background: "blue", color: "white", borderRadius: 12, padding: 5 }}>Running, but bids not allow</p>
                          }
                          {auction.status.toNumber() == 2 && auction.endDateTime.toNumber() * 1000 < Date.now() &&
                            <p style={{ background: "red", color: "white", borderRadius: 12, padding: 5 }}>Ended</p>
                          }
                        </Card.Text>
                        <Link as={Link} to={`/auctions/${JSON.stringify(auction.auctionId.toNumber())}`}>Details</Link>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </main>
          : (
            <main style={{ padding: "1rem 0" }}>
              <h2>No listed auctions</h2>
            </main>
          )}
      </div></div>
  );
}
export default MyAuctions