import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt, { hash } from "bcrypt"


const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true
    },
    avatar: {
        type: String, //cloudinary url
        required: true
    },
    coverImage: {
        type:String//cloudinary url
        
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Video '
        }
    ],
    password:{
        type: String,
        required: [true,"Password is required"]
    },
    refreshToken:{
        type: String
    }
},{timestamps:true})

userSchema.pre("save", async function(next){
    if (this.isModified("password")){
        this.password = await hash(this.password,8)
    }
    next()
})

userSchema.methods.checkPassword = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username
    },
    process.env.ACCESS_TOKEN,
    {
        expiresIn: process.env.AT_EXPIRY
    }
    )
} 

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN,
    {
        expiresIn: process.env.RT_EXPIRY
    }
    )
}

export const user = mongoose.model("User",userSchema)