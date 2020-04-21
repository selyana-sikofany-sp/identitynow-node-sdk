# Node SDK for IdentityNow #

This is a node module for interacting with IdentityNow.

## Import ##
`const idnClient=require('identitynow-client');`

## Authorization ##

Authorization needs to be configured during instantiation. The following fields need to be passed in:
| | |
|---|---| 
| Tenant | Name of the IDN Tenant
| clientID | Client ID for your API Client or Personal Access Token (PAT)
| clientSecret | Secret for your API Client or PAT
| callbackURL | Address your local listener or server will be running on. Only required for interactive user auth
| userAuthenticate | boolean flag to indicate OAuth user authentication should be performed. (Optional)

This can be performed in a block like this:

```
const config={
    tenant: 'readme',
    clientID: 'b0b15abaddad',
    clientSecret: '900dc0ffee',
    callbackURL: 'http://localhost:5000/auth/identitynow/callback',
    userAuthenticate: true
}

const client=idnClient.Create( config );

```

ClientID and Secret are generated on the Admin page Global->Security Settings->API Management. a PAT can only (currently) be generated through REST API calls. Both are outside the scope of this document.

if userAuthenticate is set to true, when a call is made to IdentityNow a browser window will be opened for the user to authenticate. If the user is already authenticated in the browser, then the window will immediately close and execution will continue.

*NOTE* If you wish to perform API activities that require an ORG_ADMIN connection, you will need to step up in the browser before running your code

Once you have an authenticated client, the following actions are available

**NOTE** Unless otherwise specified, all methods will return a Promise

## Sources ##

### List ###
```
  var sources = client.Sources.List();
```

### Get ###

Get a specific source by ID
```
    var source = client.Sources.get( 'abcdef1234' );
```

Get a 'clean' version of the source. Strips out all IDs as they will only be accurate in the tenant the source is extracted from
```
    var source = client.Sources.get( 'abcdef1234', { clean: true } );
```

Get an 'exported' version of the source. This will collect sub-objects (such as Schemas) and bundle them in the response.
```
    var source = client.Sources.get( 'abcdef1234', { clean: true, export: true } );
```
This will return something like:
```{
    source: { <source data> },
    schemas: [
        { <schema data> },
        { <schema data> }
    ]
}
```

### Create ###

Create a new source
```
client.Sources.create( object );
```
When creating a source, the object passed in can contain all the sub-objects (schemas etc.) associated with the source. At a minimum, it must contain a definition of the source:
```
{
    source: {
        description: 'My Source',
        ...
    }
}
```
It can also contain Schemas (this list continues to be extended)

Owner and Cluster can be specified by name; the SDK will look up the relevant ID in the IDN tenant


### Update ###
TODO

### Delete ###
```
var source=client.Sources.delete( 'abcdef1234' )
```

## Schemas ##

### List ###
```
  var sources = client.Schemas.List();
```

### Get ###

Get a specific source by ID
```
    var source = client.Schemas.get( 'abcd1234' );
```

### Create ###

```
client.Schemas.create( 'abcdef1234', object );
```
Create a schema. Pass in the ID of the Source, and the object representing the schema

### Update ###
TODO

### Delete ###
```
client.Schemas.delete( 'abcdef1234', 'badc0ffee' ).then( function( ok ){
    ....
})
```
Delete a schema. Pass in the ID of the Source, and the ID of the schema

## Transforms ##

### List ###
```
  var sources = client.Transforms.List();
```

### Get ###

Get a specific transform by ID
```
    client.Schemas.get( 'ToUpper' ).then( function (transform) {
        ....
    });
```

### Create ###
TODO

### Update ###
TODO

### Delete ###
TODO

## Account Profiles ##

### List ###
```
client.AccountProfiles.list( 'abcdef1234' ).then( function( profiles ) {
    ....
});
```
Returns a list of account profiles for the specified source. Returns an Array

### Get ###
```
client.AccountProfiles.get( 'abcdef1234', 'Create' ).then( function( profile ) {
    ....
});
```
Returns the account profile for the specified source and Usage