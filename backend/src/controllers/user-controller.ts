import { Request, Response, NextFunction } from "express";
import User from "../models/User.js"
import {compare, hash} from "bcrypt";
import { createToken } from "../utils/token-manager.js";
import { COOKIE_NAME } from "../utils/constants.js";

export const getAllUser = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try {
        const users = await User.find();
        return res.status(200).json({ message:"OK", users});
    } catch (error: any) {
        console.log(error);
        return res.status(400).json({ message:"ERROR", cause:error.message});
    }
}

export const userSignup = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({email:email});
        if(existingUser) {
            return res.status(401).send("User already exists.");
        }
        const hashedPassword = await hash(password, 10);
        const user = new User({name:name, email:email, password: hashedPassword});
        await user.save();

        // COOKIE AND TOKEN HANDLING
        res.clearCookie(COOKIE_NAME, {
            path: "/",
            domain:"localhost",
            httpOnly:true,
            signed:true,
        });

        const token = createToken(user._id.toString(), user.email, "7d");
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        res.cookie(COOKIE_NAME, token, {
            path: "/",
            domain:"localhost",
            expires,
            httpOnly:true,
            signed:true,
        });
        
        return res.status(201).json({message:"OK", name:user.name, email:user.email});
    } catch (error: any) {
        console.log(error);
        return res.status(400).json({ message:"ERROR", cause:error.message});
    }
}

export const userLogin = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({email:email});
        if(!user) {
            return res.status(401).send("User does not exists.");
        }
        const doPasswordMatch = await compare(password, user.password);
        if(!doPasswordMatch) {
            return res.status(403).send("Incorrect Password");
        }

        // COOKIE AND TOKEN HANDLING
        res.clearCookie(COOKIE_NAME, {
            path: "/",
            domain:"localhost",
            httpOnly:true,
            signed:true,
        });

        const token = createToken(user._id.toString(), user.email, "7d");
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        res.cookie(COOKIE_NAME, token, {
            path: "/",
            domain:"localhost",
            expires,
            httpOnly:true,
            signed:true,
        });

        return res.status(201).json({message:"OK", name:user.name, email:user.email});
    } catch (error: any) {
        console.log(error);
        return res.status(400).json({ message:"ERROR", cause:error.message});
    }
}

export const verifyUser = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try {
        const user = await User.findById(res.locals.jwtData.id);
        if(!user) {
            return res.status(401).send("User does not exist or token malfunctioned.");
        }
        if(user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match.");
        }

        return res.status(201).json({message:"OK", name:user.name, email:user.email});
    } catch (error: any) {
        console.log(error);
        return res.status(400).json({ message:"ERROR", cause:error.message});
    }
}