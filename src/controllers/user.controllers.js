import { apiError } from "../utilities/apiError.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import { user } from "../models/user.models.js";
import { uploadToCloud } from "../utilities/cloudinary.js";
import { apiResponse } from "../utilities/apiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

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
    const getRefreshToken = await req.cookies?.refreshToken 
    console.log(getRefreshToken)
    if (!getRefreshToken){
        throw new apiError(401,"Unauthorized request")
    }
    try {
        const decodedRefreshToken = await jwt.verify(getRefreshToken,process.env.REFRESH_TOKEN)
        
        const User = await user.findById(decodedRefreshToken._id)
        
        if(!User){
            throw new apiError(401,"Invalid refresh token")
        }
        
        if (getRefreshToken != User.refreshToken){
            throw new apiError(401,"Refresh token used/expired")
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

const changePassword = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword,confirmPassword} = req.body
    if (newPassword != confirmPassword){
        throw new apiError(400,"Passwords don't match")
    }
    if(oldPassword == newPassword){
        throw new apiError(400,"Enter a different password")
    }
    const User = await user.findById(req.user._id)
        
    const isPasswordCorrect = await User.checkPassword(`${oldPassword}`)
    if (!isPasswordCorrect){
        throw new apiError(400,"Password not correct")
    }
    
    User.password = newPassword
    await User.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new apiResponse(
            200,{},"Password successfully changed"
        )
    )
    

})

const getCurrentUser = asyncHandler(async (req,res)=>{
    const User = req.user
    console.log(User)
    return res
    .status(200)
    .json(
        new apiResponse(200,{User},"User fetched successfully")
    )
})

const updateUserDetails = asyncHandler(async (req,res)=>{
    const {fullname, username} = req.body
    const User = user.findByIdAndUpdate(
        user._id,
        {
            fullname: fullname,
            username: username
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(200,user,"Data updated successfully")
    )
})
const updateAvatar = asyncHandler(async (req,res)=>{
    console.log(req.user._id)
    const avatarPath = req.file?.path
   if (!avatarPath){
    throw new apiError(400,"Avatar not available")
   }
    

    const avatar = await uploadToCloud(avatarPath)
    if (!avatar){
        throw new apiError(400,"Error uploading avatar file")
    }

    const User = await user.findByIdAndUpdate(
        req.user._id,
        {
            $set:{avatar: avatar.url}
        },
        {new:true}
    ).select("-password")
    
    return res.status(200)
    .json(
        new apiResponse(200,User,"Avatar updated successfully")
    )
})

const updateCoverImg = asyncHandler(async (req,res)=>{
    const coverImagePath = req.file?.path
    if (!coverImagePath){
        throw new apiError(400,"coverImage file missing")
    }

    const coverImage = await uploadToCloud(coverImagePath)
    if (!coverImage){
        throw new apiError(400,"Error uploading coverIMage file")
    }

    const User = await user.findByIdAndUpdate(
        req.user._id,
        {
            $set:{coverImage: coverImage.url}
        },
        {new:true}
    ).select("-password")
    
    return res.status(200)
    .json(
        new apiResponse(200,User,"coverImage updated successfully")
    )
})

const channelDetails = asyncHandler(async (req,res)=>{
    const {username} = req.params
    console.log(req.params)
    if (!username){
        throw new apiError(400,"Username not found")
    }
    const channel = await user.aggregate([
        {
            $match: {
                username: username
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedChannels: {
                    $size: "$subscribedTo"
                },
                isSubscribedTo: {
                    $cond: {
                        if: {$in:[req.user._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedChannels: 1
            }
        }
    ])

    if (!channel?.length){
        throw new apiError(404, "Channel doesn't exist ")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,channel[0],"Channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req,res)=>{
    const User = await user.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            "owner": {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
    ])
    return res
    .status(200)
    .json(
        new apiResponse(200,User[0].watchHistory,"User watch history fetched successfully")
    )
})
export {userRegister,userLogin,userLogout, refreshAccessToken, changePassword, getCurrentUser, updateUserDetails, updateAvatar, updateCoverImg, getWatchHistory, channelDetails}
