import sharp from "sharp";
import cloudinary from "../utils/cloudniary.js"; 
import { PostModel } from "../models/post.model.js";
import { UserModel } from "../models/user.model.js";
import { CommentModel } from "../models/comment.model.js";
import { getReciverSocketId, io } from "../Socket/socket.js";

export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.id;

        // 1. Validate if an image was uploaded
        if (!image) {
            return res.status(400).json({ 
                message: "Image is required", 
                success: false 
            });
        }
        
        // 2. Process image buffer with Sharp
        // FIXED: Passed image.buffer and corrected 'fit' property
        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 800, fit: 'inside' })
            .toFormat("jpeg", { quality: 80 })
            .toBuffer();
        
        // 3. Convert buffer to Data URI for Cloudinary
        // FIXED: Corrected syntax to data:image/jpeg;base64,
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        
        // 4. Upload to Cloudinary
        const cloudResponse = await cloudinary.uploader.upload(fileUri);

        // 5. Create the post in database
        const post = await PostModel.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId
        });

        // 6. Push post reference to the author's user document
        const user = await UserModel.findById(authorId);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }

        // 7. Populate author info (excluding password) before returning
        await post.populate({ path: 'author', select: '-password' });

        return res.status(201).json({
            message: "New Post Added Successfully",
            post,
            success: true,
        });

    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
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

   const  user = await UserModel.findById(likedUserId).select('username profilePic');
   const postOwnerId = post.author.toString();
   if(postOwnerId !== likedUserId){

    const notification = {
        type:'like',
        userId:likedUserId,
        userDetails:user,
        postId,
        meassage:'Your Post was Liked'
    }
    const postOwnerSocketId = getReciverSocketId(postOwnerId);
    io.to(postOwnerSocketId).emit('notification',notification)
   }

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
    const  user = await UserModel.findById(likedUserId).select('username profilePic');
   const postOwnerId = post.author.toString();
   if(postOwnerId !== likedUserId){

    const notification = {
        type:'dislike',
        userId:likedUserId,
        userDeatails:user,
        postId,
        meassage:'Your Post was disliked'
    }
    const postOwnerSocketId = getReciverSocketId(postOwnerId);
    io.to(postOwnerSocketId).emit('notification',notification)
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

export const addComment = async (req,res)=>{
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

        })

        await comment.populate({
            path:'author',
            select:"username  profilePic"
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
export const deletePost = async (req, res) => {
    try {
        // 🔑 FIXED: Changed 'postid' to 'postId' to match the rest of the function
        const postId = req.params.id; 
        const authorId = req.id;
        
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ // Changed status to 404 (Not Found) instead of 401 (Unauthorized)
                message: "Post not found",
                success: false,
            });
        }

        // Delete post
        await PostModel.findByIdAndDelete(postId);

        // Remove the post id from user
        let user = await UserModel.findById(authorId);
        if (user) {
            // 🔑 This will now execute perfectly without crashing!
            user.posts = user.posts.filter(id => id.toString() !== postId);
            await user.save();
        }

        // Delete associated comments
        await CommentModel.deleteMany({ post: postId });

        return res.status(200).json({
            success: true,
            message: 'Post deleted'
        });
    } catch (error) {
        console.error("Delete Post Error Stack:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
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