import jwt from "jsonwebtoken";
import config from "../config/index.js";

const authentication = async (req, res, next) => {
  try {

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Token missing or invalid",
      });
    }

    const decoded = jwt.verify(token, config.jwt_secret);


    if (!decoded) {
      return res.status(401).json({
        message: "Unauthenticate: Invalid token or expired",
      });
    }

    req.user = decoded.user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthenticated: Invalid or expired token",
    });
  }
};

const authorization = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userRole = req?.user.role;

      // console.log("user role from authorization ", userRole);

      if (!userRole) {
        return res.status(403).json({
          message: "Forbidden: No role found",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "Forbidden: You are not allowed",
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        message: "Forbidden: You are not allowed",
      });
    }
  };
};

const authenticationMiddlewares = {
  authentication,
  authorization,
};

export default authenticationMiddlewares;
