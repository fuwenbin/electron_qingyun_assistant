<template>
  <div class="publish-modal-body custom-scroll">
    <div class="platform-account-group-list">

    </div>
    <div class="platform-account-chooser-container">
      <div class="account-chooser-filter">
        <div class="select-all">
          <a-checkbox :checked="isAccountAllSelected" @change="selectAllAccount"/>全选
        </div>
      </div>
      <div class="account-chooser-list">
        <div v-for="item in platformAccountList" :key="item.id" class="account-chooser-item">
          <a-checkbox :checked="isAccountSelected(item)" @change="handleAccountCheckChange(item)" />
          <img :src="item.logo" class="item-logo" />
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-platform-info">
              <div class="platform-name">{{ item.platform?.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps<{
  modelValue: any[]
}>();

const emit = defineEmits(['update:modelValue'])

const platformAccountList = ref<any[]>([])

const isAccountSelected = (item: any) => {
  return !!props.modelValue.find(v => v.id === item.id)
}

const isAccountAllSelected = computed(() => {
  let result = platformAccountList.value.length ===  props.modelValue.length;
  if (!result) {
    return false;
  }
  for (let i = 0; i < platformAccountList.value.length; i++) {
    const item = platformAccountList.value[i];
    if (!props.modelValue.find(v => v.id === item.id)) {
      result = false;
      break;
    }
  }
  return result;
})

const selectAllAccount = () => {
  let newValue;
  if (isAccountAllSelected.value) {
    newValue = [];
  } else {
    newValue = platformAccountList.value;
  }
  emit('update:modelValue', newValue);
}

const handleAccountCheckChange = (item: any) => {
  let newValue;
  if (props.modelValue.find(v => v.id === item.id)) {
    newValue = props.modelValue.filter(v => v.id !== item.id);
  } else {
    newValue = [...props.modelValue, item]
  }
  emit('update:modelValue', newValue);
}

const getAccountList = async () => {
  const res = await window.electronAPI.apiRequest({
    url: '/platform-account/list',
    method: 'GET'
  })
  try {
    if (res.code === 0) {
      platformAccountList.value = res.data
    } else {
      throw new Error(res.message);
    }
  } catch (error: any) {
    console.error('获取账号列表报错：' + error.message)
    message.error('获取账号列表报错：' + error.message)
  }
}

onMounted(() => {
  getAccountList()
})
</script>

<style lang="scss" scoped>
.publish-modal-body {
  height: 70vh;
  .account-chooser-filter {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .account-chooser-item {
    height: 40pix;
    display: flex;
    align-items: center;
    gap: 5px;
    .item-logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
  }
}
.timing-config {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>