import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_SECRET_KEY
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath)  return null
        // upload the file on cloudinary

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto',
        });
        // file has been uploded successfully
        console.log("File is uploded on clodinary",response.url);
        return response;
    } catch (error) {
        fs.unlink(localFilePath)
        // removes the locally saved temporary file as the upload operation get failed
        return null 
    }
}

export { uploadOnCloudinary }
