import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: [] // Default empty array 
    }]
}, { timestamps: true });

export const ConversationModel = mongoose.model('Conversation', conversationSchema);