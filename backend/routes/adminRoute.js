import express from 'express';
import { login_admin,
    getAllUser,
    deleteUser,
    addProduct,
    editProduct,
    updateProduct,
    deleteProduct,
    getAllProducts,
    getAllOrders,
    deleteOrder,
    getOrderById,
    updateOrderStatus,
    getUserById,
    notifyUser,
    getUserStats,
    getUserOrders,
    getStats } from '../controllers/adminController.js';
import upload from '../middlewares/multer.js';
import authAdmin from '../middlewares/authAdmin.js';

const adminRouter = express.Router();

// api login 

adminRouter.get('/get-all-user', authAdmin, getAllUser);
adminRouter.post('/delete-user', authAdmin, deleteUser);
adminRouter.post('/add-product', authAdmin, upload.single('image'), addProduct);
adminRouter.get('/get-product/:productId', authAdmin, editProduct);
adminRouter.put('/update-product/:productId', authAdmin, upload.single('image'), updateProduct);
adminRouter.delete('/delete-product/:productId', authAdmin, deleteProduct);
adminRouter.get('/get-all-products', authAdmin, getAllProducts);
adminRouter.get('/get-all-orders', authAdmin, getAllOrders);
adminRouter.post('/delete-order', authAdmin, deleteOrder);
adminRouter.get('/get-order-by-id/:orderId', authAdmin, getOrderById);
adminRouter.get('/get-user/:userId', authAdmin, getUserById);
adminRouter.post('/update-order-status', authAdmin, updateOrderStatus);
adminRouter.post('/notify-user', authAdmin, notifyUser);
adminRouter.get('/get-user-stats/:userId', authAdmin, getUserStats);
adminRouter.get('/get-user-orders/:userId', authAdmin, getUserOrders);
adminRouter.get('/get-stats', authAdmin, getStats);

export default adminRouter;

