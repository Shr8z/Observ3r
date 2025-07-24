# Observ3r

## BUILD

``` shell
export version=1.4.0
docker build -t localhost:32000/observ3r:$version .
docker tag localhost:32000/observ3r:$version localhost:32000/observ3r:latest
docker push localhost:32000/observ3r:$version
docker push localhost:32000/observ3r:latest
```

## Update Dependencies

``` shell
deno outdated
deno outdated --update
```

### Exemple code to interact with OnChain Contract

``` typescript
// portfolio.ts

import { createPublicClient, formatEther, getAddress, parseAbi, webSocket } from "https://esm.sh/viem";
import { mainnet } from "https://esm.sh/viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "https://esm.sh/viem/accounts";

// Replace with your Base ETH L2 chain provider URL
const providerUrl = "wss://base-rpc.publicnode.com";
const publicClient = createPublicClient({
  chain: mainnet,
  transport: webSocket(providerUrl),
});

// Replace with your wallet address
const walletAddress = "0xddf093745b0a723c68a8f040ab03e72eee2b8f60";

// ERC-20 token ABI (Application Binary Interface)
const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)",
]);

// List of ERC-20 token addresses you want to check
const tokenAddresses = [
  "0x940181a94a35a4569e4529a3cdfb74e38fd98631",
  "0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf",
  "0x321b7ff75154472b18edb199033ff4d116f340ff",
  // Add more token addresses as needed
];

const chainlinkEthUsdAddress = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";

const chainlinkEthUsdAbi = parseAbi([
  "function latestAnswer() view returns (int256)",
  "function decimals() view returns (uint8)"
]);

// Function to get the portfolio from a dedicated block
async function getPortfolio(blockNumber: bigint) {
  try {
    // Get the balance of the wallet at the specified block
    const balance = await publicClient.getBalance({
      address: walletAddress,
      blockNumber: blockNumber,
    });
    console.log(`Balance at block ${blockNumber}: ${formatEther(balance)} ETH`);

    // Get the transaction count at the specified block
    const txCount = await publicClient.getTransactionCount({
      address: walletAddress,
      blockNumber: blockNumber,
    });
    console.log(`Transaction Count at block ${blockNumber}: ${txCount}`);

    // Get the list of tokens (ERC-20) held by the wallet at the specified block
    for (const tokenAddress of tokenAddresses) {
      const contract = {
        address: getAddress(tokenAddress),
        abi: erc20Abi,
      };

      const tokenSymbol = await publicClient.readContract({
        ...contract,
        functionName: "symbol",
        blockNumber: blockNumber,
      });

      const tokenBalance = await publicClient.readContract({
        ...contract,
        functionName: "balanceOf",
        args: [walletAddress],
        blockNumber: blockNumber,
      });

      console.log(
        `Token: ${tokenSymbol}, Balance at block ${blockNumber}: ${formatEther(tokenBalance)
        }`,
      );
    }
  } catch (error) {
    console.error("Error fetching portfolio:", error);
  }
}

async function getEthUsdPrice() {
  try {
    const contract = {
      address: getAddress(chainlinkEthUsdAddress),
      abi: chainlinkEthUsdAbi,
    };

    const price = await publicClient.readContract({
      ...contract,
      functionName: 'latestAnswer',
    });

    const decimals = await publicClient.readContract({
      ...contract,
      functionName: 'decimals',
    })

    console.log(`ETH/USD Price: $${price.toString() / (1 * 10^decimals)}`);
  } catch (error) {
    console.error('Error fetching ETH/USD price:', error);
  }
}

// Function to create a new wallet
function createNewWallet() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  console.log(`New Wallet Address: ${account.address}`);
  console.log(`Private Key: ${privateKey}`);
  return account;
}

// Replace with the block number you want to query
const blockNumber = await publicClient.getBlockNumber();
await getPortfolio(blockNumber);

// Get the ETH/USD price
await getEthUsdPrice();

// Create a new wallet
// const newWallet = createNewWallet();
```