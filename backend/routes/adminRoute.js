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
    getOrderById,
    updateOrderStatus } from '../controllers/adminController.js';
import upload from '../middlewares/multer.js';

const adminRouter = express.Router();

// api login 

adminRouter.get('/get-all-user', getAllUser);
adminRouter.post('/delete-user', deleteUser);
adminRouter.post('/add-product',upload.single('image'), addProduct);
adminRouter.post('/edit-product', editProduct);
adminRouter.post('/update-product', updateProduct);
adminRouter.post('/delete-product', deleteProduct);
adminRouter.get('/get-all-products', getAllProducts);
adminRouter.get('/get-all-orders', getAllOrders);
adminRouter.get('/get-order-by-id', getOrderById);
adminRouter.post('/update-order-status', updateOrderStatus);

export default adminRouter;

