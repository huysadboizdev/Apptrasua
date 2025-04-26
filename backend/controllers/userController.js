import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'

// Kiểm tra JWT secret
const JWT_SECERT = process.env.JWT_SECERT || 'your_default_jwt_secret_key'

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
            password: hashedPassword
        }

        const newUser = new userModel(userData)
        await newUser.save()

        const token = jwt.sign({ id: newUser._id }, JWT_SECERT)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message })
    }
}

// api for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(400).json({ success: false, message: 'User does not exist' })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, JWT_SECERT)
            return res.json({ success: true, token });
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
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })


    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message })
    }
}

//  api to update user profile
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "data missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
            const imageUrl = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageUrl })
        }

        res.json({ success: true, messgae: 'profile updated' })

    } catch (error) {
        console.log(error)
        res.status(400).json({ success: false, message: error.message })
    }
}

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;
        if (!userId || !productId || !quantity) {
            return res.json({ success: false, message: 'Missing data' });
        }

        let cart = await cartModel.findOne({ userId });

        if (cart) {
            const index = cart.items.findIndex(item => item.productId.toString() === productId);
            if (index > -1) {
                cart.items[index].quantity += quantity;
            } else {
                cart.items.push({ productId, quantity });
            }
        } else {
            cart = new cartModel({ userId, items: [{ productId, quantity }] });
        }

        await cart.save();
        res.json({ success: true, message: 'Item added to cart', cart });

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Edit item in cart (update quantity)
const editCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId || !quantity) {
            return res.json({ success: false, message: 'Missing data' });
        }

        let cart = await cartModel.findOne({ userId });

        if (!cart) {
            return res.json({ success: false, message: 'Cart not found' });
        }

        const index = cart.items.findIndex(item => item.productId.toString() === productId);
        if (index > -1) {
            // Cập nhật số lượng của sản phẩm trong giỏ
            cart.items[index].quantity = quantity;
            await cart.save();
            return res.json({ success: true, message: 'Cart item updated', cart });
        } else {
            return res.json({ success: false, message: 'Product not found in cart' });
        }

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};


// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.json({ success: false, message: 'Missing data' });
        }

        let cart = await cartModel.findOne({ userId });

        if (!cart) {
            return res.json({ success: false, message: 'Cart not found' });
        }

        // Tìm sản phẩm trong giỏ và xóa nó
        const index = cart.items.findIndex(item => item.productId.toString() === productId);
        if (index > -1) {
            cart.items.splice(index, 1); // Xóa sản phẩm khỏi giỏ
            await cart.save();
            return res.json({ success: true, message: 'Item removed from cart', cart });
        } else {
            return res.json({ success: false, message: 'Product not found in cart' });
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


// Checkout (Create order)
const checkout = async (req, res) => {
    try {
        const { userId, paymentMethod } = req.body;

        const cart = await cartModel.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.json({ success: false, message: 'Cart is empty' });
        }

        const totalAmount = cart.items.reduce((sum, item) => {
            return sum + item.productId.price * item.quantity;
        }, 0);

        const order = new orderModel({
            userId,
            items: cart.items,
            totalAmount,
            paymentMethod,
            status: 'Pending'
        });

        await order.save();
        await cartModel.findOneAndDelete({ userId });

        res.json({ success: true, message: 'Order placed', order });

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
    }
};


// Get user orders
const getOrders = async (req, res) => {
    try {
        const { userId } = req.body;
        const orders = await orderModel.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, orders });

    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error.message });
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



export { registerUser, loginUser, getProfile, updateProfile, addToCart, checkout, getOrders, editCart, removeFromCart, clearCart, getOrderDetails, updateOrderStatus };