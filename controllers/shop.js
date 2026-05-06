const Product = require('../models/products');
const Service = require('../models/services');
const Cart = require('../models/cart');
const { Order, OrderItem } = require('../models/order');
const Promo = require('../models/promo');
const Loyalty = require('../models/loyalty');

// Helper to get or create session ID
const getSessionId = (req) => {
  if (!req.session.id) {
    req.session.id = require('crypto').randomUUID();
  }
  return req.session.id;
};

const getIndex = (req, res) => {
  res.render('home', {
    pageTitle: 'FetchIT – Premium Pet Products',
    path: '/',
    accountId: req.session.accountId || null,
    accountName: req.session.accountName || null
  });
};

const getAllProducts = async (req, res) => {
  try {
    const category = req.query.category;
    const sessionId = getSessionId(req);
    
    let cartCount = 0;
    try {
      cartCount = await Cart.getItemCount(sessionId) || 0;
    } catch (cartErr) {
      console.error('Cart count error (non-fatal):', cartErr.message);
      // Continue without cart count - products page should still load
    }

    let products = await Product.findAll();

    if (category && category !== 'all') {
      products = products.filter(p => p.category === category);
    }

    res.render('products', {
      products: products,
      pageTitle: 'Shop',
      path: '/products',
      currentCategory: category || 'all',
      cartCount: cartCount,
      accountId: req.session.accountId || null,
      accountName: req.session.accountName || null
    });

  } catch (err) {
    res.status(500).send('Server Error');
  }
};

const getProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    const sessionId = getSessionId(req);
    const cartCount = await Cart.getItemCount(sessionId);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    res.render('product-details', {
      product: product,
      pageTitle: product.name,
      path: '/products',
      cartCount: cartCount,
      accountId: req.session.accountId || null,
      accountName: req.session.accountName || null
    });

  } catch (err) {
    res.status(500).send('Server Error');
  }
};

const getAllServices = async (req, res) => {
  try {
    const serviceType = req.query.type;
    const sessionId = getSessionId(req);
    
    let cartCount = 0;
    try {
      cartCount = await Cart.getItemCount(sessionId) || 0;
    } catch (cartErr) {
      console.error('Cart count error (non-fatal):', cartErr.message);
    }

    let services = await Service.findAll();

    if (serviceType && serviceType !== 'all') {
      services = services.filter(s => s.service_type === serviceType);
    }

    res.render('services', {
      services: services,
      pageTitle: 'Services',
      path: '/services',
      currentType: serviceType || 'all',
      cartCount: cartCount,
      accountId: req.session.accountId || null,
      accountName: req.session.accountName || null
    });

  } catch (err) {
    res.status(500).send('Server Error');
  }
};

const getServiceDetails = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Service.findById(serviceId);
    const sessionId = getSessionId(req);
    const cartCount = await Cart.getItemCount(sessionId);

    if (!service) {
      return res.status(404).send('Service not found');
    }

    res.render('service-details', {
      service: service,
      pageTitle: service.service_name,
      path: '/services',
      cartCount: cartCount,
      accountId: req.session.accountId || null,
      accountName: req.session.accountName || null
    });

  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// ==================== CART API ENDPOINTS ====================

/**
 * GET /cart - Retrieve current cart contents
 */
const getCart = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cartItems = await Cart.getCartBySession(sessionId);
    const summary = await Cart.getCartSummary(sessionId);

    res.json({
      success: true,
      items: cartItems,
      totalItems: summary.totalItems,
      totalPrice: summary.totalPrice
    });
  } catch (err) {
    console.error('Error getting cart:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve cart' });
  }
};

/**
 * POST /cart/add - Add a product or service with quantity to cart
 */
const addToCart = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { productId, serviceId, quantity = 1 } = req.body;

    if (!productId && !serviceId) {
      return res.status(400).json({ success: false, message: 'Product ID or Service ID is required' });
    }

    let itemName, itemType;
    if (productId) {
      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      itemName = product.name;
      itemType = 'product';
    } else {
      // Verify service exists
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      itemName = service.service_name;
      itemType = 'service';
    }

    const result = await Cart.addToCart(sessionId, productId || serviceId, parseInt(quantity), itemType);
    const cartCount = await Cart.getItemCount(sessionId);

    res.json({
      success: true,
      message: `${itemName} added to cart`,
      cartCount: cartCount,
      isNew: result.isNew
    });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
};

/**
 * PUT /cart/update - Update item quantity (with concurrency check)
 */
