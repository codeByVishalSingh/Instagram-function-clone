import { ConversationModel } from "../models/coversation.model.js";
import { MessageModel } from "../models/message.model.js";
import { getReciverSocketId, io } from "../Socket/socket.js";
// Backend: message.controller.js
export const sendMessage = async (req, res) => {
    try {
        const senderId = req.id; 
        const receiverId = req.params.id; 
        const { textMessage: message } = req.body;

        // 1. MANDATORY VALIDATION (Hard Stop)
        // Agar koi bhi value sahi nahi hai, to yahi se return ho jao
        if (!senderId || !receiverId || receiverId === 'undefined' || senderId === 'undefined') {
            console.error("BLOCKING: Invalid IDs - Sender:", senderId, "Receiver:", receiverId);
            return res.status(400).json({ 
                success: false, 
                message: "Authentication error or missing user ID." 
            });
        }

        // 2. Query execution (Ab yahan undefined nahi jayega)
        let conversation = await ConversationModel.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            conversation = await ConversationModel.create({
                participants: [senderId, receiverId]
            });
        }

        const newMessage = await MessageModel.create({
            senderId,
            receiverId,
            message,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        await Promise.all([conversation.save(), newMessage.save()]);

        // Socket Logic
        const receiverSocketId = getReciverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }

        return res.status(201).json({ success: true, newMessage });

    } catch (error) {
        console.error("Controller Error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const getMessage = async (req,res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const conversation = await ConversationModel.findOne({
            participants:{$all: [senderId, receiverId]}
        }).populate('messages');
        if(!conversation) return res.status(200).json({success:true, messages:[]});

        return res.status(200).json({success:true, messages:conversation?.messages});
        
    } catch (error) {
        console.log(error);
    }
}