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
        })
    })
    describe("mint the first generation", function () {
        before(async function () {
            this.provider = waffle.provider;
            const accounts = await ethers.getSigners();
            this.owner = accounts[0];
            this.minter = accounts[1];
            this.roundsDAO = accounts[2];
            this.firstGenURI = "ipfs://QmU73KaRypPG7xP9KaPJ9bFS912QVTTdH18sYjKbPeSa8y";

            this.oneWeekSeconds = 60 * 60 * 24 * 7;
            this.tokenNum = 25;

            // deploy Rounds Contract
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
            const currentVersion = await this.rounds.currentVersion();
            await expect(currentVersion).to.be.equal(1);
            // const lastMintedTime = await this.rounds.lastMintedTime();
            // console.log(lastMintedTime);
        })
        it("fail minting the first generation", async function () {
            const mintTx = this.rounds.connect(this.minter).mintFirstGen(this.firstGenURI)
            await expect(mintTx).to.be.revertedWith("Cannot mint yet");
        })
    })
    describe("claim the next generation", function () {
        before(async function () {
            this.provider = waffle.provider;
            const accounts = await ethers.getSigners();
            this.owner = accounts[0];
            this.minter = accounts[1];
            this.roundsDAO = accounts[2];
            this.nftHolder = accounts[3];
            this.firstGenURI = "ipfs://QmU73KaRypPG7xP9KaPJ9bFS912QVTTdH18sYjKbPeSa8y";
            this.secondGenURI = "ipfs://QmRhaSoURfbaJUBxGEeTATkJVgnwoHcAM6h2CeCb8yRwjp";

            this.oneWeekSeconds = 60 * 60 * 24 * 7;
            this.tokenNum = 25;

            // deploy Rounds Contract
            this.Rounds = await ethers.getContractFactory("Rounds");
            this.rounds = await upgrades.deployProxy(this.Rounds, [this.roundsDAO.address,this.minter.address,this.oneWeekSeconds,this.tokenNum], { initializer: 'initialize(address,address,uint256,uint256)', kind: 'uups'});
            await this.rounds.deployed();

            // mint the first generation
            const mintTx = await this.rounds.connect(this.minter).mintFirstGen(this.firstGenURI);
            await mintTx.wait();

            // transfer tokens
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, 1);
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, 2);
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, 3);
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, 4);
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, 5);
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, 6);
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, 7);
        })
        it("fail claiming the second generation due to invalid time", async function () {
            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(1);
            await expect(claimTx).to.be.revertedWith("Generation is out of time");
        })
        it("claim the second generation", async function () {
            // increase time
            await ethers.provider.send('evm_increaseTime', [this.oneWeekSeconds])
            await ethers.provider.send('evm_mine')

            // claim
            const claimTx = await this.rounds.connect(this.nftHolder).claimNextGeneration(1);
            await expect(claimTx).to.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.nftHolder.address,this.tokenNum+1);
            const claimTx2 = await this.rounds.connect(this.nftHolder).claimNextGeneration(2);
            await expect(claimTx2).to.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.nftHolder.address,this.tokenNum+2);
            const claimTx3 = await this.rounds.connect(this.nftHolder).claimNextGeneration(3);
            await expect(claimTx3).to.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.nftHolder.address,this.tokenNum+3);

            // tokenURI
            const tokenURI1_2 = await this.rounds.tokenURI(this.tokenNum+1);
            const expectedTokenURI1_2 = "data:application/json;base64,eyJuYW1lIjogIlJvdW5kcyAjMS0yIiwgImRlc2NyaXB0aW9uIjogIlJvdW5kcyBEQU8gTkZUIiwgImltYWdlIjogImlwZnM6Ly9RbVU3M0thUnlwUEc3eFA5S2FQSjliRlM5MTJRVlRUZEgxOHNZaktiUGVTYTh5LzIifQ=="
            await expect(tokenURI1_2).to.be.equal(expectedTokenURI1_2);
        })
        it("fail claiming the second generation because the token has already been claimed", async function () {
            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(1);
            await expect(claimTx).to.be.revertedWith("The token has already been claimed");
        })
        it("fail claiming the second generation due to invalid time", async function () {
            // increase time
            await ethers.provider.send('evm_increaseTime', [this.oneWeekSeconds])
            await ethers.provider.send('evm_mine')

            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(4);
            await expect(claimTx).to.be.revertedWith("Generation is out of time");
        })
        it("claim the third generation", async function () {
            // claim
            const claimTx = await this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum+1);
            await expect(claimTx).to.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.nftHolder.address,this.tokenNum+4);
            const claimTx2 = await this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum+2);
            await expect(claimTx2).to.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.nftHolder.address,this.tokenNum+5);

            // tokenURI
            const tokenURI1_3 = await this.rounds.tokenURI(this.tokenNum+4);
            const expectedTokenURI1_3 = "data:application/json;base64,eyJuYW1lIjogIlJvdW5kcyAjMS0zIiwgImRlc2NyaXB0aW9uIjogIlJvdW5kcyBEQU8gTkZUIiwgImltYWdlIjogImlwZnM6Ly9RbVU3M0thUnlwUEc3eFA5S2FQSjliRlM5MTJRVlRUZEgxOHNZaktiUGVTYTh5LzMifQ=="
            await expect(tokenURI1_3).to.be.equal(expectedTokenURI1_3);
        })
        it("fail claiming the third because the token has already been claimed", async function () {
            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum+1);
            await expect(claimTx).to.be.revertedWith("The token has already been claimed");
        })
        it("fail claiming the third generation due to invalid time", async function () {
            // increase time
            await ethers.provider.send('evm_increaseTime', [this.oneWeekSeconds])
            await ethers.provider.send('evm_mine')

            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum+3);
            await expect(claimTx).to.be.revertedWith("Generation is out of time");
        })
        it("claim the forth generation", async function () {
            // claim
            const claimTx = await this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum+4);
            await expect(claimTx).to.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.nftHolder.address,this.tokenNum+6);

            // tokenURI
            const tokenURI1_4 = await this.rounds.tokenURI(this.tokenNum+6);
            const expectedTokenURI1_4 = "data:application/json;base64,eyJuYW1lIjogIlJvdW5kcyAjMS00IiwgImRlc2NyaXB0aW9uIjogIlJvdW5kcyBEQU8gTkZUIiwgImltYWdlIjogImlwZnM6Ly9RbVU3M0thUnlwUEc3eFA5S2FQSjliRlM5MTJRVlRUZEgxOHNZaktiUGVTYTh5LzQifQ=="
            await expect(tokenURI1_4).to.be.equal(expectedTokenURI1_4);
        })
        it("fail claiming the forth generation because the token has already been claimed", async function () {
            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum+4);
            await expect(claimTx).to.be.revertedWith("The token has already been claimed");
        })
        it("fail claiming the forth generation due to invalid time", async function () {
            // increase time
            await ethers.provider.send('evm_increaseTime', [this.oneWeekSeconds])
            await ethers.provider.send('evm_mine')

            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum+5);
            await expect(claimTx).to.be.revertedWith("Generation is out of time");
        })
        it("fail claiming the forth generation because the token has already been claimed", async function () {
            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum+6);
            await expect(claimTx).to.be.revertedWith("The token is the last generation");
        })
        it("mint the first generation of the second version", async function () {
            this.tokenNum2 = this.tokenNum+6
            const mintTx = await this.rounds.connect(this.minter).mintFirstGen(this.secondGenURI)
            await expect(mintTx).to.emit(this.rounds, "MintFirstGen").withArgs(this.minter.address,this.roundsDAO.address,2,this.tokenNum)
                .and.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.roundsDAO.address,this.tokenNum2+1)
                .and.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.roundsDAO.address,this.tokenNum+25)
            const tokenURI2 = await this.rounds.tokenURI(this.tokenNum2+1);
            const expectedMetadata = "data:application/json;base64,eyJuYW1lIjogIlJvdW5kcyAjMi0xIiwgImRlc2NyaXB0aW9uIjogIlJvdW5kcyBEQU8gTkZUIiwgImltYWdlIjogImlwZnM6Ly9RbVJoYVNvVVJmYmFKVUJ4R0VlVEFUa0pWZ253b0hjQU02aDJDZUNiOHlSd2pwLzEifQ==";
            await expect(tokenURI2).to.be.equal(expectedMetadata);
            const currentVersion = await this.rounds.currentVersion();
            await expect(currentVersion).to.be.equal(2);
            // const lastMintedTime = await this.rounds.lastMintedTime();
            // console.log(lastMintedTime);

            // transfer tokens
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, this.tokenNum2+1);
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, this.tokenNum2+2);
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, this.tokenNum2+3);
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, this.tokenNum2+4);
            await this.rounds.connect(this.roundsDAO)['safeTransferFrom(address,address,uint256)'](this.roundsDAO.address, this.nftHolder.address, this.tokenNum2+5);
        })
        it("fail claiming the second generation due to invalid time", async function () {
            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum2+1);
            await expect(claimTx).to.be.revertedWith("Generation is out of time");
        })
        it("fail claiming the second generation due to invalid version", async function () {
            // increase time
            await ethers.provider.send('evm_increaseTime', [this.oneWeekSeconds])
            await ethers.provider.send('evm_mine')

            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(6);
            await expect(claimTx).to.be.revertedWith("Version is out of time");
        })
        it("claim the second generation", async function () {
            // claim
            const claimTx = await this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum2+1);
            await expect(claimTx).to.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.nftHolder.address,this.tokenNum2+this.tokenNum+1);
            const claimTx2 = await this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum2+2);
            await expect(claimTx2).to.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.nftHolder.address,this.tokenNum2+this.tokenNum+2);
            const claimTx3 = await this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum2+3);
            await expect(claimTx3).to.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.nftHolder.address,this.tokenNum2+this.tokenNum+3);

            // tokenURI
            const tokenURI2_1 = await this.rounds.tokenURI(this.tokenNum2+this.tokenNum+1);
            const expectedTokenURI2_1 = "data:application/json;base64,eyJuYW1lIjogIlJvdW5kcyAjMi0yIiwgImRlc2NyaXB0aW9uIjogIlJvdW5kcyBEQU8gTkZUIiwgImltYWdlIjogImlwZnM6Ly9RbVJoYVNvVVJmYmFKVUJ4R0VlVEFUa0pWZ253b0hjQU02aDJDZUNiOHlSd2pwLzIifQ=="
            await expect(tokenURI2_1).to.be.equal(expectedTokenURI2_1);
        })
        it("fail claiming the second generation because the token has already been claimed", async function () {
            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum2+1);
            await expect(claimTx).to.be.revertedWith("The token has already been claimed");
        })
        it("fail claiming the second generation due to invalid time", async function () {
            // increase time
            await ethers.provider.send('evm_increaseTime', [this.oneWeekSeconds])
            await ethers.provider.send('evm_mine')

            // claim
            const claimTx = this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum2+4);
            await expect(claimTx).to.be.revertedWith("Generation is out of time");
        })
        it("claim the third generation", async function () {
            // claim
            const claimTx = await this.rounds.connect(this.nftHolder).claimNextGeneration(this.tokenNum2+this.tokenNum+1);
            await expect(claimTx).to.emit(this.rounds, "Transfer").withArgs(ethers.constants.AddressZero,this.nftHolder.address,this.tokenNum2+this.tokenNum+4);

            // tokenURI
            const tokenURI1_3 = await this.rounds.tokenURI(this.tokenNum2+this.tokenNum+4);
            const expectedTokenURI1_3 = "data:application/json;base64,eyJuYW1lIjogIlJvdW5kcyAjMi0zIiwgImRlc2NyaXB0aW9uIjogIlJvdW5kcyBEQU8gTkZUIiwgImltYWdlIjogImlwZnM6Ly9RbVJoYVNvVVJmYmFKVUJ4R0VlVEFUa0pWZ253b0hjQU02aDJDZUNiOHlSd2pwLzMifQ=="
            await expect(tokenURI1_3).to.be.equal(expectedTokenURI1_3);
        })
    })
})
