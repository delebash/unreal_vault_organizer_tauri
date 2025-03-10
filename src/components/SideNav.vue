<template>

  <div class="row">
    <div class="col">
      <q-select
        class="q-mb-xl"
        filled
        v-model="tags"
        use-input
        use-chips
        multiple
        hide-dropdown-icon
        hint="Add new tags, separate multiple values by a comma. Single click tag to check for filtering. Double click to edit name and color"
        input-debounce="0"
        @new-value="createValue"
        style="max-width: 100%"
      >

        <template v-slot:option="scope">
          <q-item
            v-bind="scope.itemProps"
          >
            <q-item-section>
              <q-item-label v-html="scope.opt.label"></q-item-label>
            </q-item-section>
            <q-item-section avatar>
              <q-avatar :color=scope.opt.color></q-avatar>
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <span v-for="tag in tag_info_options.sort((a, b) => (a.label > b.label) ? 1 : -1)">
          <q-chip
            text-color="white"
            clickable
            @dblclick="displayTag(tag)"
            @remove="removeTag(tag)"
            v-model:selected="tag.selected"
            @click="selectedTag(tag)"
            :color=tag.color
          >
            <div class="q-pl-md q-ma-xs">{{ tag.label }}</div>
      </q-chip>
  </span>
    </div>
  </div>
  <div class="row">
    <div class="col-auto">
      <q-select
        dense
        options-dense
        narrow-indicator
        hide-dropdown-icon
        hide-bottom-space
        filled
        v-model="filter_by"
        :options="filter_by_options"
        style="width: 100px"
      />
    </div>
  </div>
  <div class="row">
    <div class="col-auto">
      <q-btn class="q-pt-none q-mb-md"
             dense
             size=""
             @click="filterByTags"
             color="primary"
             label="Click to filter selected tags by operator"></q-btn>
    </div>

    <q-btn class="q-pt-none"
           dense
           size=""
           @click="bulkAddTags"
           color="secondary"
           label="Bulk add selected tags to selected rows"></q-btn>
  </div>

  <q-dialog v-model="tag_edit">

    <q-card style="width: 300px" class="q-px-sm q-pb-md">
      <q-btn icon="close" flat round dense v-close-popup/>
      <q-card-section>
        <div class="text-h6">Change tag properties</div>
      </q-card-section>
      <q-input v-model="tag_label" label="Tag Name"/>
      <q-select
        filled
        use-chips
        v-model="tag_color"
        :options="tag_color_options"
      >
        <template v-slot:option="scope">
          <q-item
            v-bind="scope.itemProps"
          >
            <q-item-section>
              <q-item-label v-html="scope.opt.label"></q-item-label>
            </q-item-section>
            <q-item-section avatar>
              <q-avatar :color="scope.opt.value"></q-avatar>
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:selected-item="scope">
          <q-chip
            text-color="white"
            removable
            dense
            :color="tag_color.value"
            @remove="scope.removeAtIndex(scope.index)"
            :tabindex="scope.tabindex"
            class="q-ma-none"
          >
            {{ tag_color.label }}
          </q-chip>
        </template>
      </q-select>
      <q-btn @click="saveTagInfo" color="primary" label="Save Tag"/>
    </q-card>
  </q-dialog>
</template>

<script setup>
import {ref} from 'vue'
import {db} from "src/api/db.js";
import {eventBus} from "boot/global-components.js";


//Begin Tags
const tags = ref([])
const filter_by = ref('And')
const filter_by_options = ref(
  [
    {label: 'And', value: 'And'},
    {label: 'Or', value: 'Or'},
    {label: 'Not', value: 'Not'}
  ]
)
const new_tags = ref([])
const tag_clicked = ref({})
const tag_info_options = ref([])
const selected_tags = ref([])
const tag_edit = ref(false)
const tag_label = ref('')
const tag_color = ref({})
const tag_color_options = ref([])

tag_color_options.value = await db.colorPalette.orderBy('label').toArray()
await loadTags()

