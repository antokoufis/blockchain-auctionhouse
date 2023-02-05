//Imports
import { useState, useEffect } from 'react'
import { ethers } from "ethers";
import { Row, Form, Button } from "react-bootstrap";

//toWei converter
const toWei = (num) => ethers.utils.parseEther(num.toString())

const CreateAuction = ({ auctionhouse, nft }) => {

  //Variables and setters methods
  const [item, setItem] = useState(null);
  const [startingPrice, setStartingPrice] = useState(null)
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const [formVisible, setFormVisible] = useState(true)


  const loadAuctionhouseItems = async () => {

    //Get items counter
    const itemCount = await auctionhouse.itemCount()
    let items = []

    for (let i = 1; i <= itemCount; i++) {

      //Get item
      const item = await auctionhouse.items(i)

      //Get user address 
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      //Checks that the user is the owner of the items and item not auctioning
      if (item.status != 2 && item.owner.toLowerCase() === accounts[0]) {

        // get uri url from nft contract
        const uri = await nft.tokenURI(item.tokenId)

        // use fixedUri to fetch the nft metadata stored on ipfs 
        const fixedUri = "https://" + uri
        const response = await fetch(fixedUri)

        //Get item metadata
        const metadata = await response.json()

        // Add item to items array
        items.push({
          itemId: item.itemId,
          name: metadata.name,
        })
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

  //Create Auction function
  const createAuction = async () => {
    if (!item || !startingPrice || !endDate) return
    try {
      await (await nft.setApprovalForAll(auctionhouse.address, true)).wait()
      await (await auctionhouse.makeAuction(item, toWei(startingPrice), endDate)).wait()
      setMessage('Auction has been created!')
      setFormVisible(false)
    } catch (error) {
      console.log("Auction has no created: ", error)
    }
  }

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <h1>Create Auction</h1>
            <p>Fill the form bellow to create a new auction.</p>
            {formVisible ? (
              <Row className="g-4">
                <Form.Control as="select" onChange={(e) => setItem(e.target.value)}>
                  <option>
                    Select an item
                  </option>
                  {items.map((item) => (
                    <option key={JSON.stringify(item.itemId.toNumber())} value={JSON.stringify(item.itemId.toNumber())}>
                      {JSON.stringify(item.name)}
                    </option>
                  ))}
                </Form.Control>
                <Form.Control onChange={(e) => setEndDate(e.target.value)} size="lg" required type="number" placeholder="Auction end datetime" />
                <a href="https://www.epochconverter.com/" target="_blank">Generate the <b>Epoch timestamp</b> and fill the field above. Click here to generate <b>Epoch timestamp</b>.</a>
                <Form.Control onChange={(e) => setStartingPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
                <div className="d-grid px-0">
                  <Button onClick={createAuction} variant="primary" size="lg">
                    Create
                  </Button>
                </div>
              </Row>
            ) : (
              <div className="text-center">
                <p>{message}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CreateAuction