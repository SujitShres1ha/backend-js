import { apiError } from "../utilities/apiError.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import { user } from "../models/user.models.js";
import { uploadToCloud } from "../utilities/cloudinary.js";
import { apiResponse } from "../utilities/apiResponse.js";
import multer from "multer"; // Import multer package for file uploads

const accessAndRefreshTokens = async function(user_id){
    try {
        const User = user.findById(user_id)
        const accessToken = await User.generateAccessToken()
        const refreshToken = await User.generateRefreshToken()
        
        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false})
        
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
    
    const avatarPath = req.files?.avatar[0]?.path

    let coverImagePath
    if(req.files?.coverImage && req.files?.coverImage.length > 0){
        coverImagePath = req.files.coverImage[0].path
    }
    
    if (!avatarPath){
        throw new apiError(400,"Avatar is required")
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

    const User = await user.find({email})

    if (!User){
        throw new apiError(400,"Username or email not found")
    }

    const validPassword = await User.checkPassword(password)

    if (!validPassword){
        throw new apiError(401,"Password is not valid")
    }

    const {accessToken,refreshToken} = await accessAndRefreshTokens(User._id)

    User.select("-refreshToken -password")

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
                user: User, accessToken, refreshToken
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
    .clearCookie("refreshToken",options)
    .json(
        new apiResponse(200,{},"User logged out successfully")
    )

})


export {userRegister,userLogin,userLogout}
