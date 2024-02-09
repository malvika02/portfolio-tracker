import { Alchemy, Network } from 'alchemy-sdk';
import dotenv from 'dotenv';
import readline from 'readline';
dotenv.config();

const config = {
  apiKey: process.env.ALCHEMY_API_KEY, // Your Alchemy API key
  network: Network.ETH_MAINNET, // The network you want to use
};
const alchemy = new Alchemy(config);

// Function to convert hexadecimal to decimal
function hexToDecimal(hexString) {
  return BigInt(hexString);
}

// Function to convert the token balance to a human-readable format
function convertToReadableBalance(hexBalance, decimals = 18) {
  const decimalBalance = hexToDecimal(hexBalance);
  return decimalBalance / BigInt(10 ** decimals);
}

async function fetchTokenBalances(walletAddress) {
  try {
    // Fetch all token balances for the wallet address
    const tokenBalances = await alchemy.core.getTokenBalances(walletAddress);

    // Filter out tokens with zero balance
    const nonZeroBalances = tokenBalances.tokenBalances.filter(token => BigInt(token.tokenBalance) > 0n);

    // Fetch metadata and convert balances for each token with a non-zero balance
    const tokensWithMetadata = await Promise.all(
      nonZeroBalances.map(async (token) => {
        const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
        const readableBalance = convertToReadableBalance(token.tokenBalance, metadata.decimals);
        return {
          contractAddress: token.contractAddress,
          tokenBalance: readableBalance.toString(), // Convert to string for readability
          name: metadata.name,
        };
      })
    );

    // Log the tokens with metadata and readable balances
    tokensWithMetadata.forEach(token => {
      console.log(`Token: ${token.name}`);
      console.log(`Token Balance: ${token.tokenBalance}`);
      console.log(`Contract Address: ${token.contractAddress}`);
      console.log('-----------------------------');
    });

    return tokensWithMetadata;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    throw error;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt the user for the wallet address
rl.question('Please provide a wallet address: ', (walletAddress) => {
  if (!walletAddress) {
    console.error('No wallet address was provided.');
    rl.close();
    process.exit(1);
  }

  // Example usage with provided wallet address
  fetchTokenBalances(walletAddress)
    .then(() => {
      rl.close(); // Close the readline interface after the operation
    })
    .catch((error) => {
      console.error(error);
      rl.close(); // Close the readline interface after the operation
    });
});