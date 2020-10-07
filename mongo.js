const mongo		=	require( 'mongodb' ).MongoClient
const objectid	=	require( 'mongodb' ).ObjectID

const DEFAULT_CONNECTION_TIMEOUT = 30000

const db = {
	db: null,
	retryTimeout: 100,
	insertList: {},
	deleteList: {},
	updateList: {},
	databaseList: {},
	id: name => objectid( name ),
	start: ( isAtlas, dbName, ip, port, user, pass, x509, timeoutInMS, callback ) => {
		if( Array.isArray( dbName ) )	{
			let Databases = JSON.parse( JSON.stringify( dbName ) )
			const connectDB = _=> {
				const thisDB = ( ( Databases && ( Databases.length > 0 ) )? Databases.shift(): null )
				if( thisDB )  {
					db.connect( isAtlas, thisDB, ip, port, user, pass, x509, timeoutInMS, connectDB )
				}	else {
					callback( false, null )
				}
			}
			connectDB()
		}	else {
			db.connect( isAtlas, dbName, ip, port, user, pass, x509, timeoutInMS, callback )
		}
	},
	connect: ( isAtlas, dbName, ip, port, user, pass, x509, timeoutInMS, callback ) => {
		let connectOptions = { serverSelectionTimeoutMS: ( timeoutInMS? parseInt( timeoutInMS ): DEFAULT_CONNECTION_TIMEOUT ), useNewUrlParser: true, useUnifiedTopology: true }
		if( x509 )	{
			connectOptions.tls = true
			connectOptions.tlsCertificateKeyFile = x509
		}
		mongo.connect( ( 'mongodb' + ( isAtlas? '+srv': '' ) + '://' + ( user? escape( user ): '' ) + ( ( user && pass )? ':': '' ) + ( pass? escape( pass ): '' ) + ( ( user || pass )? '@': '' ) + escape( ip ) + ( isAtlas? '': ( ':' + parseInt( port ).toString() ) ) + '/' + escape( dbName ) + '?retryWrites=true&w=majority' + ( x509? '&authMechanism=MONGODB-X509': '' ) ), connectOptions,
			( err, dataBase ) => {
				if( !err && dataBase )	{
					db.databaseList[dbName] = dataBase.db( dbName )
					db.databaseList[dbName].collection( dbName )
					callback( false, null )
				}	else	{
					callback( true, err )
				}
		})
	},
	insert: ( dbName, table, rowOrRows, callback ) => {
		if( db.databaseList[dbName] )	{
			if( db.insertList[table] )	{
				setTimeout( _=> db.insert( dbName, table, rowOrRows, callback ), db.retryTimeout )
			}	else	{
				db.databaseList[dbName].collection( table, ( err, collection ) => {
					if( Array.isArray( rowOrRows ) )	{
						db.insertList[table] = 1
						collection.insertMany( rowOrRows, ( err, result ) => db.insertDone( table, callback, ( err? null: result ) ) )
					}	else	{
						db.insertList[table] = 1
						collection.insertOne( rowOrRows, ( err, result ) => db.insertDone( table, callback, ( err? null: result.insertedId ) ) )
					}
				})
			}
		}
	},
	insertDone: ( table, callback, insertedId ) => {
		if( db.insertList[table] )	{
			db.insertList[table]--
			if( db.insertList[table] < 1 )	{
				delete db.insertList[table]
			}
		}
		if( callback )	{
			callback( insertedId )
		}
	},
	delete: ( dbName, table, dataToRemove, callback ) => {
		if( db.databaseList[dbName] )	{
			if( db.deleteList[table] )	{
				setTimeout( _=> db.delete( dbName, table, dataToRemove, callback ), db.retryTimeout )
			}	else	{
				db.deleteList[table] = true;
				db.databaseList[dbName].collection( table, ( err, collection ) => collection.deleteMany( dataToRemove, _=> db.deleteDone( table, callback ) ) )
			}
		}
	},
	deleteDone: ( table, callback ) => {
		if( db.deleteList[table] )	{
			delete db.deleteList[table]
		}
		if( callback )	{
			callback()
		}
	},
	update: ( dbName, table, dataToUpdate, newData, callback ) => {
		if( db.databaseList[dbName] )	{
			if( db.updateList[table] )	{
				setTimeout( _=> db.update( dbName, table, dataToUpdate, newData, callback ), db.retryTimeout )
			}	else	{
				db.updateList[table] = true
				db.databaseList[dbName].collection( table, ( err, collection ) => collection.updateMany( dataToUpdate, { $set: newData }, _=> db.updateDone( table, callback ) ) )
			}
		}
	},
	updateDone: ( table, callback ) => {
		if( db.updateList[table] )	{
			delete db.updateList[table]
		}
		if( callback )	{
			callback()
		}
	},
	singleQuery: ( dbName, table, query, callback ) => {
		if( db.databaseList[dbName] )	{
			db.databaseList[dbName].collection( table, ( err, collection ) => collection.findOne( query, ( err, item ) => callback( item ) ) );
		}
	},
	query: ( dbName, table, query, callback ) => {
		if( db.databaseList[dbName] )	{
			db.databaseList[dbName].collection( table, ( err, collection ) => collection.find( query ).toArray( ( err, items ) => callback( items ) ) );
		}
	},
	join: ( dbName, table, tableIDField, joinTo, joinToIDField, joinedToElement, sortBy, query, callback ) => {
		if( db.databaseList[dbName] )	{
			db.databaseList[dbName].collection( table, ( err, collection ) => {
				collection.aggregate( [ { $match: query }, { $lookup: { from: joinTo, localField: tableIDField, foreignField: joinToIDField, as: joinedToElement } }, { $sort: sortBy } ] ).toArray( ( err, items ) => callback( items ) )
			})
		}
	},
	querySort: ( dbName, table, sortBy, query, callback ) => {
		if( db.databaseList[dbName] )	{
			db.databaseList[dbName].collection( table, ( err, collection ) => collection.find( query ).sort( sortBy ).toArray( ( err, items ) => callback( items ) ) )
		}
	},
	queryLimitSort: ( dbName, table, max, sortBy, query, callback ) => {
		if( db.databaseList[dbName] )	{
			db.databaseList[dbName].collection( table, ( err, collection ) => collection.find( query ).limit( max ).sort( sortBy ).toArray( ( err, items ) => callback( items ) ) )
		}
	}
}

module.exports = db
