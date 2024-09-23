// routes/review.js
const express = require('express');
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const authenticateToken = require('../middlewares/authenticateToken');

const router = express.Router();

// GET /product/:productId/reviews - Get all reviews for a specific product
router.get('/product/:productId/reviews', async (req, res) => {
  const { productId } = req.params;
  
  try {
    // Check if the product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find all reviews for the specified product
    const reviews = await Review.findAll({
      where: { productId },
      include: [
        {
          model: User, // Include user details
          attributes: ['username'], // Get username only, for example
        }
      ]
    });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


// POST /review - Add a review for a product
router.post('/review', authenticateToken, async (req, res) => {
  const { productId, rating, comment } = req.body;
  const userId = req.user.id;

  try {
    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create the review
    const review = await Review.create({
      productId,
      userId,
      rating,
      comment,
    });

    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

//EDIT review - Edit review Only by the review of the revew owner
router.put('/review/:reviewId', authenticateToken, async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  try {
    // Find the review
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the logged-in user is the owner of the review
    if (review.userId !== userId) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    // Update the review fields
    review.rating = rating || review.rating;  // Only update if provided
    review.comment = comment || review.comment; // Only update if provided
    await review.save();

    res.status(200).json({ message: 'Review updated successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// DELETE /reviews/:reviewId - Delete a review (only by the review owner or admin)
router.delete('/review/:reviewId', authenticateToken, async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  try {
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the logged-in user is the owner of the review
    if (review.userId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await review.destroy();
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
