import mongoose, { Types } from "mongoose";

const userScehma = new mongoose.Schema({
    username:{
         Type:String, required:true, unique:true   
    },
      email:{
         Type:String, required:true, unique:true   
    },
        password:{
         Type:String, required:true,  
    },
      profilePic:{
         Type:String, default:'',  
    },
        bio:{
         Type:String, default:'',   
    },
      gender:{
         Type:String, enum:['male', 'female'],   
    },
    followers:[{Type:mongoose.Schema.Types.ObjectId, ref:"User"}],
    following:[{Type:mongoose.Schema.Types.ObjectId, ref:"User"}],
    posts:[{Type:mongoose.Schema.Types.ObjectId,ref:"Post"}],
    bookmarks:[{Type:mongoose.Schema.Types.ObjectId,ref:"Post"}]
  
}, {timestamps:true});

export const User = mongoose.Model('User',userScehma)