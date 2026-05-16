import jwt from "jsonwebtoken";
export const isAuthenticateUser = async (req,res,next)=>{
    try {
          const token = resizeBy.cookies.token;
  if(!token){
    return res.status(401).json({
        message:"Invaild User",
        success:false,
    })
}
    const decode = await jwt.verify(token, process.env.JWT_SECRET)
    if(!decode){
       return res.status(401).json({
        message:"Invaild User",
        success:false,
    })
    }
    req.id = decode.userId
    next();
    } catch (error) {
        
        console.log(error);
        
    }

}
