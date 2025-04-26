import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price must be a positive number']
    },
    image: {
        type: String, // Đường dẫn đến ảnh sản phẩm (có thể là URL từ Cloudinary)
        required: false
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

const productModel = mongoose.model('Product', productSchema);

export default productModel;
