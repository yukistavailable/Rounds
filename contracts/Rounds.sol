// SPDX-License-Identifier: GPL-3.0-or-later

/// @title The Rounds ERC-721 token

/*
██████   ██████  ██    ██ ███    ██ ██████   ██████
██   ██ ██    ██ ██    ██ ████   ██ ██   ██ ██
██████  ██    ██ ██    ██ ██ ██  ██ ██   ██ ███████
██   ██ ██    ██ ██    ██ ██  ██ ██ ██   ██      ██
██   ██  ██████   ██████  ██   ████ ██████  ███████
*/

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

contract Rounds is Initializable, ERC721Upgradeable, ERC721BurnableUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    using StringsUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;

    // The duration of minting the next generation
    uint256 public duration;

    // The last time the first generation was minted
    uint256 public lastMintedTime;

    // The number of generations
    uint256 public lastGenNum;

    // The number of tokens minted as the 1st generation
    uint256 public tokenNumOfFirstGen;

    // The current token version
    uint256 public currentVersion;

    // The amount of minted generations;
    uint256 public genAmount;

    // The Rounds DAO address;
    address public roundsDAO;

    // An address who has permissions to mint Rounds
    address public minter;

    // Mapping for tokenURIs
    mapping (uint256 => string) private _versionURIs;

    // Mapping for version and tokenId
    mapping (uint256 => uint256) private _tokenIdVersion;

    // Mapping for version and generation
    mapping (uint256 => uint256) private _tokenIdGen;

    // Mapping for claimed tokens
    mapping (uint256 => bool) private _isTokenClaimed;

    // event
    event MintFirstGen(address minter, address to, uint256 version, uint256 tokenNum);

    // event
    event MinterUpdated(address minter);

    /**
     * @notice Require that the sender is the minter.
     */
    modifier onlyMinter() {
        require(_msgSender() == minter, 'Sender is not the minter');
        _;
    }

    /*
    * @notice Initialize the NFT contract.
    * @dev This function can only be called once.
    */
    function initialize(address _roundsDAO, address _minter, uint256 _duration, uint256 _tokenNum) initializer public {
        __ERC721_init("Rounds", "ROS");
        __ERC721Burnable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        lastGenNum = 4;
        roundsDAO = _roundsDAO;
        minter = _minter;
        currentVersion = 0;
        duration = _duration;
        lastMintedTime = 0;
        tokenNumOfFirstGen = _tokenNum;
        _tokenIdCounter.increment();
    }

    /*
    * @notice Mint 1st generation tokens.
    */
    function mintFirstGen(string memory uri) public onlyMinter {
        // Can mint after all generations of the former version are claimed
        require(lastMintedTime + duration * lastGenNum < block.timestamp, "Cannot mint yet");

        // Update lastMintedTime
        lastMintedTime = block.timestamp;

        // Increment version
        currentVersion++;

        // Set URI
        _versionURIs[currentVersion] = uri;

        // Mint tokens
        for (uint256 i=0;i<tokenNumOfFirstGen;i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(roundsDAO, tokenId);
            _tokenIdVersion[tokenId] = currentVersion;
            _tokenIdGen[tokenId] = 1;
        }

        emit MintFirstGen(_msgSender(), roundsDAO, currentVersion, tokenNumOfFirstGen);
    }

    /*
    * @notice Mint a next generation token.
    */
    function claimNextGeneration(uint256 _tokenId) public {
        uint256 version = _tokenIdVersion[_tokenId];
        uint256 gen = _tokenIdGen[_tokenId];

        require(ownerOf(_tokenId) == _msgSender(), "Only token owner can mint");
        require(gen < lastGenNum, "The token is the last generation");
        require(version == currentVersion, "Version is out of time");
        require(lastMintedTime + gen * duration <= block.timestamp && block.timestamp < lastMintedTime + (gen + 1) * duration, "Generation is out of time");
        require(!_isTokenClaimed[_tokenId], "The token has already been claimed");

        // Checked the token as claimed
        _isTokenClaimed[_tokenId] = true;

        // Mint the next generation token
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_msgSender(), tokenId);

        // Set version
        _tokenIdVersion[tokenId] = currentVersion;

        // Set generation
        _tokenIdGen[tokenId] = gen + 1;
    }

    /**
     * @dev Function reverts when `msg.sender` is not the owner.
     * Called by {upgradeTo} and {upgradeToAndCall}.
     */
    function _authorizeUpgrade(address newImplementation) internal onlyOwner override {}

    /*
    * @notice Burn a token.
    */
    function _burn(uint256 tokenId) internal override(ERC721Upgradeable) {
        super._burn(tokenId);
    }

    /*
    * @notice URI for a token.
    */
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable) returns (string memory) {
        uint256 version = _tokenIdVersion[tokenId];
        uint256 gen = _tokenIdGen[tokenId];
        string memory imageURI = string(abi.encodePacked(_versionURIs[version], "/", gen.toString()));
        string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "Rounds #', version.toString(), '-', gen.toString(),  '", "description": "Rounds DAO NFT", "image": "', imageURI, '"}'))));
        json = string(abi.encodePacked('data:application/json;base64,', json));
        return json;
    }

    /**
     * @notice Set the token minter.
     * @dev Only callable by the owner.
     */
    function setMinter(address _minter) public onlyOwner {
        minter = _minter;

        emit MinterUpdated(_minter);
    }
}

library Base64 {
    bytes internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /// @notice Encodes some bytes to the base64 representation
    function encode(bytes memory data) internal pure returns (string memory) {
        uint256 len = data.length;
        if (len == 0) return "";

        // multiply by 4/3 rounded up
        uint256 encodedLen = 4 * ((len + 2) / 3);

        // Add some extra buffer at the end
        bytes memory result = new bytes(encodedLen + 32);

        bytes memory table = TABLE;

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for {
                let i := 0
            } lt(i, len) {

            } {
                i := add(i, 3)
                let input := and(mload(add(data, i)), 0xffffff)

                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                out := shl(224, out)

                mstore(resultPtr, out)

                resultPtr := add(resultPtr, 4)
            }

            switch mod(len, 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }

            mstore(result, encodedLen)
        }

        return string(result);
    }
}
