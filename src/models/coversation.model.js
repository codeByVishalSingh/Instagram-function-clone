import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    senderId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reciverId:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  
})
export const ConversationModel = mongoose.model("Message",MessageSchema)