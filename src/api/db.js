import Dexie from 'dexie'

export const db = new Dexie('unreal_vault_organizer')
db.version(6).stores({
  vaultLibrary: 'assetId, comment, *tagIds, description, image, *artifactIds, engineVersions, ' +
    'title, url, updatesAvailable, listingIdentifier, distributionMethod, seller, categories, targetPlatforms, ' +
   'assetFormats,availableInEurope,averageRating,catalogItemId,category,commentThreadStatus,createdAt,' +
    'firstPublishedAt,hasPromotionalContent,isAiForbidden,isAiGenerated,isFree,isMature,lastUpdatedAt,' +
    'licenses,listingType,medias,promotionRequestId,publishedAt,ratings,reviewCount, *fabTagIds' +
    'updatedAt,profileUrl',
  userSettings: 'id , cachePath , checkForUpdates ,auth',
  installedProjects: 'AppNameString, buildVersionString',
  tags: '++id, label, value',
  fabTags: 'uid, name, slug,color',
  colorPalette: 'label, value'
})

