import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, default: () => `https://api.dicebear.com/9.x/avataaars/svg?seed=${Math.random().toString(36).substring(7)}` },
    address: { type: Object, default: { line1: '', line2: '' } },
    phone: { type: String, default: "0000000000" },
    balance: { type: Number, default: 0 }
}, {minimize: false, timestamps: true});

const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel