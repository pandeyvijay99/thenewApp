module.exports = async (req, res, next) => {
    debugger;
    const start = Date.now();
    const { method, url, headers: requestHeaders, body: requestBody } = req;

    // Capture original send function
    const originalSend = res.send;

    // Override res.send to capture the response body
    let responseBody;
    res.send = function (body) {
        responseBody = body;
        return originalSend.apply(this, arguments);
    };

    res.on('finish', async () => {
        const duration = Date.now() - start;
        const { statusCode, getHeaders } = res;
        const responseHeaders = getHeaders();

        const logEntry = new Log({
            method,
            url,
            requestHeaders,
            requestBody,
            responseHeaders,
            responseBody,
            statusCode,
            duration
        });

        try {
            await logEntry.save();
            console.log('Log saved to MongoDB');
        } catch (error) {
            console.error('Error saving log to MongoDB:', error);
        }
    });

    next();
};
