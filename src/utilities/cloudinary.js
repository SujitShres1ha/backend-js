import {v2 as cloudinary} from 'cloudinary'
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET
})

const uploadToCloud = async (localPath) => {
    try{
        if (!localPath) return null
        const response = await cloudinary.uploader.upload(localPath,{
            resource_type: "auto"
        })
        //File uploaded successfully
        console.log("File uploaded to Cloudinary,response")
        return response
    }
    catch(error){
        fs.unlinkSync(localPath)
        //remove the local file as upload failed
        return null
    }
}