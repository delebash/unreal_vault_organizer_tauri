<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  topValue: Number,
  leftValue: Number
});
const isContextMenuVisible = defineModel();

</script>

<template>
  <div class="context-menu" :style="{ 'top': props.topValue+'px', 'left': props.leftValue+'px' }">
    <q-menu v-model="isContextMenuVisible">
      <q-list style="min-width: 100px">
        <q-item clickable v-close-popup>
          <q-item-section>New tab</q-item-section>
        </q-item>
        <q-item clickable v-close-popup>
          <q-item-section>New incognito tab</q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable v-close-popup>
          <q-item-section>Recent tabs</q-item-section>
        </q-item>
        <q-item clickable v-close-popup>
          <q-item-section>History</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<style scoped>

</style>
