const mongo = require('mongodb').MongoClient

const DEFAULT_TIMEOUT_MS = 30000
const DEFAULT_PORT = 27017

module.exports = (isAtlas, dbName, ip, port, user, pass, x509, timeoutInMS) =>
  new Promise(function (resolve, reject) {
    const parsedTimeout = Number.parseInt(timeoutInMS, 10)
    const parsedPort = Number.parseInt(port, 10)
    const effectivePort = Number.isFinite(parsedPort)
      ? parsedPort
      : DEFAULT_PORT
    const authSource = process.env.MONGO_AUTH_SOURCE || dbName

    const connectOptions = {
      serverSelectionTimeoutMS: Number.isFinite(parsedTimeout)
        ? parsedTimeout
        : DEFAULT_TIMEOUT_MS,
    }

    try {
      const url =
        'mongodb' +
        (isAtlas ? '+srv' : '') +
        '://' +
        (user ? encodeURIComponent(user) : '') +
        (user && pass ? ':' : '') +
        (pass ? encodeURIComponent(pass) : '') +
        (user || pass ? '@' : '') +
        encodeURIComponent(ip) +
        (isAtlas ? '' : ':' + effectivePort.toString()) +
        '/' +
        encodeURIComponent(dbName) +
        '?retryWrites=true&w=majority' +
        `&authSource=${encodeURIComponent(authSource)}` +
        (x509
          ? '&authMechanism=MONGODB-X509&tls=true&tlsCertificateKeyFile=' +
            encodeURIComponent(x509)
          : '&authMechanism=DEFAULT')
      const dataBase = new mongo(url, connectOptions)
      if (dataBase) {
        const dbObject = dataBase.db(dbName)
        dbObject.collection(dbName)
        resolve(dbObject)
        return
      }
      reject(new Error(`Failed to initialize Mongo client for ${dbName}`))
    } catch (err) {
      reject(err)
    }
  })
