const { Alchemy, Network }=require('alchemy-sdk');
const dotenv=require('dotenv');
const readline=require('readline');
const fetch=require('node-fetch');
const fs=require('fs');
dotenv.config();

const config = {
  apiKey: process.env.ALCHEMY_API_KEY, // Your Alchemy API key
  network: Network.ETH_MAINNET, // The network want to use
};

// The Alchemy object returned by new Alchemy() provides access to the Alchemy API. 
const alchemy = new Alchemy(config);


async function fetchTokenPrice(contractAddress) {
  try {
    // Replace with the actual Moralis API endpoint for fetching token prices
    const url = `https://deep-index.moralis.io/api/v2/erc20/${contractAddress}/price`;
    // Explicitly set the contract address for ETH
    const ethContractAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const url_eth = `https://deep-index.moralis.io/api/v2/erc20/${ethContractAddress}/price`;
    const response = await fetch(url, {
      headers: {
        'X-API-Key': process.env.MORALIS_API_KEY 
      }
    });
    const json = await response.json();
    // Access the price from the Moralis response, adjust the path as per the actual response
    const priceUsd = json.usdPrice; // Replace 'usdPrice' with the correct property from the Moralis response
    return priceUsd || null;
  } catch (error) {
    console.error('Error fetching token price from Moralis:', error);
    return null;
  }
}

async function fetchLatestTransaction(walletAddress) {
  try {
    const options = {
      count: 3,
      order: 'asc',
      category: ['internal', 'erc20', 'erc721']
    };
    const transactionsIn = await alchemy.core.getAssetTransfers({ ...options, toAddress: walletAddress });
    const transactionsOut = await alchemy.core.getAssetTransfers({ ...options, fromAddress: walletAddress });
    return transactionsIn, transactionsOut;
  } catch (error) {
    console.error('Error fetching the latest transactions:', error);
    return null;
  }
}

async function getWalletBalances(walletAddress){
  try {
    // Fetch the balance of ETH in Wei
    const balanceWei = await alchemy.core.getBalance(walletAddress);

    // Convert Wei to Ether
    const balanceEther = Number(balanceWei) / 1e18;

    // Fetch the list of tokens that the wallet address holds
    const tokenBalances = await alchemy.core.getTokenBalances(walletAddress);

    // Filter out tokens with zero balance
    const nonZeroBalances = tokenBalances.tokenBalances.filter(token => BigInt(token.tokenBalance) > 0n);
   
    let readableBalances={
        "ethBalance":"",
        "ethPriceInUsd":"",
        "totalValueOfEth":"",
        "tokenName":"",
        "tokenAddress":"",
        "tokenBalance":"",
        "tokenPrice": "",
        "tokenTotalPrice": "",
    };

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

        // Fetch the current price of ETH in USD
       // const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
       // console.log(response.json());
       // const priceData = await response.json();
       // const ethPriceInUsd = priceData.ethereum.usd;

        //Calculate the total value of ETH in USD
       
        //const totalValueInUsd = balanceEther * ethPriceInUsd;

        readableBalances.ethBalance=balanceEther;
        readableBalances.tokenName=metadata.name;
        readableBalances.tokenAddress=token.contractAddress;
        readableBalances.tokenBalance=readableBalance;
        readableBalances.tokenPrice=price;
        readableBalances.tokenTotalPrice=totalPrice
  
        console.log(readableBalances);
        return readableBalances;
      }
    }
  
  } catch (error) {
    console.error('Error fetching token balances or metadata:', error);
  }
  
};


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

module.exports = {
  fetchLatestTransaction,
  getWalletBalances,
  fetchTokenPrice,
};
// 0xc78423bc8AB4697C74AA7b95658bb320eEC47193
