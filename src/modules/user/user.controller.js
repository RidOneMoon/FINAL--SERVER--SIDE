import IssueService from "../issue/service/issue.service.js";
import UserService from "./user.service.js";
import jwtSign from "../../jwt/index.js";



// Get users role staff
const getStaffUsers = async (req, res) => {
  
  const currentUser = req?.user;
  const userRole = currentUser.role;

  if(userRole !== 'admin'){
    return res.status(403).json({
      message:"Forbidden: You are not allowed"
    })
  }

  try {
    const users = await UserService.getStaffUsers();

    return res.status(200).json({
      users,
      message: "Staff users fetched successfully."
    });
  } catch (error) {
    console.error("Error fetching staff users:", error.message);
    return res.status(500).json({
      message: "Internal server error while fetching staff users.",
    });
  }
};


// Create Staff
const createStaff = async(req, res) => {
  const body = req.body;
  const bodyKeys = Object.keys(body);

  if(bodyKeys.some((key) => body[key] === undefined || body[key].length)){
    return res.status(400).json({
      message:"Create staff required all fields must have a valid value"
    })
  }
  
  const email = body.email;

  try {

    const userExists = await UserService.getUserByEmail(email);

    if(userExists){
      return res.status(400).json({
        message:"User already exists"
      })
    }

    const newStaff = await UserService.createStaff(body);

    return res.status(201).json({
      newStaff,
      message:"Staff created successfully"
    })
    
  } catch (error) {
    return res.status(500).json({
      message:"Internal server error"
    })
  }
}


// Get Citizen Issues Counts
const getIssuesCountStatus = async(req, res) => {
  const currentUser = req?.user;
  const userId = currentUser.userId;

  try {

    const filter = {
      reporterId: userId
    }
    
    const issues = await IssueService.getIssuesStatus(filter);

    return res.status(200).json({
      issues: issues || [],
      message:"Issues fetched successfully"
    })

  } catch (error) {
    console.error("get issues status count error ", error);
    return res.status(500).json({
      message:"Internal server error"
    })
  }
}

// Get Current User
const getCurrentUser = async (req, res) => {
  const user = req?.user;

  try {

    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    const userId = user.userId;

    const userData = await UserService.getUserById(userId);

    return res.status(200).json({
      user: userData,
      message: "User fetched successfully.",
    });
  } catch (error) {
    console.error("Error occured during fetching current user: ", error);
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

// Get Users
const getUsers = async (req, res) => {

  try {
    const { page = 1, limit = 10, role, isBlocked, subscriptionStatus, search = "" } = req.query;

    // Current logged-in user's info
    const currentUser = req?.user;
    const userId = currentUser?.userId;
    const userRole = currentUser?.role;

    const roleFilter = role || (userRole !== "admin" ? userRole : null);

    // Fetch users with filters
    const result = await UserService.getUsers(
      page,
      limit,
      search,
      roleFilter,
      isBlocked,
      subscriptionStatus
    );

    const { users, pagination } = result;

    return res.status(200).json({
      data: {
        users,
        pagination,
      },
      message: "Users fetched successfully.",
    });

  } catch (error) {
    console.error("❌ Error occurred while fetching users:", error);
    return res.status(500).json({
      message: "An internal server error occurred.",
    });
  }
};


// Get Users
const getUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      message: "Invalid user id or missing.",
    });
  }

  try {
    const user = await UserService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { password, ...userData } = user;

    return res.status(200).json({
      user: userData,
      message: "User fetched successfully.",
    });
  } catch (error) {
    console.error("Error occured during fetching user by Id: ", error);
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};


// Get Users
const getUserByEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  try {
    const user = await UserService.getUserByEmail(email);


    const newUser = {
      userId: user._id,
      email,
      role: user.role,
    };

    const token = jwtSign({ user: newUser });

    return res.status(200).json({
      user,
      message: "User fetched successfully",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Update user profile
const updateProfile = async (req, res) => {
  const body = req.body;
  const userKeys = Object.keys(body);
  const userId = req?.user.userId; 

  if (userKeys.some((key) => body[key] === undefined)) {
    return res.status(400).json({
      message: "At least name or photoUrl must be provided for update.",
    });
  }

  try {
    const updatedUser = await UserService.updateUserProfile({...body, userId});

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "User not found or update failed." });
    }

    return res.status(200).json({
      user: updatedUser,
      message: "User profile updated successfully.",
    });
  } catch (error) {
    console.error(`Error updating user profile: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during profile update.",
    });
  }
};


// Update User by Admin
const updateUserByAdmin = async (req, res) => {
  const body = req.body; 

  if (!body.userId) {
    return res
      .status(400)
      .json({ message: "User ID is required for admin update." });
  }

  try {
    // Service handles the logic for converting strings ('blocked', 'subscribe') to booleans
    const updatedUser = await UserService.updateUserByAdmin(body);

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "User not found or update failed." });
    }

    // Remove sensitive data before sending
    const { password, ...userData } = updatedUser;

    return res.status(200).json({
      user: userData,
      message: "User updated by admin successfully.",
    });
  } catch (error) {
    console.error(`Error updating user by admin: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred during admin update.",
    });
  }
};


// Add Staff
const addStaff = async (req, res) => {
  const body = req.body;

  if(Object.keys(body).some((key) => body[key] === undefined || body[key].length === 0)){
    return res.status(400).json({
      message: "Create stff required all fields must have a valid value"
    })
  }

  const {email} = body;

  try {
    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    // Explicitly set role to 'staff'
    const result = await UserService.createStaff({
      ...body,
      role: "staff",
    });

    const newStaff = {
      userId: result.insertedId,
      email,
      role: "staff",
    };

    return res.status(201).json({
      message: "New staff member added successfully.",
      user: newStaff,
    });
  } catch (error) {
    console.error(`Add staff error: ${error}`);
    return res.status(500).json({
      message: "An internal server error occurred while adding staff.",
    });
  }
};


// Delete User
const deleteUser = async(req, res) => {

  const {userId} = req.params;

  if(!userId){
    return res.status(400).json({
      message: "User Id required"
    });
  }

  try {
    const isUserEists = await UserService.getUserById(userId);

    if(!isUserEists){
      return res.status(404).json({
        message:"User not found"
      })
    }

    const result = await UserService.deleteUser(userId);

    return res.status(200).json({
      message:"User deleted successfully"
    });

  } catch (error) {
    console.error("Deleting user error", error);
  }
}


const UserController = {
  getUsers,
  getUser,
  updateProfile,
  getCurrentUser,
  updateUserByAdmin,
  addStaff,
  getUserByEmail,
  getIssuesCountStatus,
  getStaffUsers,
  createStaff,
  deleteUser
};

export default UserController;
