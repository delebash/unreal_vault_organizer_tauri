<template>
  <q-chip v-show="updates" color="yellow-9" text-color="white">
    Updates Available
  </q-chip>
  <div class="q-mt-md q-mb-sm">
    <span class="q-mr-sm q-ml-sm">Quick Filter:</span>
    <input type="text" v-model="quickFilterText" id="filter-text-box" placeholder="Filter..."
           @input="onFilterTextBoxChanged">
  </div>
  <ag-grid-vue
    style="width: 100%; height: 100%; margin-bottom: 100px"
    :theme="themeAlpine"
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
    :valueCache="true"
    :enableCellTextSelection="true"
    :overlayLoadingTemplate="overlayLoadingTemplate"
    @cell-value-changed="onCellValueChanged"
    :preventDefaultOnContextMenu=true
    @cellContextMenu="contextMenu"
  >
  </ag-grid-vue>

  <GridContextMenu v-model="isContextMenuVisible" :topValue="topValue" :leftValue="leftValue"/>
</template>
<style lang="css">

</style>
<script setup>

import {onBeforeMount, ref, shallowRef} from 'vue'
import {themeAlpine} from 'ag-grid-community';
import {AllCommunityModule, ModuleRegistry} from 'ag-grid-community';
import {AgGridVue} from "ag-grid-vue3"; // Vue Data Grid Component
import TagGridSelect from './TagGridSelect.vue'
import CheckboxGrid from './CheckboxGrid.vue'
import TitleImageGrid from './TitleImageGrid.vue'
import GridContextMenu from './GridContextMenu.vue';
import FabTags from './FabTags.vue';
import GridUrl from './GridUrl.vue'
import {vault} from "src/api/vault.js";
import {isEqual, negate} from 'lodash';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

let topValue = ref(0)
let leftValue = ref(0)
let isContextMenuVisible = ref(false)
let updates = false
const columnDefs = ref([])
const rowSelection = ref(null);
const quickFilterText = ref('');
const paginationPageSize = ref(null);
const paginationPageSizeSelector = ref(null);
const gridApi = ref(null);
const rowData = ref([])
// let getRowNodeId = ref(null)
// let selectedRowId = ref(null)
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
    hide: true
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
    headerName: 'Fab Tags',
    field: 'fabTagIds',
    autoHeight: true,
    editable: false,
    width: 270,
    cellRenderer: 'FabTags',
    wrapText: true
  },
  {
    headerName: "Categories",
    field: "categories",
    editable: false,
    autoHeight: true,
    wrapText: true,
    width: 300
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
    wrapText: true,
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
              console.warn('invalid filter type ' + filterOption);
              return false;
          }
        }
      }
    }
  },
  {
    headerName: 'Target Platforms',
    field: 'targetPlatforms',
    editable: false,
    wrapText: true,
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
              console.warn('invalid filter type ' + filterOption);
              return false;
          }
        }
      }
    }
  },
  {
    headerName: "Seller",
    field: "seller",
    editable: false,
    autoHeight: true,
    wrapText: true,
    cellRenderer: 'GridUrl',
  },
  {
    field: "lastUpdatedAt",
    headerName: "Last Updated At",
    autoHeight: true,
    wrapText: true,
    width: 300,
    editable: false,
    valueFormatter: function (params) {
      if (params.value) {
        const date = new Date(params.value);
        return date.toLocaleDateString({
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        });
      }
      return '';
    },
  },
  {
    headerName: "Distribution Method",
    field: "distributionMethod",
    editable: false,
    autoHeight: true,
    wrapText: true,
    width: 300
  },
];

function contextMenu(e) {
  topValue.value = e.event.clientY;
  leftValue.value = e.event.clientX;
  isContextMenuVisible.value = true
  console.log(e)
}

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
    mode: 'multiRow',
    enableClickSelection: true,
  }
  paginationPageSize.value = 5000;
  paginationPageSizeSelector.value = [500, 1000, 5000];

});

const overlayLoadingTemplate =
  '<span class="ag-overlay-loading-center">Please wait while your rows are loading. This could take a minute to refresh your data.</span>';


async function importVault() {
  await vault.importVault();
  await getVault()
}


async function importAssetDetail() {
  await vault.importAssetDetail();
  await getVault()
}

function onFilterTextBoxChanged() {
  gridApi.value.setGridOption(
    "quickFilterText",
    quickFilterText.value
  );
}

async function getVault(reset = false) {
  //reset filters and sort
  if (reset === true) {
    gridApi.value.setFilterModel(null);
    gridApi.value.applyColumnState({
      state: [
        {
          colId: 'title',
          sort: 'asc'
        }
      ],
      defaultState: {
        // important to say 'null' as undefined means 'do nothing'
        sort: null
      }
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

// function onSelectionChanged() {
//   let selectedRows = gridApi.value.getSelectedRows();
//   selectedRows.forEach(function (selectedRow, index) {
//     selectedRowId.value = selectedRow.asset.assetId;
//   })
// }

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
}

function getGridApi() {
  return gridApi.value
}

defineExpose({
    getVault,
    importVault,
    filterRows,
    getSelectedRowsData,
    onFilterTextBoxChanged,
    TagGridSelect,
    CheckboxGrid,
    TitleImageGrid,
    GridUrl,
    importAssetDetail,
    FabTags,
    getGridApi
  }
)
</script>
