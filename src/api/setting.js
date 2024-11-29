import {db} from "src/api/db.js";

export const settings = {
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
  }
}
