# NK-Mongo
MongoDB Connection Class for the NK Node Package

## Installation

Install using NPM

```bash
npm i nk-mongo --save
```
---
## How to use

Mongo is the preferred database format for NodeJS based systems. It supports multi-table joins (commonly mistaken as the "weakness" of Mongo). This package will give you one-line access to all common Mongo functions in simple-to-use queries.

---

## To Start and Connect to Server

Use NKMongo.start()

```
NKMongo.start( 
  <Database Name>, //String
  <IP>, //String
  <Port>, //Number
  <User>, //String
  <Password>, //String
  <Timeout in milliseconds>, //Number
  <Callback> //Function
);
```

The **database connection** object is saved in the **NKMongo Object**. Indexed by the database **name**, so there is a caveat to not use the same database name across distinct servers.

Example:
```javascript
const NKMongo = require( 'nk-mongo' )

NKMongo.start( 'MyDatabase', '127.0.0.1', 27017, null, null, null, ( isError, errorMessage ) => {
  //Super duper awesome code here!
  console.log( isError, errorMessage )
})
```

### To Start and connect to **multiple servers**

WHAT?! Yes, you can connect to multiple servers in the same core, using them as objects for real-time compliances, for example:
```javascript
const NKMongo = require( 'nk-mongo' )

NKMongo.start( 'MyDatabase', '127.0.0.1', 27017, null, null, null, ( isError1, errorMessage1 ) => NKMongo.start( 'RemoteDB1', 'remote.mydomain.com', 27017, null, null, null, ( isError2, errorMessage2 ) => NKMongo.start( 'RemoteDB2', 'remote2.mydomain.com', 27017, null, null, null, ( isError3, errorMessage3 ) => {
  //Even more super duper awesome code here!
  console.log( isError1, errorMessage1, isError2, errorMessage2, isError3, errorMessage3 )
})))
```
---

## Common Utility Functions

### Insert
#### Use NKMongo.insert(), to a new row or a set of rows:
```
NKMongo.insert( 
  <Database Name>, //String 
  <Collection Name>, //String
  <ROW OR ROWS>, //A single Object to insert one, or an Array of Objects to insert many
  <Callback> //Function
) 
```

Example:
```javascript
NKMongo.insert( 'MyDatabase', 'users', 
  { 
    username: 'jose', 
    pass: '123', 
    active: false, 
    added: ( new Date() ).getTime() 
  }, 
  () => console.log( 'all done' ) )
```

### **Delete**
#### Use NKMongo.delete() to delete rows from the collection:
```
NKMongo.delete(
  <Database Name>, //String 
  <Collection Name>, //String
  <DATA TO REMOVE>, //Object
  <Callback> //Function
)
```
Example:
```Javascript
NKMongo.delete( 'MyDatabase', 'users', 
  { 
    myuser: NKMongo.id( user._id ) 
  }, 
  () => console.log( 'all done' ) )
```

### **Update** 
#### Use NKMongo.update to update rows in the collection: 
```
NKMongo.update(
  <Database Name>, //String 
  <Collection Name>, //String
  <DATA TO UPDATE>, //Object
  <NEW DATA>, //Object
  <Callback> //Function
)
```
Example:
```javascript
NKMongo.update( 'MyDatabase', 'users', 
  { 
    active: false 
  }, 
  { 
    active: true
  }, 
  () => console.log( 'all done' ) 
)
```

### **Querying**
#### Use NKMongo.query() for a query to the collection:
```
NKMongo.query(
  <Database Name>, //String 
  <Collection Name>, //String
  <QUERY>, //Object
  <Callback> //Function, Recieves rows from query
)
```
Example:
```javascript
NKMongo.query( 'MyDatabase', 'users', 
  { 
    active: true 
  }, 
  rowsFromQuery => console.log( rowsFromQuery ) 
)
```

#### Use NKMongo.singleQuery() for a single query to the collection:
Note: singleQuery should only ever query **ONE ROW**.
```
NKMongo.singleQuery(
  <Database Name>, //String 
  <Collection Name>, //String
  <Query>, //Object
  <Calback> //Function, Recieves a single row from query.
);
```
Example:
```javascript
NKMongo.singleQuery( 'MyDatabase', 'users', 
  { 
    myuser: NKMongo.id( user._id ) 
  }, 
  rowFromQuery => console.log( rowFromQuery ) 
)
```
This **singleQuery** is very useful in the authentication methods, e.g.
```javascript
NKMongo.singleQuery( 'MyDatabase', 'users', 
  { loginSessionKey: req.sessionKey }, 
  rowFromQuery => res.json( rowFromQuery? true: false ) 
)
```


### Run Query with a sort by set of data
```node
//                      dbName, table,    sortBy,       query,              callback
NKMongo.querySort( 'MyDatabase', 'users', { added: 1 }, { active: true }, rowsFromQuery => console.log( rowsFromQuery ) )
```

### Run Query with a sort by and limit to row count set of data
```node
//                      dbName,       table,  max,  sortBy,       query,            callback
NKMongo.queryLimitSort( 'MyDatabase', 'users', 100, { added: 1 }, { active: true }, rowsFromQuery => console.log( rowsFromQuery ) )
```

### Run a query to perform only one JOIN to another table
```node
//              dbName,     table, tableIDField, joinTo, joinToIDField, joinedToElement, sortBy, query, callback
NKMongo.join( 'MyDatabase', 'users', '_id', 'photos', 'user_id', 'photos', { added: 1 }, { myuser: NKMongo.id( user._id ) }, rowsFromQuery => console.log( rowsFromQuery ) )
```

### Run a query, performing a list of JOINS defined in the query
```node
const joins = [{ from: 'photos', field: '_id', fromField: 'user_id', as: 'photos' },
              { from: 'history', field: '_id', fromField: 'user_id', as: 'transactions' }]
//                      dbName, table,    joins, max,   sortBy,       query,            callback
NKMongo.joinsLimit( 'MyDatabase', 'users', joins, 100, { added: 1 }, { active: true }, rowsFromQuery => console.log( rowsFromQuery ) )
```

# Securing your Mongo Server

It is not always enough to run apt install mongo ... we need to follow a set of installation procedures to ensure our Mongo is protected from Prying Eyes.

## 1. Install Stack

Start with a clean server, so you know the configuration, if you are doing this on a shared server, most should be done already.

```bash
apt update
apt -y upgrade
apt -y autoremove
apt install -y mongodb libc6
```

## 2. Configure Mongo

Setup an admin user on Mongo

```bash
sytemctl mongodb stop
mkdir /var/local/mongo
mongod --port 27017 --dbpath /var/local/mongo
mongo --port 27017
  >use admin
  >db.createUser({ user: 'userName', pwd: 'newUserPassowrd', roles: [ { role: 'userAdminAnyDatabase', db:'admin'} ] } )
  >quit()
mongod --auth --port 27017 --dbpath /var/local/mongo
mongo --port 27017 -u "userName" -p "newUserPassowrd" --authenticationDatabase "admin"
```

Edit the configuration file, in two places:

```bash
nano /etc/mongodb.conf
```

```
bind_ip = 1.1.1.1
```
should become
```
bind_ip = 0.0.0.0
```

and

```
# Turn on/off security.  Off is currently the default
noauth = true
#auth = true
```
should become
```
# Turn on/off security.  Off is currently the default
#noauth = true
auth = true
```

then, restart the service

```bash
service mongodb restart
```

### Note: If you would like to see the connections
```bash
tail -f /var/log/mongodb/mongodb.log
```

### Note: If you use UFW for the linux firewall
```bash
ufw allow 27017/tcp
```


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
