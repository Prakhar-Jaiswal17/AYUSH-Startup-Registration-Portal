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
    let status = error.status || error.statusCode || 500
    let message = error.type === 'entity.parse.failed' ? 'Request body contains invalid JSON.' : error.message
    if (error.code === 'P2002') { status = 409; message = 'A record with this value already exists.' }
    if (error.code === 'P2025') { status = 404; message = 'Record not found.' }
    if (error.code === 'P2034') { status = 409; message = 'This account changed at the same time as another request. Reload the page and try again.' }
    if (status >= 500) {
        console.error(error)
        message = 'An unexpected server error occurred.'
    }
    return res.status(status).json({ success: false, error: message, ...(error.fields ? { fields: error.fields } : {}) })
}

function requireFields(body, fields) {
    requireObjectBody(body)
    const errors = {}
    for (const field of fields) if (typeof body[field] !== 'string' || !body[field].trim()) errors[field] = 'This field is required.'
    if (Object.keys(errors).length) throw httpError(422, 'Validation failed', errors)
}

function requireObjectBody(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw httpError(422, 'Request body must be a JSON object.', { body: 'Send a JSON object.' })
    }
}

module.exports = { asyncHandler, httpError, sendError, requireFields, requireObjectBody }
