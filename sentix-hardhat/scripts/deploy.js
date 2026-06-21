const { ethers, run, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("─────────────────────────────────────────");
  console.log("Deploying SentixLogger");
  console.log("Network  :", network.name);
  console.log("Deployer :", deployer.address);
  console.log(
    "Balance  :",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );
  console.log("─────────────────────────────────────────");

  const SentixLogger = await ethers.getContractFactory("SentixLogger");
  const contract = await SentixLogger.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✓ SentixLogger deployed to:", address);

  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting 10s before verifying on Basescan...");
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    try {
      await run("verify:verify", { address, constructorArguments: [] });
      console.log("✓ Contract verified on Basescan");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Already Verified")) {
        console.log("✓ Already verified");
      } else {
        console.warn("⚠ Verification failed:", msg);
        console.warn(`  Run manually: npx hardhat verify --network ${network.name} ${address}`);
      }
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log("Add these to your frontend .env.local:");
  console.log(`NEXT_PUBLIC_SENTIX_LOGGER_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=${network.config.chainId}`);
  console.log("─────────────────────────────────────────");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});