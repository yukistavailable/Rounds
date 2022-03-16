require('dotenv').config()
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");

const privateKey = process.env.PRIVATE_KEY
const polygonMumbai = process.env.POLYGON_MUMBAI
const polygonMainnet = process.env.POLYGON_MAINNET
const polygonScanAPIKey = process.env.POLYGONSCAN

module.exports = {
  defaultNetwork: "hardhat",
  solidity: "0.8.4",
  networks: {
    hardhat: {
    },
    mumbai: {
      url: polygonMumbai,
      accounts: [privateKey]
    },
    mainnet: {
      url: polygonMainnet,
      accounts: [privateKey]
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: polygonScanAPIKey
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
