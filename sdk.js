import { Alchemy, Network } from 'alchemy-sdk';
import dotenv from 'dotenv';
import readline from 'readline';
import fetch from 'node-fetch';
dotenv.config();

const config = {
  apiKey: process.env.ALCHEMY_API_KEY, // Your Alchemy API key
  network: Network.ETH_MAINNET, // The network want to use
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

// Function to fetch the price of a token using DexScreener API
async function fetchTokenPrice(contractAddress) {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`);
    const data = await response.json();
    if (data && data.pairs && data.pairs.length > 0 && data.pairs[0].priceUsd) {
      // Assuming we take the price from the first pair
      return data.pairs[0].priceUsd;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching price for contract ${contractAddress}:`, error);
    return null;
  }
}

async function fetchTokenBalances(walletAddress) {
  try {
    // Fetch all token balances for the wallet address
    const tokenBalances = await alchemy.core.getTokenBalances(walletAddress);

    // Filter out tokens with zero balance
    // const nonZeroBalances = tokenBalances.tokenBalances.filter(token => BigInt(token.tokenBalance) > 0n);

    // Fetch metadata and convert balances for each token with a non-zero balance
    let tokensWithMetadataAndPrice = (await Promise.all(
      tokenBalances.tokenBalances.map(async (token) => {
        const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
        const readableBalance = convertToReadableBalance(token.tokenBalance, metadata.decimals);
        if(readableBalance > 0){
          const priceUsd = await fetchTokenPrice(token.contractAddress);
          if(priceUsd){
            return {
              contractAddress: token.contractAddress,
              tokenBalance: readableBalance.toString(), // Convert to string for readability
              name: metadata.name,
              symbol:metadata.symbol,
              decimals: metadata.decimals,
              priceUsd: priceUsd
            };
          }
        }
        return null;
      })
    )).filter(token => token !== null);

    // Filter out tokens where the price is not available
    // tokensWithMetadataAndPrice = tokensWithMetadataAndPrice.filter(token => token.priceUsd !== null);

    // Calculate the total balance in USD for tokens with available prices
    const totalBalanceUsd = tokensWithMetadataAndPrice.reduce((acc, token) => {
      return acc + (token.priceUsd ? parseFloat(token.tokenBalance) * parseFloat(token.priceUsd) : 0);
    }, 0);

    // Log the tokens with metadata and readable balances
    tokensWithMetadataAndPrice.forEach(token => {
      console.log(`Token: ${token.name}`);
      console.log(`Token Balance: ${token.tokenBalance}`);
      console.log(`Token Price (USD): ${token.priceUsd || 'Price not available'}`);
      console.log(`Contract Address: ${token.contractAddress}`);
      console.log('-----------------------------');
    });

    // Log the total balance
    console.log(`Total Balance for wallet ${walletAddress} in Usd: ${totalBalanceUsd.toFixed(2)}`);


    return tokensWithMetadataAndPrice;
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