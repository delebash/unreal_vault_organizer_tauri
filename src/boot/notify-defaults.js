import { defineBoot } from '#q-app/wrappers'
import { Notify } from 'quasar'
// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default defineBoot(async (/* { app, router, ... } */) => {
  Notify.setDefaults({
    position: 'top',
    timeout: 10000,
    textColor: 'white',
    actions: [{ icon: 'close', color: 'white' }]
  })
})
