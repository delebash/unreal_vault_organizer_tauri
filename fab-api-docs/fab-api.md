# List of fab api urls and example return data

## Get assets by account with page count and loop to next cursor

accountId will be in data returned when you authenticated.

> https://www.fab.com/e/accounts/{accountId}/ue/library?count=100
> 
> get next 100 using next cursor
> 
> https://www.fab.com/e/accounts/{account}/ue/library?cursor=ZW1wPTM2NyZmYWI9MzU3JnVlcz0zNTc=&count=100


Example return data:

[fab-get-assets-by-account.json](fab-get-assets-by-account.json)


## Get asset formats for unreal engine (Above api Get assets by account has this information as well as build info)

Example assetid `84fda27a-c79f-49c9-8458-82401fb37cfb` for Ultra Dynamic Sky

> https://www.fab.com/i/listings/{assetID}/asset-formats/unreal-engine

Example return data:

[asset-formats.json](asset-formats.json)

## Get asset detail by id

> https://www.fab.com/i/listings/84fda27a-c79f-49c9-8458-82401fb37cfb

Example return data:

[fab-detail.json](fab-detail.json)

# Authentication

**Documentation of some epic api's and authentication methods from this github repo:**

[Research about Epic's non-documented API](https://github.com/MixV2/EpicResearch)

**Specific method used -- Authenticating by Authorization Code**

https://github.com/MixV2/EpicResearch/blob/master/docs/auth/grant_types/authorization_code.md



**Example code -- client_id is from list of clients**

https://github.com/MixV2/EpicResearch/blob/master/docs/auth/auth_clients.md


    export const ENDPOINTS = {
    
      authenticate: function (clientId) {
        return "https://www.epicgames.com/id/login?redirectUrl=" +
          encodeURIComponent(`https://www.epicgames.com/id/api/redirect?clientId=${clientId}&responseType=code`);
      },
    
      auth_token: "https://account-public-service-prod.ak.epicgames.com/account/api/oauth/token",
    
      vault: function (accountId) {
        return `https://www.fab.com/e/accounts/${accountId}/ue/library`;
      },
    
      detail: function (listingIdentifier){
        return `https://www.fab.com/i/listings/${listingIdentifier}`;
          }
    };
    
    
    export const VARS = {
      client_id: "34a02cf8f4414e29b15921876da36f9a",
      client_cred: "daafbccc737745039dffe53d94fc76cf",
      client_cred_base64: "MzRhMDJjZjhmNDQxNGUyOWIxNTkyMTg3NmRhMzZmOWE6ZGFhZmJjY2M3Mzc3NDUwMzlkZmZlNTNkOTRmYzc2Y2Y=",
      client_ua: "UELauncher/17.0.2-37848679+++Portal+Release-Live Windows/10.0.22631.1.768.64bit",
      date_options: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }
    }


**Get authorizationCode:**

      getAuthUrl() {
        return ENDPOINTS.authenticate(VARS.client_id)
      }
  
  
This returns a json result with authorization code, manually copy this code for the below request.
  
**Get access token:**

     async authorize(authorizationCode) {
        return await utils.httpRequest(ENDPOINTS.auth_token, {
          method: 'post',
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: authorizationCode,
            token_type: 'eg1'
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${VARS.client_cred_base64}`,
            'User-Agent': VARS.client_ua
          }
        })
      }
    }

# Misc:

https://www.fab.com/i/layouts/homepage
https://www.fab.com/i/taxonomy/listing-type-groups