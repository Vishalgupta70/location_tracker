const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { membersData } = require('./data');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.get('/api/members', (req, res) => {
    const dateFilter = req.query.date;

    // Filter data by date (optional)
    if (dateFilter) {
        const filteredMembers = membersData.filter(member => member.date === dateFilter);
        res.json(filteredMembers);
    } else {
        res.json(membersData);
    }
});
app.get('/', (req, res) => {
    res.send('Backend server is running. Use /api/members to get members data.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});