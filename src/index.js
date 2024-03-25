import connectDB from "./db/index.js";
import dotenv from "dotenv";
import {app} from './app.js'
dotenv.config({
 path:'./env'
});

connectDB()
.then(()=>{
    app.listen( process.env.PORT ||8000,()=>{
        console.log(`sever is running at this port ${process.env.PORT}`)
    })
})
.catch((e)=>{
  console.log(`mongoDB server connection failed : ${e}`);
});