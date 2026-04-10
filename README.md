# TipPost dApp (Hardhat + React + Vite + TypeScript)

TipPost is a pay-to-like social dApp.

How it works in simple terms:
1. A user creates a post (image URL + caption) and it is saved on Sepolia.
2. Another user clicks like and sends exactly `0.0001 ETH` tip.
3. The contract records the like and attempts direct payout to creator.
4. If direct payout fails, the tip is escrowed on-chain and the creator can call `withdraw()`.
5. The frontend listens to contract events to refresh feed and earnings in near real time.

## Tech Stack
- Smart Contract: Solidity `^0.8.20`
- Contract Dev: Hardhat + TypeScript
- Frontend: React + Vite + TypeScript
- Chain Interaction: ethers.js v6
- Wallet: MetaMask
- Network: Sepolia

## Project Structure
- `contracts/` smart contract, tests, deploy scripts
- `frontend/` live UI (Vercel target)

## Prerequisites
- Node.js 20+
- MetaMask browser extension
- Sepolia test ETH

Faucets:
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia
- https://sepoliafaucet.com
- https://www.infura.io/faucet/sepolia

## Part A: Contracts Setup

### 1) Install dependencies
```bash
cd contracts
npm install
```

### 2) Configure environment
Create `contracts/.env`:
```bash
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"
ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
```

Never commit `.env`.

### 3) Compile + sync ABI
```bash
npm run build:withabi
```

### 4) Test
```bash
npm test
```

### 5) Deploy to Sepolia
```bash
npm run deploy:sepolia
```
Copy the deployed contract address.

After deploy, re-sync ABI if contract changed:
```bash
npm run sync:abi
```

### 6) Verify contract (bonus)
```bash
npm run verify:sepolia -- YOUR_CONTRACT_ADDRESS
```

## Part B: Frontend Setup

### 1) Install dependencies
```bash
cd frontend
npm install
```

### 2) Configure environment
Create `frontend/.env`:
```bash
VITE_CONTRACT_ADDRESS="0xYourSepoliaContractAddress"
VITE_CHAIN_ID="11155111"
```

### 3) Run locally
```bash
npm run dev
```

Open the URL shown by Vite, connect MetaMask, and switch to Sepolia.

### 4) Build
```bash
npm run build
```

## Vercel Deployment (Frontend)
1. Push repo to GitHub.
2. In Vercel, create New Project and import this repo.
3. Set Root Directory to `frontend`.
4. Add env vars:
   - `VITE_CONTRACT_ADDRESS`
   - `VITE_CHAIN_ID=11155111`
5. Deploy.

## Required Submission Values
- GitHub Repo: `https://github.com/ClydeTeia/blockchain-midterms` (pending creation from this workspace)
- Live Frontend URL: `https://blockchain-midterms.vercel.app`
- Sepolia Contract Address: `0x95aaC5D03020DB1797aDE432605E16EDd9219A49`
- Sepolia Etherscan URL: `https://sepolia.etherscan.io/address/0x95aaC5D03020DB1797aDE432605E16EDd9219A49`

## Deployment Details
- Network: Sepolia (`11155111`)
- Contract Address: `0x95aaC5D03020DB1797aDE432605E16EDd9219A49`
- Contract Creation Tx: `0x3735c8e378b3d1042a448eb9096a060c19562541b843ebec92151a084b53ccf0`
- Contract Creation Timestamp (UTC): `2026-04-10T05:28:00Z`
- Verification Status: Verified
- Verification Link: `https://sepolia.etherscan.io/address/0x95aaC5D03020DB1797aDE432605E16EDd9219A49#code`

## Acceptance Test Flow
1. Account A: create a post.
2. Account B: like the post (MetaMask shows `0.0001 ETH` tip).
3. Account A: earnings should increase by `0.0001 ETH` (direct payout or escrowed balance).
4. Double-like attempt should fail with error message.
5. Self-like attempt should fail with error message.
6. If payout is escrowed, creator withdraws escrow successfully.

### Acceptance Proof (Sepolia)
Acceptance run timestamp (UTC): `2026-04-10T07:04:24Z`

