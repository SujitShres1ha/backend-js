import { get } from "mongoose";
import { user } from "../models/user.models.js";
import { video } from "../models/video.models.js";
import { apiError } from "../utilities/apiError.js";
import { apiResponse } from "../utilities/apiResponse.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import { uploadToCloud } from "../utilities/cloudinary.js";

const getAllVideos = asyncHandler(async (req,res)=>{
    const { page = 1, limit = 10, query, sortBy, sortType, userId} = req.query
    const owner = await user.findOne(userId).username
    const skip = (page - 1) * 10
    const videoList = await video.aggregate([
        {
            $match: {
                // owner: owner,  
                $or: [
                    {
                        title: {$regex : query, $options: 'i'}
                    },
                    {
                        description: {$regex: query, $options: 'i'}
                    }
                ]

            }
        },
        {
            $sort: {
                [sortBy]: sortType === 'desc' ? -1 : 1
    
            }
        },
        {
            $skip : skip,
        },
        {
            $limit: parseInt(limit)
        },                
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                owner: 1
            }
        }
    ])

    if (!videoList.length){
        throw new apiError(400,'Video match not found')
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,videoList,"Videos retrieved successfully")
    )
})

const publishAVideo = asyncHandler(async (req,res)=>{

    const {title,description} = req.body
    const videoFilePath = req.files?.video[0].path
    if (!videoFilePath){
        throw new apiError(400,'Video not available')
    }

    console.log(videoFilePath)
    const videoFile = await uploadToCloud(videoFilePath)
    if (!videoFile){
        throw new apiError(400,'Error uploading video')
    }
    
    const thumbnailFilePath = req.files?.thumbnail[0].path
    if (!thumbnailFilePath){
        throw new apiError(400,'Thumbnail not available')
    }

    const thumbnailFile = await uploadToCloud(thumbnailFilePath)
    if (!thumbnailFile){
        throw new apiError(400,'Error uploading thumbnail')
    }
    
    console.log(videoFile)
    const Video = await video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnailFile.url,
        owner: req.user._id,
        title,
        description,
        duration: videoFile.duration
    })

    if (!Video){
        throw new apiError(400,"Video couldn't be created")
    }

    console.log(Video)
    return res
    .status(200)
    .json(
        new apiResponse(200,Video,'Video successfully created')
    )


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const Video = await video.findById(videoId)
    if (!Video){
        console.log('400','Video id not valid')
    }
    return res
    .status(200)
    .json(
        new apiResponse(200,Video,'Video retrieved successfully')
    )
})

const updateVideo = asyncHandler(async (req,res)=>{
    const {title,description} = req.body
    let thumbnail
    if (req.file){
        const thumbnailFilePath = req.file.path
        thumbnail = await uploadToCloud(thumbnailFilePath)
    }
    
    const {videoId} = req.params
    const Video = await video.findByIdAndUpdate(
        videoId,
        {
            title: title,
            description: description,
            thumbnail: thumbnail.url
        },
        {new:true}
    )
    
    if (!Video){
        throw new apiError(400,'Error updating video')
    }
    return res
    .status(200)
    .json(
        new apiResponse(200,Video,'Video updated successfully')
    )
})

const deleteVideo = asyncHandler(async (req,res)=>{
    const {videoId} = req.params
    try {
        await video.findByIdAndDelete(
            videoId
        )
    } catch (error) {
        throw new apiError(400,'Error deleting video')
    }
    return res
    .status(200)
    .json(
        new apiResponse(200,"Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req,res)=>{
    const {videoId} = req.params
    
    const Video = await video.findByIdAndUpdate(
        videoId,
        {
            isPublished: true
        },
        {new: true}
    )
    
    if (!Video){
        throw new apiError(400,"Failed to toggle publish status")
    }
    return res
    .status(200)
    .json(
        new apiResponse(200,Video,'Publish status toggled successfully')
    )
})

export {getAllVideos,publishAVideo,getVideoById,updateVideo,deleteVideo,togglePublishStatus}