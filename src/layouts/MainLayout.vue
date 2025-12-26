<template>
  <Suspense>
    <q-layout view="hHh Lpr lff" class="rounded-borders">
      <check-for-updates ref="refCheckUpdates"></check-for-updates>
      <!--Begin Header-->
      <q-header dense elevated>
        <div class="row items-center">
          <div class="col-3" @click="closeLeftDrawer">
            <q-tabs
              v-model="selectedTab"
              align="left"
              dense
            >
              <q-tab dense name="vault" label="Vault" @click="tabChange"/>
              <q-tab dense name="settings" label="Settings" @click="tabChange"/>
            </q-tabs>
          </div>
          <div class="col-grow" @click="closeLeftDrawer">
            <div class="float-right">
              <div v-show="vaultButtons">
                <q-btn class="q-mr-sm" dense @click="importVault" color="green-9"
                       label="Import Vault"></q-btn>
                <q-btn class="q-mr-sm" dense @click="loadVault(true)" color="orange-9"
                       label="Refresh Grid"></q-btn>
                <q-btn class="q-mr-sm" dense @click="test" color="orange-9"
                       label="Test"></q-btn>
              </div>
            </div>
          </div>
          <div class="col-shrink ">
            <q-btn dense class="q-mr-sm" color="yellow-9" @click="toggleLeftDrawer">Tags</q-btn>
            <q-btn class="q-mr-sm" dense @click="exportSelectedRows" color="purple"
                   label="Export Selected Rows"></q-btn>
          </div>
        </div>
      </q-header>
      <!--End Header-->

      <!--Begin Left Drawer-->
      <q-drawer
        v-model="leftDrawerOpen"
        :width="200"
        :breakpoint="500"
        overlay
        bordered
        behavior="desktop"
      >
        <!--Begin SideNav-->
        <side-nav ref="refSideNav"></side-nav>
        <!--End SideNav-->
      </q-drawer>
      <!--End Left Drawer-->

      <!--Begin Main Page-->
      <q-page-container @click="closeLeftDrawer">
        <q-page>
          <q-tab-panels keep-alive v-model="selectedTab" animated>

            <!--Begin Vault Tab-->
            <q-tab-panel name="vault" class="q-pa-none q-ma-none" style="height: calc(100vh - 40px)">
              <vault-grid ref="refVaultGrid"></vault-grid>
            </q-tab-panel>
            <!--End Vault Tab-->

            <!--Begin Settings Tab-->
            <q-tab-panel class="q-pa-none q-ma-none" name="settings">

              <div class="q-pa-md q-gutter-md">
                <q-card>
                  <div>
                    <a class="text-h6" :href="`${getAuthUrl}`" target="_blank">Get Authorization Code, click to
                      login to your Epic
                      Account.</a>
                  </div>
                  <div>
                    <b>Next copy the value of authorizationCode and paste in the field below, do not include quotes.
                      Then click Authorize. You will have to repeat this step every so often when your token
                      expires.</b>
                  </div>
                  <i>NOTE: this application does not have any access to your username or password. We just obtain the
                    one time
                    use authorization code you copy to obtain an access token.
                  </i>
                  <q-card-section>

                    <q-input dense v-model="authorizationCode"
                             label="Authorization Code get by clicking link above to login to your account and pasting the value of authorizationCode  here, do not include quotes"
                             :type="isPwd ? 'password' : 'text'"
                    >
                      <template v-slot:append>
                        <q-icon
                          dense
                          :name="isPwd ? 'visibility_off' : 'visibility'"
                          class="cursor-pointer"
                          @click="isPwd = !isPwd"
                        />
                      </template>
                    </q-input>

                    <q-btn dense class="q-mt-md q-mb-md" @click="authorize()" color="primary"
                           label="Authorize">
                    </q-btn>

                    <q-input dense class="q-mb-md" v-model="accessToken"
                             label="Access Token *Required*. Request an authorization code from above"
                             :type="isPwd ? 'password' : 'text'"
                             readonly
                    >
                      <template v-slot:append>
                        <q-icon
                          dense
                          :name="isPwd ? 'visibility_off' : 'visibility'"
                          class="cursor-pointer"
                          @click="isPwd = !isPwd"
                        />
                      </template>
                    </q-input>
                    <q-input dense v-model="cachePath"
                             label="Vault Cache Path *Required*.  You can find the path in your epic launcher settings"
                             :rules="[val => !!val || 'Field is required']"
                    >
                      <template v-slot:append>
                        <q-btn class="q-mr-xl"
                               @click="selectDirectory"
                               color="primary" label="Select Directory">
                        </q-btn>
                      </template>
                    </q-input>

                    <q-btn dense @click="saveUserSettings" color="positive"
                           label="Save settings">
                    </q-btn>
                    <div class="float-right">
                      <q-checkbox class="q-mr-xl" dense v-model="cbCheckForUpdates"
                                  @update:model-value="checkForUpdatesChange"
                                  label="Automatically check software updates?"/>
                      <q-btn class="q-mr-xl"
                             @click="exportDatabase"
                             color="primary" label="Export Database">
                      </q-btn>
                      <q-btn
                        @click="showDialog({function:'deleteDatabase',message:'Delete database?'})"
                        color="negative" label="Delete Database">
                      </q-btn>
                    </div>
                  </q-card-section>

                  <q-card-section>
                    <div class="text-h6">Custom Tags</div>
                  </q-card-section>
                  <q-separator color="primary" size="5px" inset/>
                  <q-card-section>
                    <q-scroll-area :visible="true" style="height: 100px; max-width: 100%;">
                  <span v-for="tag in tag_info_options.sort((a, b) => (a.label > b.label) ? 1 : -1)">
                    <q-chip
                      text-color="white"
                      removable
                      @remove="beforeRemoveTag(tag)"
                      :color=tag.color
                    >
                      <div class="q-pl-md q-ma-xs">{{ tag.label }}</div>
                    </q-chip>
                  </span>
                    </q-scroll-area>
                  </q-card-section>

                  <q-card-section>
                    <div class="text-h6">Fab Tags</div>
                  </q-card-section>
                  <q-separator color="primary" size="5px" inset/>
                  <q-card-section>
                    <q-scroll-area :visible="true" style="height: 120px; max-width: 100%;">
                  <span v-for="fabTag in fabTags">
                    <q-chip
                      text-color="white"
                      :color=fabTag.color
                      clickable
                      @dblclick="displayTag(fabTag)"
                    >
                      <div class="q-pl-md q-ma-xs">{{ fabTag.name }}</div>
                    </q-chip>
                  </span>
                    </q-scroll-area>
                  </q-card-section>
                </q-card>
              </div>

            </q-tab-panel>
            <!--End Settings Tab-->
          </q-tab-panels>
        </q-page>
      </q-page-container>
    </q-layout>
  </Suspense>

  <q-dialog v-model="tag_edit">

    <q-card style="width: 300px" class="q-px-sm q-pb-md">
      <q-btn icon="close" flat round dense v-close-popup/>
      <q-card-section>
        <div class="text-h6">Change Fab tag color</div>
      </q-card-section>
      <q-input readonly v-model="tag_label" label="Tag Name"/>
      <q-select
        filled
        use-chips
        v-model="tag_color"
        :options="tag_color_options"
      >
        <template v-slot:option="scope">
          <q-item
            v-bind="scope.itemProps"
          >
            <q-item-section>
              <q-item-label v-html="scope.opt.label"></q-item-label>
            </q-item-section>
            <q-item-section avatar>
              <q-avatar :color="scope.opt.value"></q-avatar>
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:selected-item="scope">
          <q-chip
            text-color="white"
            removable
            dense
            :color="tag_color.value"
            :tabindex="scope.tabindex"
            class="q-ma-none"
          >
            {{ tag_color.label }}
          </q-chip>
        </template>
      </q-select>
      <q-btn @click="saveTagInfo" color="primary" label="Save Tag"/>
    </q-card>
  </q-dialog>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useQuasar} from 'quasar'
