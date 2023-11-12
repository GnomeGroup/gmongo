const mongo = require('mongodb').MongoClient

module.exports = (isAtlas, dbName, ip, port, user, pass, x509, timeoutInMS) =>
  new Promise(function (resolve, reject) {
    let connectOptions = {
      serverSelectionTimeoutMS: timeoutInMS
        ? parseInt(timeoutInMS)
        : CFG.defaults.timeout,
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
        (isAtlas ? '' : ':' + parseInt(port).toString()) +
        '/' +
        encodeURIComponent(dbName) +
        '?retryWrites=true&w=majority' +
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
    } catch (err) {}
    reject()
  })
