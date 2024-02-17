import fetch from 'node-fetch';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY; // Set your Moralis API key in your environment variables

async function fetchTokenPrice(contractAddress) {
  const url = `https://deep-index.moralis.io/api/v2.2/erc20/${contractAddress}/price`;
  const options = {
    method: 'GET',
    headers: {
      'X-API-Key': process.env.MORALIS_API_KEY,
      'Accept': 'application/json'
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching price for at address ${contractAddress}:`, error);
    return null;
  }
}

// Add this function to your api.js file
export async function fetchEthPriceFromMoralis() {
    const moralisApiKey = process.env.MORALIS_API_KEY; // Ensure you have set your Moralis API key in your environment variables
    const ethContractAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const url = `https://deep-index.moralis.io/api/v2/erc20/${ethContractAddress}/price?chain=eth`;
  
    try {
      const response = await fetch(url, {
        headers: {
          'X-API-Key': moralisApiKey,
          'Accept': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`Error fetching ETH price: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.usdPrice; // Assuming the API returns the price in a property named usdPrice
    } catch (error) {
      console.error('Error fetching ETH price from Moralis:', error);
      return null;
    }
  }

export { fetchTokenPrice };