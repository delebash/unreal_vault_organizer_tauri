<template>
  <div>
    <input type="text" v-model="filterText" @input="onFilterInputChange" />
  </div>
</template>

<script setup>
import {ref} from 'vue';
const props = defineProps({
  params: Object
});

const filterText = ref('');

const onFilterInputChange = () => {
  props.params.filterChangedCallback();
};

const doesFilterPass = (params) => {
  const value = params;
  console.log(value)
  return value?.toLowerCase().includes(filterText.value.toLowerCase());
};

const isFilterActive = () => filterText.value !== '';

const getModel = () => filterText.value;

const setModel = (model) => {
  filterText.value = model;
};

defineExpose({
  doesFilterPass,
  isFilterActive,
  getModel,
  setModel,
});
</script>
