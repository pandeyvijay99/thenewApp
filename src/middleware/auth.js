const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    console.log("middleware")
    
    try {
        const authHeader = (req.headers.authorization)?req.headers.authorization:null;
        if(authHeader){
            const token =  authHeader.split(' ')[1];
        if (!token) return res.status(403).send("Access denied.");
        console.log("token" , token);
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("decoded",decoded.mobileNumber);
        req.user = decoded;
        next();
        }else{
            res.status(400).send({statusCode:1,"message":"Authorisation Header missing",data:null});
            
        }
    } catch (error) {
        console.log("token issue ", error);
        res.status(401).send({statusCode:1,"message":"UnAuthorised Access",data:null});
        res.status(401).send("Unauthorised Access");
    }
};