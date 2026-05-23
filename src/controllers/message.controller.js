import { ConversationModel } from "../models/coversation.model.js";
import { MessageModel } from "../models/message.model.js";

export const  sendMessage = async (req,res)=>{
    try {
        const senderId = req.id;
        const reciverId = req.params.id;
        const {message} = req.body;

        let Conversation = await ConversationModel.create({
            participants:[senderId, receiverId]
        })
        const newMessage = await MessageModel.create({
            senderId,
            reciverId,
            message,
        })
        if(newMessage) Conversation.messages.push(newMessage._id)

            await Promise.all([Conversation.save(), newMessage.save()])

           return res.status(201).json({
            success:true,
            newMessage,
           })

    } catch (error) {
        console.log(error);
        
    }
}
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