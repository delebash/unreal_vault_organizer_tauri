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
  }
}
