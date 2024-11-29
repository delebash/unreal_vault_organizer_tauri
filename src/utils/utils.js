import {fetch} from "@tauri-apps/plugin-http";
import {eventBus} from "boot/global-components.js";

export const utils = {

  async httpRequest(url, options) {
    let response
    try {
      response = await fetch(url, options);
      if (response.ok) {
        return await response.json()
      } else {
        console.error(response.statusText)
        this.showErrorMessage(response.statusText)
      }
    } catch (err) {
      console.error(err)
      this.showErrorMessage(err)
    }
    return false
  },
  showNotification(msg,type) {
    let data = {}
    data.message = msg
    data.type = type
    eventBus.emit('showNotification', data)
  },

  showErrorMessage(msg) {
    let data = {}
    data.message = msg
    data.type = 'error'
    eventBus.emit('showMessage', data)
  },
  showLoading(data) {
    eventBus.emit('showLoading', data)
  },
  addUniqueValues(array1, array2) {
    const uniqueValues = new Set(array1);
    for (const element of array2) {
      if (!uniqueValues.has(element)) {
        array1.push(element);
        uniqueValues.add(element);
      }
    }
    return array1;
  },
  findNestedObject(arr, key, value) {
    for (const obj of arr) {
      if (obj[key] === value) {
        return obj;
      } else if (Array.isArray(obj)) {
        const result = this.findNestedObject(obj, key, value);
        if (result) return result;
      } else if (typeof obj === 'object') {
        for (const prop in obj) {
          if (Array.isArray(obj[prop])) {
            const result = this.findNestedObject(obj[prop], key, value);
            if (result) return result;
          }
        }
      }
    }
    return null;
    // const foundObject = findNestedObject(data, 'id', 3);
    // console.log(foundObject); // { id: 3, name: 'Charlie'
  },
  findByArtifactId(asset, artifactID) {
    let obj = {}
    for (let project of asset?.projectVersions) {
      if (project.artifactId === artifactID) {
        obj.assetID = asset.assetId
        obj.buildVersion = project?.buildVersions[0]?.buildVersion
        obj.artifactId = artifactID
        return obj
      }
    }
    return null
  }
}
