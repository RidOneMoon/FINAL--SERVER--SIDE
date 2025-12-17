import dotenv from "dotenv";
import path from "path";


dotenv.config({
    path: path.join(process.cwd(), ".env")
});


const config = {
    port: process.env.PORT,
    mongodb_uri:process.env.MONGODB_URI,
    jwt_secret: process.env.JW_SECRET,
    db_name: "infrastructure-issues-system",
    env: process.env.NODE_ENV,
}

export default config;