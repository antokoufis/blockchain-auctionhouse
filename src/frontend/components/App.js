import './App.css';
import Navigation from './Navbar';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Home from './Home.js'
import Items from './Items.js'
import ItemDetails from './ItemDetails';
import MyItems from './MyItems.js'
import CreateItems from './CreateItems.js'
import Auctions from './Auctions';
import AuctionDetails from './AuctionDetails';
import MyAuctions from './MyAuctions';
import CreateAuctions from './CreateAuctions';
import MyBids from './MyBids';

import AuctionhouseAbi from '../contractsData/Auctionhouse.json'
import AuctionhouseAddress from '../contractsData/Auctionhouse-address.json'
import NFTAbi from '../contractsData/NFT.json'
import NFTAddress from '../contractsData/NFT-address.json'

import { ethers } from "ethers"
import { useState } from 'react'

function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [nft, setNFT] = useState({})
  const [auctionhouse, setAuctionhouse] = useState({})
  //Handles the connection between app and Metamask
  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0])
    // Get provider from Metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // Set signer
    const signer = provider.getSigner()

    loadContracts(signer)
  }

  const loadContracts = async (signer) => {
    // Get deployed copies of contracts
    const auctionhouse = new ethers.Contract(AuctionhouseAddress.address, AuctionhouseAbi.abi, signer)
    setAuctionhouse(auctionhouse)
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer)
    setNFT(nft)
    setLoading(false)
  }

  return (
    <BrowserRouter>
      <div>
        <Navigation web3Handler={web3Handler} account={account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mx-auto mt-5">
                <Routes>
                  <Route path="/" element={
                    <Home auctionhouse={auctionhouse} nft={nft} />
                  } />
                  <Route path="/items" element={
                    <Items auctionhouse={auctionhouse} nft={nft} />
                  } />
                  <Route path="/items/:itemId" element={
                    <ItemDetails auctionhouse={auctionhouse} nft={nft} />
                  } />
                  <Route path="/items/my-items" element={
                    <MyItems auctionhouse={auctionhouse} nft={nft} />
                  } />
                  <Route path="/items/create-items" element={
                    <CreateItems auctionhouse={auctionhouse} nft={nft} />
                  } />
                  <Route path="/auctions" element={
                    <Auctions auctionhouse={auctionhouse} nft={nft} />
                  } />
                  <Route path="/auctions/:auctionId" element={
                    <AuctionDetails auctionhouse={auctionhouse} nft={nft} />
                  } />
                  <Route path="/auctions/my-auctions" element={
                    <MyAuctions auctionhouse={auctionhouse} nft={nft} />
                  } />
                  <Route path="/auctions/create-auctions" element={
                    <CreateAuctions auctionhouse={auctionhouse} nft={nft} />
                  } />
                  <Route path="/bids/my-bids" element={
                    <MyBids auctionhouse={auctionhouse} nft={nft} />
                  } />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;