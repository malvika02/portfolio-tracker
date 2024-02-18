const express = require('express');
const app = express();
const path = require('path');
const fetch=require('node-fetch');
const dotenv=require('dotenv');
const { getWalletBalances, fetchLatestTransaction} = require('./sdk.js');



app.use(express.static(path.join(__dirname, '/public/index.html')));

app.get('/api/fetchWalletDetails',async (req, res) => {
    const { walletAddress } = req.query;
    let latestTransaction =await fetchLatestTransaction(walletAddress);
    let readableBalances=await getWalletBalances(walletAddress);
    
    if(latestTransaction===null)
       res.json({message: "Alchemy API response is null"})
    res.json({latestTransaction,readableBalances});
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
