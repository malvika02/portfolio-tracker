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

// The Alchemy object returned by new Alchemy() provides access to the Alchemy API. 
const alchemy = new Alchemy(config);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to fetch the price of a token from GeckoTerminal API
async function fetchTokenPrice(contractAddress) {
  try {
  const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/eth/tokens/${contractAddress}`);
  const json = await response.json();
  // Check if 'data' and 'attributes' exist before accessing 'price_usd'
  if (json && json.data && json.data.attributes && typeof json.data.attributes.price_usd !== 'undefined') {
    return json.data.attributes.price_usd;
  } else {
    // If the structure is not as expected, log the response and return null
    console.log('Unexpected API response:', json);
    return null;
  }
} catch (error) {
  console.error('Error fetching token price:', error);
  return null;
}
}
rl.question('Please provide a wallet address: ', async (walletAddress) => {
  try {
    // Fetch the balance of ETH in Wei
    const balanceWei = await alchemy.core.getBalance(walletAddress);
    // Convert Wei to Ether
    const balanceEther = Number(balanceWei) / 1e18;
    // Fetch the list of tokens that the wallet address holds
    const tokenBalances = await alchemy.core.getTokenBalances(walletAddress);
    
    // Filter out tokens with zero balance
    const nonZeroBalances = tokenBalances.tokenBalances.filter(token => BigInt(token.tokenBalance) > 0n);
   
    // Fetch and log metadata for each token with a non-zero balance
    for (const token of nonZeroBalances) {
      //Fetch the token price first
      const price = await fetchTokenPrice(token.contractAddress);
      
      if(price === null) {
        continue;
      }
      const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
      const readableBalance = convertToReadableBalance(token.tokenBalance, metadata.decimals);
      
      if (readableBalance > 0) {
        //Calculate the total price of the token
      const totalPrice = readableBalance * price;
        // After processing tokens, log the ETH balance
        console.log(`ETH Balance for wallet ${walletAddress}: ${balanceEther} ETH`);

        console.log(`Metadata for ${metadata.name}:`, metadata);
        //Display the contract address for the token
        console.log(`Contract address for ${metadata.name}: ${token.contractAddress}`);
        //Display the balance for the token
        console.log(`Balance for ${metadata.name}: ${readableBalance}`);
        //Display the price of each token
        console.log(`Price: ${price} USD`);
        //Display the total price of each token
        console.log(`Total Price: ${totalPrice} USD`);
        console.log(`--------------------------------------------------------------------`);
      }
    }
  //    // After the loop, log the sum of total prices of tokens and add the ETH balance
  //    console.log(`Total balance in the wallet (tokens): ${sumTotalPrice}`);
  //    console.log(`ETH Balance for wallet ${walletAddress}: ${balanceEther} ETH`);
  
  // // Calculate the sum of sumTotalPrice and totalValueInUsd
  // const grandTotal = sumTotalPrice + totalValueInUsd;
  // console.log(`Grand Total balance in the wallet: ${grandTotal.toFixed(2)} USD`);
  
  } catch (error) {
    console.error('Error fetching token balances or metadata:', error);
  } finally {
    rl.close();
  }
});

// Function to convert the token balance to a human-readable format
function convertToReadableBalance(hexBalance, decimals = 18) {
  const decimalBalance = hexToDecimal(hexBalance);
  // Convert BigInt to Number for arithmetic operations with decimals
  return Number(decimalBalance) / Math.pow(10, decimals);
}
// Function to convert hexadecimal to decimal
function hexToDecimal(hexString) {
  return BigInt(hexString);
}
// // Function to convert the token balance to a human-readable format
// function convertToReadableBalance(hexBalance, decimals = 18) {
//   const decimalBalance = hexToDecimal(hexBalance);
//   return decimalBalance / BigInt(10 ** decimals);
// }















// // List of wallet addresses to fetch balances for
// const walletAddresses = [
//   // '0x28C6c06298d514Db089934071355E5743bf21d60',
//   // '0xf89d7b9c864f589bbF53a82105107622B35EaA40',
//   // '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
//   // ... can add more addresses
// ];

// async function fetchBalancesForMultipleWallets(walletAddresses) {
//   const allBalances = [];
//   for (const address of walletAddresses) {
//     console.log(`Fetching balances for wallet: ${address}`);
//     try {
//       const balances = await fetchTokenBalances(address);
//       allBalances.push({ address, balances });
//     } catch (error) {
//       console.error(`Error fetching balances for wallet ${address}:`, error);
//       allBalances.push({ address, error: error.message });
//     }
//   }

//   // Write the results to a JSON file
//   fs.writeFile('balances.json', JSON.stringify(allBalances, null, 2), (err) => {
//     if (err) {
//       console.error('Error writing to file:', err);
//     } else {
//       console.log('Finished writing balances to balances.json');
//     }
//   });
// }

// // const rl = readline.createInterface({
// //   input: process.stdin,
// //   output: process.stdout
// // });

// async function promptForAddressAndFetchBalances() {
//   for await (const walletAddress of askForWalletAddress()) {
//     await fetchTokenBalances(walletAddress);
//   }
//   // After the above is done, fetch balances for predefined wallet addresses
//    await fetchBalancesForPredefinedAddresses();
// }
// async function* askForWalletAddress() {
//   yield new Promise(async(resolve) => {
//     rl.question('Please provide a wallet address: ', async(walletAddress) => {
//       if (!walletAddress) {
//         console.error('No wallet address was provided.');
//         rl.close();
//         process.exit(1);
//       } else{
//         try{
//           // Fetch the balance in Wei
//         const balanceWei = await alchemy.core.getBalance(walletAddress);
//         // Convert Wei to Ether
//         const balanceEther = Number(balanceWei) / 1e18;
//         // Fetch the current price of ETH in USD
//         const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
//         const priceData = await response.json();
//         const ethPriceInUsd = priceData.ethereum.usd;
//         // Calculate the total value of ETH in USD
//         const totalValueInUsd = balanceEther * ethPriceInUsd;

//         // Display the results
//         console.log(`ETH Balance for wallet ${walletAddress}: ${balanceEther} ETH`);
//         console.log(`Current ETH Price: ${ethPriceInUsd} USD`);
//         console.log(`Total ETH Value: ${totalValueInUsd.toFixed(2)} USD`);
//       } catch (error) {
//         console.error('Error fetching ETH balance and USD value:', error);
//       }
//       rl.close();
//       resolve(walletAddress);
//         }
      
//     }); 
//     });
  
// }

// async function fetchBalancesForPredefinedAddresses() {
//   console.log('Fetching balances and latest transactions for predefined wallet addresses...');
//   for (const address of walletAddresses) {
//     console.log(`Fetching balances for wallet: ${address}`);
//     await fetchTokenBalances(address);
  
//   }
// }

// // Start the process by prompting for a wallet address
// promptForAddressAndFetchBalances().then(() => {
//     console.log('Finished fetching balances for all wallets');
//     rl.close();
//     process.exit(0); // Exit the process when done
//   }).catch(error => {
//     console.error('Error during balance fetching process', error);
//     rl.close();
//     process.exit(1); // Exit the process on error
//   });

// export { fetchTokenBalances, fetchBalancesForMultipleWallets};