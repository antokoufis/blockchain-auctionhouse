//Imports
import { useState } from "react";
import { Row, Form, Button } from "react-bootstrap";
import { Buffer } from "buffer";
import { create as ipfsHttpClient } from "ipfs-http-client";

// Pass the params for IPFS API
const projectId = "2J34MiC08Z0U7RiyLdaqJwExgfz";
const projectSecret = "33fba3f3543647bde1a8725dd66778b7";
const subdomain = "antonisk-marketplace.infura-ipfs.io";

// encrypt the authorization
const authorization = `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString("base64")}`;

// with this next variable, you are passing the necessary information in the request to infura, notice authorization
// is being passed as argument headers
const client = ipfsHttpClient({
  host: "infura-ipfs.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: authorization,
  },
});

const CreateItems = ({ auctionhouse, nft }) => {

  //Variables and setters methods
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
  const [formVisible, setFormVisible] = useState(true)

  //Uploads item details on IPFS
  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    if (typeof file !== 'undefined') {
      try {
        const result = await client.add(file)
        console.log(result)
        setImage(`${subdomain}/ipfs/${result.path}`);
      } catch (error) {
        console.log("ipfs image upload error: ", error)
      }
    }
  }

  //Create NFT function
  const createNFT = async () => {
    if (!image || !name || !description) return
    try {
      const result = await client.add(JSON.stringify({ image, name, description }))
      mintThenList(result)
    } catch (error) {
      console.log("ipfs uri upload error: ", error)
    }
  }

  //Mint NFT function
  const mintThenList = async (result) => {
    const uri = `${subdomain}/ipfs/${result.path}`;
    // mint nft 
    await (await nft.mint(uri)).wait()
    // get tokenId of new nft 
    const id = await nft.tokenCount()
    // add nft to auctionhouse
    await (await auctionhouse.makeItem(nft.address, id)).wait()

    //Set data on variables    
    setMessage('Item created. Visit "My Items" section to see your items.')
    setFormVisible(false)
  }

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <h1>Create Item</h1>
            <p>Fill the form bellow to mint the NFT and create a new Item.</p>
            {formVisible ? (
              <Row className="g-4">
                <Form.Control
                  type="file"
                  required
                  name="file"
                  onChange={uploadToIPFS}
                />
                <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
                <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
                <div className="d-grid px-0">
                  <Button onClick={createNFT} variant="primary" size="lg">
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

export default CreateItems