import {db} from '../api/db.js'
import {eventBus} from "boot/global-components.js";
import {auth} from "src/api/auth.js";
import {settings} from "src/api/setting.js";
import {vault} from "src/api/vault.js";
import VaultGrid from "components/VaultGrid.vue";
import SideNav from "components/SideNav.vue";
import CheckForUpdates from "components/CheckForUpdates.vue";
import {exportDB} from "dexie-export-import";
import {readDir, writeTextFile} from '@tauri-apps/plugin-fs';
import {downloadDir, join, homeDir} from '@tauri-apps/api/path';
import {save, open} from "@tauri-apps/plugin-dialog";


const $q = useQuasar()
const leftDrawerOpen = ref(false)
let cachePath = ref('')
const isPwd = ref(true)
const selectedTab = ref('vault')
const vaultButtons = ref(true)
const authorizationCode = ref('')
const refVaultGrid = ref(null)
const refSideNav = ref(null)
const refCheckUpdates = ref(null)
const cbCheckForUpdates = ref(true)
const accessToken = ref(null)
const tag_info_options = ref([])
let currentTag = {}
const fabTags = ref([])
const tag_edit = ref(false)
const tag_label = ref('')
const tag_color = ref({})
const tag_color_options = ref([])
const tag_clicked = ref({})



