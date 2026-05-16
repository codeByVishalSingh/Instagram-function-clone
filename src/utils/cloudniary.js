import {v1 as cloudniary} from "cloudinary";
import dotenv from "dotenv";
dotenv.config({});


cloudniary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET,
});

export default cloudniary;