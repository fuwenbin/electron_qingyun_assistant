<template>
  <div class="start-time-config">
    <a-select v-model:value="minute" :options="minuteOptions()" @change="handleMinuteChange" />
    <span>分</span>
    <a-select v-model:value="second" :options="secondOptions()" @change="handleSecondChange" />
    <span>秒</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps<{
  value: number;
}>();

const emit = defineEmits<{
  (e: 'update:value', value: number): void
}>();

const minute = ref(props.value / 60 || 0);
const second = ref(props.value % 60 || 0);
const minuteOptions = () => {
  return Array.from({ length: 60 }, (_, index) => ({
    label: index < 10 ? `0${index}` : index.toString(),
    value: index
  }));
}

const secondOptions = () => {
  return Array.from({ length: 60 }, (_, index) => ({
    label: index < 10 ? `0${index}` : index.toString(),
    value: index
  }));
}

const handleMinuteChange = (value: number) => {
  emit('update:value', value * 60 + second.value);
}

const handleSecondChange = (value: number) => {
  emit('update:value', minute.value * 60 + value);
}

</script>

<style scoped lang="scss">
.start-time-config {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
