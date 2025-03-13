const wallet = require("../models/wallet");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const { sendPushNotification } = require("../controller/notificaion");

const uploadBlessingWallet = async (req, res) => {
    try {
        if (req.body.length == 0 || req.body[0] == null) {
            return res.status(StatusCodes.OK).json({
                statusCode: 1,
                message: "Invalid request",
                data: null
            });
        }
        const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("token", token);
            user_id = decoded._id;
            console.log("user_id  ", decoded._id);
        }

        const walletData = await wallet.create(req.body);
        if (req.body[0].type == 19) {
            sendPushNotification(req.body[0].userId, req.body[0].senderUserId, "receivedBlessing", "", false);
            const tempWalletData = {
                senderUserId: null,
                senderWebName: null,
                type: 20,
                blessings: -(req.body[0].blessings),
                userId: req.body[0].senderUserId,
                userWebname: req.body[0].userWebname
            }
            await wallet.create(tempWalletData);
        }
        return res.status(StatusCodes.OK).json({
            statusCode: "0",
            message: "uploaded successfully",
            data: walletData
        });
    } catch (error) {
        console.log("catch ", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            statusCode: 1,
            message: error.message,
            data: null
        });
    }
};


const getWalletInfo = async (req, res) => {
    try {
        const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("token", token);
            user_id = decoded._id;
            console.log("user_id  ", decoded._id);
        }

        const totalBlessings = await getBlessingsSum(user_id);

        const durationToFind = req.query.duration ?? 0
        // Get the current date and time
        const now = new Date();

        // Subtract 8 hours from the current time
        const durationFilter = new Date(now.getTime() - durationToFind * 60 * 60 * 1000);

        const walletHistory = await wallet.find({ userId: user_id, transactionAt: { $gte: durationFilter } });


        const data = {
            "totalBlessings": totalBlessings,
            "walletHistory": walletHistory
        }

        return res.status(StatusCodes.OK).json({
            statusCode: "0",
            message: "success",
            data: data
        });
    } catch (error) {
        console.log("catch ", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            statusCode: 1,
            message: error.message,
            data: null
        });
    }
};

const getDailyHistory = async (req, res) => {
    try {
        const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("token", token);
            user_id = decoded._id;
            console.log("user_id  ", decoded._id);
        }
        const ObjectId = require('mongoose').Types.ObjectId
        const userObjectId = new ObjectId(user_id);
        const walletData = await wallet.find({ userId: userObjectId })
        return res.status(StatusCodes.OK).json({
            statusCode: "0",
            message: "successfully fetched daily history",
            data: walletData
        });
    } catch (error) {
        console.log("catch ", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            statusCode: 1,
            message: error.message,
            data: null
        });
    }
};

async function getBlessingsSum(userId) {
    try {
        const ObjectId = require('mongoose').Types.ObjectId
        const userObjectId = new ObjectId(userId);
        const result = await wallet.aggregate([
            {
                $match: { userId: userObjectId } // Filter by userId
            },
            {
                $group: {
                    _id: null, // Group all filtered documents
                    totalBlessings: { $sum: { $toDouble: "$blessings" } }
                }
            }
        ]);

        if (result.length > 0) {
            return result[0].totalBlessings;
        } else {
            return 0;
        }
    } catch (error) {
        console.error("Error fetching total blessings:", error);
    }
}

const getMonthlyHistory = async (req, res) => {
    try {
        const authHeader = req.headers.authorization ? req.headers.authorization : null;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user_id = decoded._id;
        }

        const currentYear = req.body.year ? req.body.year : new Date().getFullYear();
        console.log("currentYear", currentYear);
        const startOfYear = new Date(currentYear, 0, 1);
        console.log("currentYear", startOfYear);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        console.log("currentYear", endOfYear);
        const ObjectId = require('mongoose').Types.ObjectId;
        const blessingsData = await wallet.aggregate([
            {
                // Match only transactions for the current user within the current calendar year
                $match: {
                    userId: new ObjectId(user_id),
                    transactionAt: {
                        $gte: startOfYear,
                        $lte: endOfYear
                    }
                }
            },
            {
                // Group by month and day to calculate daily blessings within each month
                $group: {
                    _id: {
                        month: { $month: "$transactionAt" },
                        day: { $dayOfMonth: "$transactionAt" }
                    },
                    dailyBlessings: { $sum: "$blessings" }
                }
            },
            {
                // Sort by month and day in ascending order
                $sort: { "_id.month": 1, "_id.day": 1 }
            },
            {
                // Group by month to create an array of daily blessings per month and calculate monthly total
                $group: {
                    _id: "$_id.month",
                    monthTotal: { $sum: "$dailyBlessings" },
                    dateWiseBlessings: {
                        $push: {
                            day: "$_id.day",
                            blessings: "$dailyBlessings"
                        }
                    }
                }
            },
            {
                // Sort by month in ascending order
                $sort: { "_id": 1 }
            },
            {
                // Project the final structure
                $project: {
                    _id: 0,
                    month: "$_id",
                    monthTotal: 1,
                    dateWiseBlessings: 1
                }
            }
        ]);

        return res.status(StatusCodes.OK).json({
            statusCode: "0",
            message: "Successfully fetched yearly history",
            data: blessingsData
        });
    } catch (error) {
        console.error("Error fetching blessings data:", error);
        throw error;
    }
};

const getTransactionHistory = async (req, res) => {
    debugger
    try {
        let user_id = ""
        const authHeader = req.headers.authorization || null;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });

            // Verify token and get user ID
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user_id = decoded._id;
        }

        // Set limit and offset for pagination, with defaults
        const limit = parseInt(req.body.limit) || 10;
        const offset = parseInt(req.body.offset) || 0;
        debugger;
        // Optional duration filter
        // const durationToFind = req.query.duration || 0;
        // const now = new Date();
        // const durationFilter = new Date(now.getTime() - durationToFind * 60 * 60 * 1000);

        // Sum of blessings (assuming getBlessingsSum is a helper function)
        const totalBlessings = await getBlessingsSum(user_id);
        // const ObjectId = require('mongoose').Types.ObjectId
        // Query wallet history with filters
        const walletHistory = await wallet.find({
            userId: user_id,
            type: { $in: [19, 20] }
            // transactionAt: { $gte: durationFilter }
        })
            .sort({ transactionAt: -1 })  // Sort by latest transactions
            .skip(offset)                  // Offset for pagination
            .limit(limit);                 // Limit for pagination

        // Prepare response data
        const data = {
            "totalBlessings": totalBlessings,
            "walletHistory": walletHistory
        };

        return res.status(StatusCodes.OK).json({
            statusCode: "0",
            message: "success",
            data: data
        });
    } catch (error) {
        console.error("Error fetching transaction history:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            statusCode: 1,
            message: error.message,
            data: null
        });
    }
};

module.exports = { uploadBlessingWallet, getWalletInfo, getDailyHistory, getMonthlyHistory, getTransactionHistory };