import { redisClient } from "./redis.db.js";


export const setValue = async ({key,value,ttl})=>{
    try {
        const data = typeof value=="string"? value:JSON.stringify(value)
        return ttl ? await redisClient.set(key,data,{EX: ttl}) : await redisClient.set(key,data)
    } catch (error) {
        console.log(error,"Failed to set operation");
        
    }

}

export const updateValue = async ({key,value,ttl})=>{
    try {
        return  await setValue({key,value,ttl})
    } catch (error) {
        console.log(error,"Failed to update operation");
        
    }

}

export const get = async ({key,value,ttl})=>{
    try {
        return  await redisClient.get(key)
    } catch (error) {
        console.log(error,"Failed to get operation");
        
    }

}

export const ttl = async (key)=>{
    try {
        return  await redisClient.ttl(key)
    } catch (error) {
        console.log(error,"Failed to get TTL operation");
        
    }

}


export const exists = async (key)=>{
    try {
        return  await redisClient.exists(key)
    } catch (error) {
        console.log(error,"Failed to get exists operation");
        
    }

}

export const expire = async ({key,ttl})=>{
    try {
        return  await redisClient.ttl({key,ttl})
    } catch (error) {
        console.log(error,"Failed to get expire operation");
        
    }

}

export const deleteKey = async (key)=>{
    try {
        return  await redisClient.del(key)
    } catch (error) {
        console.log(error,"Failed to get delete operation");
        
    }

}