const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const fetch=require('node-fetch');
const dotenv=require('dotenv');
const { getWalletBalances, fetchLatestTransaction} = require('./sdk.js');

// Enable CORS for all routes
app.use(cors());

// app.use(express.static(path.join(__dirname, '/public/launch.html')));
app.use(express.static(path.join(__dirname, '/public')));

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

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/info', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'info.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