const updateCartItem = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { productId, serviceId, quantity, version } = req.body;

    if ((!productId && !serviceId) || quantity === undefined || version === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID or Service ID, quantity, and version are required'
      });
    }

    if (quantity < 1) {
      // Remove item if quantity is less than 1
      const removed = await Cart.removeFromCart(sessionId, productId, serviceId);
      const cartCount = await Cart.getItemCount(sessionId);
      return res.json({
        success: true,
        message: 'Item removed from cart',
        cartCount: cartCount,
        removed: true
      });
    }

    const result = await Cart.updateQuantity(sessionId, productId, serviceId, parseInt(quantity), parseInt(version));

    if (result === null) {
      return res.status(409).json({
        success: false,
        message: 'Concurrent update detected. Please refresh and try again.',
        conflict: true
      });
    }

    const summary = await Cart.getCartSummary(sessionId);
    const cartCount = await Cart.getItemCount(sessionId);

    res.json({
      success: true,
      message: 'Cart updated',
      cartCount: cartCount,
      totalItems: summary.totalItems,
      totalPrice: summary.totalPrice
    });
  } catch (err) {
    console.error('Error updating cart:', err);
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
};

/**
 * DELETE /cart/remove/:itemId - Remove item from cart
 * Query param: type=product|service
 */
const removeFromCart = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const itemId = req.params.productId;
    const itemType = req.query.type || 'product';

    if (!itemId) {
      return res.status(400).json({ success: false, message: 'Item ID is required' });
    }

    const productId = itemType === 'product' ? itemId : null;
    const serviceId = itemType === 'service' ? itemId : null;

    const removed = await Cart.removeFromCart(sessionId, productId, serviceId);
    const cartCount = await Cart.getItemCount(sessionId);
    const summary = await Cart.getCartSummary(sessionId);

    if (!removed) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    res.json({
      success: true,
      message: 'Item removed from cart',
      cartCount: cartCount,
      totalItems: summary.totalItems,
      totalPrice: summary.totalPrice
    });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
};

/**
 * DELETE /cart/clear - Empty the entire cart
 */
const clearCart = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    await Cart.clearCart(sessionId);

    res.json({
      success: true,
      message: 'Cart cleared',
      cartCount: 0,
      totalItems: 0,
      totalPrice: 0
    });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
};

// ==================== CHECKOUT ENDPOINTS ====================

const DELIVERY_FEE = 100.00;

/**
 * POST /promo/validate — validate a promo code (AJAX)
 */
const validatePromo = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const promo = await Promo.validate(code);

    if (!promo) {
      return res.json({ success: false, message: 'Invalid or expired promo code.' });
    }

    const { discount, discountedSubtotal } = Promo.calculate(promo, parseFloat(subtotal));

    res.json({
      success: true,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      discount,
      discountedSubtotal,
      message: promo.discount_type === 'percent'
        ? `${promo.discount_value}% discount applied!`
        : `₱${promo.discount_value} discount applied!`
    });
  } catch (err) {
    console.error('Promo validation error:', err);
    res.status(500).json({ success: false, message: 'Could not validate promo code.' });
  }
};

/**
 * GET /checkout - Display checkout page with cart contents
 */
const getCheckout = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cartItems = await Cart.getCartBySession(sessionId);
    const summary = await Cart.getCartSummary(sessionId);

    if (cartItems.length === 0) {
      return res.redirect('/products');
    }

    let account = null;
    let loyaltyBalance = 0;
    let maxRedeemablePoints = 0;
    let maxRedeemableValue = 0;

    if (req.session.accountId) {
      const Account = require('../models/accounts').Account;
      account = await Account.findById(req.session.accountId);
      loyaltyBalance = await Loyalty.getBalance(req.session.accountId);
      // Only allow redeeming in multiples of 100
      maxRedeemablePoints = Math.min(loyaltyBalance, Math.floor(loyaltyBalance / Loyalty.POINTS_PER_REDEEM) * Loyalty.POINTS_PER_REDEEM);
      maxRedeemableValue = Loyalty.pointsToValue(loyaltyBalance);
    }

    res.render('checkout', {
      pageTitle: 'Checkout',
      path: '/checkout',
      cartItems,
      subtotal: summary.totalPrice,
      deliveryFee: 0,
      total: summary.totalPrice,
      account,
      loyaltyBalance,
      maxRedeemablePoints,
      maxRedeemableValue
    });
  } catch (err) {
    console.error('Error loading checkout:', err);
    res.status(500).send('Server Error');
  }
};

/**
 * POST /checkout/process - Process the checkout form
 */
