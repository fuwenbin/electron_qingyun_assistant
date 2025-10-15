<template>
  <div class="font-level-chooser">
    <div class="chooser-item shape-1" style="font-size: 20px;font-weight: bold;" 
      :class="{ active: isActive('标题1') }"
      @click="() => changeFontSize(56, 'bold')">标题1
    </div>
    <div class="chooser-item shape-2" style="font-size: 18px;font-weight: bold;" 
      :class="{ active: isActive('标题2') }"
      @click="() => changeFontSize(48, 'bold')">标题2
    </div>
    <div class="chooser-item shape-3" style="font-size: 16px;font-weight: bold;" 
      :class="{ active: isActive('标题3') }"
      @click="() => changeFontSize(44, 'bold')">标题3
    </div>
    <div class="chooser-item shape-4" style="font-size: 14px;font-weight: bold;" 
      :class="{ active: isActive('标题4') }"
      @click="() => changeFontSize(40, 'bold')">标题4
    </div> 
    <div class="chooser-item shape-5" style="font-size: 12px;font-weight: normal; " 
      :class="{ active: isActive('正文') }"
      @click="() => changeFontSize(36, 'normal')">正文
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  value: any
}>()

const emit = defineEmits(['update:value'])

const activeStyle = computed(() => {
  if (props.value.fontSize === 56 && props.value.fontWeight === 'bold') {
    return '标题1'
  } else if (props.value.fontSize === 48 && props.value.fontWeight === 'bold') {
    return '标题2'
  } else if (props.value.fontSize === 44 && props.value.fontWeight === 'bold') {
    return '标题3'
  } else if (props.value.fontSize === 40 && props.value.fontWeight === 'bold') {
    return '标题4'
  } else {
    return '正文'
  }
})

const isActive = (value: string) => {
  return activeStyle.value === value;
}

const changeFontSize = (fontSize: number, fontWeight: string) => {
  emit('update:value', {
    ...props.value,
    fontSize: fontSize,
    fontWeight: fontWeight
  })
}
</script>

<style scoped lang="scss">
.font-level-chooser {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 6px;
  .chooser-item {
    cursor: pointer;
    border: 1px solid #999; 
    border-radius: 4px;

    text-align: center;
    &.active {
      border-color: #1677ff;
    }
  }
  .shape-1{
    width: 58px;
    height: 58px;
    line-height: 58px;
  }
  .shape-2{
    width: 56px;
    height: 56px;
    line-height: 56px;
  }
  .shape-3{
    width: 54px;
    height: 54px;
    line-height: 54px;
  }
  .shape-4{
    width: 52px;
    height: 52px;
    line-height: 52px;
  }
  .shape-5{
    width: 50px;
    height: 50px;
    line-height: 50px;
  }
}
</style>
