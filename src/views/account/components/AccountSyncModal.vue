<template>
  <a-modal :open="props.open" title="账号同步" width="1000"
    @ok="handleOk" :okButtonProps="{ loading: loading }" okText="同步"
    @update:open="(value: boolean) => emit('update:open', value)">
    <div class="account-sync-modal">
      <AccountSelect v-model="selectedAccountList"></AccountSelect>
    </div>
    
  </a-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import AccountSelect from '@/components/AccountSelect.vue';
import { message } from 'ant-design-vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits(['update:open'])

const selectedAccountList = ref<any[]>([])
const loading = ref(false);

const handleOk = async () => {
  const accountIdList = selectedAccountList.value.map(item => item.id)
  const data = JSON.parse(JSON.stringify(accountIdList))
  loading.value = true;
  try {
    const res  = await window.electronAPI.apiRequest({
      url: '/platform-account-sync-task/add',
      method: 'post',
      data
    })
    if (res.code === 0) {
      message.success('同步完成')
      emit('update:open', false);
    } else {
      throw new Error(res.message)
    }
  } catch (error: any) {
    console.error('同步失败：' + error.message)
    message.error('同步失败：' + error.message)
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>

</style>