const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shop');

router.get('/', shopController.getIndex);

router.get('/products', shopController.getAllProducts);

router.get('/products/:id', shopController.getProductDetails);

router.get('/services', shopController.getAllServices);

router.get('/services/:id', shopController.getServiceDetails);

// Cart API routes
router.get('/cart', shopController.getCart);
router.post('/cart/add', shopController.addToCart);
router.put('/cart/update', shopController.updateCartItem);
router.delete('/cart/remove/:productId', shopController.removeFromCart);
router.delete('/cart/clear', shopController.clearCart);

// Promo code validation
router.post('/promo/validate', shopController.validatePromo);

// Checkout routes
router.get('/checkout', shopController.getCheckout);
router.post('/checkout/process', shopController.postCheckoutProcess);
router.get('/checkout/confirmation/:orderId', shopController.getOrderConfirmation);

module.exports = router;