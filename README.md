# NFT-Auctionhouse
**Requirements for initial setup**

1. Install [NodeJS](https://nodejs.org/en/), should work with any node version below 16.5.0
2. Install [Hardhat](https://hardhat.org/)

**Setting up**

1. Clone/Download the repository
`git clone https://github.com/antokoufis/blockchain-auctionhouse`
2. Get inside project
`cd NFT-Auctionhouse` 
3. Install project specific dependencies
    
    `npm install`
    
4. Install dependencies that not included
    1. Install React Router Dom
        
        `npm install react-router-dom@6`
        
    2. Install IPFS HTTP Client
        
        `npm install ipfs-http-client@56.0.1`
        
    3. Install openzeppelin
        
        `npm install @openzeppelin/contracts@4.5.0`
        
**Requirements to boot up local development blockchain**

1. Install Metamask on your browser
2. Get inside project
`cd NFT-Auctionhouse` 
3. Start Hardhad node
`npx hardhat node`
4. Add hardhat network on Metamask
Open up a browser, click the fox icon, then click the top center 
dropdown button that lists all the available networks then click add 
networks. A form should pop up. For the "Network Name" field enter 
"Hardhat". For the "New RPC URL" field enter "[http://127.0.0.1:8545](http://127.0.0.1:8545/)
". For the chain ID enter "31337". Then click save.
5. Import addresses
    
    Note 1: When you run `npx hardhat node`, copy all address on external text file. Don’t use ctrl-c, ctrl-p.
    
    Note 2: Every time that you run `npx hardhat node` clear metamask history
    On Extension, click the account icon on the top-right corner. On Mobile, tap the hamburger icon in the top left to open the main menu > Select Settings > Select Advanced > Scroll down and click Reset Account
    
**Cheatsheet**
1. Start Hardhad node
`npx hardhat node`
2. Run hardhat test
`npx hardhat test`  
3. Deploy smart contracts
`npx hardhat run src/backend/scripts/deploy.js --network localhost`
4. Start react
`npm run start`
5. Run hardhat console
`npx hardhat console --network localhost`