onMounted(async () => {
  tag_color_options.value = await db.colorPalette.orderBy('label').toArray()
  eventBus.on('refreshGrid', (args) => {
    loadVault()
  })
  eventBus.on('filteredRows', (args) => {
    refVaultGrid.value.filterRows(args)
  })
  eventBus.on('bulkAddTags', (args) => {
    bulkAddTagIds(args)
  })
  eventBus.on('showLoading', (args) => {
    showLoading(args)
  })
  eventBus.on('showNotification', (args) => {
    showNotification(args)
  })
  eventBus.on('showMessage', async (args) => {
    showMessage(args)
  })
  eventBus.on('gridRedrawRows', async () => {
    gridRedrawRows()
  })
  await loadSettings(true)
})


async function saveTagInfo() {
  tag_clicked.value.name = tag_label.value
  tag_clicked.value.color = tag_color.value.value
  tag_edit.value = false
  await db.fabTags.put({
    uid: tag_clicked.value.uid,
    name: tag_clicked.value.name,
    color: tag_clicked.value.color
  })
  gridRedrawRows()
}
function gridRedrawRows() {
  let gridApi = refVaultGrid.value.getGridApi()
  if (refVaultGrid.value && gridApi) {
    gridApi.redrawRows();
  }
}
function displayTag(tag) {
  tag_color.value = {}
  tag_edit.value = true
  tag_clicked.value = tag
  tag_label.value = tag.name
  tag_color.value.value = tag.color
  tag_color.value.label = tag.name
}

// watch([refCheckUpdates], () => {
//   if (refCheckUpdates.value) {
//     nextTick(() => {
//       loadSettings()
//     });
//   }
// });
async function test(){
 vault.importAssetDetail()
  //let importedTags = await db.importedTags.orderBy('name').toArray();
  //console.log(importedTags)
}
async function bulkAddTagIds(data) {
  let assets = refVaultGrid.value.getSelectedRowsData()
  if (assets.length > 0 && data.tagIds.length > 0) {
    await vault.updateTagsByRow(assets, data.tagIds)
    // await loadVault()
    gridRedrawRows()
  } else {
    $q.notify({
      color: 'info',
      message: 'Please select rows and tags that you want to bulk add tags to.',
    })
  }
}

const getAuthUrl = computed(() => {
  return auth.getAuthUrl()
})

//Settings
async function loadSettings(mounted = false) {
  let userSettings = await settings.getUserSettings()

  if (!userSettings?.cachePath || userSettings?.cachePath === '' || userSettings === undefined) {
    selectedTab.value = 'settings'
    vaultButtons.value = false
    $q.notify({
      color: 'negative',
      message: 'On your settings tab, you must set a vault cache path and have an access token by logging in and requesting an authorization code.',
    })
  } else {
    accessToken.value = userSettings?.auth?.access_token
    cachePath.value = userSettings?.cachePath
    await loadTags()

    cbCheckForUpdates.value = userSettings?.checkForUpdates
    if (cbCheckForUpdates.value || userSettings === undefined) {
      cbCheckForUpdates.value = true
      refCheckUpdates.value.checkForAppUpdates()
    }
  }
}

function checkForUpdatesChange() {
  if (cbCheckForUpdates.value === true) {
    refCheckUpdates.value.checkForAppUpdates()
  }
}

function tabChange() {
  if (selectedTab.value === 'vault') {
    vaultButtons.value = true
    // saveUserSettings()
  } else {
    vaultButtons.value = false
    loadTags()
  }
}

async function saveUserSettings() {
  let directoryExists = await isDirectory(cachePath.value)
  if (cachePath.value !== '' && directoryExists) {
    await settings.saveUserSettings({cachePath: cachePath.value, checkForUpdates: cbCheckForUpdates.value})
    $q.notify({
      type: 'positive',
      message: 'Settings saved successfully',
    })
  } else {
    $q.notify({
      color: 'negative',
      message: 'Vault cache path is required or not a valid directory',
    })
  }
}

async function authorize() {
  if (authorizationCode.value !== '') {
    let authData = await auth.authorize(authorizationCode.value)
    let data = {auth: authData, cachePath: cachePath.value, checkForUpdates: cbCheckForUpdates.value}
    await settings.saveUserSettings(data)
    if (await auth.isAuthDataValid() === true) {
      $q.notify({
        type: 'positive',
        message: 'Authorization successful',
      })
      accessToken.value = authData.access_token
    }
  } else {
    $q.notify({
      color: 'negative',
      message: 'Authorization Code is required please click the link above to login to your Epic account.',
    })
  }
}

async function isDirectory(path) {
  try {
    await readDir(path);
    return true; // If readDir succeeds, it's a directory
  } catch (error) {
    // Handle specific errors if needed, e.g., if it's a file
    return false;
  }
}

