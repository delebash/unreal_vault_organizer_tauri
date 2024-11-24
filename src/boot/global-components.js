import {boot} from 'quasar/wrappers'
import mitt from 'mitt'
const eventBus = mitt()
import {db} from "src/api/db.js";
import {colorPalette} from "src/utils/quasarColorPalatte.js";

export default boot(async ({app}) => {
  await loadColorPalette()
})

//Initialize color palette in database
async function loadColorPalette() {
  let rows = await db.colorPalette.toArray()
  if (rows.length === 0) {
    for (let color of colorPalette) {
      await db.colorPalette.put({
        label: color,
        value: color
      })
    }
  }
}
export { eventBus }
