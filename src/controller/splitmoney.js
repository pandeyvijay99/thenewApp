const splitmoney = require("../models/splitmoney");
const { StatusCodes } = require("http-status-codes");


const addUser = async (req, res) => {
    try {
        const data = await splitmoney.create(req.body);

        return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: "uploaded successfully",
            data: data
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            statusCode: 1,
            message: error.message,
            data: null
        });
    }
};

const findUsersByMobileNumbers = async (req, res) => {
    try {
        // Validate request body
        if (!Array.isArray(req.body) || req.body.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                statusCode: 1,
                message: "Invalid request. Expected an array of mobile numbers.",
                data: null
            });
        }

        // Query the database
        const data = await splitmoney.find({ mobileNumber: { $in: req.body } });

        // Respond with success
        return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: "Users found",
            data: data
        });
    } catch (error) {
        // Handle errors
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            statusCode: 1,
            message: error.message,
            data: null
        });
    }
};

module.exports = { addUser, findUsersByMobileNumbers };