import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiErrors.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false })

        return ({ accessToken, refreshToken })
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details
    // check the user already exists
    // if not create user
    // check for image and avtar image
    // upload images to clodinary
    // create entry in database
    // remove password and refresh token from response
    // check user created or not
    // return response

    const { username, email, fullName, password } = req.body
    // console.log("email :",email,"Password :",password,"Full Name :",fullName,"Username",username)

    if ([fullName, email, username, password].some((field) => (field?.trim() === ""))) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0].path;
    // const coverImageLocalPath =  req.files?.coverImage[0].path;

    // console.log(avatarLocalPath)

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avtar field is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // console.log(avatar,coverImage)

    if (!avatar) {
        throw new ApiError(400, "Avatar image is required.")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, "User registered Successfully")
    )

})


const loginUser = asyncHandler(async (req, res) => {
    // take user data using req.body
    // checking the user
    // find user
    // check for password
    // refresh and access token
    // send in cookies

    const { email, username, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "email or username is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }
    // console.log(user.email)
    // console.log(password)
    const passwordValidation = await user.isPasswordCorrect(password);
    // console.log(password)

    if (!passwordValidation) {
        throw new ApiError(401, "Invalid username or password!")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(201)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User loggedin successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "User logged out"))

})


const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(400,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError("Refresh token is expiered or used");
        }
    
        const option ={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken,option)
        .cookie("refreshToken",newrefreshToken,option)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access token is refreshed(new access token is generated successfully)"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

})


export { registerUser, loginUser, logoutUser, refreshAccessToken } 