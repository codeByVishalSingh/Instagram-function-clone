import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    senderId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reciverId:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  
})
export const Conversation = mongoose.model("Message",MessageSchema)