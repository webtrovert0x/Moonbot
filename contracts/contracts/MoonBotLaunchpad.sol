// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MoonBotToken.sol";

/**
 * @title MoonBotLaunchpad
 * @notice Fair-launch bonding curve launchpad for BOT Chain.
 * Features:
 * - 0.2 BOT Creation Fee (Protocol revenue)
 * - 1% Trading Fee Split: 0.5% to Protocol + 0.5% to Token Creator
 * - EIP-1167 Minimal Proxy Clones for ~90% lower gas fees
 * - Auto-Graduation to DEX upon 100% bonding curve fill
 */
contract MoonBotLaunchpad is ReentrancyGuard, Ownable {
    using Clones for address;

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 1e18; // 1 Billion tokens
    uint256 public constant TOKENS_FOR_SALE = 800_000_000 * 1e18; // 800 Million tokens (80%)
    uint256 public constant TOKENS_FOR_DEX = 200_000_000 * 1e18;  // 200 Million tokens (20%)
    
    // Initial virtual reserves for bonding curve: (x * y = k)
    uint256 public constant INITIAL_VIRTUAL_BOT_RESERVE = 30 ether;
    uint256 public constant INITIAL_VIRTUAL_TOKEN_RESERVE = 1_073_000_000 * 1e18;
    uint256 public constant K_CONSTANT = INITIAL_VIRTUAL_BOT_RESERVE * INITIAL_VIRTUAL_TOKEN_RESERVE;
    
    // Fee configurations
    uint256 public creationFee = 0.2 ether; // 0.2 BOT fee to create a coin
    uint256 public constant PROTOCOL_FEE_BPS = 50; // 0.50% protocol fee
    uint256 public constant CREATOR_FEE_BPS = 50;  // 0.50% creator earnings fee
    uint256 public constant TOTAL_FEE_BPS = 100;   // 1.00% total trading fee

    address public immutable tokenImplementation;
    address public feeRecipient;
    address[] public allTokens;

    struct TokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        string description;
        string imageUri;
        string twitter;
        string telegram;
        string website;
        address creator;
        uint256 virtualBotReserve;
        uint256 virtualTokenReserve;
        uint256 realBotReserve;
        uint256 tokensSold;
        bool graduated;
        uint256 createdAt;
    }

    mapping(address => TokenInfo) public tokens;
    mapping(address => bool) public isTokenRegistered;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        string description,
        string imageUri,
        string twitter,
        string telegram,
        string website,
        address indexed creator,
        uint256 createdAt
    );

    event TokenPurchased(
        address indexed tokenAddress,
        address indexed buyer,
        uint256 botIn,
        uint256 tokensOut,
        uint256 newVirtualBotReserve,
        uint256 newVirtualTokenReserve,
        uint256 timestamp
    );

    event TokenSold(
        address indexed tokenAddress,
        address indexed seller,
        uint256 tokensIn,
        uint256 botOut,
        uint256 newVirtualBotReserve,
        uint256 newVirtualTokenReserve,
        uint256 timestamp
    );

    event TokenGraduated(
        address indexed tokenAddress,
        uint256 botLiquidity,
        uint256 tokenLiquidity,
        uint256 timestamp
    );

    event CreatorFeePaid(
        address indexed tokenAddress,
        address indexed creator,
        uint256 feeAmount,
        uint256 timestamp
    );

    constructor(address _tokenImplementation) Ownable(msg.sender) {
        require(_tokenImplementation != address(0), "Invalid token impl");
        feeRecipient = msg.sender;
        tokenImplementation = _tokenImplementation;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid fee recipient");
        feeRecipient = newRecipient;
    }

    function setCreationFee(uint256 newFee) external onlyOwner {
        creationFee = newFee;
    }

    /**
     * @notice Creates a new token requiring 0.2 BOT creation fee
     * @dev Any excess msg.value above creationFee is used to execute an initial buy
     */
    function createToken(
        string memory name,
        string memory symbol,
        string memory description,
        string memory imageUri,
        string memory twitter,
        string memory telegram,
        string memory website
    ) external payable nonReentrant returns (address) {
        require(msg.value >= creationFee, "Creation fee of 0.2 BOT required");
        require(bytes(name).length > 0, "Name required");
        require(bytes(symbol).length > 0, "Symbol required");

        // Transfer creation fee to protocol fee recipient
        if (creationFee > 0) {
            (bool feeSent, ) = payable(feeRecipient).call{value: creationFee}("");
            require(feeSent, "Creation fee transfer failed");
        }

        // Clone master implementation at ~90% lower gas cost
        address tokenAddr = tokenImplementation.clone();
        MoonBotToken(tokenAddr).initialize(name, symbol, address(this));

        tokens[tokenAddr] = TokenInfo({
            tokenAddress: tokenAddr,
            name: name,
            symbol: symbol,
            description: description,
            imageUri: imageUri,
            twitter: twitter,
            telegram: telegram,
            website: website,
            creator: msg.sender,
            virtualBotReserve: INITIAL_VIRTUAL_BOT_RESERVE,
            virtualTokenReserve: INITIAL_VIRTUAL_TOKEN_RESERVE,
            realBotReserve: 0,
            tokensSold: 0,
            graduated: false,
            createdAt: block.timestamp
        });

        isTokenRegistered[tokenAddr] = true;
        allTokens.push(tokenAddr);

        emit TokenCreated(
            tokenAddr,
            name,
            symbol,
            description,
            imageUri,
            twitter,
            telegram,
            website,
            msg.sender,
            block.timestamp
        );

        // Optional initial purchase with remaining value
        uint256 initialBuyBot = msg.value - creationFee;
        if (initialBuyBot > 0) {
            _executeBuy(tokenAddr, msg.sender, initialBuyBot, 0);
        }

        return tokenAddr;
    }

    /**
     * @notice Buy tokens using BOT
     */
    function buy(address tokenAddress, uint256 minTokensOut) external payable nonReentrant {
        require(isTokenRegistered[tokenAddress], "Token not registered");
        require(msg.value > 0, "Must send BOT");
        _executeBuy(tokenAddress, msg.sender, msg.value, minTokensOut);
    }

    struct BuyCalculation {
        uint256 protocolFee;
        uint256 creatorFee;
        uint256 totalFee;
        uint256 netBot;
        uint256 newBotReserve;
        uint256 newTokenReserve;
        uint256 tokensOut;
        uint256 excessBot;
        bool hitsGraduation;
    }

    function _executeBuy(
        address tokenAddress,
        address buyer,
        uint256 botAmount,
        uint256 minTokensOut
    ) internal {
        TokenInfo storage token = tokens[tokenAddress];
        require(!token.graduated, "Token already graduated");

        BuyCalculation memory calc;
        calc.protocolFee = (botAmount * PROTOCOL_FEE_BPS) / 10000;
        calc.creatorFee = (botAmount * CREATOR_FEE_BPS) / 10000;
        calc.totalFee = calc.protocolFee + calc.creatorFee;
        calc.netBot = botAmount - calc.totalFee;

        // Distribute protocol fee
        if (calc.protocolFee > 0) {
            (bool feeSent, ) = payable(feeRecipient).call{value: calc.protocolFee}("");
            require(feeSent, "Protocol fee transfer failed");
        }

        // Distribute creator earnings fee
        if (calc.creatorFee > 0 && token.creator != address(0)) {
            (bool creatorFeeSent, ) = payable(token.creator).call{value: calc.creatorFee}("");
            if (creatorFeeSent) {
                emit CreatorFeePaid(tokenAddress, token.creator, calc.creatorFee, block.timestamp);
            }
        }

        calc.newBotReserve = token.virtualBotReserve + calc.netBot;
        calc.newTokenReserve = K_CONSTANT / calc.newBotReserve;
        calc.tokensOut = token.virtualTokenReserve - calc.newTokenReserve;

        uint256 remainingTokens = TOKENS_FOR_SALE - token.tokensSold;

        if (calc.tokensOut >= remainingTokens) {
            calc.tokensOut = remainingTokens;
            calc.newTokenReserve = token.virtualTokenReserve - calc.tokensOut;
            calc.newBotReserve = K_CONSTANT / calc.newTokenReserve;
            uint256 actualNetBot = calc.newBotReserve - token.virtualBotReserve;
            uint256 actualFee = (actualNetBot * TOTAL_FEE_BPS) / (10000 - TOTAL_FEE_BPS);
            uint256 totalCost = actualNetBot + actualFee;

            if (botAmount > totalCost) {
                calc.excessBot = botAmount - totalCost;
            }

            token.virtualBotReserve = calc.newBotReserve;
            token.virtualTokenReserve = calc.newTokenReserve;
            token.realBotReserve += actualNetBot;
            token.tokensSold = TOKENS_FOR_SALE;
            token.graduated = true;
            calc.hitsGraduation = true;
        } else {
            token.virtualBotReserve = calc.newBotReserve;
            token.virtualTokenReserve = calc.newTokenReserve;
            token.realBotReserve += calc.netBot;
            token.tokensSold += calc.tokensOut;
        }

        require(calc.tokensOut >= minTokensOut, "Slippage tolerance exceeded");

        IERC20(tokenAddress).transfer(buyer, calc.tokensOut);

        if (calc.excessBot > 0) {
            (bool refundSent, ) = payable(buyer).call{value: calc.excessBot}("");
            require(refundSent, "Refund transfer failed");
        }

        if (calc.hitsGraduation) {
            emit TokenGraduated(tokenAddress, token.realBotReserve, TOKENS_FOR_DEX, block.timestamp);
        }

        emit TokenPurchased(
            tokenAddress,
            buyer,
            botAmount - calc.excessBot,
            calc.tokensOut,
            token.virtualBotReserve,
            token.virtualTokenReserve,
            block.timestamp
        );
    }

    /**
     * @notice Sell tokens for BOT
     */
    function sell(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 minBotOut
    ) external nonReentrant {
        require(isTokenRegistered[tokenAddress], "Token not registered");
        require(tokenAmount > 0, "Token amount must be > 0");

        TokenInfo storage token = tokens[tokenAddress];
        require(!token.graduated, "Token already graduated");

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenAmount);

        uint256 newTokenReserve = token.virtualTokenReserve + tokenAmount;
        uint256 newBotReserve = K_CONSTANT / newTokenReserve;
        uint256 grossBotOut = token.virtualBotReserve - newBotReserve;

        require(grossBotOut <= token.realBotReserve, "Insufficient real BOT reserve");

        uint256 protocolFee = (grossBotOut * PROTOCOL_FEE_BPS) / 10000;
        uint256 creatorFee = (grossBotOut * CREATOR_FEE_BPS) / 10000;
        uint256 totalFee = protocolFee + creatorFee;
        uint256 netBotOut = grossBotOut - totalFee;

        require(netBotOut >= minBotOut, "Slippage tolerance exceeded");

        token.virtualBotReserve = newBotReserve;
        token.virtualTokenReserve = newTokenReserve;
        token.realBotReserve -= grossBotOut;
        token.tokensSold -= tokenAmount;

        // Transfer protocol fee
        if (protocolFee > 0) {
            (bool feeSent, ) = payable(feeRecipient).call{value: protocolFee}("");
            require(feeSent, "Protocol fee transfer failed");
        }

        // Transfer creator earnings fee
        if (creatorFee > 0 && token.creator != address(0)) {
            (bool creatorFeeSent, ) = payable(token.creator).call{value: creatorFee}("");
            if (creatorFeeSent) {
                emit CreatorFeePaid(tokenAddress, token.creator, creatorFee, block.timestamp);
            }
        }

        // Send BOT to seller
        (bool sent, ) = payable(msg.sender).call{value: netBotOut}("");
        require(sent, "BOT transfer failed");

        emit TokenSold(
            tokenAddress,
            msg.sender,
            tokenAmount,
            netBotOut,
            token.virtualBotReserve,
            token.virtualTokenReserve,
            block.timestamp
        );
    }

    /**
     * @notice Estimate how many tokens you get for a given BOT amount
     */
    function calculateOutput(address tokenAddress, uint256 botIn)
        external
        view
        returns (uint256 tokensOut, uint256 fee)
    {
        require(isTokenRegistered[tokenAddress], "Token not registered");
        TokenInfo memory token = tokens[tokenAddress];
        if (token.graduated) return (0, 0);

        fee = (botIn * TOTAL_FEE_BPS) / 10000;
        uint256 netBot = botIn - fee;

        uint256 newBotReserve = token.virtualBotReserve + netBot;
        uint256 newTokenReserve = K_CONSTANT / newBotReserve;
        tokensOut = token.virtualTokenReserve - newTokenReserve;

        uint256 remainingTokens = TOKENS_FOR_SALE - token.tokensSold;
        if (tokensOut > remainingTokens) {
            tokensOut = remainingTokens;
        }
    }

    /**
     * @notice Estimate BOT received when selling tokens
     */
    function calculateRefund(address tokenAddress, uint256 tokenAmount)
        external
        view
        returns (uint256 botOut, uint256 fee)
    {
        require(isTokenRegistered[tokenAddress], "Token not registered");
        TokenInfo memory token = tokens[tokenAddress];
        if (token.graduated) return (0, 0);

        uint256 newTokenReserve = token.virtualTokenReserve + tokenAmount;
        uint256 newBotReserve = K_CONSTANT / newTokenReserve;
        uint256 grossBotOut = token.virtualBotReserve - newBotReserve;

        fee = (grossBotOut * TOTAL_FEE_BPS) / 10000;
        botOut = grossBotOut - fee;
    }

    /**
     * @notice Get current token price in BOT (1 token = ? BOT scaled by 1e18)
     */
    function getCurrentPrice(address tokenAddress) external view returns (uint256) {
        require(isTokenRegistered[tokenAddress], "Token not registered");
        TokenInfo memory token = tokens[tokenAddress];
        return (token.virtualBotReserve * 1e18) / token.virtualTokenReserve;
    }

    /**
     * @notice Get bonding curve progress in percentage basis points (10000 = 100%)
     */
    function getProgress(address tokenAddress) external view returns (uint256) {
        require(isTokenRegistered[tokenAddress], "Token not registered");
        TokenInfo memory token = tokens[tokenAddress];
        if (token.graduated) return 10000;
        return (token.tokensSold * 10000) / TOKENS_FOR_SALE;
    }

    /**
     * @notice Returns all token details
     */
    function getToken(address tokenAddress) external view returns (TokenInfo memory) {
        require(isTokenRegistered[tokenAddress], "Token not registered");
        return tokens[tokenAddress];
    }

    /**
     * @notice Returns array of all deployed token addresses
     */
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    /**
     * @notice Returns count of all deployed tokens
     */
    function tokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    receive() external payable {}
}
