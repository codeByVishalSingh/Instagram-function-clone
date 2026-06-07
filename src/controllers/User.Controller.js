import { UserModel } from "../models/user.model.js";
import bcrypt from"bcryptjs";
import jwt from"jsonwebtoken";
import cloudinary from "../utils/cloudniary.js";
import getDataUri from "../utils/daturi.js";
import { PostModel } from "../models/post.model.js";


export const RegisterContoller = async (req,res)=>{
    try {
        const {username, email,password} = req.body;
       
        if(!username|| !email || !password){
       return res.status(401).json({
            message:"Somthing is Missing please check",
            success:false,
        })
    }
        const user = await UserModel.findOne({email})
        if(user){
            return res.status(401).json({
                message:"Try to Diffrent email",
                success:false,
            })
        }
        const hashedPassowrd = await bcrypt.hash(password, 10);

        await UserModel.create({
            username,
            email,
            password:hashedPassowrd,
        })
        return res.status(201).json({
            message:"Account Create Succesfully",
            success:true,
        })

    } catch (error) {
        console.log(error);
        
    }
}
export const LoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        message: "Something is missing please check",
        success: false,
      });
    }

    let user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid User",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    const token = jwt.sign(
      { userid: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // FIX: Safely resolve posts and filter out missing ones
    const postPromises = user.posts.map(async (postId) => {
      const post = await PostModel.findById(postId);
      // Check if post exists AND if it belongs to the user before accessing .author
      if (post && post.author.equals(user._id)) {
        return post;
      }
      return null;
    });

    const populatedPosts = (await Promise.all(postPromises)).filter(post => post !== null);

    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      follower: user.follower,
      following: user.following,
      posts: populatedPosts,
    };

    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: `Welcome back ${user.username}`,
        success: true,
        user: userData,
      });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};
export const logoutController = async (req,res)=>{
    try {
        
        return res.cookie("token"," ", {maxAge:0}).json({
            message:" User Logout Successfully",
            success:true,
        })
    } catch (error) {
        console.log(error);
        
    }
}

export const getUserProfile = async (req,res)=>{
    try {
        const userid = req.params.id;
        let user = await UserModel.findById(userid).populate({path:"posts",createdAt:-1}).populate('bookmarks')
        res.status(201).json({
            user,
            success:true,
        })
        
    } catch (error) {
        console.log(error);
        
    }
}


export const editUserProfile = async (req, res) => {
    try {
        const userId = req.id; 
        const { bio, gender } = req.body; // Frontend se aane wali values
        const profilePic = req.file; // Multer se aayi hui file
        
        // 1. User find karein
        const user = await UserModel.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: "User not Found",
                success: false,
            });
        }

        // 2. Profile Photo Upload Logic
        if (profilePic) {
            const fileurl = getDataUri(profilePic);
            const cloudResponse = await cloudinary.uploader.upload(fileurl);
            user.profilePic = cloudResponse.secure_url;
        }

        // 3. Bio & Gender Update Logic (Conditional)
        if (bio !== undefined) user.bio = bio;
        
        // Sirf tabhi update karein agar gender ki value valid ho aur enum se match karti ho
        if (gender && (gender === "male" || gender === "female")) {
            user.gender = gender.toLowerCase();
        }

        // 4. Save
        await user.save();

        return res.status(200).json({
            message: "User Profile Updated Successfully",
            success: true,
            user // Updated user object return karein
        });
                     
    } catch (error) {
        console.error("Error in editUserProfile:", error);
        return res.status(500).json({
            message: "Internal server error: " + error.message, // Error detail dekhne ke liye
            success: false
        });
    }
}


export const getSuggestedUser = async (req, res) => {
    try {
        
        const suggestedUsers = await UserModel.find({ _id: { $ne: req.id } }).select("-password");
        
       
        if (!suggestedUsers || suggestedUsers.length === 0) {
            return res.status(400).json({
                message: "Currently No Suggested Users",
                success: false
            });
        }

     
        return res.status(200).json({
            success: true,
            users: suggestedUsers,
        });

    } catch (error) {
        console.log("Error in getSuggestedUser:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
// 1. CRITICAL FIX: Added (req, res) parameters to the function
export const followOrUnfollow = async (req, res) => {
  try {
    const followUser = req.id; // The logged-in user (from your auth middleware)
    const userToFollow = req.params.id; // The ID of the user to follow/unfollow

    // Prevent a user from following themselves
    if (followUser === userToFollow) {
      return res.status(400).json({
        message: "You cannot follow or unfollow yourself",
        success: false,
      });
    }

    // 2. CRITICAL FIX: Added 'await' to both database fetches
    const user = await UserModel.findById(followUser);
    const target = await UserModel.findById(userToFollow);

    if (!user || !target) {
      return res.status(404).json({
        message: "Invalid User or user not found",
        success: false,
      });
    }

    // Check if the current user is already following the target user
    const isFollowing = user.following.includes(userToFollow);

    if (isFollowing) {
      // UNFOLLOW LOGIC: Pull the IDs out of the respective arrays
      await Promise.all([
        UserModel.updateOne({ _id: followUser }, { $pull: { following: userToFollow } }),
        UserModel.updateOne({ _id: userToFollow }, { $pull: { followers: followUser } }),
      ]);
      
      return res.status(200).json({
        message: "User Unfollowed Successfully",
        success: true,
      });
    } else {
      // FOLLOW LOGIC: Push the IDs into the respective arrays
      await Promise.all([
        UserModel.updateOne({ _id: followUser }, { $push: { following: userToFollow } }),
        UserModel.updateOne({ _id: userToFollow }, { $push: { followers: followUser } }),
      ]);

      return res.status(200).json({
        message: "User Followed Successfully",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error in followOrUnfollow:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};