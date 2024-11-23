<template>
    <q-layout view="hHh Lpr lff" class="rounded-borders">
      <!--Begin Header-->
      <q-header dense elevated>
        <div class="row items-center">
          <div class="col-3" @click="closeLeftDrawer">
            <q-tabs
              v-model="selectedTab"
              align="left"
              dense
            >
              <q-tab dense name="vault" label="Vault"/>
              <q-tab dense name="settings" label="Settings" @click="loadData"/>
            </q-tabs>
          </div>
<!--          <div class="row items-center">-->
<!--            <span class="q-mr-md">Quick Filter:</span>-->
<!--            <q-input dense v-model="quickfilter" color="black" id="filter-text-box" bg-color="white" filled-->
<!--                     placeholder="Search All Columns except tags"-->
<!--                     @update:model-value="onFilterTextBoxChanged"></q-input>-->
<!--          </div>-->
          <div class="col-grow" @click="closeLeftDrawer">
            <div class="float-right">
              <q-btn class="q-mr-sm" dense @click="fetchVault" color="green-9"
                     label="Import Vault"></q-btn>
              <q-btn class="q-mr-sm" dense @click="loadVault" color="orange-9"
                     label="Refresh Grid"></q-btn>
            </div>
          </div>
          <div class="col-shrink ">
            <q-btn dense class="q-mr-sm" color="yellow-9" @click="toggleLeftDrawer">Tags</q-btn>
          </div>
        </div>
      </q-header>
      <!--End Header-->
      <!--      Dialog Box-->
      <q-dialog v-model="confirmDeleteTagDialog" ref="dialogRef" @hide="onDialogHide">
        <q-card>
          <q-card-section class="row items-center">

            <span class="q-ml-sm">The tag you are trying to delete is currently used in a record. Continue deleting?</span>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="OK" color="primary" position="top" @click="clickOKConfirmDelete" />
            <q-btn flat label="Cancel" color="primary" @click="onDialogCancel"/>
          </q-card-actions>
        </q-card>
      </q-dialog>
      <!--End Dialog Box-->

      <!--Begin Left Drawer-->
      <q-drawer
        v-model="leftDrawerOpen"
        :width="200"
        :breakpoint="500"
        overlay
        bordered
        behavior="desktop"
      >
        <side-nav ref="refSideNav"></side-nav>
      </q-drawer>
      <!--End Left Drawer-->

      <!--Begin Main Page-->
      <q-page-container @click="closeLeftDrawer">
        <q-page>
          <q-tab-panels keep-alive v-model="selectedTab" animated>
            <!--Begin Vault Tab-->
            <q-tab-panel name="vault" class="q-pa-none q-ma-none"
                         style="height: calc(100vh - 40px)">

              <vault-grid ref="refVaultGrid"></vault-grid>
            </q-tab-panel>
            <!--End Vault Tab-->

            <!--Begin Settings Tab-->

            <q-tab-panel class="row q-pl-xs q-pt-xs q-pb-none q-ma-none" name="settings">
              <div class="q-md column" style="min-width: 600px;">
                <a :href="`${getAuthUrl}`" target="_blank">Login to your Epic Account here and
                  enter your authorization code in the field below. Then click get access key. </a>
                <q-input dense v-model="authorizationCode" label="Authorization Code" stack-label>
                </q-input>
                <br>
                <q-btn class="q-pt-none" dense @click="authenticate()" color="primary"
                       label="Authenticate"></q-btn>

                <q-input dense v-model="cachePath" label="Vault Cache Path*" stack-label
                         lazy-rules
                         :rules="[ val => val && val.length > 0 || 'Please type something']"
                >
                </q-input>
                <q-btn class="q-pt-none" dense @click="saveUserSettings()" color="positive"
                       label="Save settings"></q-btn>
                <br>


                <div>
                  <b>Delete Tags -- This also removes them from your vault item row.</b>
                </div>
                <div v-for="tag in tag_info_options.sort((a, b) => (a.label > b.label) ? 1 : -1)">
                  <q-chip
                    text-color="white"
                    removable
                    @remove="beforeRemoveTag(tag)"
                    :color=tag.color
                  >
                    <div class="q-pl-md q-ma-xs">{{ tag.label }}</div>
                  </q-chip>
                </div>
              </div>


            </q-tab-panel>
            <!--End Settings Tab-->

          </q-tab-panels>
        </q-page>
      </q-page-container>
    </q-layout>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useQuasar} from 'quasar'
import {useDialogPluginComponent} from 'quasar'
import {api} from '../api/api.js'
import {db} from '../api/db.js'
import VaultGrid from "components/VaultGrid.vue";
import SideNav from "components/SideNav.vue";
import CheckForUpdates from "components/CheckForUpdates.vue";
import {colorPalette} from '../utils/quasarColorPalatte.js'
import {eventBus} from "boot/global-components.js";

const $q = useQuasar()
const leftDrawerOpen = ref(false)
const cachePath = ref('')
const isPwd = ref(true)
const selectedTab = ref('vault')
const authorizationCode = ref('')
const refVaultGrid = ref(null)
const refSideNav = ref(null)
const quickfilter = ref('')
const tag_info_options = ref([])
const confirmDeleteTagDialog = ref(false)
let currentTag = {}
const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent()
defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits
])

function clickOKConfirmDelete() {
  removeTag()
  onDialogOK()
}
function removeTag(){
  refSideNav.value.removeTag(currentTag)
  const index = tag_info_options.value.findIndex(({label}) => label === currentTag.label);
  tag_info_options.value.splice(index, 1)
}
onMounted(() => {
  eventBus.on('refreshGrid', (args) => {
    refVaultGrid.value.loadVault()
  })
  eventBus.on('filteredRows', (args) => {
    refVaultGrid.value.filterRows(args)
  })
})

async function beforeRemoveTag(tag) {
  currentTag = tag
  let filteredRows = await db.vaultLibrary.where('tagIds').anyOf(tag.id).toArray()
  if (filteredRows.length > 0) {
    confirmDeleteTagDialog.value = true
  }else{
    removeTag()
  }
}

async function loadTags() {
  tag_info_options.value = await db.tags.toArray()
  tag_info_options.value = tag_info_options.value.sort((a, b) => (a.label > b.label) ? 1 : -1)
}

function onFilterTextBoxChanged() {
  refVaultGrid.value.onFilterTextBoxChanged(quickfilter.value)
}


await loadColorPalette()
await loadData()


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

function loadVault() {
  refVaultGrid.value.loadVault()
}

function fetchVault() {
  refVaultGrid.value.fetchVault()
}

//Settings
async function loadData() {
  await loadTags()
  if (await api.isAuthDataValid() === true) {
    console.log('auth data is valid')
    // loadVault()
  } else {
    console.log('data is not valid')
    selectedTab.value = 'settings'
    $q.notify({
      type: 'warning',
      message: 'Please verify your settings tab information',
      timeout: 8000,
      position: 'top'
    })
  }
}

async function saveUserSettings() {
  let data = {cachePath: 'c:\test'}
  await api.saveUserSettings(data)
}

//End Settings

//Begin Vault
const getAuthUrl = computed(() => {
  return api.getAuthUrl()
})


async function authenticate() {
  if (authorizationCode.value !== 0) {
    let auth = await api.authenticate(authorizationCode.value)
    let data = {auth: auth}
    await api.saveUserSettings(data)
  }
}

//End Vault

//Begin Tags
function closeLeftDrawer() {
  if (leftDrawerOpen.value === true) {
    leftDrawerOpen.value = false
  }
}

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
