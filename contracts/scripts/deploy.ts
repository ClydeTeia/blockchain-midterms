import { ethers, run } from "hardhat";

async function main() {
  const tipPostFactory = await ethers.getContractFactory("TipPost");
  const tipPost = await tipPostFactory.deploy();
  await tipPost.waitForDeployment();

  const address = await tipPost.getAddress();

  console.log(`TipPost deployed to: ${address}`);
  console.log("\nVerification command:");
  console.log(`npx hardhat verify --network sepolia ${address}`);

  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\nWaiting 30s before auto-verify...");
    await new Promise((resolve) => setTimeout(resolve, 30_000));

    try {
      await run("verify:verify", {
        address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan.");
    } catch (error) {
      console.log("Auto-verify skipped or failed:");
      console.log(error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
