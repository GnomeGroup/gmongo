const objectid = require('mongodb').ObjectId

module.exports = (id) => new objectid(id)
