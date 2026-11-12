function asyncHandler(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

function httpError(status, message, fields) {
    const error = new Error(message)
    error.status = status
    if (fields) error.fields = fields
    return error
}

function sendError(res, error) {
    let status = error.status || 500
    let message = error.message
    if (error.code === 'P2002') { status = 409; message = 'A record with this value already exists.' }
    if (error.code === 'P2025') { status = 404; message = 'Record not found.' }
    if (status >= 500) {
        console.error(error)
        message = 'An unexpected server error occurred.'
    }
    return res.status(status).json({ success: false, error: message, ...(error.fields ? { fields: error.fields } : {}) })
}

function requireFields(body, fields) {
    const errors = {}
    for (const field of fields) if (typeof body[field] !== 'string' || !body[field].trim()) errors[field] = 'This field is required.'
    if (Object.keys(errors).length) throw httpError(422, 'Validation failed', errors)
}

module.exports = { asyncHandler, httpError, sendError, requireFields }
