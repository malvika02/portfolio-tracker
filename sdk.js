import { Alchemy, Network } from 'alchemy-sdk';
import dotenv from 'dotenv';
import readline from 'readline';
import fetch from 'node-fetch';
import fs from 'fs'
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

//Function to fetch the ETH balance of a wallet in ether
async function fetchEthBalanceAndUsdValue(walletAddress){
  try{
    //used Alchemy sdk t get wallet's balance in Wei (smallest uint of ETH)
    const balanceWei = await alchemy.core.getBalance(walletAddress);
    
    //converts Wei to Ether (1 Ether = 10^18 Wei)
    const balanceEther = Number(balanceWei) / 1e18;

    //fetches the current price of ETH in USD from an API
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const priceData = await response.json();
    const ethPriceInUsd = priceData.ethereum.usd;

    //calculate the total value of ETH in USD
    const totalValueInUsd = balanceEther * ethPriceInUsd;

    //Log the results
    console.log(`ETh Balance for wallet ${walletAddress}: ${balanceEther} ETH`);
    console.log(`Current ETH Price: ${ethPriceInUsd} USD`);
    console.log(`Total ETH Value: ${totalValueInUsd.toFixed(2)} USD`);

    //Return the balance and its USD value
    return{
      balanceEther: balanceEther,
      ethPriceInUsd: ethPriceInUsd,
      totalValueInUsd: totalValueInUsd
    };
  }catch (error) {
    console.error('Error fetching ETH balance and USD value:', error);
    throw error;
  }
 
}

// Function to fetch the price of a token using DexScreener API
async function fetchTokenPrice(contractAddress) {
  try {
    
    const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/eth/tokens/${contractAddress}`, {
      headers: {
        'Accept': 'application/json;version=20230302'
      }
    });
    
    
    const data = await response.json();
    console.log(`API response for ${contractAddress}:`, data); // Log the API response
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
    
    // Initialize tokensWithMetadataAndPrice before using it
    let tokensWithMetadataAndPrice = [];

    // Log the total number of tokens before filtering
    console.log(`Total number of tokens before filtering: ${tokenBalances.tokenBalances.length}`);
    
    // Print the length of the json
    console.log(`Number of tokens with available price: ${tokensWithMetadataAndPrice.length}`);
     
    
    // Fetch metadata and convert balances for each token with a non-zero balance
    tokensWithMetadataAndPrice = (await Promise.all(
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
    console.log(tokensWithMetadataAndPrice);
    console.log(tokensWithMetadataAndPrice.length);

    // sum balance of each token
    let sum = 0;
    for(let i=0; i<=tokensWithMetadataAndPrice.length-1; i++){
      console.log(tokensWithMetadataAndPrice[i].priceUsd * tokensWithMetadataAndPrice[i].tokenBalance);
      let token = tokensWithMetadataAndPrice[i].priceUsd * tokensWithMetadataAndPrice[i].tokenBalance 
      sum += token
    }
    console.log(`Total balance of the token: ${sum}`);


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

// List of wallet addresses to fetch balances for
const walletAddresses = [
  // '0x28C6c06298d514Db089934071355E5743bf21d60',
  // '0xf89d7b9c864f589bbF53a82105107622B35EaA40',
  // '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
  // ... can add more addresses
];

async function fetchBalancesForMultipleWallets(walletAddresses) {
  const allBalances = [];
  for (const address of walletAddresses) {
    console.log(`Fetching balances for wallet: ${address}`);
    try {
      const balances = await fetchTokenBalances(address);
      allBalances.push({ address, balances });
    } catch (error) {
      console.error(`Error fetching balances for wallet ${address}:`, error);
      allBalances.push({ address, error: error.message });
    }
  }

  // Write the results to a JSON file
  fs.writeFile('balances.json', JSON.stringify(allBalances, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      console.log('Finished writing balances to balances.json');
    }
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptForAddressAndFetchBalances() {
  for await (const walletAddress of askForWalletAddress()) {
    await fetchTokenBalances(walletAddress);
  }
  // After the above is done, fetch balances for predefined wallet addresses
  await fetchBalancesForPredefinedAddresses();
}
async function* askForWalletAddress() {
  yield new Promise(async(resolve) => {
    rl.question('Please provide a wallet address: ', async(walletAddress) => {
      if (!walletAddress) {
        console.error('No wallet address was provided.');
        rl.close();
        process.exit(1);
      } else{
        try{
          // Fetch the balance in Wei
        const balanceWei = await alchemy.core.getBalance(walletAddress);
        // Convert Wei to Ether
        const balanceEther = Number(balanceWei) / 1e18;
        // Fetch the current price of ETH in USD
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const priceData = await response.json();
        const ethPriceInUsd = priceData.ethereum.usd;
        // Calculate the total value of ETH in USD
        const totalValueInUsd = balanceEther * ethPriceInUsd;

        // Display the results
        console.log(`ETH Balance for wallet ${walletAddress}: ${balanceEther} ETH`);
        console.log(`Current ETH Price: ${ethPriceInUsd} USD`);
        console.log(`Total ETH Value: ${totalValueInUsd.toFixed(2)} USD`);
      } catch (error) {
        console.error('Error fetching ETH balance and USD value:', error);
      }
      rl.close();
      resolve(walletAddress);
        }
      
    }); 
    });
  
}

async function fetchBalancesForPredefinedAddresses() {
  console.log('Fetching balances and latest transactions for predefined wallet addresses...');
  for (const address of walletAddresses) {
    console.log(`Fetching balances for wallet: ${address}`);
    await fetchTokenBalances(address);
  
  }
}

// Start the process by prompting for a wallet address
promptForAddressAndFetchBalances()
  .then(() => {
    console.log('Finished fetching balances for all wallets');
    rl.close();
    process.exit(0); // Exit the process when done
  })
  .catch(error => {
    console.error('Error during balance fetching process', error);
    rl.close();
    process.exit(1); // Exit the process on error
  });

export { fetchTokenBalances, fetchBalancesForMultipleWallets};