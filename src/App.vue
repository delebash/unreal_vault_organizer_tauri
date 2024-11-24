<template>
  <Suspense>
    <router-view/>
  </Suspense>
</template>
<script setup>
import CheckForUpdates from "components/CheckForUpdates.vue";
defineOptions({
  name: 'App'
});
</script>
<style>
</style>
