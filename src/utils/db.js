import mongoose from "mongoose";
import { configDotenv } from "dotenv";


const connectDB = async ()=>{
    try {
          await mongoose.connect(process.env.MONGO_URI)
          console.log("Database is Connecting Successfully");
          
    } catch (error) {
        console.log(error);
        
    }
}
export default  connectDB;