| Step | Result | Tx Hash | Etherscan |
|---|---|---|---|
| Fund Account B (prep) | Pass | `0xbc827199f30305be0a0798764c17978f1cc5108d27bc723982f4b01598bd3f2f` | https://sepolia.etherscan.io/tx/0xbc827199f30305be0a0798764c17978f1cc5108d27bc723982f4b01598bd3f2f |
| 1. Account A creates post (`postId=4`) | Pass | `0xc6634d068bb191977b17d560b62a6434d12f8f8d8b3ddcb14e6e666ed69774da` | https://sepolia.etherscan.io/tx/0xc6634d068bb191977b17d560b62a6434d12f8f8d8b3ddcb14e6e666ed69774da |
| 2. Account B likes post with exact `0.0001 ETH` | Pass | `0x0280cac3be198e4ad7288d871edd6891ebba6bd0a503b7bb07853c038245302a` | https://sepolia.etherscan.io/tx/0x0280cac3be198e4ad7288d871edd6891ebba6bd0a503b7bb07853c038245302a |
| 4. Double-like attempt (Account B) | Expected Revert (`AlreadyLiked`) | `0xeae44dc7dd550629598e58e9aeccfcbee68f16997d9e1b3fb90eac717c1902fc` | https://sepolia.etherscan.io/tx/0xeae44dc7dd550629598e58e9aeccfcbee68f16997d9e1b3fb90eac717c1902fc |
| 5. Self-like attempt (Account A) | Expected Revert (`CannotLikeOwnPost`) | `0x22ab0c3598439ef72b8e0fc58838efa64a782375bbc66d897e51cbd5b383c2d5` | https://sepolia.etherscan.io/tx/0x22ab0c3598439ef72b8e0fc58838efa64a782375bbc66d897e51cbd5b383c2d5 |
| Deploy RejectEtherReceiver (prep for escrow test) | Pass | `0x50e9464a70a9359c7f695eaf800cb0344ab70ce95c40b63809f82ef8022107bb` | https://sepolia.etherscan.io/tx/0x50e9464a70a9359c7f695eaf800cb0344ab70ce95c40b63809f82ef8022107bb |
| Create reject-receiver post (`postId=5`) | Pass | `0xe1b43c1b5b33ca92a482d2f6274668f71ab26773ee3a8933aeef9a19846a3a3f` | https://sepolia.etherscan.io/tx/0xe1b43c1b5b33ca92a482d2f6274668f71ab26773ee3a8933aeef9a19846a3a3f |
| 6. Escrow fallback like (`TipEscrowed` emitted) | Pass | `0xa67490348c4565305731a9c56d83198b9b8e9be78f8c9b885cc9371f44f9431c` | https://sepolia.etherscan.io/tx/0xa67490348c4565305731a9c56d83198b9b8e9be78f8c9b885cc9371f44f9431c |
| 6. Withdraw escrowed tips | Pass | `0x4256e50e27e693797e5d4e8ae591bf07fff196cbc999390f374a2b002d3b6d56` | https://sepolia.etherscan.io/tx/0x4256e50e27e693797e5d4e8ae591bf07fff196cbc999390f374a2b002d3b6d56 |

## Validation Snapshot
- `contracts`: `npm test` passed (`12 passing`)
- `frontend`: `npm run lint` passed
- `frontend`: `npm run build` passed (Vite build success on local and Vercel production deployment)

## Security Notes
- Use a dev wallet only.
- Never commit private keys.
- `likePost` and `withdraw` use checks-effects-interactions + `nonReentrant`.
- Contract enforces exact tip amount (`msg.value == likeCost`).
- Hybrid payout avoids like DoS when creator rejects direct ETH transfers.

## Production Readiness Notes
- Data access currently uses `getAllPosts()`; production deployments should use pagination and/or an indexer (for example The Graph) for scalable reads.
- Likes use hybrid settlement: direct payout is attempted first, and failed payouts are escrowed for creator withdrawal.
- Content is stored on-chain in this implementation; production systems should store media and long-form metadata off-chain (for example IPFS/Arweave) and keep only references on-chain.
