const inbox = require("../models/inbox");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");

const fetchAllNotifications = async (req, res) => {
    try {
        var filter = { to: req.query.to };

        const page = parseInt(req.query.page, 10) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const inboxList = await inbox.find(filter)
            .skip(skip)
            .limit(limit)
            .exec();

        return res.status(StatusCodes.OK).json({
            statusCode: "0",
            message: "Found notification list",
            data: inboxList
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

const updateStatusForNotification = async (req, res) => {
    try {
        const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("token", token);
            user_id = decoded._id;
            console.log("user id ", decoded._id);
        } else {
            return res.status(StatusCodes.FORBIDDEN).json({
                statusCode: 1,
                message: "Invalid user",
                data: null
            });
        }
        const notificationId = req.body.notificationId;

        const update = { isReaded: true }

        const option = {
            new: true,
            upsert: true,
        }

        const inboxList = await inbox.findByIdAndUpdate(notificationId, update, option);

        return res.status(StatusCodes.OK).json({
            statusCode: "0",
            message: "updated",
            data: inboxList
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

module.exports = { fetchAllNotifications, updateStatusForNotification };