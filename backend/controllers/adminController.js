import validator from 'validator'
import bycrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import userModel from '../models/userModel.js'
import productModel from '../models/productModel.js'
import orderModel from '../models/orderModel.js'

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
        const { name, description, price, category, stock } = req.body;
        const imageFile = req.file; // Giả sử có upload hình ảnh mới

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let imageUrl = product.image;
        if (imageFile) {
            imageUrl = imageFile.path; // Hoặc sử dụng Cloudinary
        }

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.category = category || product.category;
        product.stock = stock !== undefined ? stock : product.stock;
        product.image = imageUrl;

        await product.save();

        res.json({ success: true, message: 'Product updated successfully', product });

    } catch (error) {
        console.log(error);
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

        if (!['Pending', 'Completed', 'Cancelled'].includes(status)) {
            return res.json({ success: false, message: 'Invalid status' });
        }

        const order = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: 'Order status updated', order });
    } catch (error) {
        console.log(error);
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
    updateOrderStatus
}

