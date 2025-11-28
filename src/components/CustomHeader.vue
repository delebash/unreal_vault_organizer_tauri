<!-- CustomHeader.vue -->
<template>
  <div class="ag-cell-label-container" role="presentation">
    <span data-ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>
    <span data-ref="eFilterButton" class="ag-header-icon ag-header-cell-filter-button"></span>
    <div data-ref="eLabel" class="ag-header-cell-label" role="presentation">
      <span data-ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>
      <span data-ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>
      <span data-ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>
      <span data-ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>
      ** <span data-ref="eText" class="ag-header-cell-text" role="columnheader"></span>
      <span data-ref="eFilter" class="ag-header-icon ag-filter-icon"></span>
    </div>
  </div>
<!--  <div class="custom-header">-->
<!--    <span class="custom-header-label">{{ params.displayName }}</span>-->
<!--    <button @click="onSortAsc" v-if="params.enableSorting">Sort ASC</button>-->
<!--    <button @click="onSortDesc" v-if="params.enableSorting">Sort DESC</button>-->
<!--    <button @click="onMenuClick" v-if="params.enableMenu">Open Menu</button>-->
<!--  </div>-->
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  params: Object, // AG Grid provides header component parameters via 'params'
});

const onSortAsc = () => {
  props.params.setSort('asc', false);
};

const onSortDesc = () => {
  props.params.setSort('desc', false);
};

const onMenuClick = () => {
  props.params.showColumnMenu(event.target);
};
</script>

<style scoped>
@import 'ag-grid-community/styles/ag-grid.css';
@import 'ag-grid-community/styles/ag-theme-alpine.css';
</style>
