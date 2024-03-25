import e from "express";
import {asynchandler} from "../utils/asynchandler.js";
const resigerUser =asynchandler(async (res,req)=>{
   res.status(200).json({
    message:"ok"
   })
});

export {resigerUser};