async function selectDirectory() {
  const defaultPath = await homeDir(); // Get the application directory to use as a default
  const selected = await open({
    directory: true, // This is crucial for selecting a directory
    multiple: false, // Set to true if you want to allow multiple directory selections
    defaultPath: defaultPath, // Optional: Set an initial directory for the dialog
  });

  if (selected === null) {
    console.log('Directory selection cancelled.');
  } else {
    console.log('Selected directory:', selected);
    cachePath.value = selected;
  }
}

async function deleteDatabase() {
  db.delete({disableAutoOpen: false});
  $q.notify({
    color: 'positive',
    message: 'Database deleted.',
  })
  location.reload();
}

async function exportSelectedRows() {
  let rows = refVaultGrid.value.getSelectedRowsData()
  if (rows.length > 0) {
    const filename = "Unreal_Vault_Organizer_Selected_Rows.json";
    await downloadJsonFile(rows, filename);
  } else {
    let data = {}
    data.message = `Now rows have been selected.`;
    data.type = 'error'
    showMessage(data)
  }
}

async function exportDatabase() {
  const filename = "Unreal_Vault_Organizer_Database.json";
  const blob = await exportDB(db);
  let jsonData = await blobToJson(blob)
  await downloadJsonFile(jsonData, filename);
}

async function blobToJson(blob) {
  const text = await blob.text();
  return JSON.parse(text);
}

async function downloadJsonFile(jsonData, filename) {
  try {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const defaultPath = await downloadDir();
    const suggestedPath = await join(defaultPath, filename)
    const filePath = await save({
      defaultPath: suggestedPath,
      filters: [{
        name: 'JSON File',
        extensions: ['json']
      }]
    });

    if (filePath) {
      await writeTextFile(filePath, jsonString);
      console.log(`File successfully saved to: ${filePath}`);
    } else {
      console.log('File save cancelled by the user.');
    }
  } catch (error) {
    console.error('Error saving the JSON file:', error);
    let data = {}
    data.message = `Error saving the JSON file ${error}`
    data.type = 'error'
    showMessage(data)
  }
}

function showDialog(options) {
  $q.dialog({
    title: options.title || 'Confirm action',
    message: options.message,
    cancel: true,
    persistent: true
  }).onOk(() => {
    switch (options.function) {
      case 'removeTag':
        removeTag(options.data)
        break;
      case 'deleteDatabase':
        deleteDatabase()
        break;
      case 'exportDatabase':
        exportDatabase()
        break;
    }
  }).onCancel(() => {
  }).onDismiss(() => {
    // console.log('I am triggered on both OK and Cancel')
  })
}

function showLoading(data) {
  if (data.show === true) {
    $q.loading.show({
      message: data.msg,
      spinnerColor: 'primary'
    })
  } else {
    $q.loading.hide()
  }
}

function showMessage(args) {
  let color
  switch (args.type) {
    case 'success':
      color = 'positive'
      break;
    case 'error':
      color = 'negative'
      break;
  }
  $q.notify({
    color: color,
    message: args.message
  })
}

function showNotification(data) {
  $q.notify({
    color: data.type,
    message: data.message
  })
}

//End Settings

//Begin Vault
async function loadVault(reset) {
  await refVaultGrid.value.getVault(reset)
}

async function importVault() {
  let userSettings = await settings.getUserSettings()
  if (!userSettings?.cachePath || userSettings?.cachePath === '') {
    selectedTab.value = 'settings'
    vaultButtons.value = false
    $q.notify({
      color: 'negative',
      message: 'On your settings tab, you must set a vault cache path.',
    })
  } else {
    let bAuthDataValid = await auth.isAuthDataValid()
    if(bAuthDataValid) {
      await refVaultGrid.value.importVault()
    }
  }
}
//End Vault

//Begin Tags
async function removeTag() {
  refSideNav.value.removeTag(currentTag)
  const index = tag_info_options.value.findIndex(({label}) => label === currentTag.label);
  tag_info_options.value.splice(index, 1)
  gridRedrawRows()
}

async function beforeRemoveTag(tag) {
  currentTag = tag
  let filteredRows = await db.vaultLibrary.where('tagIds').anyOf(tag.id).toArray()
  if (filteredRows.length > 0) {
    showDialog({function: 'removeTag', message: 'This tag is in use, confirm delete', data: tag})
  } else {
    await removeTag()
  }
}

async function loadTags() {
  tag_info_options.value = await db.tags.toArray()
  tag_info_options.value = tag_info_options.value.sort((a, b) => (a.label > b.label) ? 1 : -1)
  fabTags.value = await db.fabTags.toArray()
  fabTags.value = fabTags.value.sort((a, b) => (a.name > b.name) ? 1 : -1)

}

//End Tags

//Drawer
function closeLeftDrawer() {
  if (leftDrawerOpen.value === true) {
    leftDrawerOpen.value = false
  }
}

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

//End Drawer
</script>
