import { Router } from "express";
import { userLogin, userLogout, userRegister } from "../controllers/user.controllers.js";
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

userRouter.route("/logout").post(jwtVerify,userLogout)
export default userRouter