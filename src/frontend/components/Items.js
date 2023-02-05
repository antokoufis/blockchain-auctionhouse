//Imports
import { useState, useEffect } from 'react'
import { Row, Col, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const Items = ({ auctionhouse, nft, account }) => {

    //Variables and setters methods
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState([])

    //Loads items from blockchain and set values on variables
    const loadAuctionhouseItems = async () => {

        //Get items counter
        const itemCount = await auctionhouse.itemCount()
        let items = []

        for (let i = 1; i <= itemCount; i++) {

            //Get item
            const item = await auctionhouse.items(i)

            //Get user address
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            //Checks that the user is not the owner of the items
            if (item.owner.toLowerCase() !== accounts[0]) {

                // get uri url from nft contract
                const uri = await nft.tokenURI(item.tokenId)

                // use fixedUri to fetch the nft metadata stored on ipfs 
                const fixedUri = "https://" + uri
                const response = await fetch(fixedUri)
                const metadata = await response.json()

                // Check if items auctioning, and pass some extra fiels
                if (item.status === 2) {

                    //Get auctions counter
                    const auctionCount = await auctionhouse.auctionCount()

                    for (let y = 1; y <= auctionCount; y++) {

                        //Get auction
                        const auction = await auctionhouse.auctions(y)

                        //Mapping items with auctions
                        if (auction.itemId + '' === item.itemId + '') {

                            //Fix DateTime
                            let d = new Date(auction.endDateTime * 1000);

                            // Add item to items array
                            items.push({
                                itemId: item.itemId,
                                name: metadata.name,
                                description: metadata.description,
                                image: metadata.image,
                                owner: item.owner,
                                status: item.status,
                                auctionID: y,
                                endDateTime: d,
                                endDateTimeTimestamp: auction.endDateTime
                            })
                        }
                    }
                }
                else {
                    // Add item to items array
                    items.push({
                        itemId: item.itemId,
                        name: metadata.name,
                        description: metadata.description,
                        image: metadata.image,
                        owner: item.owner,
                        status: item.status,
                        auctionID: null
                    })
                }
            }
        }

        //Set data on variables
        setLoading(false)
        setItems(items)
    }

    // Loader message 
    useEffect(() => {
        loadAuctionhouseItems()
    }, [])
    if (loading) return (
        <main style={{ padding: "1rem 0" }}>
            <h2>Loading...</h2>
        </main>
    )

    return (
        <div className="container-fluid mt-5">
            <div className="row">
                <h1>Items</h1>
                <p> </p>
                {items.length > 0 ?
                    <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
                        <div className="px-5 container">
                            <Row xs={1} md={2} className="g-4">
                                {items.map((item, idx) => (
                                    <Col key={idx} className="overflow-hidden">
                                        <Card>
                                            <Card.Body color="secondary">
                                                <Card.Title>{item.name}</Card.Title>
                                                <Card.Img variant="top" src={"https://" + item.image} />
                                                <p> </p>
                                                <Card.Text>
                                                    {item.status.toNumber() === 2 && item.endDateTimeTimestamp * 1000 > Date.now() &&
                                                        <p style={{ background: "green", color: "white", borderRadius: 12, padding: 5 }}>Item auctioning</p>
                                                    }
                                                    {item.status.toNumber() === 1 &&
                                                        <p style={{ background: "red", color: "white", borderRadius: 12, padding: 5 }}>Item NOT auctioning</p>
                                                    }
                                                    {item.status.toNumber() === 2 && item.endDateTimeTimestamp * 1000 < Date.now() &&
                                                        <p style={{ background: "blue", color: "white", borderRadius: 12, padding: 5 }}>Item auctioning, but bids not allow</p>
                                                    }
                                                    {item.status.toNumber() === 2 &&
                                                        <Link as={Link} to={`/auctions/${JSON.stringify(item.auctionID)}`}>Auction details</Link>
                                                    }
                                                </Card.Text>
                                                <Link as={Link} to={`/items/${JSON.stringify(item.itemId.toNumber())}`}>Items details</Link>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </main>
                    : (
                        <main style={{ padding: "1rem 0" }}>
                            <h2>No listed items</h2>
                        </main>
                    )}
            </div></div>
    );
}
export default Items