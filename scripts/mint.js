const { ethers, upgrades } = require("hardhat");

async function main() {
    const accounts = await ethers.getSigners();
    const uri = "ipfs://QmU73KaRypPG7xP9KaPJ9bFS912QVTTdH18sYjKbPeSa8y";
    const roundsAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const Rounds = await ethers.getContractFactory("Rounds");
    const rounds = await Rounds.attach(roundsAddress);
    console.log(rounds.address);

    const tx = await rounds.mintFirstGen(uri);
    await tx.wait();

    const uri1 = await rounds.tokenURI(1);
    console.log(uri1);
}

main();