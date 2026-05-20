import { UserModel } from "../models/user.model.js";
import bcrypt from"bcryptjs";
import jwt from"jsonwebtoken";
import cloudinary from "../utils/cloudniary.js";
import getDataUri from "../utils/daturi.js";
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

    // FIX 1
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        message: "Something is missing please check",
        success: false,
      });
    }

    // FIX 2
    let user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid User",
        success: false,
      });
    }

    // FIX 3
    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // optional sanitized user object
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      follower: user.follower,
      following: user.following,
      posts: user.posts,
    };

    // FIX 4
    const token = jwt.sign(
      { userid: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

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
        let user = await UserModel.findById(userid).select('-password');
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
        const userId = req.id; // Derived from your isAuthenticateUser middleware
        const { bio, gender } = req.body;
        console.log("DEBUG: Extracted User ID is ->", userId);
        
        // 1. Get the file from req.file (this is where Multer places it)
        const profilePic = req.file; 
        
        let cloudResponse;
        if (profilePic) {
            // Pass the Multer file object into your DataURI helper
            const fileurl = getDataUri(profilePic);
            cloudResponse = await cloudinary.uploader.upload(fileurl);
        }

        // 2. Add 'await' so you actually get the user document back from MongoDB
        const user = await UserModel.findById(userId).select('-password');
        
        if (!user) {
            // 3. Changed 'req.status' to 'res.status'
            return res.status(404).json({
                message: "User not Found",
                success: false,
            });
        }

        // 4. Update the fields if they were provided in the request
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (cloudResponse) user.profilePic = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: "User Profile Updated Successfully",
            success: true,
            user // Good practice to send the updated user object back
        });
                     
    } catch (error) {
        console.error("Error in editUserProfile:", error);
        return res.status(500).json({
            message: "Internal server error",
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