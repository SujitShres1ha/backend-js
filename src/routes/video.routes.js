import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controllers.js";
import jwtVerify from "../middlewares/auth.middlewares.js";
import { get } from "mongoose";
const videoRouter = Router()


videoRouter.route("/get-all-videos").get(jwtVerify,getAllVideos)
videoRouter.route("/publish-video").post(jwtVerify,upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]),publishAVideo)

videoRouter.route("/get-videos").post(jwtVerify,getAllVideos)
videoRouter.route("/:videoId").get(jwtVerify,getVideoById)
videoRouter.route("/update-video/:videoId").post(jwtVerify,upload.single('thumbnail'),updateVideo)
videoRouter.route("/delete-video/:videoId").patch(jwtVerify,deleteVideo)
videoRouter.route("/toggle-status/:videoId").patch(jwtVerify,togglePublishStatus)
export default videoRouter