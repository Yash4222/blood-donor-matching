require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Blood Donor API is running'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/requests', require('./routes/requests'));

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log('Server running on port ' + PORT));
});