import {ENDPOINTS, VARS} from './globals'
import {db} from './db.js'
import {fetch} from '@tauri-apps/plugin-http';
import {eventBus} from "boot/global-components.js";
// import { invoke } from '@tauri-apps/api/core';
// const invoke = window.__TAURI__.core.invoke;

export const api = {

  async getUserSettings(id = 1) {
    return db.userSettings.get(id)
  },
  async saveUserSettings(data, id = 1) {
    const user = await this.getUserSettings(id)
    if (user === undefined) {
      //add id for new user only 1 user currently
      data.id = id
      await db.userSettings.add(data)
    } else {
      await db.userSettings.update(id, {...data})
    }
  },
  async updateVaultAsset(assetId, data) {
    await db.vaultLibrary.update(assetId, data)
  },
  getAuthUrl() {
    return ENDPOINTS.authenticate(VARS.client_id)
  },
  async isAuthDataValid() {
    let userSettings = await this.getUserSettings()
    if (userSettings?.auth) {
      let authData = userSettings.auth
      if (authData.access_token && new Date() < new Date(authData.expires_at)) {
        return true;
      } else if (authData.access_token && new Date() < new Date(authData.refresh_expires_at)) {
        showErrorMessage('Access token expired.  On your settings tab please request a new authorization code to get a new access token.')
        console.log('Auth expired.');
        return false;
      }
    } else {
      showErrorMessage('Access token invalid.  On your settings tab please request a new authorization code to get a new access token.')
      console.log('Auth invalid.');
      return false;
    }
    return false
  },
  async authorize(authorizationCode) {
    return await httpRequest(ENDPOINTS.auth_code, {
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
  },
  async loadVault() {
    return await db.vaultLibrary.toArray()
  },
  async importVault() {
    let userSettings = await this.getUserSettings()
    let authData = userSettings.auth
    let url = ENDPOINTS.vault(authData.account_id)
    let options = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${authData.token_type} ${authData.access_token}`,
        'User-Agent': VARS.client_ua
      }
    }

    const response = await httpRequest(url, options)
    await this.saveVaultData(response)

  },
  async saveVaultData(data) {
    if (data.results && data.results.length > 0) {
      for (let asset of data.results) {
        // let buildVersion
        // let thumbnail_url = catalog_item.images[0]?.url
        // let ue_versions = catalog_item.projectVersions[0].engineVersions
        // let orderedVersions = lodash.orderBy(catalog_item.projectVersions.buildVersions, ['buildVersion'], ['desc']);
        // let version = orderedVersions[0]
        // if (version) {
        //   buildVersion = version.buildVersion
        // }

        // let vaultItem = {
        //   description: catalog_item.description,
        //   title: catalog_item.title,
        //   thumbnail_url: thumbnail_url,
        //   buildVersion: buildVersion,
        //   ue_version: ue_versions,
        //   url: catalog_item.url,
        //   artifactId: catalog_item.artifactId,
        // }


        let asset1 = {
          "assetId": "89efe5924d3d467c839449ab6ab52e7f",
          "assetNamespace": "89efe5924d3d467c839449ab6ab52e7f",
          "categories": [
            {
              "id": "0a4f7590-4376-400b-a6e4-c7a658cbab47",
              "name": "Humans"
            }
          ],
          "description": "Paragon: Kallari",
          "distributionMethod": "ASSET_PACK",
          "images": [
            {
              "md5": null,
              "type": "Featured",
              "url": "https://media.fab.com/image_previews/gallery_images/2b20d84c-1d20-4228-b9c1-604d2a468e08/f3204a85-df23-4d1f-a8d6-ffabbe19e19e.jpg",
              "width": "640",
              "height": "349",
              "uploadedDate": "2024-10-17T08:59:44.005557Z"
            }
          ],
          "projectVersions": [
            {
              "artifactId": "ParagonKallari",
              "engineVersions": [
                "UE_4.19",
                "UE_4.20",
                "UE_4.21",
                "UE_4.22",
                "UE_4.23",
                "UE_4.24",
                "UE_4.25",
                "UE_4.26",
                "UE_4.27",
                "UE_5.0",
                "UE_5.1",
                "UE_5.2",
                "UE_5.3",
                "UE_5.4"
              ],
              "targetPlatforms": [
                "Windows"
              ],
              "buildVersions": [
                {
                  "buildVersion": "4.21.0-4393602+++depot+UE4-UserContent-Windows",
                  "platform": "Windows"
                }
              ]
            }
          ],
          "source": "fab",
          "title": "Paragon: Kallari",
          "url": "https://www.fab.com/listings/ec8f2cb8-f904-4473-902f-67ade18bd225",
          "customAttributes": [
            {
              "ListingIdentifier": "ec8f2cb8-f904-4473-902f-67ade18bd225"
            }
          ],
          "legacyItemId": "b8bb5e8b8c63428aa5fd73525c2eddad"
        }

        let asset_row = await db.vaultLibrary.where('assetId').equals(asset.assetId).first()
        if (asset_row === undefined) {
          await db.vaultLibrary.put({
            assetId: asset.assetId,
            asset: asset
          })
        } else {
          await db.vaultLibrary.update(asset.assetId, {
            asset: asset
          })
        }
      }
    }
  },
  async testDatat() {
    let data = [{
      "assetId": "15bc890e1f044d0fae93d38ae84fdfe2",
      "assetNamespace": "ue",
      "categories": [
        {
          "id": "assets/megascans",
          "name": null
        }
      ],
      "description": "A high quality pack of clovers, grass and weeds created from real world scan data.",
      "distributionMethod": "ASSET_PACK",
      "images": [
        {
          "md5": "84274c7f669b1f8d312b800f1020f985",
          "type": "Featured",
          "url": "https://cdn1.epicgames.com/ue/product/Featured/MegascansMeadowPack_featured-894x488-84274c7f669b1f8d312b800f1020f985.png",
          "width": "894",
          "height": "488",
          "uploadedDate": "2017-10-12T12:37:37.213Z"
        }
      ],
      "projectVersions": [
        {
          "artifactId": "Megascan15bc890e1f044d0fae93d38ae84fdfe2V2",
          "engineVersions": [
            "UE_4.18"
          ],
          "targetPlatforms": [
            "Windows",
            "Mac"
          ],
          "buildVersions": [
            {
              "buildVersion": "4.18.0-3743933+++depot+UE4-UserContent-Windows",
              "platform": "Windows"
            },
            {
              "buildVersion": "4.18.0-3743933+++depot+UE4-UserContent-Mac",
              "platform": "Mac"
            }
          ]
        },
        {
          "artifactId": "Megascan15bc890e1f044d0fae93d38ae84fdfe2V1",
          "engineVersions": [
            "UE_4.15",
            "UE_4.16",
            "UE_4.17"
          ],
          "targetPlatforms": [
            "Windows",
            "Mac"
          ],
          "buildVersions": [
            {
              "buildVersion": "4.18.0-3695413+++depot+UE4-UserContent-Windows",
              "platform": "Windows"
            },
            {
              "buildVersion": "4.18.0-3695413+++depot+UE4-UserContent-Mac",
              "platform": "Mac"
            }
          ]
        },
        {
          "artifactId": "Megascan15bc890e1f04V3",
          "engineVersions": [
            "UE_4.19"
          ],
          "targetPlatforms": [
            "Windows",
            "Mac"
          ],
          "buildVersions": [
            {
              "buildVersion": "4.18.0-4057892+++depot+UE4-UserContent-Mac",
              "platform": "Mac"
            },
            {
              "buildVersion": "4.18.0-4057892+++depot+UE4-UserContent-Windows",
              "platform": "Windows"
            }
          ]
        },
        {
          "artifactId": "Megascan15bc890e1f04V6",
          "engineVersions": [
            "UE_4.22",
            "UE_4.23",
            "UE_4.24",
            "UE_4.25",
            "UE_4.26",
            "UE_4.27",
            "UE_5.0",
            "UE_5.1",
            "UE_5.2",
            "UE_5.3"
          ],
          "targetPlatforms": [
            "Windows",
            "Mac"
          ],
          "buildVersions": [
            {
              "buildVersion": "4.21.0-7092014+++depot+UE4-UserContent-Windows",
              "platform": "Windows"
            },
            {
              "buildVersion": "4.21.0-7092014+++depot+UE4-UserContent-Mac",
              "platform": "Mac"
            }
          ]
        },
        {
          "artifactId": "Megascan15bc890e1f04V4",
          "engineVersions": [
            "UE_4.20"
          ],
          "targetPlatforms": [
            "Windows",
            "Mac"
          ],
          "buildVersions": [
            {
              "buildVersion": "4.21.0-4405929+++depot+UE4-UserContent-Windows",
              "platform": "Windows"
            },
            {
              "buildVersion": "4.21.0-4405929+++depot+UE4-UserContent-Mac",
              "platform": "Mac"
            }
          ]
        },
        {
          "artifactId": "Megascan15bc890e1f04V5",
          "engineVersions": [
            "UE_4.21"
          ],
          "targetPlatforms": [
            "Mac",
            "Windows"
          ],
          "buildVersions": [
            {
              "buildVersion": "4.21.0-7092032+++depot+UE4-UserContent-Windows",
              "platform": "Windows"
            },
            {
              "buildVersion": "4.21.0-7092032+++depot+UE4-UserContent-Mac",
              "platform": "Mac"
            }
          ]
        }
      ],
      "source": "uem",
      "title": "Megascans - Meadow Pack",
      "url": "https://www.unrealengine.com/marketplace/en/product/megascans-meadow-pack",
      "customAttributes": null,
      "legacyItemId": null
    }]

    for (let catalog_item of data) {
      // const catalog_row = await db.vaultLibrary.where('key').equals(catalog_item.assetId).first()
      let catalog_row = await db.vaultLibrary.get(catalog_item.assetId);
      if (catalog_row === undefined) {
        await db.vaultLibrary.add({asset: catalog_item}, catalog_item.assetId)
      } else {
        await db.vaultLibrary.update(catalog_item.assetId, {asset: catalog_item})
      }
    }
  },
  async getProjectVersion() {

    // console.log()
    // let arrybuildVersion = []
    //
    // for (let projectVersion of catalog_item.projectVersions) {
    //   let artifactId=projectVersion.artifactId
    //   let buildVersion=projectVersion.buildVersions[0].buildVersion
    //   let engineVersions=projectVersion.engineVersions
    //   let obj = {artifactId,buildVersion,engineVersions};
    //   arrybuildVersion.push(obj)
    // }
    // }
    // console.log(arrybuildVersion)
    // console.log(arrybuildVersion)
    // let orderedVersions = lodash.orderBy(arrybuildVersion, ['buildVersion'], ['asc']);
    //  console.log(orderedVersions)
  },
}

async function httpRequest(url, options) {
  let response
  try {
    response = await fetch(url, options);
    if (response.ok) {
      return await response.json()
    } else {
      console.error(response.statusText)
      showErrorMessage(response.statusText)
    }
  } catch (err) {
    console.error(err)
    showErrorMessage(err)
  }
  return false
}

function showErrorMessage(msg) {
  let data = {}
  data.message = msg
  data.type = 'error'
  eventBus.emit('showMessage', data)
}
