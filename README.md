`Portfolio-Tracker`

Tracker for good investment

Identifying lucrative investment opportunities in the rapidly evolving cryptocurrency market can be challenging due to the lack of consolidated, real-time data on asset holdings and investment activities of leading crypto companies.


`Wallet Balance Fetcher`

This project provides a tool to fetch and display the balance and token information for Ethereum wallet addresses using the Alchemy SDK.


`Features`

- Fetch token balances and prices for a given Ethereum wallet address.
- Calculate the total balance in USD for the wallet.
- Support for manual input of wallet addresses.
- Automatically fetch balances for a predefined list of wallet addresses.
- Output balance information to the console and store it in a JSON file.


`Prerequisites`

Before you begin, ensure you have met the following requirements:

- You have installed Node.js and npm.
- You have an Alchemy API key.


`Installation`

To install the necessary dependencies, run the following command:

1. Clone the repository to your local machine:

    `bash`
    git clone https://github.com/malvika02/portfolio-tracker

2. Navigate to the project directory:

    `bash`
    cd portfolio-tracker

3. Install the necessary dependencies:

    `bash`
    npm install

After running this command, npm will automatically install all the dependencies defined in `package.json`, and you should be ready to run the project locally.



`Configuration`

Create a `.env` file in the root directory of the project and add your Alchemy API key:
    
    ALCHEMY_API_KEY=your_api_key_here

