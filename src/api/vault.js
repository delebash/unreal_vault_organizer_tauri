import {db} from "src/api/db.js";
import {utils} from "src/utils/utils.js";
import {ENDPOINTS, VARS} from "src/utils/globals.js";
import {normalize} from "@tauri-apps/api/path";
import {exists, readDir} from "@tauri-apps/plugin-fs";
import {manifest} from "src/utils/manifest.js";
import {settings} from "./setting.js"

let loadingMsg = {}

export const vault = {
  async updateVaultAsset(assetId, data) {
    await db.vaultLibrary.update(assetId, data)
  },
  async loadVault() {
    loadingMsg.show = true
    loadingMsg.msg = "Please wait while your vault is loading."
    utils.showLoading(loadingMsg)
    let data = await db.vaultLibrary.toArray()

    let timer = setTimeout(() => {
      loadingMsg.show = false
      utils.showLoading(loadingMsg)
      timer = void 0
    }, 2000)
    return data
  },
  async importVault(count = 100) {
    let userSettings = await settings.getUserSettings()
    let authData = userSettings.auth
    let url = new URL(ENDPOINTS.vault(authData.account_id));
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
    while (continueLoop === true) {
      const json_response = await utils.httpRequest(url, options)
      let next = json_response?.cursors?.next
      let results = json_response?.results
      if (next === null) {
        if (results.length > 0) {
          data.push(...results)
          loadingMsg.msg = msg + ' Finished downloading, row count = ' + data.length
          utils.showLoading(loadingMsg)
        }
        continueLoop = false
      } else {
        url.searchParams.set("cursor", next);
        data.push(...results)
        loadingMsg.msg = msg + ' Rows downloaded ' + data.length
        utils.showLoading(loadingMsg)
      }
    }
    loadingMsg.msg = "Begin parsing data"
    utils.showLoading(loadingMsg)
    await this.saveVaultData(data)
    loadingMsg.show = true
    loadingMsg.msg = "Finished parsing data"
    utils.showLoading(loadingMsg)
    // hiding in 2s
    let timer = setTimeout(() => {
      loadingMsg.show = false
      utils.showLoading(loadingMsg)
      timer = void 0
    }, 2000)

  },
  async checkForUpdates() {
    //   let filteredAsset = await db.vaultLibrary.where("artifactIds").equals("AncientGame_5.0").toArray()
    // console.log(filteredAsset[0])
    let myasset = filteredAsset[0]
    console.log(myasset)
    let result = myasset.projectVersions.find(item => item.artifactId === "AncientGame_5.0");
    console.log(result)
  },
  getArtifactEngineVersion(projectVersions) {
    let engineVersions = []
    let artifactIds = []
    for (let project of projectVersions) {
      if (project.engineVersions) {
        engineVersions = utils.addUniqueValues(engineVersions, project.engineVersions)
      }
      if (project.artifactId) {
        artifactIds.push(project.artifactId)
      }
    }
    let engineVer = engineVersions.join(' ').replaceAll('UE_', '')
    let obj = {
      'engineVersions': engineVer,
      'artifactIds': artifactIds
    }
    return obj
  },
  async saveVaultData(data) {
    if (data.length > 0) {
      for (let asset of data) {
        let asset_row = db.vaultLibrary.get(asset.assetId)
        let artifactEngineVersion = this.getArtifactEngineVersion(asset.projectVersions)
        if (asset_row === undefined) {
          await db.vaultLibrary.put({
            assetId: asset.assetId,
            engineVersions: artifactEngineVersion.engineVersions,
            artifactIds: artifactEngineVersion.artifactIds,
            description: asset.description,
            image: asset?.images[0],
            projectVersions: asset.projectVersions,
            title: asset.title,
            url: asset.url
          })
        } else {
          await db.vaultLibrary.update(asset.assetId, {
            engineVersions: artifactEngineVersion.engineVersions,
            artifactIds: artifactEngineVersion.artifactIds,
            description: asset.description,
            image: asset?.images[0],
            projectVersions: asset.projectVersions,
            title: asset.title,
            url: asset.url
          })
        }
      }
    }
  },
  async updateTagsByRow(assets, tagIds) {
    for (let asset of assets) {
      await db.vaultLibrary.update(asset.assetId, {
        tagIds: tagIds
      })
    }
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
        // console.log(buildInfo)
        await db.installedProjects.add({
          AppNameString: buildInfo.AppNameString,
          buildVersionString: buildInfo.BuildVersionString
        })
      }
    } catch (error) {
      console.log(error)
    }
  },
}
