# gmongo
MongoDB Connection Class

## Installation

Install using NPM

```bash
npm i gmongo --save
```
---
## How to use

Mongo is the preferred database format for NodeJS based systems. It supports multi-table joins (commonly mistaken as the "weakness" of Mongo). This package will give you one-line access to all common Mongo functions in simple-to-use queries.

---

## Connecting

### To connect to a server use Mongo.start()

```
Mongo.start( 
  <Is Atlas DB>, //Boolean
  <Database Name>, //String
  <IP>, //String
  <Port>, //Number or NULL
  <User>, //String or NULL
  <Password>, //String or NULL
  <x509 Certificate Path>, //String or NULL
  <Timeout in milliseconds>, //Number or NULL
  <Callback> //Function
);
```

The **database connection** object is saved in the **Object**. Indexed by the database **name**, so do not use the same database name across distinct servers.

Example:
```node
const Mongo = require( 'gmongo' )

Mongo.start( false, 'MyDatabase', '127.0.0.1', 27017, null, null, null, ( isError, errorMessage ) => {
  //Super duper awesome code here!
  console.log( isError, errorMessage )
})
```

### To Start and connect to **Multiple Servers**

WHAT?! Yes, you can connect to multiple servers in the same core, using them as objects for real-time compliances, for example:
```node
const Mongo = require( 'gmongo' )

Mongo.start( false, 'MyDatabase', '127.0.0.1', 27017, null, null, null, ( isError1, errorMessage1 ) => Mongo.start( false, 'RemoteDB1', 'remote.mydomain.com', 27017, null, null, null, ( isError2, errorMessage2 ) => Mongo.start( false, 'RemoteDB2', 'remote2.mydomain.com', 27017, null, null, null, ( isError3, errorMessage3 ) => {
  //Even more super duper awesome code here!
  console.log( isError1, errorMessage1, isError2, errorMessage2, isError3, errorMessage3 )
})))
```
---

## Common Utility Functions

### To INSERT a new row or a set of rows, use Mongo.insert()
```
Mongo.insert( 
  <Database Name>, //String 
  <Collection Name>, //String
  <ROW OR ROWS>, //A single Object to insert one, or an Array of Objects to insert many
  <Callback> //Function
) 
```

Example:
```node
Mongo.insert( 'MyDatabase', 'users', 
  { 
    username: 'jose', 
    pass: '123', 
    active: false, 
    added: ( new Date() ).getTime() 
  }, 
  () => console.log( 'all done' ) )
```

### To DELETE rows from the collection, use Mongo.delete()
```
Mongo.delete(
  <Database Name>, //String 
  <Collection Name>, //String
  <DATA TO REMOVE>, //Object
  <Callback> //Function
)
```
Example:
```node
Mongo.delete( 'MyDatabase', 'users', 
  { 
    myuser: Mongo.id( user._id ) 
  }, 
  () => console.log( 'all done' ) )
```

### To UPDATE rows in the collection use Mongo.update 
```
Mongo.update(
  <Database Name>, //String 
  <Collection Name>, //String
  <DATA TO UPDATE>, //Object
  <NEW DATA>, //Object
  <Callback> //Function
)
```
Example:
```node
Mongo.update( 'MyDatabase', 'users', 
  { 
    active: false 
  }, 
  { 
    active: true
  }, 
  () => console.log( 'all done' ) 
)
```

### To QUERY the collection use Mongo.query()
```
Mongo.query(
  <Database Name>, //String 
  <Collection Name>, //String
  <QUERY>, //Object
  <Callback> //Function, Recieves rows from query
)
```
Example:
```node
Mongo.query( 'MyDatabase', 'users', 
  { 
    active: true 
  }, 
  rowsFromQuery => console.log( rowsFromQuery ) 
)
```

### To QUERY with a SORT use Mongo.querySort
```
Mongo.querySort(
  <Database Name>, //String 
  <Collection Name>, //String
  <SORT BY>, //Object
  <QUERY>, //Object
  <Callback> //Function, Recieves rows from query
)
```
Example:
```node
Mongo.querySort( 'MyDatabase', 'users', 
  { added: 1 }, 
  { active: true }, 
rowsFromQuery => console.log( rowsFromQuery ) )
```


