<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">{{ title }}</div>
            <div class="text-subtitle2">该功能正在开发中...</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="flex flex-center" style="min-height: 200px;">
              <q-icon name="engineering" size="100px" color="grey-4" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script> 