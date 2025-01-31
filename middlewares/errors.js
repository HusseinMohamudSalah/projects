// middleware/errorMiddleware.js
exports.globalErrorMiddleware = function (err, req, res, next) {
    
    const statusCode = err.status || 500;
    const message = err.message || "Internal Server Error";
    if (process.env.NODE_ENV === 'development') {
        return res.status(statusCode).json({
            success: false,
            message: message,
            stack: err.stack  // Muujinta stack trace si loo sahlo debugging
        });
    }
    return res.status(statusCode).json({
        success: false,
        message: message
    });
};
