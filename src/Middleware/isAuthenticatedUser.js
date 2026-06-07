import jwt from "jsonwebtoken";

export const isAuthenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            });
        }
        
     // Inside your isAuthenticateUser middleware file
const decode = await jwt.verify(token, process.env.JWT_SECRET);  

if (!decode) {
    return res.status(401).json({ message: "Invalid User", success: false });
}

// 💥 CHANGE THIS LINE to match your lowercase token payload key:
req.id = decode.userid; 

next();
    } catch (error) {
        console.log("Error in Auth Middleware:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};