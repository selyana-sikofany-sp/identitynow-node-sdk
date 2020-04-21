var client;

function AccountProfiles( client ) {

    this.client=client;


}

AccountProfiles.prototype.list=function( id ) {
        
    let url=this.client.apiUrl+'/cc/api/accountProfile/list/';
    let that=this;
    
    return this.client.Sources.get( id ).then( function( resp ) {
        
        return that.client.get(url+resp.connectorAttributes.cloudExternalId).then(
            function (resp) {
                return Promise.resolve(resp.data);
            }
            , function (err) {
                return Promise.reject({
                    url: url,
                    status: err.response.status,
                    statusText: err.response.statusText
                });
            });
        }, function (err) {
            return Promise.reject({
                url: url,
                status: err.response.status,
                statusText: err.response.statusText
            });
        });
        
        
    }
    
AccountProfiles.prototype.get = function get ( id, usage) {
        
    let that=this;
    return this.client.Sources.get( id ).then( function( resp ) {
        
        let url=that.client.apiUrl+'/cc/api/accountProfile/get/'+resp.connectorAttributes.cloudExternalId+'?usage='+usage;
        return that.client.get(url).then(
            function (resp) {
            return Promise.resolve(resp.data);

        }
        , function (err) {
            return Promise.reject({
                url: url,
                status: err.response.status,
                statusText: err.response.statusText
            });
        });
    }, function (err) {
        return Promise.reject({
            url: url,
            status: err.response.status,
            statusText: err.response.statusText
        });
    });
}


AccountProfiles.prototype.update = function( id, profile ) {

    return this.client.Sources.get( id ).then( function( resp ) {
        
        let url=this.client.apiUrl+'/cc/api/accountProfile/update/'+resp.connectorAttributes.cloudExternalId;
        return this.client.post(url, profile).then( function (resp) {
            return Promise.resolve(resp.data);            
        }
        , function (err) {
            return Promise.reject({
                url: url,
                status: err.response.status,
                statusText: err.response.statusText
            });
        });
    }, function (err) {
        return Promise.reject({
            url: url,
            status: err.response.status,
            statusText: err.response.statusText
        });
    });
}

module.exports = AccountProfiles;