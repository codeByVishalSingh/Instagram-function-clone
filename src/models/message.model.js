import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reciverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message:{
        tupe:String,
        required:true
    }
})
export const Message = mongoose.model("Message",MessageSchema)