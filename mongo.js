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
	start: ( isAtlas, dbName, ip, port, user, pass, timeoutInMS, callback ) => {
		if( Array.isArray( dbName ) )	{
			let Databases = JSON.parse( JSON.stringify( dbName ) )
			const connectDB = _=> {
				const thisDB = ( ( Databases && ( Databases.length > 0 ) )? Databases.shift(): null )
				if( thisDB )  {
					db.connect( isAtlas, thisDB, ip, port, user, pass, timeoutInMS, connectDB )
				}	else {
					callback( false, null )
				}
			}
			connectDB()
		}	else {
			db.connect( isAtlas, dbName, ip, port, user, pass, timeoutInMS, callback )
		}
	},
	connect: ( isAtlas, dbName, ip, port, user, pass, timeoutInMS, callback ) => 
		mongo.connect( ( 'mongodb' + ( isAtlas? '+srv': '' ) + '://' + ( user? escape( user ): '' ) + ( ( user && pass )? ':': '' ) + ( pass? escape( pass ): '' ) + ( ( user || pass )? '@': '' ) + escape( ip ) + ( isAtlas? '': ( ':' + parseInt( port ).toString() ) ) + '/' + escape( dbName ) + '?retryWrites=true&w=majority' ), { serverSelectionTimeoutMS: ( timeoutInMS? parseInt( timeoutInMS ): DEFAULT_CONNECTION_TIMEOUT ), useNewUrlParser: true, useUnifiedTopology: true },
			( err, dataBase ) => {
				if( !err && dataBase )	{
					db.databaseList[dbName] = dataBase.db( dbName )
					db.databaseList[dbName].collection( dbName )
					callback( false, null )
				}	else	{
					callback( true, err, ( 'mongodb' + ( isAtlas? '+srv': '' ) + '://' + ( user? escape( user ): '' ) + ( ( user && pass )? ':': '' ) + ( pass? escape( pass ): '' ) + ( ( user || pass )? '@': '' ) + escape( ip ) + ( isAtlas? '': ( ':' + parseInt( port ).toString() ) ) + '/' + escape( dbName ) + '?retryWrites=true&w=majority' ) )
				}
	}),
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
				let lkData = { $lookup: { from: joinTo, localField: tableIDField, foreignField: joinToIDField, as: joinedToElement } }
				collection.aggregate( [ lkData, { $match: query } ], { $sort: sortBy } ).toArray( ( err, items ) => callback( items ) )
			});
		}
	},
	joinsLimit: ( dbName, table, joins, max, sortBy, query, callback ) => {
		if( db.databaseList[dbName] )	{
			db.databaseList[dbName].collection( table, ( err, collection ) => {
				let lookupdata = []
				for( let i = 0; i < joins.length; i++ )	{
					let lookupDataItem = { from: joins[i].from, localField: joins[i].field, foreignField: joins[i].fromField, as: joins[i].name }
					lookupdata.push( { $lookup: lookupDataItem } )
				}
				lookupdata.push( { $match: query } )
				collection.aggregate( lookupdata, { $sort: sortBy, $limit: max } ).toArray( ( err, items ) => callback( items ) )
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