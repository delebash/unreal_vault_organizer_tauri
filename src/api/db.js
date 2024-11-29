import Dexie from 'dexie'

export const db = new Dexie('unreal_vault_organizer')
db.version(3).stores({
  vaultLibrary: 'assetId, comment, *tagIds, description, image, *artifactIds, engineVersions, title, url, updatesAvailable',
  userSettings: 'id , cachePath , checkForUpdates ,auth',
  installedProjects: 'AppNameString, buildVersionString',
  tags: '++id, label, value',
  colorPalette: 'label, value'
})
// vaultLibrary: 'assetId, comment, *tagIds, asset, engineVersions',
//   projectVersions:'++id, assetId, artifactId, buildVersion',
//vaultLibrary: 'assetId, comment, *tagIds, description, images, projectVersions, title, url',
//vaultLibrary: 'assetId, comment, *tagIds, asset',
