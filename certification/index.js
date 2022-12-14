var client;

function Certification( client ) {
    this.client=client;
}
// This is a 'Perform Search' API v3. 
Certification.prototype.getPage= function( payload, off, lst) {
        
    let offset=0;
    if (off!=null) {
        offset=off;
    }
    
    let list=[];
    if (lst!=null) {
        list=lst;
    }
    
    let limit=100;

    let url=this.client.apiUrl+'/v3/search?limit='+limit+'&offset='+offset+'&count=true';
    if (!payload) {
        return Promise.reject({
            url: 'Perform search v3',
            status: -6,
            statusText: 'Payload body is null. Cant be null'
        })
    }
    //let that=this;

    return this.client.post(url, payload)
        .then( function (resp) {
        count=resp.headers['x-total-count'];
        resp.data.forEach( function( itm ) {
            list.push(itm);
        } );
        offset+=resp.data.length;
        if (list.length<count) {
            return that.getPage(payload, offset, list);
        }
        return Promise.resolve(list);
    }, function ( err ) {
        console.log('getPage.reject');
        console.log( err );
        return Promise.reject({
            url: url,
            status: err.response.status,
            statusText: err.response.statusText
        });
    });

}

/* Check json object and return reviewer ID
 * @param {object} certification json body.
 */


Certification.prototype.getReviewerID = async function(object) {

    try{
        let query;
        if (object.type === 'SEARCH') {
            query = `attributes.displayName:${object.searchCampaignInfo.reviewer.name}`;
        } else if (object.type === 'ROLE_COMPOSITION') {
            query = `attributes.displayName:${object.roleCompositionCampaignInfo.reviewer.name}`;
        }

        let payload = {
            queryType: "SAILPOINT",
            indices: [ "identities" ],
            query: {
                query: query
            }
        }

        return this.getPage(payload)
            .then(resp => {
                return resp[0].id;
            })

    } catch (Error) {
        return Error;
    }

}

/* Check json object and return remediator ID
 * @param {object} certification json body. 
 */


Certification.prototype.getRemediatorID = async function(object) {

    try{
        // default remediator is se.admin
        let query = `attributes.displayName:se.admin`;

        let payload = {
            queryType: "SAILPOINT",
            indices: [ "identities" ],
            query: {
                query: query
            }
        }

        return this.getPage(payload)
            .then(resp => {
                return resp[0].id;
            })

    } catch (Error) {
        return Error;
    }

}


/* Check json object and return source ID
 * @param {object} certification json body. 
 */


Certification.prototype.getSourceID = async function(object, sourceName) {

    try{

        function checkforSource(json) {
            return json.name == sourceName;
        }

        return this.client.Sources.list()
            .then(resp => {
                return resp.find(checkforSource).id;
            })

    } catch (Error) {
        return Error;
    }

}
/* Check json object whether it has required value and add necessary ID(S) based on types
 * @param {object} certification json body.
 */

Certification.prototype.checkCampaign = function(object) {
    // check if object has required items (name, description, type)
    if (!object.name) {
        return Promise.reject({
            url: 'Certification.checkCampaign',
            status: -6,
            statusText: 'No name specified for creation'
        });
    } else if (!object.description) {
        return Promise.reject({
            url: 'Certification.checkCampaign',
            status: -6,
            statusText: 'No description specified for creation'
        });
    } else if (!object.type) {
        return Promise.reject({
            url: 'Certification.checkCampaign',
            status: -6,
            statusText: 'No type specified for creation'
        });

    } else {
        console.log('all checks pass');
        // Add necessary ID(s) based on the Campaign type
        // For search campaign that has reviewer:  search for the reviewer ID
        if (object.type === "SEARCH") {

            if (object.searchCampaignInfo.reviewer) {
                return this.getReviewerID(object)
                    .then(resp => {
                        object.searchCampaignInfo.reviewer.id = resp;
                        return object;
                    })
                    .catch(err => {
                        return err;
                    })
            } else {
                return Promise.resolve(object);
            }
        // For role composition campaign:  search for the remediator and reviewer ID
        } else if (object.type === "ROLE_COMPOSITION") {

            return this.getRemediatorID(object)
                .then(remediatorId => {
                    console.log(`Remediator ID: ${remediatorId}`);
                    object.roleCompositionCampaignInfo.remediatorRef.id = remediatorId;
                    return object;
                })
                .then(object => {
                    if (object.roleCompositionCampaignInfo.reviewer) {
                        return this.getReviewerID(object)
                            .then (reviewerId => {
                                console.log(`Reviewer ID: ${reviewerId}`);
                                object.roleCompositionCampaignInfo.reviewer.id = reviewerId;
                                return object;
                            })
                    } else {
                        return Promise.resolve(object);
                    }
                })
                .catch (err => {
                    return err;
                })

        //For source owner campaign: search for the source ID
        } else if (object.type === "SOURCE_OWNER") {

            // Manually do PRISM / Active Directory source
            if (object.name.includes("PRISM")) {
                return this.getSourceID(object, "PRISM")
                .then(id => {
                    object.sourceOwnerCampaignInfo.sourceIds.push(id);
                    return object;
                })
                .catch (err => {
                    return err;
                })
            } else if (object.name.includes("Active Directory")) {
                return this.getSourceID(object, "Active Directory")
                .then(id => {
                    object.sourceOwnerCampaignInfo.sourceIds.push(id);
                    return object;
                })
                .catch (err => {
                    return err;
                })
            }
         // If this is a manager campaign, do nothing..
        } else {
            return Promise.resolve(object);
        }
    }
}



