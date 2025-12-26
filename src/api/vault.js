import {db} from "src/api/db.js";
import {utils} from "src/utils/utils.js";
import {ENDPOINTS, VARS} from "src/utils/globals.js";
import {normalize} from "@tauri-apps/api/path";
import {exists, readDir} from "@tauri-apps/plugin-fs";
import {manifest} from "src/utils/manifest.js";
import {settings} from "./setting.js"
import {data} from "autoprefixer";

let loadingMsg = {}

export const vault = {
  async updateVaultAsset(assetId, data) {
    await db.vaultLibrary.update(assetId, data)
  },
  async loadVault() {
    let userSettings = await settings.getUserSettings()
    let assets = await db.vaultLibrary.toArray()
    if (userSettings?.cachePath && userSettings?.cachePath !== '' && userSettings !== undefined && assets.length > 0) {
      loadingMsg.show = true
      loadingMsg.msg = "Please wait while your vault is loading."
      utils.showLoading(loadingMsg)
      let bSucess = false, bUpdatesAvailable = false

      bSucess = await this.updateInstalledProjects(userSettings.cachePath)

      let installedProjects = await db.installedProjects.toArray()
      for (let project of installedProjects) {
        for (let i = 0; i < assets.length; i++) {
          let result = utils.findByArtifactId(assets[i], project.AppNameString)
          if (result !== null) {
            if (result.buildVersion !== project.buildVersionString) {
              assets[i].updatesAvailable = true
              bUpdatesAvailable = true
              break;
            } else {
              assets[i].updatesAvailable = false
              break;
            }
          }
        }
      }

      await utils.waitMilliseconds(2000)
      loadingMsg.show = false
      utils.showLoading(loadingMsg)
      if (bUpdatesAvailable === true) {
        utils.showNotification('Updates Available! Filter the Updates Available column to true', 'positive')
      }
      return assets
    }
  },


  async importVault(count = 2000) {
    let userSettings = await settings.getUserSettings()
    let authData = userSettings.auth
    let url = new URL(ENDPOINTS.vault(authData.account_id));
    url.searchParams.set("count", count.toString());
    let options = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${authData.token_type} ${authData.access_token}`,
        'User-Agent': VARS.client_ua
      }
    }

    let data = []
    let continueLoop = true
    loadingMsg.show = true
    let msg = "Please wait while your vault is being downloaded."
    loadingMsg.msg = msg
    utils.showLoading(loadingMsg)
    let authFailure = false

    while (continueLoop === true) {
      const json_response = await utils.httpRequest(url, options)
      if (json_response !== undefined) {
        let next = json_response?.cursors?.next
        let results = json_response?.results
        if (next === null) {
          if (results.length > 0) {
            data.push(...results)
            loadingMsg.msg = msg + ' Finished downloading, total asset count = ' + data.length
            utils.showLoading(loadingMsg)
            await utils.waitMilliseconds(2000)
          }
          continueLoop = false
        } else {
          url.searchParams.set("cursor", next);
          data.push(...results)
          loadingMsg.msg = msg + ' Assets downloaded ' + data.length
          utils.showLoading(loadingMsg)
        }
      } else {
        authFailure = true
        continueLoop = false
      }
    }
    if (authFailure) {
      loadingMsg.show = false
      utils.showErrorMessage('Error with authorization.  On your settings tab please request a new authorization code to get a new access token.')
    } else {
      loadingMsg.msg = "Begin parsing data"
      utils.showLoading(loadingMsg)
      await this.saveVaultData(data)
      loadingMsg.show = true
      loadingMsg.msg = "Finished parsing data"
      utils.showLoading(loadingMsg)
      await this.importAssetDetail()
      loadingMsg.msg = "Finished additional asset details download"
      utils.showLoading(loadingMsg)
      await utils.waitMilliseconds(2000)
      loadingMsg.show = false
      utils.showLoading(loadingMsg)
    }
  },

  async saveVaultData(data) {
    try {
      if (data.length > 0) {
        console.time()
        await db.vaultLibrary.bulkPut(data)
        // for (let asset of data) {
        //   let asset_row = await db.vaultLibrary.get(asset.assetId)
        //   let artifactEngineVersion = this.getArtifactEngineVersion(asset.projectVersions)
        //   let listingIdentifier = null
        //   if (asset.customAttributes) {
        //     const objListingIdentifier = asset.customAttributes.find(obj => Object.hasOwn(obj, 'ListingIdentifier'));
        //     listingIdentifier = objListingIdentifier?.ListingIdentifier || null;
        //   }
        //
        //   //User can click on the link to goto fab for asset detail.  It will slow the loading process too much.
        //   if (listingIdentifier === undefined || listingIdentifier == null || listingIdentifier.length <= 0) {
        //     listingIdentifier = 'No listing identifier'
        //   }
        //
        //   let categories = []
        //   if (asset.categories && asset.categories.length > 0) {
        //     categories = asset.categories.map(category =>  category.name).join(', ');
        //   }
        //
        //   if (asset_row === undefined) {
        //     await db.vaultLibrary.add({
        //       assetId: asset.assetId,
        //       assetNamespace: asset.assetNamespace,
        //       categories: categories,
        //       description: asset.description,
        //       listingType: asset.listingType,
        //       seller: asset.seller || 'Not Available',
        //       distributionMethod: asset.distributionMethod,
        //       images: asset.images,
        //       projectVersions: asset.projectVersions,
        //       source: asset.source,
        //       title: asset.title,
        //       url: asset.url,
        //       customAttributes: asset.customAttributes,
        //       legacyItemId: asset.legacyItemId,
        //       engineVersions: artifactEngineVersion?.engineVersions,
        //       artifactIds: artifactEngineVersion?.artifactIds,
        //       updatesAvailable: false,
        //       listingIdentifier: listingIdentifier,
        //       targetPlatforms: artifactEngineVersion?.targetPlatforms,
        //
        //     })
        //   } else {
        //     await db.vaultLibrary.update(asset.assetId, {
        //       assetNamespace: asset.assetNamespace,
        //       categories: categories,
        //       description: asset.description,
        //       listingType: asset.listingType,
        //       seller: asset.seller || 'Not Available',
        //       distributionMethod: asset.distributionMethod,
        //       images: asset.images,
        //       projectVersions: asset.projectVersions,
        //       source: asset.source,
        //       title: asset.title,
        //       url: asset.url,
        //       customAttributes: asset.customAttributes,
        //       legacyItemId: asset.legacyItemId,
        //       engineVersions: artifactEngineVersion?.engineVersions,
        //       artifactIds: artifactEngineVersion?.artifactIds,
        //       updatesAvailable: false,
        //       listingIdentifier: listingIdentifier,
        //       targetPlatforms: artifactEngineVersion?.targetPlatforms,
        //     })
        //   }
        // }
        console.timeEnd()
      }
    } catch (e) {
      console.error(e)
      console.timeEnd()
    }
  },

  async importAssetDetail() {
    let assets = await db.vaultLibrary.toArray()
    let promiseArray = [];
    let assetDetails = []
    let listingIdentifier
    loadingMsg.show = true
    let msg = "Please wait while additional asset details are being downloaded."
    loadingMsg.msg = msg
    utils.showLoading(loadingMsg)
    let count = 0

    let options = {
      headers: {
        'Content-Type': 'application/json',
      }
    }

    try {
      for (let asset of assets) {
        if (asset.customAttributes) {
          const objListingIdentifier = asset.customAttributes.find(obj => Object.hasOwn(obj, 'ListingIdentifier'));
          listingIdentifier = objListingIdentifier?.ListingIdentifier || null;
        }
        if (listingIdentifier !== null) {
          //let assetId = asset.assetId
          let url = new URL(ENDPOINTS.detail(listingIdentifier));
          promiseArray.push(fetch(url).then((assetDetail) => {
            if (typeof assetDetail === 'object') {
              // assetDetail.assetId = assetId
              assetDetails.push(assetDetail)
              loadingMsg.msg = msg + ' Assets downloaded ' + count++
              utils.showLoading(loadingMsg)
            }
          }));
        }
      }
      await Promise.all(promiseArray);

      for (let assetDetail of assetDetails) {
        let fabTagIds = []
        let fabTags = (assetDetail?.tags) || null
        if (fabTags !== null && fabTags.length > 0) {
          fabTagIds = await this.addFabTags(fabTags)
        }
      // await db.vaultLibrary.update(assetDetail.assetId, {
      //   assetFormats: assetDetail?.assetFormats || null,
      //   availableInEurope: assetDetail?.availableInEurope || null,
      //   averageRating: assetDetail?.averageRating || null,
      //   catalogItemId: assetDetail?.catalogItemId || null,
      //   category: assetDetail?.category || null,
      //   changelogs: assetDetail?.changelogs || null,
      //   commentThreadStatus: assetDetail?.commentThreadStatus || null,
      //   createdAt: assetDetail?.createdAt || null,
      //   longDescription: assetDetail?.description || null,
      //   externalUrl: assetDetail?.externalUrl || null,
      //   faqs: assetDetail?.faqs || null,
      //   firstPublishedAt: assetDetail?.firstPublishedAt || null,
      //   hasPromotionalContent: assetDetail?.hasPromotionalContent || null,
      //   isAiForbidden: assetDetail?.isAiForbidden || null,
      //   isAiGenerated: assetDetail?.isAiGenerated || null,
      //   isFree: assetDetail?.isFree || null,
      //   isMature: assetDetail?.isMature || null,
      //   lastUpdatedAt: assetDetail?.lastUpdatedAt || null,
      //   licenses: assetDetail?.licenses || null,
      //   fabListingType: assetDetail?.listingType || null,
      //   medias: assetDetail?.medias || null,
      //   promotionRequestId: assetDetail?.promotionRequestId || null,
      //   publishedAt: assetDetail?.publishedAt || null,
      //   ratings: assetDetail?.ratings || null,
      //   reviewCount: assetDetail?.reviewCount || null,
      //   startingPrice: assetDetail?.startingPrice || null,
      //   fabTagIds: fabTagIds || null,
      //   fabThumbnails: assetDetail?.thumbnails || null,
      //   fabTitle: assetDetail?.tags || null,
      //   uid: assetDetail?.uid || null,
      //   updatedAt: assetDetail?.updatedAt || null,
      //   user: assetDetail?.user || null
      // })
      }
    } catch (err) {
      console.log(err)
    }

    await utils.waitMilliseconds(2000)
    loadingMsg.show = false
    utils.showLoading(loadingMsg)
  },
  async addFabTags(fabTags) {
    let fabTagIds = []
    for (let fabTag of fabTags) {
      let asset_row = await db.fabTags.get(fabTag.uid)
      if (asset_row === undefined) {
        //Add new tag to lookup table
        await db.fabTags.add({
            uid: fabTag.uid,
            name: fabTag.name,
            slug: fabTag.slug,
            color: "grey"
          }
        )
      }
      fabTagIds.push(fabTag.uid)
    }
    return fabTagIds
  },
  getArtifactEngineVersion(projectVersions) {
    let engineVersions = []
    let artifactIds = []
    let targetPlatforms = []
    for (let project of projectVersions) {
      if (project.engineVersions) {
        engineVersions = utils.addUniqueValues(engineVersions, project.engineVersions)
        targetPlatforms = utils.addUniqueValues(targetPlatforms, project.targetPlatforms)
      }
      if (project.artifactId) {
        artifactIds.push(project.artifactId)
      }
    }
    let engineVer = engineVersions.join(',').replaceAll('UE_', '')
    let platforms = targetPlatforms.join(',')
    let obj = {
      'engineVersions': engineVer,
      'artifactIds': artifactIds,
      'targetPlatforms': platforms

    }
    return obj
  },

  async updateTagsByRow(assets, tagIds) {
    for (let asset of assets) {
      await db.vaultLibrary.update(asset.assetId, {
        tagIds: tagIds
      })
    }
  },
  async test() {
    let userSettings = await settings.getUserSettings()
    let authData = userSettings.auth

    let options = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${authData.token_type} ${authData.access_token}`,
        'User-Agent': VARS.client_ua
      }
    }


    let url = new URL(ENDPOINTS.detail(asset.listingIdentifier));
    let data = utils.httpRequest(url, options)

  },
  async updateInstalledProjects(cachePath) {

    await db.installedProjects.clear()
    try {
      let buildInfo = {}
      const basePath = await normalize(cachePath);
      const directories = await readDir(basePath)
      for (let directory of directories) {
        let filePath = '', fileExists = false
        let path = await normalize(basePath + '\\' + directory.name)
        try {
          filePath = path + '\\manifest'
          fileExists = await exists(filePath)
          if (fileExists === true) {
            buildInfo = await manifest.parseData(filePath)
          }
        } catch (error) {
          console.error(error)
        }
        try {
          filePath = path + '\\manifest.manifest'
          fileExists = await exists(filePath)
          if (fileExists === true) {
            buildInfo = await manifest.parseData(filePath)
          }
        } catch (error) {
          console.error(error)
        }
        if (Object.keys(buildInfo).length !== 0) {
          await db.installedProjects.clear()
          await db.installedProjects.add({
            AppNameString: buildInfo.AppNameString,
            buildVersionString: buildInfo.BuildVersionString
          })
        }
      }
      return true
    } catch (error) {
      console.log(error)
    }
    return false
  }
}
