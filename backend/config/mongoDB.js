import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected Successfully");
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB Connection Error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB Disconnected");
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