/* Create a new certification campaign with information in object parameter
 * @param {object} certification json body. ex:
 * {
 *      "name" : "Manager Campaign",
 *      "description" : "Every manager needs to review this campaign",
 *      "type" : "SOURCE_OWNER"
 *      "deadline": "2020-03-15T10:00:01.456Z"
 * }
 */

Certification.prototype.creagiteCampaign = function (object) {

    
    const url = `${this. client.apiUrl}/beta/campaigns`;
    const options = {
        contentType: 'application/json',
        formEncoded: false,
    }

    const post = (object) => {
        //AXIOS POST return promises, store promise in 'result' variable
        return this.client.post(url, object, options)
            .then(resp => {
                return resp.data;
            }).catch( err => {
                if (!err.statusText) {
                    console.log('err with no statusText calling certification.create /beta/campaigns');
                    console.log(err);
                }
                return Promise.reject({
                    url: 'Certification.createCampaign',
                    status: -9,
                    statusText: err.statusText || err.exception_message
                });
            })
    }

    // run checkCampaign()

    return this.checkCampaign(object)
        .then(object => {
            return post(object);
        })
        .then(resp => {
            return resp;
        })
        .catch (err => {
            return err;
        })

}

/* Create a new certification campaign template with information in object parameter
 *  @param {object} certification json body. ex:
 * {
 *      "name" : "Manager Campaign",
 *      "description" : "Everyone needs to review this campaign",
 *      "campaign" : {
 *         "name" : "Manager campaign", 
 *         "description" : "this is a manager template"
 *         "type" : "MANAGER",
 *         "emailNotificationEnabled" : true,
 *       }
 *      "deadlineDuration" : "P2W"
 * }
 */

Certification.prototype.createTemplate = function (object) {

    // check if object has required items (name, description, campaign object)
    if (!object.name) {
        return Promise.reject({
            url: 'Certification.createTemplate',
            status: -6,
            statusText: 'No name specified for creation'
        });
    } else if (!object.description) {
        return Promise.reject({
            url: 'Certification.createTemplate',
            status: -6,
            statusText: 'No description specified for creation'
        });
    } else if (!object.campaign) {
        return Promise.reject({
            url: 'Certification.createTemplate',
            status: -6,
            statusText: 'No campaign object specified for creation'
        });
    }

    const url = `${this. client.apiUrl}/beta/campaign-templates`;
    const options = {
        contentType: 'application/json',
        formEncoded: false,
    }
    const post = (object) => {
        //AXIOS POST return promises, store promise in 'result' variable
        return this.client.post(url, object, options)
            .then(resp => {
                return resp.data;
            }).catch( err => {
                if (!err.statusText) {
                    console.log('err with no statusText calling certification.create /beta/campaigns');
                    console.log(err);
                }
                return Promise.reject({
                    url: 'Certification.createCampaign',
                    status: -9,
                    statusText: err.statusText || err.exception_message
                });
            })
    }
    

    // run checkCampaign() againts the campaign value
    return this.checkCampaign(object.campaign)
        .then(campaignWithIds => {
            // then replace the key value
            object.campaign = campaignWithIds;
            return post(object);
        })
        .then(resp => {
            return resp;
        })
        .catch (err => {
            return err;
        })

}



/* List Campaign Template
 * No object parameter is needed
 */

Certification.prototype.listTemplate = function() {

    let url = this.client.apiUrl + '/beta/campaign-templates';
    //let that = this;

    //AXIOS GET return promises, store promise in 'result' variable
    let result = this.client.get(url)
        .then(function(resp) {
            if (resp.data){
                return resp.data;
            } else {
                return Promise.reject({
                    url: 'Certification.list',
                    status: -9,
                    statusText: 'No data is returned'
                });
            }
        }).catch( err => {
            if (!err.statusText) {
                console.log('err with no statusText calling certification.list /beta/campaign-templates');
                console.log(err);
            }
            return Promise.reject({
                url: 'Certification.list',
                status: -9,
                statusText: err.statusText || err.exception_message
            });
        })
    return result;
}

/* Create a new certification campaign template with information in object parameter
 *  @param {string} campaign id - ex: 27cff0281ae647c4b4917e5bdd48c3dc
 */


Certification.prototype.generate = function(id) {

    let url = `${this.client.apiUrl}/beta/campaign-templates/${id}/generate`;
    console.log(`Generating Campaign from Templates ${id}`);

    const options = {
        contentType: 'application/json',
        formEncoded: false,
    }

    // AXIOS POST return promises
    let result = this.client.post(url, options)
    .then(resp => {
        return resp.data;
    }).catch( err => {
        if (!err.statusText) {
            console.log('err with no statusText calling certification.generate');
            console.log(err);
        }
        return Promise.reject({
            url: 'Certification.generate',
            status: -9,
            statusText: err.statusText || err.exception_message
        });
    })
    return result;

}
module.exports = Certification;