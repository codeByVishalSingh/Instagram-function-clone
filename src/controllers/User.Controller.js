import { UserModel } from "../models/user.model.js";
import bcrypt from"bcryptjs";
import jwt from"jsonwebtoken";
import cloudniary from "../utils/cloudniary.js";
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
      profilpic: user.profilpic,
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
export const editUserProfile = async (req,res)=>{
    try {
        const userId = req.id;
        const {bio, gender} = req.body;
        let cloudResponse;
        if(profilpic){
            const fileurl = getDataUri(profilpic)
            cloudResponse = await cloudniary.uploader.upload(fileurl)


        }
        const user = UserModel.findById(userId)
         if(!user){
            req.status(404).json({
                message: "User not Found",
                success:false,
            })
         }
         if(bio) user.bio = bio;
         if(gender) user.gender = gender;
         if(profilpic) user.profilpic = cloudResponse.secure_url;
         await user.save()

         return res.status(201).json({
            message:"User Profile Pic Udated Successfully",
            success:true,
         })
                      
    } catch (error) {
        console.log(error);
        
    }
}
export const getSuggestedUser = async ()=>{
    try {
        
        const sujggestedUsers = await UserModel.find({_id:{$ne:req.id}}).select("-password");
        if(!sujggestedUsers){
            return res.status(400).json({
                message:"Currently No Suggested User "
            })

        }

         return res.status(200).json({
                success:true,
                users:sujggestedUsers,
            })
    } catch (error) {
        console.log(error);
        
    }
}
export const followOrUnfollow =async ()=>{
  const followUser = req.id;
  const  userToFollow = req.params.id;

  if(followUser === userToFollow){
    return res.status(400).json({
        message:"User Can not follow or unfollow Yourself",
        success:false,
    })
  }

  const user = UserModel.findById(followUser);
  const target = UserModel.findById(userToFollow);
  if(!user || !target){
      return res.status(400).json({
        message:"Invaild User",
        success:false,
    })

  }
  const isFollowing = user.following.includes(userToFollow)
  if(isFollowing){
    await Promise.all([
        UserModel.updateOne({ _id: followUser}, {$pull: {following: userToFollow}}),
        UserModel.updateOne({ _id: userToFollow}, {$pull: {followers: followUser}}),
    ])
    return res.status(200).json({
        message:"User Unfollow Successsfully",
        success:true,
    })
  }
  else {
       await Promise.all([
        UserModel.updateOne({ _id: followUser}, {$push: {following: userToFollow}}),
        UserModel.updateOne({ _id: userToFollow}, {$push: {followers: followUser}}),
    ])
    return res.status(200).json({
        message:"User follow Successsfully",
        success:true,
    })
  }
}