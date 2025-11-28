<script setup>

const props = defineProps({
  params: Object
});

const asset = props.params.data

</script>
<template>
  <a :href="asset?.user?.profileUrl" target="_blank">{{asset.seller}}</a>
</template>

<style scoped>

</style>
