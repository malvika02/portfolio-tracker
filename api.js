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
    console.error(`Error fetching price for token at address ${contractAddress}:`, error);
    return null;
  }
}

export { fetchTokenPrice };