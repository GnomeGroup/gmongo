const mongo = require('mongodb').MongoClient

module.exports = (
  isAtlas,
  dbName,
  ip,
  port,
  user,
  pass,
  x509,
  timeoutInMS,
  callback
) =>
  new Promise(function(resolve, reject) {
    let connectOptions = {
      serverSelectionTimeoutMS: timeoutInMS
        ? parseInt(timeoutInMS)
        : CFG.defaults.timeout,
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
    if (x509) {
      connectOptions.tls = true
      connectOptions.tlsCertificateKeyFile = x509
    }
    mongo.connect(
      'mongodb' +
        (isAtlas ? '+srv' : '') +
        '://' +
        (user ? escape(user) : '') +
        (user && pass ? ':' : '') +
        (pass ? escape(pass) : '') +
        (user || pass ? '@' : '') +
        escape(ip) +
        (isAtlas ? '' : ':' + parseInt(port).toString()) +
        '/' +
        escape(dbName) +
        '?retryWrites=true&w=majority' +
        (x509 ? '&authMechanism=MONGODB-X509&ssl=true' : ''),
      connectOptions,
      (err, dataBase) => {
        console.log(err, dataBase)
        if (!err && dataBase) {
          const dbObject = dataBase.db(dbName)
          dbObject.collection(dbName)
          resolve(dbObject)
        } else {
          reject(err)
        }
      }
    )
  })
