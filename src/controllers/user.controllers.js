import { apiError } from "../utilities/apiError.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import { user } from "../models/user.models.js";
import { uploadToCloud } from "../utilities/cloudinary.js";
import { apiResponse } from "../utilities/apiResponse.js";
import jwt from "jsonwebtoken"
import multer from "multer"; // Import multer package for file uploads

const accessAndRefreshTokens = async function(user_id){
    try {
        const User = await user.findById(user_id)
        console.log(User)
        const accessToken = await User.generateAccessToken()
        const refreshToken = await User.generateRefreshToken()
        
        User.refreshToken = refreshToken
        await User.save({validateBeforeSave: false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new apiError(500,"Error generating access and refresh tokens")
    }
}

const userRegister = asyncHandler(async (req,res)=>{
    //get user details
    //form validation  
    //check existing users  
    //check avatar & cover images
    //upload to cloudinary, avatar 
    //create user obj, entry in db 
    //remove password and refresh token from response
    //check if user is created 
    //return response
      
    const {username, email, fullname, password} = req.body
    if ([username,email,fullname,password].some((field)=>
        field?.trim()) == ""){
        throw new apiError(400,"All fields must be completed")
    }
    

    const existedUser = await user.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new apiError(409, "User with email or username already exists")
    }
    
    let avatarPath
    if (req.files?.avatar && req.files?.avatar.length > 0){
        avatarPath = req.files.avatar[0].path
    }

    let coverImagePath
    if(req.files?.coverImage && req.files?.coverImage.length > 0){
        coverImagePath = req.files.coverImage[0].path
    }
    

    

    const avatar = await uploadToCloud(avatarPath)
    
    const coverImage = await uploadToCloud(coverImagePath)

    if (!avatar){
        throw new apiError(400, "Avatar file not available")
    }

    const User = await user.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username,
        password,
        email
    })

    const createdUser = await user.findById(User._id).select("-password -refreshToken")

    console.log(createdUser)
    if (!createdUser){
        throw new apiError(400, "User couldn't be registered")
    }

    return res.json(
        new apiResponse(200,createdUser,"User successfully created")
    )

})


const userLogin = asyncHandler(async (req,res)=>{

    const {email,password} = req.body
    
    if (!email){
        throw new apiError(400,"Email is required")
    }

    const User = await user.findOne({email})

    if (!User){
        throw new apiError(400,"Username or email not found")
    }

    const validPassword = await User.checkPassword(password)

    if (!validPassword){
        throw new apiError(401,"Password is not valid")
    }

    const {accessToken,refreshToken} = await accessAndRefreshTokens(User._id)

    const loggedInUser = await user.findById(User._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )

})

const userLogout = asyncHandler(async (req,res)=>{
    await user.findByIdAndUpdate(
        req.user._id,
        {
            $set: {refreshToken: undefined}
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(
        new apiResponse(200,{},"User logged out successfully")
    )

})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const getRefreshToken = req.cookies?.refreshToken 
    if (!getRefreshToken){
        throw new apiError(401,"Unauthorized request")
    }
    try {
        const decodedRefreshToken = await jwt.verify(getRefreshToken,process.env.REFRESH_TOKEN)
    
        const User = user.findById(decodedRefreshToken._id)
    
        if(!User){
            throw new apiError(401,"Invalid refresh token")
        }
    
        if (decodedRefreshToken != User.refreshToken){
            throw new apiError(401,"Invalid refresh token")
        }
    
        const {accessToken, refreshToken} = await accessAndRefreshTokens(User._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new apiResponse(
                200,
                {
                    accessToken,refreshToken
                },
                "Access token refreshed"
            )
        )
        
    
    } catch (error) {
        throw new apiError(400,"Invalid refresh token",error.message)
    }
    
})

export {userRegister,userLogin,userLogout, refreshAccessToken}
