# NK-Mongo
MongoDB Connection Class for the NK Node Package

## Installation

Install using NPM

```bash
npm i nk-mongo --save
```

## How to use


### Start and connect to server
```node
const NKMongo = require( 'nk-mongo' )
//                  dbName,         ip,   port, callback
NKMongo.start( 'MyDatabase', '127.0.0.1', 27017, () => {
  //                    dbName, table,      rowOrRows,                                                                        callback
  NKMongo.insert( 'MyDatabase', 'users', { username: 'jose', pass: '123', active: false, added: ( new Date() ).getTime() }, () => console.log( 'all done' ) )
  //                    dbName, table,     dataToRemove,                      callback
  NKMongo.delete( 'MyDatabase', 'users', { myuser: NKMongo.id( user._id ) }, () => console.log( 'all done' ) )
  //                    dbName, table,      dataToUpdate,       newData,        callback
  NKMongo.update( 'MyDatabase', 'users', { active: false }, { active: true }, () => console.log( 'all done' ) )
  //                        dbName, table,      query,                              callback
  NKMongo.singleQuery( 'MyDatabase', 'users', { myuser: NKMongo.id( user._id ) }, rowFromQuery => console.log( rowFromQuery ) )
  //                  dbName, table,      query,          callback
  NKMongo.query( 'MyDatabase', 'users', { active: true }, rowsFromQuery => console.log( rowsFromQuery ) )
  //dbName, table, tableIDField, joinTo, joinToIDField, joinedToElement, sortBy, query, callback
  NKMongo.join( 'MyDatabase', 'users', tableIDField, joinTo, joinToIDField, joinedToElement, sortBy, query, rowsFromQuery => console.log( rowsFromQuery ) )
  //                      dbName, table,    joins, max,   sortBy,       query,            callback
  NKMongo.joinsLimit( 'MyDatabase', 'users', joins, 100, { added: 1 }, { active: true }, rowsFromQuery => console.log( rowsFromQuery ) )
  //                      dbName, table,    sortBy,       query,              callback
  NKMongo.querySort( 'MyDatabase', 'users', { added: 1 }, { active: true }, rowsFromQuery => console.log( rowsFromQuery ) )
  //                      dbName,       table,  max,  sortBy,       query,            callback
  NKMongo.queryLimitSort( 'MyDatabase', 'users', 100, { added: 1 }, { active: true }, rowsFromQuery => console.log( rowsFromQuery ) )
})
```
