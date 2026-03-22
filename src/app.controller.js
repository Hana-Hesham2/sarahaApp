import { PORT } from "../config/config.service.js"
import express from "express"
import { checkConnetionDB } from "./DB/models/connectionDB.js"
import userRouter from "./modules/users/user.controller.js"
import userModel from "./DB/models/user.model.js"
import cors from "cors"
import { redisConnection } from "./DB/redis/redis.db.js"
const app=express()
const port=PORT

const bootstrap=()=>{
    
    app.use(cors({origin:"*"}))
    
    app.use(express.json())

    app.get("/",(req,res,next)=>{
        res.status(200).json({message:"Welcome on saraha app"})
    })

    checkConnetionDB()
    redisConnection()
   
    app.use("/uploads",express.static("uploads"))
    app.use("/users",userRouter)

    app.use("{/*demo}",(req,res,next)=>{
         throw(new Error(`404 URL ${req.originalUrl} Not Found`,{cause:404}))
    })
    
    
    app .use((err,req,res,next)=>{
        res.status(err.cause || 500).json({message:err.message, stack: err.stack})
        
    })

    app.listen(port,()=>{
        console.log(`Server is running on port ${port}`);
        
    })
}

export default bootstrap
