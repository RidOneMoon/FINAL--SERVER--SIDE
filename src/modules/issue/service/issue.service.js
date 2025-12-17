import { ObjectId } from "mongodb";
import connectDb from "../../../db/index.js";


// Get Issues for Dashboard
const getIssuesStatus = async(filter) => {

  try {

    const db = await connectDb();
    const issues = await db.collection("issues").find(filter).toArray();
    return issues;
    
  } catch (error) {
    throw new Error("Database error during fatching issues status ");
  }
}

// Get Signle Issue
const getSingleIssue = async (issueId) => {
  try {
    const db = await connectDb();
    const issueObjectId = new ObjectId(issueId);

    const issue = await db.collection("issues").findOne({
      _id: issueObjectId,
    });

    return issue;
  } catch (error) {
    throw new Error(`Error fetching single issue: ${error.message}`);
  }
};

// Get Issues
const getIssues = async (filter, skip, limit) => {
  try {
    const db = await connectDb();

    const issues = await db
      .collection("issues")
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ isBoosted: -1, createdAt: -1 }) 
      .toArray();

    return issues;
  } catch (error) {
    throw new Error(`Error fetching issues: ${error.message}`);
  }
};

// Get Issues Count
const getTotalIssues = async (userId) => {

  const filter = {};

  if(userId){
    if(!ObjectId.isValid(userId)){
      throw new Error("Invalid userId format")
    }
    filter.reporterId = userId;
  }

  try {
    const db = await connectDb();

    const issuesCount = await db.collection("issues").countDocuments(filter);

    return issuesCount;
  } catch (error) {
    throw new Error(`Db error during fetching total issues: ${error}`);
  }
};

