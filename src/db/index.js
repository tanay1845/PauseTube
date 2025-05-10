import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`MongoDB Connected \nconnected at ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection Failed",error);
    }
}

export default connectDB;