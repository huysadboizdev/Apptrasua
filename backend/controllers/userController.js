import { v2 as cloudinary } from 'cloudinary'
import productModel from '../models/productModel.js'
import cartModel from '../models/cartModel.js'
import userModel from '../models/userModel.js'
import orderModel from '../models/orderModel.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import validator from 'validator'

// Kiểm tra JWT secret
const ACCESS_TOKEN_SECERT = process.env.ACCESS_TOKEN_SECERT || 'huydev'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !password || !email) {
            return res.json({ success: false, message: 'missing details' })
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'enter a valid email' })
        }

        if (password.length < 8) {
            return res.json({ success: false, message: 'enter a strong password' })
        }

        // Check if email already exists
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return res.json({ success: false, message: 'Email already registered' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword,
            role: 'user' // Default role for new registrations
        }

        const newUser = new userModel(userData)
        await newUser.save()

        const token = jwt.sign({ id: newUser._id }, ACCESS_TOKEN_SECERT)

        res.json({ 
            success: true, 
            token,
            user: {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        })

    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message })
    }
}

// api for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        // Check if it's admin login
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            const token = jwt.sign({ id: 'admin', role: 'admin' }, ACCESS_TOKEN_SECERT)
            return res.json({ 
                success: true, 
                token,
                user: {
                    email: ADMIN_EMAIL,
                    role: 'admin'
                }
            })
        }

        // Regular user login
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(400).json({ success: false, message: 'User does not exist' })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id, role: user.role }, ACCESS_TOKEN_SECERT)
            return res.json({ 
                success: true, 
                token,
                user: {
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            })
        } else {
            res.json({ success: false, message: 'invalid credentials' })
        }

    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message })
    }
}

// api to get user profile data
const getProfile = async (req, res) => {
    try {
        const { userId } = req.user;  // Lấy userId từ req.user
        const userData = await userModel.findById(userId).select('-password');

        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, userData });
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
}


//  api to update user profile
const updateProfile = async (req, res) => {
    try {
        const { userId } = req.user;
        const { name, phone, address } = req.body;
        const imageFile = req.file;

        console.log('Updating profile for user:', userId);
        console.log('Request body:', req.body);
        console.log('Image file:', imageFile);

        if (!name || !phone) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const updateData = {
            name,
            phone,
            address: address || ''
        };

        // Nếu có file ảnh, thêm vào updateData
        if (imageFile) {
            updateData.image = imageFile.path;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                image: updatedUser.image,
                phone: updatedUser.phone,
                address: updatedUser.address
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Add item to cart
const addToCart = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('User:', req.user);

        const { productId } = req.body;
        const { userId } = req.user;

        if (!productId) {
            return res.json({ success: false, message: 'Vui lòng chọn sản phẩm cần thêm' });
        }

        let cart = await cartModel.findOne({ userId });

        if (cart) {
            const index = cart.items.findIndex(item => item.productId.toString() === productId);
            if (index > -1) {
                // Nếu sản phẩm đã có trong giỏ, tăng số lượng lên 1
                cart.items[index].quantity += 1;
            } else {
                // Nếu sản phẩm chưa có trong giỏ, thêm mới với số lượng 1
                cart.items.push({ productId, quantity: 1 });
            }
        } else {
            // Tạo giỏ hàng mới với sản phẩm đầu tiên
            cart = new cartModel({ 
                userId, 
                items: [{ productId, quantity: 1 }] 
            });
        }

        await cart.save();
        res.json({ 
            success: true, 
            message: 'Đã thêm sản phẩm vào giỏ hàng', 
            cart 
        });

    } catch (error) {
        console.log('Error in addToCart:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Edit item in cart (update quantity)
const editCart = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('User:', req.user);

        const { productId, quantity } = req.body;
        const { userId } = req.user;

        // Kiểm tra chi tiết hơn
        if (!productId) {
            return res.json({ success: false, message: 'Vui lòng chọn sản phẩm cần cập nhật' });
        }

        // Chuyển đổi quantity thành số và kiểm tra
        const quantityNumber = Number(quantity);
        if (isNaN(quantityNumber) || quantityNumber < 0) {
            return res.json({ 
                success: false, 
                message: 'Số lượng không hợp lệ. Vui lòng nhập số lớn hơn hoặc bằng 0',
                receivedQuantity: quantity
            });
        }

        let cart = await cartModel.findOne({ userId });

        if (!cart) {
            return res.json({ success: false, message: 'Không tìm thấy giỏ hàng' });
        }

        const index = cart.items.findIndex(item => item.productId.toString() === productId);
        if (index > -1) {
            if (quantityNumber === 0) {
                // Nếu số lượng là 0, xóa sản phẩm khỏi giỏ hàng
                cart.items.splice(index, 1);
                await cart.save();
                return res.json({ 
                    success: true, 
                    message: 'Đã xóa sản phẩm khỏi giỏ hàng',
                    cart,
                    removed: true
                });
            } else {
                // Cập nhật số lượng mới
                cart.items[index].quantity = quantityNumber;
                await cart.save();
                return res.json({ 
                    success: true, 
                    message: 'Đã cập nhật giỏ hàng thành công', 
                    cart,
                    updatedItem: cart.items[index]
                });
            }
        } else {
            return res.json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
        }

    } catch (error) {
        console.log('Error in editCart:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};


// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const { userId } = req.user; // Lấy userId từ req.user thay vì req.body

        if (!productId) {
            return res.json({ success: false, message: 'Thiếu ID sản phẩm' });
        }

        let cart = await cartModel.findOne({ userId });

        if (!cart) {
            return res.json({ success: false, message: 'Không tìm thấy giỏ hàng' });
        }

        // Tìm sản phẩm trong giỏ và xóa nó
        const index = cart.items.findIndex(item => item.productId.toString() === productId);
        if (index > -1) {
            cart.items.splice(index, 1); // Xóa sản phẩm khỏi giỏ
            await cart.save();
            return res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng', cart });
        } else {
            return res.json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
        }

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};


// Clear all items in cart
const clearCart = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'User ID is required' });
        }

        let cart = await cartModel.findOne({ userId });

        if (!cart) {
            return res.json({ success: false, message: 'Cart not found' });
        }

        // Xóa toàn bộ giỏ hàng của người dùng
        cart.items = [];
        await cart.save();

        res.json({ success: true, message: 'Cart cleared', cart });

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get cart items
const getCart = async (req, res) => {
    try {
        console.log('Request user:', req.user);

        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const userId = req.user.userId;
        console.log('Getting cart for user:', userId);

        const cart = await cartModel.findOne({ userId }).populate('items.productId');
        console.log('Found cart:', cart);

        if (!cart) {
            // Nếu không tìm thấy giỏ hàng, tạo giỏ hàng mới
            const newCart = new cartModel({
                userId,
                items: []
            });
            await newCart.save();
            return res.json({ 
                success: true, 
                message: 'Giỏ hàng trống',
                cart: newCart 
            });
        }

        // Tính tổng tiền
        const totalAmount = cart.items.reduce((sum, item) => {
            return sum + (item.productId.price * item.quantity);
        }, 0);

        // Cập nhật tổng tiền vào giỏ hàng
        cart.totalAmount = totalAmount;
        await cart.save();

        return res.json({ 
            success: true, 
            message: 'Lấy giỏ hàng thành công',
            cart 
        });
    } catch (error) {
        console.error('Error in getCart:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy giỏ hàng',
            error: error.message 
        });
    }
};


