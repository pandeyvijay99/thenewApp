// helpers/auditLogger.js
const Audit = require('../src/models/audit');

async function logAudit(activityType, mobileNumber, Url,thumbnailUrl,photoUrl ,userId,description,documentId) {
    debugger;
    const audit = new Audit({
        activityType,
        mobileNumber,
        Url,
        thumbnailUrl,
        userId,
        description,
        documentId,
        photoUrl
    });
    await audit.save();
}

module.exports = logAudit;
