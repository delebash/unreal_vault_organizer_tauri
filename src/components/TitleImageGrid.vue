<script setup>

const props = defineProps({
  params: Object
});

const asset = props.params.data

</script>
<template>
  <a :href="`${asset.url}`" target="_blank">
  <div class="q-ml-xs">
    {{asset.title}}
    <q-img
      :src="asset.image?.url"
      spinner-color="white"
      style="height: 140px; max-width: 150px">
    </q-img>
  </div>
  </a>
</template>

<style scoped>

</style>
