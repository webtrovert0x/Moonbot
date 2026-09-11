const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MoonBotLaunchpad", function () {
  let launchpad;
  let owner, user1, user2;
  const CREATION_FEE = ethers.parseEther("0.2");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const LaunchpadFactory = await ethers.getContractFactory("MoonBotLaunchpad");
    launchpad = await LaunchpadFactory.deploy();
    await launchpad.waitForDeployment();
  });

  it("should create a new token requiring 0.2 BOT creation fee", async function () {
    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    const tx = await launchpad.connect(user1).createToken(
      "Moon Doge",
      "MDOGE",
      "The first doge on BOT Chain",
      "https://example.com/logo.png",
      "https://x.com/moondoge",
      "https://t.me/moondoge",
      "https://moondoge.bot",
      { value: CREATION_FEE }
    );
    await tx.wait();

    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(CREATION_FEE);

    const allTokens = await launchpad.getAllTokens();
    expect(allTokens.length).to.equal(1);

    const tokenInfo = await launchpad.getToken(allTokens[0]);
    expect(tokenInfo.name).to.equal("Moon Doge");
    expect(tokenInfo.symbol).to.equal("MDOGE");
    expect(tokenInfo.creator).to.equal(user1.address);
    expect(tokenInfo.tokensSold).to.equal(0);
    expect(tokenInfo.graduated).to.equal(false);
  });

  it("should create a token with creation fee + initial buy", async function () {
    const initialBuyBot = ethers.parseEther("1.0");
    const totalValue = CREATION_FEE + initialBuyBot;

    const tx = await launchpad.connect(user1).createToken(
      "BOT Pepe",
      "BPEPE",
      "Pepe goes to BOT Chain",
      "https://example.com/pepe.png",
      "",
      "",
      "",
      { value: totalValue }
    );
    await tx.wait();

    const allTokens = await launchpad.getAllTokens();
    const tokenAddr = allTokens[0];
    const TokenFactory = await ethers.getContractFactory("MoonBotToken");
    const tokenContract = TokenFactory.attach(tokenAddr);

    const userBalance = await tokenContract.balanceOf(user1.address);
    expect(userBalance).to.be.gt(0);

    const tokenInfo = await launchpad.getToken(tokenAddr);
    expect(tokenInfo.tokensSold).to.equal(userBalance);
    expect(tokenInfo.realBotReserve).to.be.gt(0);
  });

  it("should pay creator earnings (0.5%) on buys and sells", async function () {
    const tx = await launchpad.connect(user1).createToken(
      "RocketBOT",
      "RBOT",
      "To the moon",
      "https://example.com/rbot.png",
      "",
      "",
      "",
      { value: CREATION_FEE }
    );
    await tx.wait();

    const allTokens = await launchpad.getAllTokens();
    const tokenAddr = allTokens[0];
    const TokenFactory = await ethers.getContractFactory("MoonBotToken");
    const tokenContract = TokenFactory.attach(tokenAddr);

    const buyAmount = ethers.parseEther("2.0");
    const creatorBalanceBefore = await ethers.provider.getBalance(user1.address);

    // User2 buys tokens
    await launchpad.connect(user2).buy(tokenAddr, 0, { value: buyAmount });

    const creatorBalanceAfter = await ethers.provider.getBalance(user1.address);
    const expectedCreatorFee = (buyAmount * 50n) / 10000n; // 0.5%
    expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(expectedCreatorFee);

    // User2 sells
    const user2Balance = await tokenContract.balanceOf(user2.address);
    const sellAmount = user2Balance / 2n;
    await tokenContract.connect(user2).approve(await launchpad.getAddress(), sellAmount);

    const creatorBalanceBeforeSell = await ethers.provider.getBalance(user1.address);
    await launchpad.connect(user2).sell(tokenAddr, sellAmount, 0);
    const creatorBalanceAfterSell = await ethers.provider.getBalance(user1.address);

    expect(creatorBalanceAfterSell).to.be.gt(creatorBalanceBeforeSell);
  });

  it("should graduate token when 100% curve is filled", async function () {
    const tx = await launchpad.connect(user1).createToken(
      "Graduation Token",
      "GRAD",
      "Targeting 100% curve",
      "https://example.com/grad.png",
      "",
      "",
      "",
      { value: CREATION_FEE }
    );
    await tx.wait();

    const allTokens = await launchpad.getAllTokens();
    const tokenAddr = allTokens[0];

    // Big buy to trigger graduation
    const bigBuy = ethers.parseEther("200.0");
    await launchpad.connect(user2).buy(tokenAddr, 0, { value: bigBuy });

    const tokenInfo = await launchpad.getToken(tokenAddr);
    expect(tokenInfo.graduated).to.equal(true);
    expect(tokenInfo.tokensSold).to.equal(await launchpad.TOKENS_FOR_SALE());
  });
});
