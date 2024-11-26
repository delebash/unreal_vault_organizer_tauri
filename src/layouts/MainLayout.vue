<template>
  <Suspense>
    <q-layout view="hHh Lpr lff" class="rounded-borders">
      <check-for-updates ref="refCheckUpdates"></check-for-updates>
      <!--Dialog Box-->
      <!--      <q-dialog v-model="confirmDeleteTagDialog" ref="dialogRef" @hide="onDialogHide">-->
      <!--        <q-card>-->
      <!--          <q-card-section class="row items-center">-->
      <!--          <span-->
      <!--            class="q-ml-sm">The tag you are trying to delete is currently used in a record. Continue deleting?</span>-->
      <!--          </q-card-section>-->

      <!--          <q-card-actions align="right">-->
      <!--            <q-btn flat label="OK" color="primary" position="top" @click="clickOKConfirmDelete"/>-->
      <!--            <q-btn flat label="Cancel" color="primary" @click="onDialogCancel"/>-->
      <!--          </q-card-actions>-->
      <!--        </q-card>-->
      <!--      </q-dialog>-->
      <!--End Dialog Box-->

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
                <q-btn class="q-mr-sm" dense @click="loadVault" color="orange-9"
                       label="Refresh Grid"></q-btn>
              </div>
            </div>
          </div>
          <div class="col-shrink ">
            <q-btn dense class="q-mr-sm" color="yellow-9" @click="toggleLeftDrawer">Tags</q-btn>
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
                  <q-card-section>
                    <div>
                      <a class="text-h6" :href="`${getAuthUrl}`" target="_blank">Get Authorization Code, click to
                        login to your Epic
                        Account.</a>
                    </div>
                    <div>
                      <b>Next copy the value of authorizationCode and paste in the field below, do not include quotes.
                        Then click Authorize. You will have to repeat this step every so often when your token expires.</b>
                    </div>
                      <i>NOTE: this application does not have any access to your username or password. We just obtain the one time
                        use authorization code you copy to obtain an access token.
                      </i>

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

                    <q-btn dense class="q-mt-md" @click="authorize()" color="primary"
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
                      <q-checkbox dense v-model="cbCheckForUpdates" @update:model-value="checkForUpdatesChange"
                                  label="Automatically check software updates?"/>
                    </q-input>
                    <q-btn dense @click="saveUserSettings()" color="positive"
                           label="Save settings">
                    </q-btn>
                    <div class="float-right">
                      <div class="text-h6">Warning</div>
                      <q-btn
                        @click="showDialog({function:'deleteDatabase',message:'Confirm deleting database.'})"
                        color="negative" label="Delete Database">
                      </q-btn>
                    </div>
                  </q-card-section>

                  <q-card-section>
                    <div class="text-h6">Delete Tags</div>
                  </q-card-section>
                  <q-separator color="primary" size="5px" inset/>
                  <q-card-section>
                  <q-scroll-area  :visible="true" style="height: 200px; max-width: 100%;">
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
                </q-card>
              </div>

            </q-tab-panel>
            <!--End Settings Tab-->
          </q-tab-panels>
        </q-page>
      </q-page-container>
    </q-layout>
  </Suspense>
</template>

<script setup>
import {ref, computed, onMounted, nextTick, watch} from 'vue'
import {useQuasar} from 'quasar'
import {api} from '../api/api.js'
import {db} from '../api/db.js'
import VaultGrid from "components/VaultGrid.vue";
import SideNav from "components/SideNav.vue";
import {eventBus} from "boot/global-components.js";
import CheckForUpdates from "components/CheckForUpdates.vue";

const $q = useQuasar()
const leftDrawerOpen = ref(false)
const cachePath = ref('')
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
const refsLoaded = ref(false);
let currentTag = {}
let userSettings

onMounted(async () => {
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
  eventBus.on('showMessage', (args) => {
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
  })

})


watch([refCheckUpdates], () => {
  if (refCheckUpdates.value) {
    nextTick(() => {
      loadSettings()
    });
  }
});

async function bulkAddTagIds(data) {
  let assets = refVaultGrid.value.getSelectedRowsData()
  if (assets.length > 0 && data.tagIds.length > 0) {
    await api.updateTagsByRow(assets, data.tagIds)
    await loadVault()
  } else {
    $q.notify({
      color: 'info',
      message: 'Please select rows and tags that you want to bulk add tags to.',
    })
  }
}

const getAuthUrl = computed(() => {
  return api.getAuthUrl()
})


//Settings
async function loadSettings() {

  userSettings = await api.getUserSettings()
  cbCheckForUpdates.value = userSettings?.checkForUpdates

  if (cbCheckForUpdates.value || userSettings === undefined) {
    cbCheckForUpdates.value = true
    refCheckUpdates.value.checkForAppUpdates()
  }


  await loadTags()

  accessToken.value = userSettings?.auth?.access_token

  if (!userSettings?.cachePath || userSettings?.cachePath === '') {
    selectedTab.value = 'settings'
    vaultButtons.value = false
    $q.notify({
      color: 'negative',
      message: 'On your settings tab, you must set a vault cache path and have an access token by logging in and requesting an authorization code.',
    })
    return false
  }
  cachePath.value = userSettings?.cachePath
  return true
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
  if (cachePath.value !== '') {
    await api.saveUserSettings({cachePath: cachePath.value, checkForUpdates: cbCheckForUpdates.value})
    $q.notify({
      type: 'positive',
      message: 'Settings saved successfully',
    })
  } else {
    $q.notify({
      color: 'negative',
      message: 'Vault cache path is required',
    })
  }
}

async function authorize() {
  if (authorizationCode.value !== '') {
    let auth = await api.authorize(authorizationCode.value)
    let data = {auth: auth}
    await api.saveUserSettings(data)
    if (await api.isAuthDataValid() === true) {
      $q.notify({
        type: 'positive',
        message: 'Authorization successful',
      })
      accessToken.value = auth.access_token
    }
  } else {
    $q.notify({
      color: 'negative',
      message: 'Authorization Code is required please click the link above to login to your Epic account.',
    })
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

//End Settings

//Begin Vault
async function loadVault() {
  await refVaultGrid.value.getVault()
}

async function importVault() {
  if (!userSettings?.cachePath || userSettings?.cachePath === '') {
    selectedTab.value = 'settings'
    vaultButtons.value = false
    $q.notify({
      color: 'negative',
      message: 'On your settings tab, you must set a vault cache path and have an access token by logging in and requesting an authorization code.',
    })
  } else {
    if (await api.isAuthDataValid()) {
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
