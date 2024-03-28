import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
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
const refreshAccessToken = asyncHandler(async(req,res)=>{
   const incomingToken =req.cookie.refreshToken ||req.body.refreshToken;
   if (!incomingToken) {
      throw new ApiError(401,"Unauthorized request");
   }
  try {
    const decodedToken=jwt.verify(incomingToken,process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
       throw new ApiError(401,"Invalid refresh token")
    }
    if (incomingToken !==user?.refreshToken){
       throw new ApiError(401,"Refresh token is expired")
    }
    const options={
      httpOnly:true,
      secure:true
    }
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshAccessToken
    (user._id);
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
       new ApiResponse(200,
        {accessToken,refreshToken:newRefreshToken},
        "access token successfull refreshed"
       )
    );
  } catch (error) {
   throw new ApiError(error?.message ||"invalid refresh token");
  }
});
const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body;
  
  const user=await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
   throw new ApiError(401,"Invalid old password")
  }
  user.password=newPassword;
  await user.save(validateBeforeSave);

  return res
  .status(200).json(new ApiResponse(200,{},"Password successfull change"));
});
const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(new ApiResponse(200,req.user,"successfull fetch current user"));
});
const updateAccountDetails = asyncHandler(async(req,res)=>{
   const {email,fullName} =req.user
   if (!(email||fullName)) {
      throw new ApiError(401,"All fields are required");
   }
  const user= await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
         email,fullName
      }
    },
    {
      new:true
    }
   ).select("-password");
   return res.status(200).json(new ApiResponse(200,user,"Update successfully"));
});
const updateUserAvatar =asyncHandler(async(req,res)=>{

  const avatarLocalPath=req.file?.path;

  if (avatarLocalPath){
    throw new ApiError(400,"avatar file is missing");
  }

  const avatar =await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
   throw new ApiError(400,"error while uploading avatar ");
  }
  const user=await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
         avatar:avatar.url
      }
    },{
      new:true
    }
   ).select("-password ");
  return res
        .status(200)
        .json(new ApiResponse(200,user,"avatar successfully updates"));

});
const updateUserCoverImage =asyncHandler(async(req,res)=>{

 const coverImageLocalPath=req.file.user?.path;

 if (!coverImageLocalPath.url) {
   throw new ApiError(400,"coverimage not found");
 }
 const coverImage =await uploadOnCloudinary(coverImageLocalPath);
 if (!coverImage) {
   throw new ApiError(400,"error while uploading coverimage");
 }
 const user = await User.findByIdAndUpdate(req.user?._id,
   {
     $set:{
      coverImage:coverImage.url
     }
   },{
      new:true
   }
   ).select("-password");
   return res
   .status(200)
   .json(new ApiResponse(200,user,"successfully uploaded coverimage"));
});
export { 
   resigerUser,
   loginUser,
   loggoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage
};