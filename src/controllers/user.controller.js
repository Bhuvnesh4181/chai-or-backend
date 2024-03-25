import { asyncHandler } from "../utils/asyncHandler.js";
const resigerUser =asyncHandler(async (req,res)=>{
   res.status(200).json({
      message:"bhuvesh is my friend!!"
   })
})

export {resigerUser};