import jwt from 'jsonwebtoken';

const authAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECERT);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        console.log('Auth admin error:', error);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

export default authAdmin;