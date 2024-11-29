<template>
  <q-chip v-show="updates" color="yellow-9" text-color="white">
    Updates Available
  </q-chip>

  <ag-grid-vue
    style="width: 100%; height: 100%; margin-bottom: 100px"
    class="ag-theme-alpine"
    id="myGrid"
    :refreshCells="true"
    :columnDefs="columnDefs"
    @grid-ready="onGridReady"
    :defaultColDef="defaultColDef"
    :rowData="rowData"
    :rowSelection="rowSelection"
    :pagination="true"
    :paginationPageSize="paginationPageSize"
    :paginationPageSizeSelector="paginationPageSizeSelector"
    :getRowNodeId="getRowNodeId"
    :valueCache="true"
    :enableCellTextSelection="true"
    :overlayLoadingTemplate="overlayLoadingTemplate"
    @cell-value-changed="onCellValueChanged"
    @selection-changed="onSelectionChanged"
    @first-data-rendered="onFirstDataRendered">
  </ag-grid-vue>
</template>
<style lang="css">

</style>
<script setup>

import {onBeforeMount, ref, shallowRef} from 'vue'
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-alpine.css"; // Optional Theme applied to the Data Grid
import {AgGridVue} from "ag-grid-vue3"; // Vue Data Grid Component
import TagGridSelect from '../components/TagGridSelect.vue'
import CheckboxGrid from '../components/CheckboxGrid.vue'
import TitleImageGrid from '../components/TitleImageGrid.vue'
import {vault} from "src/api/vault.js";
import {isEqual, negate} from 'lodash';

let updates = false
const columnDefs = ref([])

const rowSelection = ref(null);
const paginationPageSize = ref(null);
const paginationPageSizeSelector = ref(null);
const gridApi = shallowRef();
const rowData = ref([])
let getRowNodeId = ref(null)
let selectedRowId = ref(null)
const defaultColDef = {
  width: 150,
  sortable: true,
  editable: true,
  resizable: true,
  filter: true

}

columnDefs.value = [
  {
    headerName: "Asset Id",
    field: "assetId",
    editable: false,
    hide: false
  },
  {
    headerName: "Title",
    field: "title",
    sort: 'asc',
    editable: false,
    wrapText: true,
    autoHeight: true,
    cellRenderer: 'TitleImageGrid',
  },
  {
    headerName: "Description",
    field: "description",
    editable: false,
    autoHeight: true,
    wrapText: true,
    width: 300
  },
  {
    headerName: 'Tags',
    field: 'tagIds',
    autoHeight: true,
    editable: false,
    cellRenderer: 'TagGridSelect',
    width: 270
  },
  {
    headerName: "Comment",
    field: "comment",
    wrapText: true,
    width: 300,
    cellEditor: 'agLargeTextCellEditor'
  },
  {
    headerName: 'Updates Available',
    field: 'updatesAvailable',
    autoHeight: true,
    editable: false,
    cellRenderer: 'agCheckboxCellRenderer',
    width: 165,
  },
  {
    headerName: 'Engine Versions',
    field: 'engineVersions',
    editable: false,
    wrapText: false,
    width: 270,
    filterParams: {
      filterOptions: ['contains', 'notContains', 'equals', 'notEqual'],
      textMatcher: ({filterOption, value, filterText}) => {
        if (filterText == null) {
          return false;
        }
        let bMatch = false
        const myArray = value.split(",")
        let arryFilterText = filterText.split(",")
        if (Array.isArray(arryFilterText)) {
          switch (filterOption) {
            case 'contains':
              return arryFilterText.every(element => myArray.includes(element));
            case 'notContains':
              const filteredArray = arryFilterText.filter(item => !myArray.includes(item));
              return filteredArray.length === arryFilterText.length;
            case 'equals':
              arryFilterText.sort();
              myArray.sort()
              return arraysEqual(arryFilterText, myArray);
            // return isEqual(myArray, arryFilterText);
            case 'notEqual':
              arryFilterText.sort();
              myArray.sort()
              return !isEqual(arryFilterText, myArray);
            //   return arryFilterText !== myArray
            default:
              // should never happen
              console.warn('invalid filter type ' + filter);
              return false;
          }
        }
      }
    }
  },
];

function compareMixedTypes(a, b) {
  if (typeof a === typeof b) {
    return a === b ? 0 : a < b ? -1 : 1;
  }
  return typeof a < typeof b ? -1 : 1;
}

function arraysEqual(a, b) {
  a.sort(compareMixedTypes);
  b.sort(compareMixedTypes);

  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

onBeforeMount(() => {
  rowSelection.value = {
    mode: "multiRow",
  };
  paginationPageSize.value = 5000;
  paginationPageSizeSelector.value = [500, 1000, 5000];
});

const overlayLoadingTemplate =
  '<span class="ag-overlay-loading-center">Please wait while your rows are loading. This could take a minute to refresh your data.</span>';

async function importVault() {
  await vault.importVault();
  await getVault()
}

const onFilterTextBoxChanged = (filterValue) => {
  gridApi.value.setGridOption(
    "quickFilterText",
    filterValue
  );
};

async function getVault(reset = false) {
  //reset filters and sort
  if (reset === true) {
    gridApi.value.setFilterModel(null);
    gridApi.value.applyColumnState({
      defaultState: {sort: null},
    });
  }
  rowData.value = await vault.loadVault();

}

function filterRows(args) {
  rowData.value = args.rows;
}

function getSelectedRowsData() {
  return gridApi.value.getSelectedRows();
}

function onSelectionChanged() {
  let selectedRows = gridApi.value.getSelectedRows();
  selectedRows.forEach(function (selectedRow, index) {
    selectedRowId.value = selectedRow.asset.assetId;
  })
}

async function onGridReady(params) {
  gridApi.value = params.api;
  await getVault()
}

function onFirstDataRendered(params) {
  // params.api.sizeColumnsToFit();
}

async function onCellValueChanged(event) {
  if (event.column.colId === 'comment') {
    await vault.updateVaultAsset(event.data.assetId, {
      comment: event.data.comment
    })
  }
  if (event.column.colId === 'updates_available') {
    await vault.updateVaultAsset(event.data.assetId, {
      updatesAvailable: event.data.updates_available
    })
  }
}

defineExpose({
    getVault,
    importVault,
    filterRows,
    getSelectedRowsData,
    onFilterTextBoxChanged,
    TagGridSelect,
    CheckboxGrid,
    TitleImageGrid
  }
)
</script>