const postCheckoutProcess = async (req, res) => {
  try {
    const sessionId = getSessionId(req);

    const {
      firstName, lastName, phone, email,
      deliveryMethod, deliveryDate, timeWindow,
      city, street, postalCode,
      paymentMethod,
      promoCode,
      redeemPoints
    } = req.body;

    // Validate required fields
    const errors = [];
    if (!firstName || !firstName.trim()) errors.push('First name is required');
    if (!lastName  || !lastName.trim())  errors.push('Last name is required');
    if (!phone     || !phone.trim())     errors.push('Phone number is required');
    if (!email     || !email.trim())     errors.push('Email address is required');
    if (!deliveryMethod)                 errors.push('Delivery method is required');
    if (!paymentMethod)                  errors.push('Payment method is required');

    if (deliveryMethod === 'delivery') {
      if (!deliveryDate)              errors.push('Delivery date is required');
      if (!timeWindow)                errors.push('Preferred time window is required');
      if (!city   || !city.trim())    errors.push('City is required for delivery');
      if (!street || !street.trim())  errors.push('Street address is required for delivery');
      if (!postalCode || !postalCode.trim()) errors.push('Postal code is required for delivery');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // Get cart items
    const cartItems = await Cart.getCartBySession(sessionId);
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => sum + ((item.item_price || item.product_price) * item.quantity), 0);
    const deliveryFee = deliveryMethod === 'delivery' ? DELIVERY_FEE : 0;

    // Apply promo code discount
    let promoDiscount = 0;
    let promoRow = null;
    if (promoCode && promoCode.trim()) {
      promoRow = await Promo.validate(promoCode.trim());
      if (promoRow) {
        const result = Promo.calculate(promoRow, subtotal);
        promoDiscount = result.discount;
      }
    }

    // Apply loyalty points redemption
    let pointsDiscount = 0;
    let pointsRedeemed = 0;
    const accountId = req.session.accountId || null;
    if (accountId && redeemPoints && parseInt(redeemPoints) > 0) {
      const toRedeem = parseInt(redeemPoints);
      try {
        pointsDiscount = await Loyalty.redeemPoints(accountId, toRedeem);
        pointsRedeemed = toRedeem;
      } catch (e) {
        // If redemption fails (insufficient points), just skip it silently
        console.warn('Points redemption failed:', e.message);
      }
    }

    const totalDiscount = promoDiscount + pointsDiscount;
    const total = Math.max(0, subtotal - totalDiscount + deliveryFee);

    // Create the order
    const orderData = {
      session_id: sessionId,
      account_id: accountId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phone.trim(),
      email_address: email.trim(),
      delivery_method: deliveryMethod,
      delivery_date: deliveryMethod === 'delivery' ? deliveryDate : null,
      delivery_time_window: deliveryMethod === 'delivery' ? timeWindow : null,
      delivery_city: deliveryMethod === 'delivery' ? city.trim() : null,
      delivery_street: deliveryMethod === 'delivery' ? street.trim() : null,
      delivery_postal_code: deliveryMethod === 'delivery' ? postalCode.trim() : null,
      payment_method: paymentMethod,
      payment_status: 'pending',
      subtotal_amount: subtotal,
      delivery_fee: deliveryFee,
      discount_amount: totalDiscount,
      promo_code: promoRow ? promoRow.code : null,
      points_redeemed: pointsRedeemed,
      total_amount: total,
      order_status: 'pending',
      customer_notes: null
    };

    const createdOrder = await Order.create(orderData);
    const orderId = createdOrder.order_id;

    // Save order items
    for (const item of cartItems) {
      await Order.addItem(orderId, {
        product_id: item.product_id || null,
        service_id: item.service_id || null,
        product_name: item.item_name || item.product_name,
        product_price: item.item_price || item.product_price,
        quantity: item.quantity
      });
    }

    // Award loyalty points to logged-in customer (earn on amount paid)
    if (accountId) {
      await Loyalty.awardPoints(accountId, total);
    }

    // Clear the cart
    await Cart.clearCart(sessionId);

    res.redirect(`/checkout/confirmation/${orderId}`);

  } catch (err) {
    console.error('Error processing checkout:', err);
    res.status(500).json({ success: false, message: 'Failed to process order. Please try again.' });
  }
};

/**
 * GET /checkout/confirmation/:orderId - Display order confirmation
 */
const getOrderConfirmation = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const sessionId = getSessionId(req);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Get order items
    const orderItems = await Order.getItems(orderId);

    res.render('order-confirmation', {
      pageTitle: 'Order Confirmation',
      path: '/checkout/confirmation',
      order: order,
      orderItems: orderItems
    });
  } catch (err) {
    console.error('Error loading order confirmation:', err);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getIndex,
  getAllProducts,
  getProductDetails,
  getAllServices,
  getServiceDetails,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validatePromo,
  getCheckout,
  postCheckoutProcess,
  getOrderConfirmation
};
