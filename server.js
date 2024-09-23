// server.js
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const reviewRoutes = require('./routes/review');
const sequelize = require('./db');

const app = express();
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use(productRoutes);
app.use(reviewRoutes);

// Sync models and start the server
sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}).catch(error => {
  console.error('Unable to start the server:', error);
});
