# List of fab api urls and example return data

## Authentication needed for below api urls

### Get assets by account with page count and loop to next cursor

accountId will be in data returned after you have [authenticated](#authentication)

> https://www.fab.com/e/accounts/{accountId}/ue/library?count=100
> 
> get next 100 using next cursor
> 
> https://www.fab.com/e/accounts/{account}/ue/library?cursor=ZW1wPTM2NyZmYWI9MzU3JnVlcz0zNTc=&count=100
>
> Example return data:
> 
> [fab-get-assets-by-account.json](fab-get-assets-by-account.json)


## No authentication needed for below api urls

### Get asset formats for unreal engine (api Get assets by account has this information as well as build info)

Example assetId `84fda27a-c79f-49c9-8458-82401fb37cfb` for Ultra Dynamic Sky

> https://www.fab.com/i/listings/{assetID}/asset-formats/unreal-engine
>
> Example return data:
> 
> [asset-formats.json](asset-formats.json)


### Get asset detail by id

> https://www.fab.com/i/listings/84fda27a-c79f-49c9-8458-82401fb37cfb
>
> Example return data:
> 
> [fab-detail.json](fab-detail.json)


### Get tags lookup data (all tags available to use for any product)

> https://www.fab.com/i/tags
>
> Example return data:
> 
> [fab-tags.json](fab-tags.json)

### taxonamy-license

> https://www.fab.com/i/taxonomy/licenses
>
> Example return data:
> 
> [taxonomy-licenses.json](taxonomy-licenses.json)


### search by seller

> https://www.fab.com/i/listings/search?seller=Velarion
> 
> Example return data:
> 
> [listing-search-by-seller.json](listing-search-by-seller.json)

## Requires different authentication method maybe use puppeteer

Example puppeteer node app

https://github.com/delebash/puppeteer_epic_games_auth

### listing-states

> https://www.fab.com/i/users/me/listings-states/967505ae-397f-498a-ab4e-1166ff3d2978?

> https://www.fab.com/i/users/me/listings-states?listing_ids=16c7386a-a699-48fa-8361-18d57d1d24d3&listing_ids=4d40d3b0-d964-4b71-ab0d-de15e3cebff8&listing_ids=710bb906-5a72-452a-b80d-4795cbdd382c&listing_ids=b4f01806-75cc-4538-812b-e834fdbe032f
>
> Example return data:
> 
> [listing-states.json](listing-states.json)


### ownership

> https://www.fab.com/i/listings/967505ae-397f-498a-ab4e-1166ff3d2978/ownership
>
> Example return data:
> 
> [ownership.json](ownership.json)


### cart

> https://www.fab.com/i/cart

### old bulk

> https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace/{{account_id}}/bulk/items?includeDLCDetails=false&includeMainGameDetails=false&country=US&locale=en

# Authentication method example:

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

# Mis api urls:

https://www.fab.com/i/layouts/homepage

https://www.fab.com/i/taxonomy/listing-type-groups