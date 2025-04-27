import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { 
        type: String, 
        default: "https://api.dicebear.com/9.x/avataaars/svg?seed=default" 
    },
    address: { type: String, default: '' }, // Chỉ cần một chuỗi duy nhất cho địa chỉ
    phone: { type: String, default: "0000000000" },
    balance: { type: Number, default: 0 },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, { minimize: false, timestamps: true });

const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel;
