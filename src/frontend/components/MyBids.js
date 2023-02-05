//Imports
import { useState, useEffect } from 'react'
import { Row, Col, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { ethers } from "ethers";

//fromWei converter
const fromWei = (num) => ethers.utils.formatEther(num)

const MyBids = ({ auctionhouse, nft, account }) => {

  //Variables and setters methods
  const [loading, setLoading] = useState(true)
  const [bids, setBids] = useState([])

  const loadAuctionhouseBids = async () => {

    //Get bids counter
    const bidCount = await auctionhouse.bidCount()
    let bids = []

    for (let i = 1; i <= bidCount; i++) {

      //Get bid
      const bid = await auctionhouse.bids(i)

      //Get user address
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      //Checks that the user is the bidder
      if (bid.bidder.toLowerCase() === accounts[0]) {

        //Fix price
        let fixedPrice = fromWei(bid.bidPrice)

        // Add bid to bids array
        const auction = await auctionhouse.auctions(bid.auctionId)
        const item = await auctionhouse.items(auction.itemId)
        const uri = await nft.tokenURI(item.tokenId)
        const fixedUri = "https://" + uri
        const response = await fetch(fixedUri)
        const metadata = await response.json()

        //Fix DateTime
        let d = new Date(auction.endDateTime * 1000)

        // Add bid to bids array
        bids.push({
          bidId: bid.bidId,
          auctionId: bid.auctionId,
          bidPrice: fixedPrice,
          timestamp: bid.timestamp,
          owner: bid.bidder,
          status: bid.status,
          image: "https://" + metadata.image,
          itemName: metadata.name,
          endDateTime: d
        })
      }
    }

    //Set data on variables
    setLoading(false)
    setBids(bids)
  }

  // Loader message
  useEffect(() => {
    loadAuctionhouseBids()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <h1>My Bids</h1>
        <p> </p>
        {bids.length > 0 ?
          <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
            <div className="content mx-auto">
              <Row xs={1} md={2} className="g-4">
                {bids.map((bid, idx) => (
                  <Col key={idx} className="overflow-hidden">
                    <Card>
                      <Card.Body color="secondary">
                        <Card.Title>{bid.itemName}</Card.Title>
                        <Card.Img variant="top" src={bid.image} />
                        <p> </p>
                        <p><b>BID PRICE: </b>{bid.bidPrice} ETH</p>

                        <Card.Text>
                          <p><b>DATETIME: </b>{JSON.stringify(bid.endDateTime.toString())}</p>

                        </Card.Text>
                        <Card.Text>
                          {bid.status.toNumber() == 1 &&
                            <p style={{ background: "green", color: "white", borderRadius: 12, padding: 5 }}>Winning</p>
                          }
                          {bid.status.toNumber() == 2 &&
                            <p style={{ background: "red", color: "white", borderRadius: 12, padding: 5 }}>Returned</p>
                          }
                        </Card.Text>
                        <Link as={Link} to={`/auctions/${JSON.stringify(bid.auctionId.toNumber())}`}>Auction</Link>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </main>
          : (
            <main style={{ padding: "1rem 0" }}>
              <h2>No listed bids</h2>
            </main>
          )}
      </div></div>
  );
}
export default MyBids