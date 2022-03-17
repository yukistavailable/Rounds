const { expect } = require("chai");
const { ethers, waffle, upgrades } = require("hardhat");

describe("Rounds", function () {
    describe("initialization", function () {
        it("deploy", async function () {
            const oneWeekSeconds = 60 * 60 * 24 * 7;
            const tokenNum = 25;
            const accounts = await ethers.getSigners();
            const Rounds = await ethers.getContractFactory("Rounds");
            const rounds = await upgrades.deployProxy(Rounds, [accounts[1].address,accounts[0].address,oneWeekSeconds,tokenNum], { initializer: 'initialize(address,address,uint256,uint256)', kind: 'uups'});
            await rounds.deployed();
            console.log(rounds.address);
        })
    })
    describe("mint the first generation", function () {
        before(async function () {
            this.provider = waffle.provider;
            const accounts = await ethers.getSigners();
            this.owner = accounts[0];
            this.minter = accounts[1];
            this.roundsDAO = accounts[2];
            this.brand = accounts[3];
            this.firstGenURI = "ipfs://QmU73KaRypPG7xP9KaPJ9bFS912QVTTdH18sYjKbPeSa8y";

            this.oneWeekSeconds = 60 * 60 * 24 * 7;
            this.tokenNum = 25;
            this.Rounds = await ethers.getContractFactory("Rounds");
            this.rounds = await upgrades.deployProxy(this.Rounds, [this.roundsDAO.address,this.minter.address,this.oneWeekSeconds,this.tokenNum], { initializer: 'initialize(address,address,uint256,uint256)', kind: 'uups'});
            await this.rounds.deployed();
        })
        it("mint the first generation", async function () {
            const mintTx = await this.rounds.connect(this.minter).mintFirstGen(this.firstGenURI)
            await expect(mintTx).to.emit(this.rounds, "MintFirstGen").withArgs(this.minter.address,this.roundsDAO.address,1,this.tokenNum)
                .and.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.roundsDAO.address,1)
                .and.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.roundsDAO.address,this.tokenNum)
            const tokenURI1 = await this.rounds.tokenURI(1);
            const expectedMetadata = "data:application/json;base64,eyJuYW1lIjogIlJvdW5kcyAjMS0xIiwgImRlc2NyaXB0aW9uIjogIlJvdW5kcyBEQU8gTkZUIiwgImltYWdlIjogImlwZnM6Ly9RbVU3M0thUnlwUEc3eFA5S2FQSjliRlM5MTJRVlRUZEgxOHNZaktiUGVTYTh5LzEifQ==";
            await expect(tokenURI1).to.be.equal(expectedMetadata);
            const lastMintedTime = await this.rounds.lastMintedTime();
            console.log(lastMintedTime);
        })
        it("fail minting the first generation", async function () {
            const mintTx = this.rounds.connect(this.minter).mintFirstGen(this.firstGenURI)
            await expect(mintTx).to.be.revertedWith("Cannot mint yet");
        })
    })
})
