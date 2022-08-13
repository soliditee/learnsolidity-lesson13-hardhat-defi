const { getNamedAccounts, ethers } = require("hardhat")
const { getWeth, ETH_AMOUNT } = require("./getWeth")

async function main() {
    await getWeth()

    const { deployer } = await getNamedAccounts()
    const lendingPool = await getLendingPool()
    console.log(`Lending Pool Address = ${lendingPool.address}`)

    // Deposit
    const wethContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    await approveErc20(wethContractAddress, lendingPool.address, ETH_AMOUNT, deployer)
    await lendingPool.deposit(wethContractAddress, ETH_AMOUNT, deployer, 0)
    console.log(`Depsited ${ethers.utils.formatEther(ETH_AMOUNT)} WETH`)

    // Borrow
    const { totalDebtETH, availableBorrowsETH } = await getBorrowerAccountData(lendingPool, deployer)
    const daiPrice = await getDaiPrice()
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toString())
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
    console.log(`Amount of DAI to borrower = ${amountDaiToBorrow}`)
    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    await borrowerDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer)

    await getBorrowerAccountData(lendingPool, deployer)

    // Repay
    await repayDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer)
    await getBorrowerAccountData(lendingPool, deployer)
}

async function repayDai(daiTokenAddress, lendingPool, amountToRepay, account) {
    await approveErc20(daiTokenAddress, lendingPool.address, amountToRepay, account)
    await lendingPool.repay(daiTokenAddress, amountToRepay, 1, account)
}

async function borrowerDai(daiTokenAddress, lendingPool, amountToBorrow, account) {
    await lendingPool.borrow(daiTokenAddress, amountToBorrow, 1, 0, account)
}

async function getLendingPool(account) {
    const addressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5", // Lending Pool Address Provider for V2 on Mainnet
        account
    )
    const lendingPoolAddress = await addressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
    return lendingPool
}

async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
    const ercToken = await ethers.getContractAt("IERC20", erc20Address, account)
    const txApprove = await ercToken.approve(spenderAddress, amountToSpend)
    await txApprove.wait(1)
    console.log(`Approved ${ethers.utils.formatEther(amountToSpend)} tokens`)
}

async function getBorrowerAccountData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } = await lendingPool.getUserAccountData(account)
    console.log(`Worth of ETH as Collateral       = ${ethers.utils.formatEther(totalCollateralETH)}`)
    console.log(`Worth of ETH as Debt             = ${ethers.utils.formatEther(totalDebtETH)}`)
    console.log(`Worth of ETH available to borrow = ${ethers.utils.formatEther(availableBorrowsETH)}`)
    return { totalDebtETH, availableBorrowsETH }
}

async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt("AggregatorV3Interface", "0x773616E4d11A78F511299002da57A0a94577F1f4")
    const { answer } = await daiEthPriceFeed.latestRoundData()
    console.log(`DAI/ETH price = ${(1 / answer.toString()) * 1e18}`)
    return answer
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
