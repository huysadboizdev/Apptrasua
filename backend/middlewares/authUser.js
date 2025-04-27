import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_SECERT = process.env.ACCESS_TOKEN_SECERT || 'huydev'

// user authentication middleware
const authUser = async (req, res, next) => {
    try {
        // Kiểm tra xem có header Authorization không
        if (!req.headers.authorization) {
            console.log('No Authorization header found');
            return res.status(401).json({ 
                success: false, 
                message: "Không tìm thấy token xác thực" 
            });
        }

        // Lấy token từ header
        const authHeader = req.headers.authorization;
        console.log('Authorization header:', authHeader);
        
        const token = authHeader.split(' ')[1];
        console.log('Extracted token:', token);

        // Kiểm tra định dạng token
        if (!token) {
            console.log('No token found in Authorization header');
            return res.status(401).json({ 
                success: false, 
                message: "Token không hợp lệ" 
            });
        }

        try {
            // Xác thực token
            console.log('Verifying token with secret:', ACCESS_TOKEN_SECERT);
            const decoded = jwt.verify(token, ACCESS_TOKEN_SECERT);
            console.log('Decoded token:', decoded);
            
            // Kiểm tra xem token có chứa id không
            if (!decoded.id) {
                console.log('Token does not contain id');
                return res.status(401).json({ 
                    success: false, 
                    message: "Token không hợp lệ" 
                });
            }

            // Thêm thông tin người dùng vào request
            req.user = {
                userId: decoded.id
            };

            console.log('User authenticated:', req.user);
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            console.error('Token format:', token);
            return res.status(401).json({ 
                success: false, 
                message: "Token không hợp lệ hoặc đã hết hạn" 
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi xác thực" 
        });
    }
}

export default authUser