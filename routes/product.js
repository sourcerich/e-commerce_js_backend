// routes/product.js
const express = require('express');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const { Op } = require('sequelize');
const authenticateToken = require('../middlewares/authenticateToken');

const router = express.Router();

// GET /products - List all products
router.get('/allproducts', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// GET /products/:id - Get details of a single product
router.get('/product/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// GET /products/available - List all available products (stock > 0)
router.get('/products/available', async (req, res) => {
  try {
    const availableProducts = await Product.findAll({
      where: { stock: { [Op.gt]: 0 } } // Get products where stock is greater than 0
    });

    res.status(200).json(availableProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// GET /products/unavailable - List all unavailable products (stock = 0)
router.get('/products/unavailable', async (req, res) => {
  try {
    const unavailableProducts = await Product.findAll({
      where: { stock: 0 } // Get products where stock is equal to 0
    });

    res.status(200).json(unavailableProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// POST /products - Create a new product
router.post('/createproduct', async (req, res) => {
  const { name, description, price, stock } = req.body;

  try {
    const newProduct = await Product.create({
      name,
      description,
      price,
      stock,
    });

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// POST /products/:id/purchase - Purchase a product
router.post('/products/:id/purchase', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;  // How many units to purchase
  const userId = req.user.id;  // User from authenticated token

  try {
    // Fetch product
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Only ${product.stock} units available.` });
    }

    // Reduce product stock
    product.stock -= quantity;
    await product.save();

    // Record the purchase
    const purchase = await Purchase.create({
      userId,
      productId: id,
      quantity,
    });

    res.status(201).json({ message: 'Purchase successful', purchase });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


module.exports = router;
