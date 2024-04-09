import { Router } from "express";
import { userLogin, userLogout, userRegister, refreshAccessToken, changePassword, getCurrentUser, updateUserDetails, updateAvatar, updateCoverImg, channelDetails, getWatchHistory } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import jwtVerify from "../middlewares/auth.middlewares.js";

const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
userRegister)

userRouter.route("/login").post(userLogin)

//secure routes
userRouter.route("/logout").post(jwtVerify,userLogout)
userRouter.route("/refresh-access-token").post(refreshAccessToken)
userRouter.route("/change-password").patch(jwtVerify,changePassword)
userRouter.route("/current-user").get(jwtVerify,getCurrentUser)
userRouter.route("/update-account").patch(jwtVerify,updateUserDetails)
userRouter.route("/update-avatar").patch(jwtVerify,upload.single("avatar"),updateAvatar)
userRouter.route("/update-coverimg").patch(jwtVerify,upload.single("coverImage"),updateCoverImg)
userRouter.route("/channel/:username").get(jwtVerify,channelDetails)
userRouter.route("/watch-history").get(jwtVerify,getWatchHistory)

export default userRouter 