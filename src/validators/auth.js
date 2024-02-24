const { check, validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");


const validateSignUpRequest = [
check("countryCode").notEmpty().withMessage("countryCode is required"),
check("mobileNumber").notEmpty().withMessage("MobileNumber  is required"),

];
const validateSignIpRequest = [
    check("countryCode").notEmpty().withMessage("countryCode is required"),
    check("mobileNumber").notEmpty().withMessage("MobileNumber  is required"),
]
const isRequestValidated = (req, res, next) => {
  const errors = validationResult(req);
 
  if (errors.array().length > 0) {
      return res
              .status(StatusCodes.BAD_REQUEST)
              .json({ error: errors.array()[0].msg });
  }
  next();
};
module.exports = {
  validateSignUpRequest,
  isRequestValidated,
  validateSignIpRequest,
};