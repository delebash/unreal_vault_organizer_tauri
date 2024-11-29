<template>
  <q-checkbox
    v-model="updates_available"
    color="secondary"
    true-value="1"
    false-value="0"
    disable
    @update:model-value="updateCheckbox"
  />
</template>

<script setup>
import {ref} from 'vue'
import {vault} from "src/api/vault.js";

const props = defineProps({
  params: Object
});

const updates_available = ref(false)

loadData()

async function loadData() {

  updates_available.value = props.params.data.updatesAvailable || false
}

async function updateCheckbox(value) {
  await vault.updateVaultAsset(props.params.data.assetId,{updatesAvailable: value})
}
</script>

<style scoped>

</style>