// Create Issue Report
const createIssue = async (payload, userId) => {
  try {
    const db = await connectDb();

    const newIssue = {
      ...payload,
      reporterId: userId,
      status: "pending",
      priority: payload.priority || "normal",
      upvotes: 0,
      assignedStaffId: null,
      isBoosted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await db.collection("issues").insertOne(newIssue);
    return res;
  } catch (error) {
    throw new Error(`Error occurd during create issue: ${error}`);
  }
};

// Create Issue Time line
const createTimelineEntry = async (entryPayload) => {
  try {
    const db = await connectDb();

    const newTimelineEntry = {
      ...entryPayload,
      issueId: new ObjectId(entryPayload.issueId), // Ensure issueId is stored as ObjectId
      timestamp: new Date(),
    };

    const result = await db
      .collection("issueTimelines")
      .insertOne(newTimelineEntry);

    return result;
  } catch (error) {
    console.error(`Error occurred during timeline creation: ${error}`);
    throw new Error(
      `Error occurred during timeline creation: ${error.message || error}`
    );
  }
};

// Upvote Issue
const upvoteIssue = async (issueId, userId) => {
  try {
    const db = await connectDb();

    const issueObjectId = new ObjectId(issueId);

    const result = await db.collection("issues").findOneAndUpdate(
      {
        _id: issueObjectId,
        reporterId: { $ne: userId },
        upvoters: { $ne: userId },
      },
      {
        $inc: { upvotes: 1 },
        $addToSet: { upvoters: userId },
      },
      { returnDocument: "after" }
    );

    return result;
  } catch (error) {
    throw new Error(`Error upvoting issue: ${error.message}`);
  }
};

// Boost Issue Priority
const boostIssuePriority = async (issueId, userId) => {
  try {
    const db = await connectDb();
    const issueObjectId = new ObjectId(issueId);

    const result = await db.collection("issues").findOneAndUpdate(
      {
        _id: issueObjectId,
        isBoosted: false,
      },
      {
        $set: {
          priority: "high",
          isBoosted: true,
        },
        $currentDate: { updatedAt: true },
      },
      {
        returnDocument: "after",
      }
    );

    const updatedIssue = result;

    if (updatedIssue) {
      await createTimelineEntry({
        issueId: issueObjectId,
        status: updatedIssue.status,
        message: "Issue priority boosted by citizen (Payment successful).",
        updatedBy: "Citizen",
        updatedById: userId,
      });
    }

    return updatedIssue;
  } catch (error) {
    throw new Error(`Error boosting issue: ${error.message}`);
  }
};

// Edit Own Issue
const editOwnIssue = async (issueId, userId, updatePayload) => {
  try {
    const db = await connectDb();
    const issueObjectId = new ObjectId(issueId);

    const result = await db.collection("issues").findOneAndUpdate(
      {
        _id: issueObjectId,
        reporterId: userId,
        status: "pending",
      },
      {
        $set: {
          ...updatePayload,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    return result;
  } catch (error) {
    throw new Error(`Error editing issue: ${error.message}`);
  }
};

// delete issue
const deleteOwnIssue = async (issueId, userId) => {
  try {
    const db = await connectDb();
    const issueObjectId = new ObjectId(issueId);

    const result = await db.collection("issues").findOneAndDelete({
      _id: issueObjectId,
      reporterId: userId,
    });

    return result;
  } catch (error) {
    throw new Error(`Error deleting issue: ${error}`);
  }
};

// Issue Time line
const getIssueTimeline = async (issueId) => {
  try {
    const db = await connectDb();
    const issueObjectId = new ObjectId(issueId);

    const timeline = await db
      .collection("issueTimelines")
      .find({ issueId: issueObjectId })
      .sort({ timestamp: -1 })
      .toArray();

    return timeline;
  } catch (error) {
    throw new Error(`Error fetching issue timeline: ${error.message}`);
  }
};

const changeIssueStatus = async (
  issueId,
  newStatus,
  updaterId,
  updaterRole
) => {
  try {
    const db = await connectDb();

    const issueObjectId = new ObjectId(issueId);
    const normalizedRole = updaterRole.toLowerCase();
    const normalizedStatus = newStatus.toLowerCase();

    const filter = { _id: issueObjectId };

    if (normalizedRole === "staff") {
      filter.assignedStaffId = new ObjectId(updaterId);
    }

    const result = await db.collection("issues").findOneAndUpdate(
      filter,
      {
        $set: { status: normalizedStatus },
        $currentDate: { updatedAt: true },
      },
      { returnDocument: "after" }
    );


    if (!result) {
      throw new Error("Issue not found or permission denied");
    }

    const updatedIssue = result;

    await createTimelineEntry({
      issueId: issueObjectId,
      status: normalizedStatus,
      message: `Issue status changed to: ${normalizedStatus}.`,
      updatedBy: normalizedRole,
      updatedById: updaterId,
    });

    return updatedIssue;
  } catch (error) {
    throw new Error(`Error changing issue status: ${error.message}`);
  }
};


// Assign Staff
const assignStaff = async(issueId, staffId) => {

  try {
    const db = await connectDb();

    const updateOperation = {
            $set: {
              assignedStaffId: new ObjectId(staffId), 
              status: 'pending', 
              assignedAt: new Date(), 
            }
        };

    const result = await db.collection("issues").findOneAndUpdate(
            { _id: new ObjectId(issueId) }, 
            updateOperation,                
            { returnDocument: 'after' }     
        );

    return result;
  } catch (error) {
    throw new Error("Db error during assign staff");
  }
}


// Get Resolved issues
const getResolvedIssues = async() => {
  try {
    const db = await connectDb();

    const issues = await db.collection("issues").find({ status: 'resolved' }).toArray();

    return issues;
  } catch (error) {
    throw new Error("Db error during fetching resolved issues");
  }
}

const IssueService = {
  createIssue,
  getIssues,
  getTotalIssues,
  createTimelineEntry,
  upvoteIssue,
  boostIssuePriority,
  editOwnIssue,
  getSingleIssue,
  getIssueTimeline,
  deleteOwnIssue,
  changeIssueStatus,
  getIssuesStatus,
  assignStaff,
  getResolvedIssues
};

export default IssueService;