// Checkout (Create order)
const checkout = async (req, res) => {
    try {
        const { paymentMethod, address, phone } = req.body;
        const userId = req.user.userId;

        console.log('Checkout request - UserId:', userId);
        console.log('Checkout request - Body:', req.body);

        // Lấy giỏ hàng của người dùng
        const cart = await cartModel.findOne({ userId }).populate('items.productId');
        console.log('Found cart:', cart);

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Giỏ hàng trống' 
            });
        }

        // Tính tổng tiền
        const totalAmount = cart.items.reduce((sum, item) => {
            return sum + (item.productId.price * item.quantity);
        }, 0);

        // Tạo đơn hàng mới
        const order = new orderModel({
            userId,
            items: cart.items.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.price
            })),
            totalAmount,
            paymentMethod,
            address,
            phone,
            status: 'Pending'
        });

        // Lưu đơn hàng
        await order.save();

        // Xóa giỏ hàng
        await cartModel.findOneAndDelete({ userId });

        return res.status(200).json({
            success: true,
            message: 'Đặt hàng thành công',
            order
        });

    } catch (error) {
        console.error('Error in checkout:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi đặt hàng',
            error: error.message
        });
    }
};


// Get user orders
const getOrders = async (req, res) => {
    try {
        console.log('Getting orders for user:', req.user);
        const userId = req.user.userId; // Lấy userId từ req.user

        // Lấy danh sách đơn hàng và populate thông tin sản phẩm
        const orders = await orderModel.find({ userId })
            .populate('items.productId')
            .sort({ createdAt: -1 });

        console.log('Found orders:', orders);

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách đơn hàng thành công",
            orders
        });
    } catch (error) {
        console.error("Error in getOrders:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách đơn hàng",
            error: error.message
        });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;

        console.log('Cancelling order:', { orderId, userId });

        // Tìm đơn hàng trước khi cập nhật
        const order = await orderModel.findOne({ _id: orderId, userId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Kiểm tra trạng thái trước khi cập nhật
        if (order.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng đã được hủy trước đó'
            });
        }

        if (order.status === 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy đơn hàng đã hoàn thành'
            });
        }

        // Cập nhật trạng thái đơn hàng
        const updatedOrder = await orderModel.findOneAndUpdate(
            { _id: orderId, userId },
            { $set: { status: 'Cancelled' } },
            { new: true, runValidators: false }
        );

        res.json({
            success: true,
            message: 'Hủy đơn hàng thành công',
            order: updatedOrder
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi hủy đơn hàng',
            error: error.message
        });
    }
};


// Lấy chi tiết đơn hàng theo id
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Tìm đơn hàng theo id
        const order = await orderModel.findById(orderId).populate('items.productId');
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order });

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// API để lấy tất cả sản phẩm cho người dùng
const getAllProductsForUser = async (req, res) => {
    try {
        const products = await productModel.find(); // Tìm tất cả sản phẩm

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products available' });
        }

        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export { getAllProductsForUser }; // Xuất API này để sử dụng trong router


// Cập nhật trạng thái đơn hàng (chỉ có thể cập nhật trạng thái của admin hoặc người quản lý)
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        // Chỉ cho phép cập nhật trạng thái đơn hàng nếu là một trong các trạng thái hợp lệ
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
    registerUser, 
    loginUser, 
    getProfile, 
    updateProfile, 
    addToCart, 
    checkout, 
    getOrders, 
    editCart, 
    removeFromCart, 
    clearCart, 
    getOrderDetails, 
    updateOrderStatus, 
    getCart, 
    cancelOrder 
};