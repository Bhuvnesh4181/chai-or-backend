import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js";
const generateAccessAndRefreshAccessToken = async(userId)=>{
   try {
      const user =await User.findById(userId);
      const accessToken=user.generateAccessToken();
      const refreshToken=user.generateRefreshToken();
      user.refreshToken=refreshToken;
      await user.save({validateBeforeSave:false});
      return {accessToken , refreshToken};
   } catch (err) {
      throw new ApiError(500,"something went wrong while generating token")
   }
};
const resigerUser = asyncHandler(async(req,res)=>{
 //get user details from fontend
 //validation-not empty
 //check if the user exist , username and emails
 //check for avatar and images
 //upload to the cloundinary and check avatar
 //create user object and create enter in db
 //remove password and refresh token field in res
 //check user creation 
 //return res
 
   const {fullName,email,username,password}=req.body;
   console.log("email: ",email);
   
   if ([fullName,username,email,password].some((field)=>field?.trim()==="")) 
   {
    throw new ApiError(400,"All fields are required")  
   } 
   const exitedUser= await User.findOne({
      $or:[{username},{email}]
   })
   if (exitedUser) {
      throw new ApiError(409,"User alread exists")
   }
   const avatarLocalPath=req.files?.avatar[0]?.path
   //const coverImageLocalPath=req.files?.coverImage[0]?.path
   let coverImageLocalPath;
   if (req.files&&Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0) {
      coverImageLocalPath=req.files.coverImage[0].path
   }

   if (!avatarLocalPath) {
      throw new ApiError(400,"Avatar field is required");
   }
   const avatar= await uploadOnCloudinary(avatarLocalPath);
   const coverImage =await uploadOnCloudinary(coverImageLocalPath);
   if (!avatar) {
      throw new ApiError(400,"Avatar field is required");
   }
   const user =await User.create({
      fullName,
      avatar:avatar.url,
      coverImage:coverImage?.url || "",
      email,
      password,
      username:username.toLowerCase()
})
  const createdUser = await User.findById(user._id).select(
   "-password -refreshToken"
  )
  if (!createdUser) {
   throw new ApiError(500,"Something went wrong while resistering user")
  }
  res.status(201).json(
   new ApiResponse(200,createdUser,"User resistered successfully")
  )
});
const loginUser= asyncHandler(async(req,res)=>{
  const {email,password,username}=req.body;
  if (!(email||username)) {
   throw new ApiError(400,"username or email is required");
  }
  const user= await User.findOne({
   $or:[{email},{username}]
  });
  if (!user) {
    throw new ApiError(404,"User does not exist");
  }
  const isPasswordVaild=await user.isPasswordCorrect(password);

  if(!isPasswordVaild) throw new ApiError(401,"Password is Invalid");
  const {accessToken,refreshToken}=await generateAccessAndRefreshAccessToken(user._id);

 const loggedInUser = await User.findById(user._id).select(
   "-password -refreshToken"
  )
  const options={
   httpOnly:true,
   secure:true
  }
  return res
  .status(200,)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,
   {
     user:loggedInUser,accessToken,refreshToken
   },
   "User successfully logged In"
  )
 );
});
const loggoutUser=asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            refreshToken:undefined
         }
      },
      {
         new:true
      }
   );
   const options={
      httpOnly:true,
      secure:true
   }
   return res
   .status(200)
   .clearCookie("accessToken")
   .clearCookie("refreshToken")
   .json(new ApiResponse(200,{},"User logged out"));
});
export { 
   resigerUser,
   loginUser,
   loggoutUser
};