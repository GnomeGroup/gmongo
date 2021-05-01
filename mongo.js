const mongo = require('mongodb').MongoClient
const objectId = require('./services/objectId')
const connect = require('./services/connect')

const CFG = require('./config/')

const resFmt = (err, result, resolve, reject) => {
  if (err) {
    reject(err)
  } else {
    resolve(result)
  }
}

const db = {
  db: null,
  retryTimeout: 100,
  insertList: {},
  deleteList: {},
  updateList: {},
  databaseList: {},
  id: name => objectId(name),
  start: (isAtlas, dbName, ip, port, user, pass, x509, timeoutInMS) =>
    new Promise((resolve, reject) => {
      if (!Array.isArray(dbName)) {
        dbName = [dbName]
      }
      const connectDB = _ => {
        const thisDB = dbName && dbName.length > 0 ? dbName.shift() : null
        if (thisDB) {
          connect(isAtlas, thisDB, ip, port, user, pass, x509, timeoutInMS)
            .then(dbObject => {
              db.databaseList[thisDB] = dbObject
              connectDB()
            })
            .catch(err => {
              console.log('Database Connection Error', err)
              reject()
            })
        } else {
          resolve()
        }
      }
      connectDB()
    }),
  insert: (dbName, table, rowOrRows) =>
    new Promise((resolve, reject) => {
      if (db.databaseList[dbName]) {
        db.databaseList[dbName].collection(table, (err, collection) =>
          collection[
            Array.isArray(rowOrRows) ? 'insertMany' : 'insertOne'
          ](rowOrRows, (err, result) => resFmt(err, result, resolve, reject))
        )
      } else {
        reject('No Connection')
      }
    }),
  delete: (dbName, table, dataToRemove) =>
    new Promise((resolve, reject) => {
      if (db.databaseList[dbName]) {
        db.databaseList[dbName].collection(table, (err, collection) =>
          collection.deleteMany(dataToRemove, (err, result) =>
            resFmt(err, result, resolve, reject)
          )
        )
      } else {
        reject('No Connection')
      }
    }),
  update: (dbName, table, dataToUpdate, newData) =>
    new Promise((resolve, reject) => {
      if (db.databaseList[dbName]) {
        db.databaseList[dbName].collection(table, (err, collection) =>
          collection.updateMany(
            dataToUpdate,
            { $set: newData },
            (err, result) => resFmt(err, result, resolve, reject)
          )
        )
      } else {
        reject('No Connection')
      }
    }),
  singleQuery: (dbName, table, query) =>
    new Promise((resolve, reject) => {
      if (db.databaseList[dbName]) {
        db.databaseList[dbName].collection(table, (err, collection) =>
          collection.findOne(query, (err, result) =>
            resFmt(err, result, resolve, reject)
          )
        )
      } else {
        reject('No Connection')
      }
    }),
  query: (dbName, table, query) =>
    new Promise((resolve, reject) => {
      if (db.databaseList[dbName]) {
        db.databaseList[dbName].collection(table, (err, collection) =>
          collection
            .find(query)
            .toArray((err, result) => resFmt(err, result, resolve, reject))
        )
      } else {
        reject('No Connection')
      }
    }),
  querySort: (dbName, table, sort, query, callback) =>
    new Promise((resolve, reject) => {
      if (db.databaseList[dbName]) {
        db.databaseList[dbName].collection(table, (err, collection) =>
          collection
            .find(query)
            .sort(sort)
            .toArray((err, result) => resFmt(err, result, resolve, reject))
        )
      } else {
        reject('No Connection')
      }
    }),
  queryLimitSort: (dbName, table, max, sort, query, callback) =>
    new Promise((resolve, reject) => {
      if (db.databaseList[dbName]) {
        db.databaseList[dbName].collection(table, (err, collection) =>
          collection
            .find(query)
            .limit(max)
            .sort(sort)
            .toArray((err, result) => resFmt(err, result, resolve, reject))
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
    query
  ) =>
    new Promise((resolve, reject) => {
      if (db.databaseList[dbName]) {
        db.aggregate(dbName, table, query, sort, [
          {
            $lookup: {
              from: joinTo,
              localField: tableIDField,
              foreignField: joinToIDField,
              as: joinedToElement
            }
          }
        ])
          .then(result => resolve(result))
          .catch(err => reject(err))
      } else {
        reject('No Connection')
      }
    }),
  joins: (dbName, table, joinedToList, sort, query) =>
    new Promise((resolve, reject) => {
      if (db.databaseList[dbName]) {
        db.databaseList[dbName].collection(table, (err, collection) => {
          let aggregrateList = []
          for (let i = 0; i < joinedToList.length; i++) {
            aggregrateList.push({
              $lookup: {
                from: joinedToList[i].to.name,
                localField: joinedToList[i].from,
                foreignField: joinedToList[i].to.id,
                as: joinedToList[i].name
              }
            })
          }
          db.aggregate(dbName, table, query, sort, aggregrateList)
            .then(result => resolve(result))
            .catch(err => reject(err))
        })
      } else {
        reject('No Connection')
      }
    }),
  aggregate: (dbName, table, query, sort, aggregates) =>
    new Promise((resolve, reject) => {
      if (db.databaseList[dbName]) {
        db.databaseList[dbName].collection(table, (err, collection) => {
          if (query) {
            aggregates.unshift({ $match: query })
          }
          if (sort) {
            aggregates.push({ $sort: sort })
          }
          collection
            .aggregate(aggregates)
            .toArray((err, result) => resFmt(err, result, resolve, reject))
        })
      } else {
        reject('No Connection')
      }
    })
}

module.exports = db
/*
const connectNOW = async _ => {
  const response = await db.start(
    true,
    'QuickLook',
    'clarowebsite.gv53t.mongodb.net',
    null,
    'rldyAccess',
    'MllwrWjXVT5MtzFM',
    null,
    20000
  )
  console.log(response)
}

console.log(connectNOW())
*/

const timeoutPromise = interval =>
  new Promise((resolve, reject) => {
    setTimeout(function() {
      resolve('done')
    }, interval)
  })

async function timeTest() {
  await db.start(
    true,
    'QuickLook',
    'clarowebsite.gv53t.mongodb.net',
    null,
    'rldyAccess',
    'MllwrWjXVT5MtzFM',
    null,
    20000
  )
  await timeoutPromise(3000)
}

let startTime = Date.now()
timeTest().then(() => {
  let finishTime = Date.now()
  let timeTaken = finishTime - startTime
  console.log('Time taken in milliseconds: ' + timeTaken)
  console.log(db.databaseList)
  process.exit()
})
