const { ethers, upgrades } = require("hardhat");

async function main() {
    const accounts = await ethers.getSigners();
    const oneWeekSeconds = 60 * 60 * 24 * 7;
    const tokenNum = 5;
    // console.log(accounts[0].address);

    /// deploy
    const Rounds = await ethers.getContractFactory("Rounds");
    const rounds = await upgrades.deployProxy(Rounds, [accounts[1].address,accounts[0].address,oneWeekSeconds,tokenNum], { initializer: 'initialize(address,address,uint256,uint256)', kind: 'uups'});
    await rounds.deployed();
    console.log(rounds.address);
}

main();