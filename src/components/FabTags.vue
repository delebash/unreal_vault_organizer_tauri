<script setup>
import {ref, onBeforeMount} from 'vue'
import {db} from "../api/db.js";

const tags = ref([])
const props = defineProps({
  params: Object
});

onBeforeMount(() => {
  loadData()
})

async function loadData() {
  let fabTags = await db.fabTags.toArray()
  if (fabTags.length > 0 && props.params.data.fabTagIds) {
    let fabTagIds = props.params.data.fabTagIds
    let filteredObjects = fabTags.filter(obj => fabTagIds.includes(obj.uid));
    tags.value = filteredObjects.sort((a, b) => (a.name > b.name) ? 1 : -1)
  }
}
</script>

<template>
  <q-chip v-for="tag in tags" :key="tag.uid"
          text-color="white"
          dense
          :color=tag.color
          class="q-pa-xs"
  >
    {{ tag.name }}
  </q-chip>
</template>

<style scoped>

</style>
