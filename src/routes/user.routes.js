import { Router } from "express";
import { userLogin, userLogout, userRegister, refreshAccessToken } from "../controllers/user.controllers.js";
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
userRouter.route("/refreshtoken").post(refreshAccessToken)
export default userRouter 