async function bulkAddTags() {
  let tagIds = []
  if (selected_tags.value.length > 0) {
    for (let tag of selected_tags.value) {
      tagIds.push(tag.id)
    }
  }
  eventBus.emit('bulkAddTags', {tagIds: tagIds})
}

async function filterByTags() {
  let filteredRows = []
  let tagIds = []
  let operator = filter_by.value
  if (selected_tags.value.length > 0) {
    for (let tag of selected_tags.value) {
      tagIds.push(tag.id)
    }
    if (typeof operator !== 'string') {
      operator = operator.label
    }
    let rows
    //Or
    if (operator === 'Or') {
      filteredRows = await db.vaultLibrary.where('tagIds').anyOf(tagIds).toArray()
    } else if (operator === 'And') {
      rows = await db.vaultLibrary.toArray()
      for (let row of rows) {
        if (row.tagIds) {
          if (row.tagIds.length > 0) {
            const containsAll = tagIds.every(element => {
              return row.tagIds.includes(element);
            });
            if (containsAll === true) {
              filteredRows.push(row)
            }
          }
        }
      }
    } else if (operator === 'Not') {
      let rows = await db.vaultLibrary.toArray()
      for (let item of rows) {
        if (item.tagIds?.length > 0) {
          const includesTags = item.tagIds.some(item => tagIds.includes(item));
          if (includesTags === false) {
            filteredRows.push(item)
          }
        } else {
          filteredRows.push(item)
        }
      }
    }
  } else {
    filteredRows = await db.vaultLibrary.toArray()
  }
  //only unique rowsS
  filteredRows = uniqBy(filteredRows, JSON.stringify)
  eventBus.emit('filteredRows', {rows: filteredRows})
}

function uniqBy(a, key) {
  let seen = new Set();
  return a.filter(item => {
    let k = key(item);
    return seen.has(k) ? false : seen.add(k);
  });
}

function selectedTag(tag) {
  if (tag.selected === true) {
    selected_tags.value.push(tag)
  } else {
    const index = selected_tags.value.findIndex(({label}) => label === tag.label);
    selected_tags.value.splice(index, 1)
  }
}

async function saveTagInfo() {
  tag_clicked.value.label = tag_label.value
  tag_clicked.value.color = tag_color.value.value
  tag_edit.value = false
  await db.tags.put({
    id: tag_clicked.value.id,
    label: tag_clicked.value.label,
    value: tag_clicked.value.value,
    color: tag_clicked.value.color
  })
  eventBus.emit('refreshGrid', {})
}

async function removeTag(tag) {
  const index = tag_info_options.value.findIndex(({label}) => label === tag.label);
  tag_info_options.value.splice(index, 1)
  selected_tags.value.splice(index, 1)
  await db.tags.delete(tag.id)
  eventBus.emit('refreshGrid', {})
}

function displayTag(tag) {
  tag_color.value = {}
  tag_edit.value = true
  tag_clicked.value = tag
  tag_label.value = tag.label
  tag_color.value.value = tag.color
  tag_color.value.label = tag.label
}

async function createValue(val, done) {
  // specific logic to eventually call done(...) -- or not
  done(val, 'add-unique')
  if (val.length > 0) {
    val
      .split(/[,;|]+/)
      .map(v => v.trim())
      .filter(v => v.length > 0)
      .forEach(v => {
        const found = tag_info_options.value.some(item => item.label === v);
        if (found === false) {
          let obj = {label: v, value: v, color: 'grey'}
          new_tags.value.push(obj)
        }
      })
    done(null)

    for (let tag of new_tags.value) {
      let id = await db.tags.add({
        value: tag.value,
        label: tag.label,
        color: tag.color
      })
      tag.id = id
      tag_info_options.value.push(tag)
    }
    tags.value = []
    new_tags.value = []
    eventBus.emit('refreshGrid', {})
  }
}

async function loadTags() {
  tag_info_options.value = await db.tags.toArray()
  tag_info_options.value = tag_info_options.value.sort((a, b) => (a.label > b.label) ? 1 : -1)
}

defineExpose({
    removeTag
  }
)
</script>
