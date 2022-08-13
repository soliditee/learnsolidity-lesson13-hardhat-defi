const { getNamedAccounts, ethers } = require("hardhat")

const ETH_AMOUNT = ethers.utils.parseEther("0.02")

async function getWeth() {
    const { deployer } = await getNamedAccounts()

    const wethContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const weth = await ethers.getContractAt("IWETH", wethContractAddress, deployer)

    const txDeposit = await weth.deposit({ value: ETH_AMOUNT })
    await txDeposit.wait(1)

    const wethBalance = await weth.balanceOf(deployer)
    console.log(`WETH Balance = ${ethers.utils.formatEther(wethBalance)}`)
}

module.exports = { getWeth, ETH_AMOUNT }
