import { apiError } from "../utilities/apiError.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import jwt from "jsonwebtoken";
import { user } from "../models/user.models.js";

const jwtVerify = asyncHandler(async (req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if (!token){
            throw new apiError(401,"Request not authorized")
        }
        
        const validToken = await jwt.verify(token,process.env.ACCESS_TOKEN)
        
        if (!validToken){
            throw new apiError(400,"Invalid access token")
        }
    
        const User = await user.findById(validToken._id).select("-password -refreshToken")
    
        req.user = User
        next()
    } catch (error) {
        throw new apiError(401,"Invalid access token")
    }
})


export default jwtVerify
