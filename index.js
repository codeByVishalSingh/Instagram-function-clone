import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from"dotenv";
import connectDB from "./src/utils/db.js";
import userRoute from "./src/routes/user.route.js"
import postRoute from "./src/routes/post.route.js"
import messageRoute from "./src/routes/message.route.js"

dotenv.config({})
const app = express();
const PORT = process.env.PORT || 8000

app.get("/",(req, res) =>{
    return   res.status(200).json({
        message: "Comming From Backend ",
        success:true
    })
})

app.use(express.json())
app.use(cookieParser())
app.use(urlencoded({extended:true}))

const corsOptions = {
    origin:'http://loacalhost:5173:',
    Credential:true,
}

app.use(cors(corsOptions))

// api 

app.use("/api/v1/user", userRoute)
app.use("/api/v1/post", postRoute)
app.use("/api/v1/message", messageRoute)

app.listen(PORT,()=>{
    
    connectDB();
    console.log(`Server is running on port ${PORT}`);
    
})

