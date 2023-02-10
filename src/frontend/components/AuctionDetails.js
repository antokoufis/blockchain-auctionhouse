//Imports
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react'
import { Row, Form, Button, Col, Card } from "react-bootstrap";
import { ethers } from "ethers";

//toWei, fromWei converters
const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

const AuctionDetails = ({ auctionhouse, nft }) => {

    //Variables and setters methods
    const [loading, setLoading] = useState(true)
    const [auctionDetails, setAuctionDetails] = useState([])
    const [itemDetails, setItemDetails] = useState([])
    const { auctionId } = useParams();
    const [message, setMessage] = useState('')
    const [formVisible, setFormVisible] = useState(true)
    const [bid, setBid] = useState('')
    const [historyBids, setHistoryBids] = useState('')
    const [posts, setPosts] = useState('')

    //Loads auction details from blockchain and set values on variables
    const loadAuctionhouseAuctionDetails = async () => {

        //Get auction 
        const auction = await auctionhouse.auctions(auctionId)

        //Set auction details 
        auctionDetails.auctionId = auction.auctionId;
        auctionDetails.itemId = auction.itemId;
        auctionDetails.auctioneer = auction.auctioneer;
        auctionDetails.startingPrice = fromWei(auction.startingPrice);

        //Fix DateTime
        let d = new Date(auction.endDateTime * 1000);

        auctionDetails.endDateTime = d;
        auctionDetails.endDateTimeTimestamp = auction.endDateTime;
        auctionDetails.winningBid = auction.winningBid;
        auctionDetails.status = auction.status;
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        auctionDetails.loggingUser = accounts[0];

        //Get item
        const item = await auctionhouse.items(auction.itemId)
        const uri = await nft.tokenURI(item.tokenId)
        const fixedUri = "https://" + uri
        const response = await fetch(fixedUri)
        const metadata = await response.json()

        //Set item details 
        itemDetails.name = metadata.name;
        itemDetails.description = metadata.description;
        itemDetails.image = "https://" + metadata.image;
        itemDetails.owner = item.owner;
        itemDetails.status = item.status;

        //Get bids counter
        const historyBidsCount = await auctionhouse.bidCount()
        let historyBids = []

        for (let i = 1; i <= historyBidsCount; i++) {

            //Get bid
            const bidHistory = await auctionhouse.bids(i)

            //Mapping bids with auctions
            if (bidHistory.auctionId.toString() === auction.auctionId.toString()) {

                //Fix price
                let fixedPrice = fromWei(bidHistory.bidPrice)

                //Fix DateTime
                let h = new Date(bidHistory.timestamp * 1000);

                // Add bid to bids array
                historyBids.push({
                    bidId: bidHistory.bidId,
                    auctionId: bidHistory.auctionId,
                    bidPrice: fixedPrice,
                    timestamp: h,
                    bidder: bidHistory.bidder,
                    status: bidHistory.status,
                })
            }

        }

        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };

        fetch("https://auctionhouse.antonisk.com/wp-json/wp/v2/addresses?_fields=content&slug=" + auction.auctioneer, requestOptions)
            .then(response => response.json())
            .then(result => setPosts(result))
            .catch(error => console.log('error', error));


        //Set data on variables
        setHistoryBids(historyBids)
        setItemDetails(itemDetails)
        setAuctionDetails(auctionDetails)
        setLoading(false)


    }


    // Loader message
    useEffect(() => {
        loadAuctionhouseAuctionDetails()
    }, [])
    if (loading) return (
        <main style={{ padding: "1rem 0" }}>
            <h2>Loading...</h2>
        </main>
    )

    // Create a new bid function
    const createBid = async () => {
        if (!bid) return
        try {
            await (await auctionhouse.makeBid(auctionDetails.auctionId, toWei(bid), { value: toWei(bid) })).wait()
            setMessage('Bid has been created! Refresh the page to see the new bid.')
            setFormVisible(false)
        } catch (error) {
            console.log("Bid has no created: ", error)
        }
    }

    // Receive item function
    const receiveItem = async () => {
        try {
            await (await auctionhouse.receiveItem(auctionDetails.auctionId)).wait()
            setMessage('Item transfered.')
        }
        catch (error) {
            console.log("Item has no received: ", error)
        }
    }



    return (
        <div>
            <h1>{itemDetails.name}</h1>
            <img src={itemDetails.image} />
            <p> </p>
            <Card.Text>
                <Link as={Link} to={`/items/${JSON.stringify(auctionDetails.itemId.toNumber())}`}>Item Details</Link>
            </Card.Text>
            <p><b>AUCTIONEER: </b> {auctionDetails.auctioneer}</p>
            <p><b>STARTING PRICE: </b> {auctionDetails.startingPrice} ETH</p>
            <Card.Text>
                {auctionDetails.endDateTimeTimestamp * 1000 < Date.now() &&
                    <p><b>ENDED AT: </b> {auctionDetails.endDateTime.toString()}</p>
                }
                {auctionDetails.endDateTimeTimestamp * 1000 > Date.now() &&
                    <p><b>ENDS ΑΤ: </b> {auctionDetails.endDateTime.toString()}</p>
                }
            </Card.Text>

            <Card.Text>
                {auctionDetails.status.toNumber() == 1 && auctionDetails.endDateTimeTimestamp.toNumber() * 1000 > Date.now() &&
                    <p style={{ background: "green", color: "white", borderRadius: 12, padding: 5 }}>Running</p>
                }
                {auctionDetails.status.toNumber() == 1 && auctionDetails.endDateTimeTimestamp.toNumber() * 1000 < Date.now() &&
                    <p style={{ background: "blue", color: "white", borderRadius: 12, padding: 5 }}>Running, but bids not allow</p>
                }
                {auctionDetails.status.toNumber() == 2 && auctionDetails.endDateTimeTimestamp.toNumber() * 1000 < Date.now() &&
                    <p style={{ background: "red", color: "white", borderRadius: 12, padding: 5 }}>Ended</p>
                }
            </Card.Text>

            <div>
                {formVisible && auctionDetails.status.toNumber() == 1 && auctionDetails.loggingUser != auctionDetails.auctioneer.toLowerCase() && auctionDetails.endDateTimeTimestamp * 1000 > Date.now() ? (
                    <Row className="g-4">
                        <Form.Label>Place a bid:</Form.Label>
                        <Form.Control onChange={(e) => setBid(e.target.value)} size="lg" required type="number" placeholder="Bid Price" />              <div className="d-grid px-0">
                            <Button onClick={createBid} variant="primary" size="lg">
                                Bid
                            </Button>
                        </div>
                    </Row>
                ) : (
                    <div className="text-center">
                        <p>{message}</p>
                    </div>
                )}
            </div>

            {historyBids.length == 0 && auctionDetails.status.toNumber() == 1 && auctionDetails.loggingUser == auctionDetails.auctioneer.toLowerCase() && auctionDetails.endDateTimeTimestamp * 1000 < Date.now() &&
                <Button onClick={receiveItem} variant="primary" size="lg">
                    Close the auction
                </Button>
            }


            {historyBids.length > 0 ?

                <div>
                    <div className="container">
                        <Row xs={1} className="g-4 py-5">
                            {historyBids.map((historyBid, idx) => (
                                <Col key={idx} className="overflow-hidden">
                                    <Card>
                                        <Card.Body color="secondary">
                                            <Card.Text><b>BID PRICE: </b>{historyBid.bidPrice}</Card.Text>
                                            <Card.Text><b>BID DATETIME: </b>{historyBid.timestamp.toString()}</Card.Text>
                                            <Card.Text>
                                                <p><b>BIDDER: </b>{historyBid.bidder}</p>
                                            </Card.Text>
                                            <Card.Text>
                                                {historyBid.status.toNumber() == 1 &&
                                                    <p style={{ background: "green", color: "white", borderRadius: 12, padding: 5 }}>Winning bid</p>
                                                }
                                                {historyBid.status.toNumber() == 2 &&
                                                    <p style={{ background: "red", color: "white", borderRadius: 12, padding: 5 }}>Returned bid</p>
                                                }
                                            </Card.Text>
                                            <Card.Text>
                                                {historyBid.status.toNumber() == 1 && auctionDetails.loggingUser == historyBid.bidder.toLowerCase() && auctionDetails.endDateTimeTimestamp * 1000 < Date.now() &&
                                                    <Button onClick={receiveItem} variant="primary" size="lg">
                                                        Close the auction
                                                    </Button>
                                                }
                                                {historyBid.status.toNumber() == 1 && auctionDetails.loggingUser == historyBid.bidder.toLowerCase() && auctionDetails.endDateTimeTimestamp * 1000 < Date.now() &&
                                                    <p>{JSON.stringify(posts)} </p>
                                                }
                                            </Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>
                : (
                    <main style={{ padding: "1rem 0" }}>
                        <h4>No listed bids</h4>
                    </main>
                )}
        </div>

    );
}

export default AuctionDetails;