// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MoonBotToken
 * @dev Ultra-lightweight Initializable ERC20 token designed for EIP-1167 Minimal Proxies.
 * Saves ~90% gas during coin creation on BOT Chain.
 */
contract MoonBotToken is ERC20 {
    uint8 private constant _DECIMALS = 18;
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**_DECIMALS; // 1 Billion tokens

    bool public initialized;
    string private _customName;
    string private _customSymbol;

    constructor() ERC20("MoonBot Template", "MBOT") {
        // Master implementation constructor
        initialized = true;
    }

    /**
     * @notice Initialize clone proxy with custom name, symbol, and mint supply to launchpad
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        address launchpad_
    ) external {
        require(!initialized, "Already initialized");
        require(launchpad_ != address(0), "Invalid launchpad");
        initialized = true;

        _customName = name_;
        _customSymbol = symbol_;

        // Mint fixed 1B supply to launchpad
        _mint(launchpad_, TOTAL_SUPPLY);
    }

    function name() public view virtual override returns (string memory) {
        return bytes(_customName).length > 0 ? _customName : super.name();
    }

    function symbol() public view virtual override returns (string memory) {
        return bytes(_customSymbol).length > 0 ? _customSymbol : super.symbol();
    }
}
