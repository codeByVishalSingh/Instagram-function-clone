import sharp from "sharp"
import cloudniary from "../utils/cloudniary.js";
import { PostModel } from "../models/post.model.js";
import { UserModel } from "../models/user.model.js";
import { populate } from "dotenv";
import { CommentModel } from "../models/comment.model.js";
export const addNewPost = async (req,res)=>{
    try {
        const {caption} = req.body;
        const image = req.file;
        const authorId = req.id;

        if(!image){
            res.status(400).json({message: "Image ids Require"})
        }
        
        const optimizedImageBuffer = await sharp(image, buffer).resize({width:800, height:800, fir:'inside'}).toFormat(
            "jpeg", {quality:80}).toBuffer();
        

           const fileUri = `data:/image/jpeg.base64, ${optimizedImageBuffer.toString('base64')}`;
           const cloudResponse= await cloudniary.uploader.upload(fileUri)
           const post = await PostModel.create({
            caption,
            image:cloudResponse.secure_url,
            author:authorId
           });

           const user = await UserModel.findById(authorId);
           if(user){
            user.posts.push(post._id);
            await user.save();
           }

           await post.populate({path:'author',select:'-password'}) ;
           return res.status(201).json({
            message: "New Post Added Successfully",
            post,
            success:true,
           })
    } catch (error) {
        console.log(error);
        
    }
}
export const getAllPost = async (req, res) => {
    try {
        const posts = await PostModel.find().sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePic' })
            .populate({
                path: 'comments',
                sort: { createdAt: -1 },
                populate: {
                    path: 'author',
                    select: 'username profilePic'
                }
            });
        return res.status(200).json({
            posts,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
};

export const getUserPost = async (req, res) => {
    try {
        const authorId = req.id;
        const posts = await PostModel.find({ author: authorId }).sort({ createdAt: -1 }).populate({
            path: 'author',
            select: 'username, profilePiC'
        }).populate({
            path: 'comments',
            sort: { createdAt: -1 },
            populate: {
                path: 'author',
                select: 'username, profilePic'
            }
        });
        return res.status(200).json({
            posts,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const likePost = async (req,res)=>{
  try {
   const likedUserId = req.id;
   const postId = req.params.id;
   const post = await PostModel.findById(postId)
   if(!post){
     return res.status(401).json({message:"Post not found", success:false})

   }

   await post.updateOne({ $addToSet :{likes:likedUserId}})
   await post.save();

   return res.status(200).json({
    message:"Post Liked",
    success: true
   })

  } catch (error) {
    console.log(error);
    
    
  }
}
export const dislikePost = async (req,res)=>{
  try {
   const likedUserId = req.id;
   const postId = req.params.id;
   const post = await PostModel.findById(postId)
   if(!post){
     return res.status(401).json({message:"Post not found", success:false})

   }

   await post.updateOne({ $pull :{likes:likedUserId}})
   await post.save();

   return res.status(200).json({
    message:"Post disliked",
    success: true
   })

  } catch (error) {
    console.log(error);
    
    
  }
}

export const addComment = async ()=>{
    try {
        const postId = req.params.id;
        const commentUserId = req.id;
        
        const {text} = req.body;
        const post = await PostModel.findById(postId);

        if(!text){
            return res.status(401).json({
                message:"Comment is require",
                success:false
            })
        }
        const comment = await CommentModel.create({
            text,
            author:commentUserId,
            post:postId,

        }).populate({
            path:'author',
            select:"username, profilePic"
        });
        post.comments.push(comment._id);
        await post.save();

        return res.status(201).json({
            message:"Comment added Successfully",
            comment,
            success:true
        })
        
    } catch (error) {
        console.log(error);
        
    }
}

export const getCommentsOfPost = async (req,res)=>{
    try {
        const postId = req.params.id;
        const comments = await CommentModel.find({post:postId}).populate('author','username','profilePic')
        if(!comments) {
            return res.status(404).json({
                message: "Comment not found for this post",
                success: false,
            })
        }
        
    } catch (error) {
        console.log(error);
        
    }
}
export const  deletePost = async (req,res)=>{
    try {
        const postid = req.params.id;
        const authorId = req.id;
        const post = await PostModel.findById(postid);
        if(!post){
            return res.status(401).json({
                message: "post not found ",
                success:false,
            })
        }

        //  delete post

        await PostModel.findByIdAndDelete(postid);

        // remove the post id from user

        let user = await UserModel.findById(authorId);
         user.posts = user.posts.filter(id => id.toString() !== postId);
        await user.save();

        // delete associated comments
        await CommentModel.deleteMany({post:postId});

        return res.status(200).json({
            success:true,
            message:'Post deleted'
        })
    } catch (error) {
        console.log(error);
        
    }
}
export const bookmarkPost = async (req,res)=>{
    try {
        const postId = req.params.id;
        const authorId = req.id;
        const post = await PostModel.findById(postId)
    if(!post){
        return res.status(401).json({
            message:"Post not found",
            success: false,
        })
    }
       
            const user = await UserModel.findById(authorId);
        if(user.bookmarks.includes(post._id)){
            // already bookmarked -> remove from the bookmark
            await user.updateOne({$pull:{bookmarks:post._id}});
            await user.save();
            return res.status(200).json({type:'unsaved', message:'Post removed from bookmark', success:true});

        }else{
            // bookmark krna pdega
            await user.updateOne({$addToSet:{bookmarks:post._id}});
            await user.save();
            return res.status(200).json({type:'saved', message:'Post bookmarked', success:true});
        }
    } catch (error) {
        console.log(error);
        
    }
} 