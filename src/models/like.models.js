import mongoose, { Schema } from "mongoose"

const likeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: 'Videos'
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: 'Tweet'
    }
},{timestamps:true})

export const like = mongoose.model('Like',likeSchema)