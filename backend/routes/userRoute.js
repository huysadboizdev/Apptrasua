import express from 'express';
import authUser from '../middlewares/authUser.js';
import { registerUser, loginUser, getProfile, updateProfile, addToCart, checkout, getOrders, editCart, 
    removeFromCart, clearCart, getOrderDetails, updateOrderStatus, getAllProductsForUser, getCart, cancelOrder
} from '../controllers/userController.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router();

// api login and register
userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)

//api get user profile and update profile
userRouter.get('/get-profile', authUser, getProfile)
userRouter.put('/update-profile', upload.single('image'), authUser, updateProfile)

// cart api
userRouter.get('/get-cart', authUser, getCart)
userRouter.post('/add-to-cart', authUser, addToCart)
userRouter.put('/edit-cart', authUser, editCart)
userRouter.post('/remove-from-cart', authUser, removeFromCart)
userRouter.post('/clear-cart', authUser, clearCart)

// user api
userRouter.get('/get-all-products', getAllProductsForUser)

// order api
userRouter.post('/checkout', authUser, checkout)
userRouter.get('/get-orders', authUser, getOrders)
userRouter.get('/get-order-details/:orderId', authUser, getOrderDetails)
userRouter.post('/cancel-order/:orderId', authUser, cancelOrder)
userRouter.post('/update-order-status', authUser, updateOrderStatus)

export default userRouter;

