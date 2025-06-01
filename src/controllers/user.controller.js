import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiErrors.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async(req,res)=>{
    // get user details
    // check the user already exists
    // if not create user
    // check for image and avtar image
    // upload images to clodinary
    // create entry in database
    // remove password and refresh token from response
    // check user created or not
    // return response

    const {username , email ,fullName ,password} = req.body
    console.log("email :",email,"Password :",password,"Full Name :",fullName,"Username",username)

    if([fullName,email,username,password].some((field) => (field?.trim() === ""))){
        throw new ApiError(400,"All fields are required")
    }

    const existingUser = User.findOne({
        $or: [{ email } , { username }]
    })

    if(existingUser){
        ApiError(409,"User already exists")
    }

    const avatarLocalPath =  req.files?.avatar[0].path;
    const coverImageLocalPath = req.files?.coverImage[0].path;

    if(!avatarLocalPath){
        ApiError(400,"Avtar field is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        ApiError(400,"Avatar image is required.")
    }

    const user = await User.create({
        avatar,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,"User registered Successfully")
    )

})

export {registerUser} 