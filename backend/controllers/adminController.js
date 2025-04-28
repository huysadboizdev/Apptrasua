import validator from 'validator'
import bycrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import userModel from '../models/userModel.js'
import productModel from '../models/productModel.js'
import orderModel from '../models/orderModel.js'
import mongoose from 'mongoose'
import cartModel from '../models/cartModel.js'

const login_admin = async (req, res) => {
    try {
        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            return res.json({ success: true })
        }

        res.json({ success: false });
    }
    catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message })
    }
}

const getAllUser = async (req, res) => {
    try {
        const users = await userModel.find()

        res.json({ success: true, users })
    }
    catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message })
    }
}

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.body

        await userModel.findByIdAndDelete(userId)
        res.json({ success: true, message: "User deleted successfully" })

    }
    catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message })
    }
}


// Add a new product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        const imageFile = req.file; // Giả sử bạn có middleware multer để upload hình ảnh

        if (!name || !description || !price || !category || stock === undefined) {
            return res.status(400).json({ success: false, message: 'Missing product details' });
        }

        let imageUrl = '';
        if (imageFile) {
            // Upload hình ảnh lên Cloudinary
            const result = await cloudinary.uploader.upload(imageFile.path, {
                folder: "products", // Bạn có thể chỉ định thư mục trong Cloudinary nếu muốn
            });
            imageUrl = result.secure_url; // Lấy URL ảnh đã upload
        }

        const newProduct = new productModel({
            name,
            description,
            price,
            category,
            stock,
            image: imageUrl, // Lưu URL ảnh vào database
        });

        await newProduct.save();
        res.status(201).json({ success: true, message: 'Product added successfully', product: newProduct });

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Edit a product (get product details for edit)
const editProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, product });

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update a product
const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Kiểm tra và lấy dữ liệu từ req.body
        const body = req.body || {};
        const { name, description, price, category, stock } = body;
        const imageFile = req.file;

        console.log('Update product request:', {
            productId,
            body,
            imageFile: imageFile ? 'File exists' : 'No file'
        });

        // Tìm sản phẩm hiện tại
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Xử lý hình ảnh
        let imageUrl = product.image;
        if (imageFile) {
            try {
                // Upload hình ảnh lên Cloudinary
                const result = await cloudinary.uploader.upload(imageFile.path, {
                    folder: "products",
                });
                imageUrl = result.secure_url;
            } catch (error) {
                console.log('Cloudinary upload error:', error);
                return res.status(500).json({ success: false, message: 'Error uploading image' });
            }
        }

        // Tạo object cập nhật
        const updateData = {
            name: name || product.name,
            description: description || product.description,
            price: price !== undefined ? Number(price) : product.price,
            category: category || product.category,
            stock: stock !== undefined ? Number(stock) : product.stock,
            image: imageUrl
        };

        console.log('Updating product with data:', updateData);

        // Cập nhật sản phẩm
        const updatedProduct = await productModel.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(500).json({ success: false, message: 'Failed to update product' });
        }

        res.json({ 
            success: true, 
            message: 'Product updated successfully', 
            product: updatedProduct 
        });

    } catch (error) {
        console.log('Update product error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await productModel.findByIdAndDelete(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, message: 'Product deleted successfully' });

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
    try {
        const products = await productModel.find(); // Tìm tất cả sản phẩm trong database

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products found' });
        }

        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};



// Lấy tất cả đơn hàng
const getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.find().populate('userId').populate('items.productId').sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Lấy chi tiết đơn hàng theo ID
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await orderModel.findById(orderId).populate('userId').populate('items.productId');
        
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        if (!['Pending', 'Accepted', 'Delivery', 'Successful', 'Cancelled'].includes(status)) {
            return res.json({ success: false, message: 'Invalid status' });
        }

        const order = await orderModel.findByIdAndUpdate(
            orderId, 
            { status }, 
            { new: true }
        ).populate('userId').populate('items.productId');

        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: 'Order status updated', order });
    } catch (error) {
        console.log('Update order status error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa đơn hàng
const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        console.log('Deleting order with ID:', orderId);

        if (!orderId) {
            return res.json({ success: false, message: 'Order ID is required' });
        }

        const order = await orderModel.findByIdAndDelete(orderId);

        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.log('Delete order error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};



// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Kiểm tra userId có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.log('Get user by ID error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Gửi thông báo đến người dùng
const notifyUser = async (req, res) => {
    try {
        const { orderId, message } = req.body;

        if (!orderId || !message) {
            return res.json({ success: false, message: 'Thiếu thông tin cần thiết' });
        }

        // Tìm đơn hàng để lấy thông tin người dùng
        const order = await orderModel.findById(orderId).populate('userId');
        
        if (!order) {
            return res.json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        // TODO: Thêm logic gửi thông báo đến người dùng ở đây
        // Ví dụ: gửi email, push notification, hoặc lưu vào database

        res.json({ 
            success: true, 
            message: 'Đã gửi thông báo thành công',
            order: order
        });
    } catch (error) {
        console.log('Error notifying user:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get user statistics
const getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;

        // Lấy thông tin đơn hàng
        const orders = await orderModel.find({ userId });
        
        // Lấy thông tin giỏ hàng
        const cart = await cartModel.findOne({ userId });

        // Tính toán thống kê
        const stats = {
            totalOrders: orders.length,
            pendingOrders: orders.filter(order => order.status === 'Pending').length,
            completedOrders: orders.filter(order => order.status === 'Successful').length,
            cartItems: cart ? cart.items.length : 0,
            totalSpent: orders.reduce((total, order) => {
                if (order.status === 'Successful') {
                    return total + order.totalAmount;
                }
                return total;
            }, 0),
            totalOrderAmount: orders.reduce((total, order) => total + order.totalAmount, 0)
        };

        res.json({ success: true, stats });
    } catch (error) {
        console.log('Error getting user stats:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get user orders and total amount
const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;

        // Lấy tất cả đơn hàng của người dùng
        const orders = await orderModel.find({ userId })
            .populate('items.productId')
            .sort({ createdAt: -1 });

        // Tính tổng tiền của tất cả đơn hàng
        const totalAmount = orders.reduce((total, order) => total + order.totalAmount, 0);

        res.json({ 
            success: true, 
            orders,
            totalAmount
        });
    } catch (error) {
        console.log('Error getting user orders:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getStats = async (req, res) => {
    try {
        // Get total counts
        const totalOrders = await orderModel.countDocuments();
        const totalUsers = await userModel.countDocuments();
        const totalProducts = await productModel.countDocuments();

        // Calculate total revenue from all orders (including unconfirmed)
        const allOrders = await orderModel.find();
        const totalRevenue = allOrders.reduce((total, order) => total + order.totalAmount, 0);

        res.json({
            success: true,
            totalOrders,
            totalRevenue,
            totalUsers,
            totalProducts
        });
    } catch (error) {
        console.log('Error getting stats:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export {
    login_admin,
    getAllUser,
    deleteUser,
    addProduct,
    editProduct,
    updateProduct,
    deleteProduct,
    getAllProducts,
    getAllOrders,
    getOrderById,
    deleteOrder,
    updateOrderStatus,
    getUserById,
    notifyUser,
    getUserStats,
    getUserOrders,
    getStats
}

