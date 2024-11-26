import Dexie from 'dexie'

export const db = new Dexie('unreal_vault_organizer')
db.version(1).stores({
  vaultLibrary: 'assetId, comment, *tagIds, asset ',
  userSettings: 'id , cachePath , checkForUpdates ,auth',
  tags: '++id, label, value',
  colorPalette: 'label, value'
})