### To QUERY with a SORT and LIMIT, use Mongo.queryLimitSort
```
Mongo.queryLimitSort(
  <Database Name>, //String 
  <Collection Name>, //String
  <LIMIT>, //Number
  <SORT BY>, //Object
  <QUERY>, //Object
  <Callback> //Function, Recieves rows from query
)
```
Example
```node
Mongo.queryLimitSort( 'MyDatabase', 'users', 
  100, 
  { added: 1 }, 
  { active: true }, 
  rowsFromQuery => console.log( rowsFromQuery ) 
)
```

### For a SINGLE QUERY the collection use Mongo.singleQuery()
Note: singleQuery should only ever query **ONE ROW**.
```
Mongo.singleQuery(
  <Database Name>, //String 
  <Collection Name>, //String
  <QUERY>, //Object
  <Calback> //Function, Recieves a single row from query.
);
```
Example:
```node
Mongo.singleQuery( 'MyDatabase', 'users', 
  { 
    myuser: Mongo.id( user._id ) 
  }, 
  rowFromQuery => console.log( rowFromQuery ) 
)
```
This **singleQuery** is very useful in the authentication methods, e.g.
```node
Mongo.singleQuery( 'MyDatabase', 'users', 
  { loginSessionKey: req.sessionKey }, 
  rowFromQuery => res.json( rowFromQuery? true: false ) 
)
```

### To JOIN a SINGLE COLLECTION to another, use Mongo.join()
```
Mongo.singleQuery(
  <Database Name>, //String 
  <Collection Name>, //String
  <Collection ID Field>, //String
  <Name of Collection to join to>, //String
  <ID Field of collection to join to>, //String
  <Join to Element>, //String
  <Sort By>, //Object
  <Query>, // Object
  <Calback> //Function, Recieves rows from query
);
```
Example:
```node
Mongo.join( 'MyDatabase', 'users', 
  '_id', 
  'photos',
  'user_id', 
  'photos', 
  { added: 1 }, 
  { myuser: Mongo.id( user._id ) }, 
  rowsFromQuery => console.log( rowsFromQuery ) 
)
```

### To QUERY, and perform a LIST of JOINS defined in the query, use Mongo.joinsLimit()
```
Mongo.joinsLimit(
  <Database Name>, //String 
  <Collection Name>, //String
  <JOINS>, //Array of Objects
  <LIMIT>, //Number
  <SORT BY>, //Object
  <QUERY>, //Object
  <Calback> //Function, Recieves rows from query
);
```
Example
```node
const joins = [
  { from: 'photos', field: '_id', fromField: 'user_id', as: 'photos' },
  { from: 'history', field: '_id', fromField: 'user_id', as: 'transactions' }
];

Mongo.joinsLimit( 'MyDatabase', 'users', 
  joins, 
  100, 
  { added: 1 }, 
  { active: true }, 
  rowsFromQuery => console.log( rowsFromQuery ) 
)
```
---
## Securing your Mongo Server

It is not always enough to run `apt install mongo` ... we need to follow a set of installation procedures to ensure our Mongo is protected from Prying Eyes.

1. Install Stack
  
  Start with a clean server, so you know the configuration. If you are doing this on a shared server, most should be done already.

  ```bash
  apt update
  apt -y upgrade
  apt -y autoremove
  apt install -y mongodb libc6
  ```

2. Configure Mongo

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

  Edit the configuration file, in two places
  ```bash
  nano /etc/mongodb.conf
  ```
  `bind_ip = 1.1.1.1` to `bind_ip = 0.0.0.0`

  and

  ```bash
  # Turn on/off security.  Off is currently the default
  noauth = true
  #auth = true
  ```
  should become
  ```bash
  # Turn on/off security.  Off is currently the default
  #noauth = true
  auth = true
  ```

  then, restart the service

  ```bash
  service mongodb restart
  ```


### Notes: 
#### If you would like to watch the connections
```bash
tail -f /var/log/mongodb/mongodb.log
```
#### If you use UFW for the linux firewall
```bash
ufw allow 27017/tcp
```


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
