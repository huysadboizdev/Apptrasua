import express from 'express';
import authUser from '../middlewares/authUser.js';
import { registerUser, loginUser, getProfile, updateProfile, addToCart, checkout, getOrders, editCart, removeFromCart, clearCart, getOrderDetails, updateOrderStatus } from '../controllers/userController.js';
import upload from '../middlewares/multer.js';


const userRouter = express.Router();
// api login and register
userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
//api get user profile and update profile
userRouter.get('/get-profile', authUser, getProfile)
userRouter.post('/update-profile', upload.single('image'), authUser, updateProfile)

// cart api
userRouter.post('/add-to-cart', authUser, addToCart);  // Add item to cart
userRouter.post('/edit-cart', authUser, editCart);
userRouter.post('/remove-from-cart',authUser, removeFromCart);
userRouter.post('/clear-cart', authUser, clearCart);



// order api
userRouter.post('/checkout', authUser, checkout);      // Checkout (create order)
userRouter.get('/get-orders', authUser, getOrders);    // Get user orders
userRouter.get('/get-order-details/:orderId', authUser, getOrderDetails); // Get order details
userRouter.post('/update-order-status', authUser, updateOrderStatus); // Update order status



export default userRouter;

