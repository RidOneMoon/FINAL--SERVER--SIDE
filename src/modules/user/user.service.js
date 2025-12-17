import { ObjectId } from "mongodb";
import connectDb from "../../db/index.js";


// Create Staff
const createStaff = async(playload) => {

  const newStaff = {
    ...playload,
    isBlocked: false, 
    createdAt: new Date(),
    updatedAt: new Date(),
  }

    try {
        const db = await connectDb();
        
        const res = await db.collection("users").insertOne(newStaff);
        return res;

    } catch (error) {
        throw new Error("Db error while creating staff");
    }
}

// Get Stafs Users
const getStaffUsers = async () => {
  const filter = { role: "staff" }; 
  try {
    const db = await connectDb();
    const users = await db
      .collection("users")
      .find(filter)
      .toArray();

    return users;
  } catch (error) {
    throw new Error(`Error fetching staff users: ${error.message}`);
  }
};

// Get User By Id
const getUserById = async (id) => {
  try {
    const db = await connectDb();

    const userId = new ObjectId(id);
    const user = await db.collection("users").findOne({ _id: userId });

    return user;
  } catch (error) {
    console.error("Mongodb error occured during fetching user by id: ", error);
    throw new Error(
      `Mongodb error occured during fetching user by id: ${error}`
    );
  }
};

// Get User By Email
const getUserByEmail = async (email) => {
  try {
    const db = await connectDb();

    const user = await db.collection("users").findOne({ email });

    return user;
  } catch (error) {
    console.error("Mongodb error occured during fetching user: ", error);
    throw new Error(`Mongodb error occured during fetching user: ${error}`);
  }
};

// Get total users
const getTotalUsers = async (filter = {}) => {
  try {
    const db = await connectDb();

    const usersCount = await db.collection("users").countDocuments(filter);

    return usersCount;
  } catch (error) {
    console.error("Db error during fetching total users count: ", error);
    throw new Error(
      `Db error during fetching total users count: ${error.message || error}`
    );
  }
};

// Get All Users
const getUsers = async (page, limit, search, role, isBlocked, subscriptionStatus) => {
  try {
    const db = await connectDb();

    // --------------------------
    // Pagination
    // --------------------------
    const pageSize = Number(limit) > 0 ? Number(limit) : 10;
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const skip = (pageNumber - 1) * pageSize;

    // --------------------------
    // Build MongoDB Filter
    // --------------------------
    const filter = {};

    // Role filter
    if (role) {
      filter.role = role;
    }

    // Search filter (name, email, phone)
    if (search && search.trim() !== "") {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // isBlocked boolean filter
    if (isBlocked === "true") filter.isBlocked = true;
    if (isBlocked === "false") filter.isBlocked = false;

    // Subscription filter
    if (subscriptionStatus === "premium") {
      filter.subscriptionStatus = "premium";
    } else if (subscriptionStatus === "free") {
      filter.subscriptionStatus = "free";
    }

    // --------------------------
    // Fetch Users
    // --------------------------
    const users = await db
      .collection("users")
      .find(filter)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }) 
      .toArray();

    // --------------------------
    // Get Total Count
    // --------------------------
    const total = await db.collection("users").countDocuments(filter);

    return {
      users,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };

  } catch (error) {
    console.error("❌ MongoDB error occurred while fetching users:", error);
    throw new Error("Database error during fetching users");
  }
};


// Update User
const updateUserProfile = async (payload) => {
  const { name, photoUrl, userId, address, phone, subscriptionStatus } = payload;

  const updatedObj = {
  };

  if(name){
    updatedObj.name = name;
  }

  if(photoUrl){
    updatedObj.photoUrl = photoUrl;
  }

  if(subscriptionStatus){
    updatedObj.subscriptionStatus = subscriptionStatus;
  }

  if(phone){
    updatedObj.phone = phone;
  }

  if(address){
    updatedObj.address = address
  }

  const options = {
    upsert: true,
    returnDocument: "after",
  };

  try {
    const db = await connectDb();

    const updatedUser = await db
      .collection("users")
      .findOneAndUpdate({ _id: new ObjectId(userId) }, {
        $set: {...updatedObj}
      }, options);

    return updatedUser;
  } catch (error) {
    throw new Error(`Mongodb error while updating user: ${error}`);
  }
};

// Update Use By Admin
const updateUserByAdmin = async (updatePlayload) => {

  const {isBlocked, userId, name, email, photoUrl, phone} = updatePlayload;

  const updatedObj = {};


  if(name){
    updatedObj.name = name;
  }

  if(photoUrl){
    updatedObj.photoUrl = photoUrl;
  }

  if(phone){
    updatedObj.phone = phone;
  }

  if(email){
    updatedObj.email = email;
  }

  if (isBlocked !== undefined) {
    updatedObj.isBlocked = isBlocked;
  }

  if (Object.keys(updatedObj).length === 0) {
    return null;
  }

  const updateInstructure = {
    $set: updatedObj,
  };

  const options = {
    upsert: true,
    returnDocument: "after",
  };

  try {
    const db = await connectDb();

    const updatedUser = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        updateInstructure,
        options
      );

    return updatedUser;
  } catch (error) {
    throw new Error(`Error occured while updating user by admin: ${error}`);
  }
};


// Delete Staff
const deleteUser = async(userId) => {
  try {
    const db = await connectDb();
    const res = await db.collection("users").deleteOne({_id: new ObjectId(userId)});

    return res;
  } catch (error) {
    throw new Error("Db error while deleting user ")
  }
}

const UserService = {
  getUserByEmail,
  getUsers,
  getUserById,
  updateUserProfile,
  updateUserByAdmin,
  getTotalUsers,
  getStaffUsers,
  createStaff,
  deleteUser
};

export default UserService;
