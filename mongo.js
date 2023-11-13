const mongo = require('mongodb').MongoClient
const objectId = require('./services/objectId')
const connect = require('./services/connect')
const aes = require('./services/aes')

const CFG = require('./config/')

const resFmt = (err, result, resolve, reject) => {
  if (err) {
    reject(err)
  } else {
    resolve(result)
  }
}

const decrypt = (rows, columns, key, iv) => {
  for (let i = 0; i < rows.length; i++) {
    for (let x in rows[i]) {
      if (columns.includes(x)) {
        rows[i][x] = aes.decrypt(key, iv, rows[i][x])
      }
    }
  }
  return rows
}

const db = {
  db: null,
  retryTimeout: 100,
  insertList: {},
  deleteList: {},
  updateList: {},
  databaseList: {},
  aes: aes,
  id: (name) =>
    typeof name != 'string' || name.length % 12 == 0 ? objectId(name) : null,
  start: (isAtlas, dbName, ip, port, user, pass, x509, timeoutInMS) =>
    new Promise((resolve, reject) => {
      if (!Array.isArray(dbName)) {
        dbName = [dbName]
      }
      const connectDB = (_) => {
        const thisDB = dbName && dbName.length > 0 ? dbName.shift() : null
        if (thisDB) {
          connect(isAtlas, thisDB, ip, port, user, pass, x509, timeoutInMS)
            .then((dbObject) => {
              db.databaseList[thisDB] = dbObject
              connectDB()
            })
            .catch((err) => {
              console.log('Database Connection Error', err)
              reject()
            })
        } else {
          resolve()
        }
      }
      connectDB()
    }),
  insert: (dbName, table, rowOrRows, columsOfRowOrRowsToEncrypt, key, iv) =>
    new Promise(async (resolve, reject) => {
      if (db.databaseList[dbName]) {
        if (columsOfRowOrRowsToEncrypt && key && iv) {
          if (Array.isArray(rowOrRows)) {
            for (let i = 0; i < rowOrRows.length; i++) {
              for (let n = 0; n < columsOfRowOrRowsToEncrypt.length; n++) {
                rowOrRows[i][columsOfRowOrRowsToEncrypt[n]] = aes.encrypt(
                  key,
                  iv,
                  rowOrRows[i][columsOfRowOrRowsToEncrypt[n]]
                )
              }
            }
          } else {
            for (let n = 0; n < columsOfRowOrRowsToEncrypt.length; n++) {
              rowOrRows[columsOfRowOrRowsToEncrypt[n]] = aes.encrypt(
                key,
                iv,
                rowOrRows[columsOfRowOrRowsToEncrypt[n]]
              )
            }
          }
        }
        const collection = await db.databaseList[dbName].collection(table)
        resFmt(
          null,
          await collection[
            Array.isArray(rowOrRows) ? 'insertMany' : 'insertOne'
          ](rowOrRows),
          resolve,
          reject
        )
      } else {
        reject('No Connection')
      }
    }),
  delete: (dbName, table, dataToRemove) =>
    new Promise(async (resolve, reject) => {
      if (db.databaseList[dbName]) {
        const collection = await db.databaseList[dbName].collection(table)
        resFmt(null, await collection.deleteMany(dataToRemove), resolve, reject)
      } else {
        reject('No Connection')
      }
    }),
  update: (
    dbName,
    table,
    dataToUpdate,
    newData,
    columsOfRowOrRowsToEncrypt,
    key,
    iv
  ) =>
    new Promise(async (resolve, reject) => {
      if (db.databaseList[dbName]) {
        if (columsOfRowOrRowsToEncrypt && key && iv) {
          for (let n = 0; n < columsOfRowOrRowsToEncrypt.length; n++) {
            newData[columsOfRowOrRowsToEncrypt[n]] = aes.encrypt(
              key,
              iv,
              newData[columsOfRowOrRowsToEncrypt[n]]
            )
          }
        }
        const collection = await db.databaseList[dbName].collection(table)
        resFmt(
          null,
          await collection.updateMany(dataToUpdate, { $set: newData }),
          resolve,
          reject
        )
      } else {
        reject('No Connection')
      }
    }),
  singleQuery: (dbName, table, query, columnsToDecrypt, key, iv) =>
    new Promise(async (resolve, reject) => {
      if (db.databaseList[dbName]) {
        const collection = await db.databaseList[dbName].collection(table)
        const result = await collection.findOne(query)
        resFmt(
          null,
          result && columnsToDecrypt && key && iv
            ? decrypt([result], columnsToDecrypt, key, iv)[0]
            : result,
          resolve,
          reject
        )
      } else {
        reject('No Connection')
      }
    }),
  query: (dbName, table, query, columnsToDecrypt, key, iv) =>
    new Promise(async (resolve, reject) => {
      if (db.databaseList[dbName]) {
        const collection = await db.databaseList[dbName].collection(table)
        const results = await collection.find(query)
        const result = []
        while (await results.hasNext()) {
          result.push(await results.next())
        }
        resFmt(
          null,
          result && result.length > 0 && columnsToDecrypt && key && iv
            ? decrypt(result, columnsToDecrypt, key, iv)
            : result,
          resolve,
          reject
        )
      } else {
        reject('No Connection')
      }
    }),
  querySort: (dbName, table, sort, query, columnsToDecrypt, key, iv) =>
    new Promise(async (resolve, reject) => {
      if (db.databaseList[dbName]) {
        const collection = await db.databaseList[dbName].collection(table)
        const results = await (await collection.find(query)).sort(sort)
        const result = []
        while (await results.hasNext()) {
          result.push(await results.next())
        }
        resFmt(
          null,
          result && result.length > 0 && columnsToDecrypt && key && iv
            ? decrypt(result, columnsToDecrypt, key, iv)
            : result,
          resolve,
          reject
        )
      } else {
        reject('No Connection')
      }
    }),
  queryLimitSort: (
    dbName,
    table,
    max,
    sort,
    query,
    columnsToDecrypt,
    key,
    iv
  ) =>
    new Promise(async (resolve, reject) => {
      if (db.databaseList[dbName]) {
        const collection = await db.databaseList[dbName].collection(table)
        const results = await (
          await (await collection.find(query)).limit(max)
        ).sort(sort)
        const result = []
        while (await results.hasNext()) {
          result.push(await results.next())
        }
        resFmt(
          null,
          result && result.length > 0 && columnsToDecrypt && key && iv
            ? decrypt(result, columnsToDecrypt, key, iv)
            : result,
          resolve,
          reject
        )
      } else {
        reject('No Connection')
      }
    }),
  join: (
    dbName,
    table,
    tableIDField,
    joinTo,
    joinToIDField,
    joinedToElement,
    sort,
    query,
    columnsToDecrypt,
    key,
    iv
  ) =>
    new Promise(async (resolve, reject) => {
      if (db.databaseList[dbName]) {
        const collection = await db.databaseList[dbName].collection(table)
        resolve(
          await db.aggregate(
            dbName,
            table,
            query,
            sort,
            [
              {
                $lookup: {
                  from: joinTo,
                  localField: tableIDField,
                  foreignField: joinToIDField,
                  as: joinedToElement,
                },
              },
            ],
            columnsToDecrypt,
            key,
            iv
          )
        )
      } else {
        reject('No Connection')
      }
    }),
  joins: (
    dbName,
    table,
    joinedToList,
    sort,
    query,
    columnsToDecrypt,
    key,
    iv
  ) =>
    new Promise(async (resolve, reject) => {
      if (db.databaseList[dbName]) {
        const collection = await db.databaseList[dbName].collection(table)
        let aggregrateList = []
        for (let i = 0; i < joinedToList.length; i++) {
          aggregrateList.push({
            $lookup: {
              from: joinedToList[i].to.name,
              localField: joinedToList[i].from,
              foreignField: joinedToList[i].to.id,
              as: joinedToList[i].name,
            },
          })
        }
        resolve(
          await db.aggregate(
            dbName,
            table,
            query,
            sort,
            aggregrateList,
            columnsToDecrypt,
            key,
            iv
          )
        )
      } else {
        reject('No Connection')
      }
    }),
  aggregate: (
    dbName,
    table,
    query,
    sort,
    aggregates,
    columnsToDecrypt,
    key,
    iv
  ) =>
    new Promise(async (resolve, reject) => {
      if (db.databaseList[dbName]) {
        const collection = await db.databaseList[dbName].collection(table)
        if (query) {
          aggregates.unshift({ $match: query })
        }
        if (sort) {
          aggregates.push({ $sort: sort })
        }
        const result = []
        const results = collection.aggregate(aggregates)
        for await (const row of results) {
          result.push(row)
        }
        resFmt(
          null,
          columnsToDecrypt && columnsToDecrypt.length > 0 && key && iv
            ? decrypt(result, columnsToDecrypt, key, iv)
            : result,
          resolve,
          reject
        )
      } else {
        reject('No Connection')
      }
    }),
}

module.exports = db
