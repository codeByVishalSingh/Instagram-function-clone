import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reciverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message:{
        type:String,
        required: true
    }
})
export const MessageModel = mongoose.model("Message",MessageSchema)