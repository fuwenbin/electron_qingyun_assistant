<template>
  <a-modal :open="props.open" title="未回复评论" okText="发布回复"
    :okButtonProps="{ loading: publishLoading }"
    @ok="handleOk"
    @update:open="(value: boolean) => emit('update:open', value)">
    <div class="comment-list-dialog">
      <a-spin :spinning="loading">
        <div v-if="dataList && dataList.length > 0" class="comment-list">
          <div v-for="comment in dataList" class="comment-item">
            <div class="item-origin">
              <div>{{ comment.user.nickname }}</div>
              <div>{{ showCommentTime(comment.createTime) }}</div>
            </div>
            <div class="item-origin-text">{{ comment.text }}</div>
            <div class="item-reply">
              <div style="width: 50px;">回复：</div>
              <a-textarea v-model:value="comment.replyText" placeholder="请输入回复内容"
                @change="(e: any) => reply(e, comment)" />
            </div>
          </div>
        </div>
        <div v-else>暂无数据</div>
      </a-spin>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs';

const props = defineProps<{
  open: boolean
  accountId: string,
  platformId: number,
  itemId: string
}>()

const emit = defineEmits(['update:open'])

const loading = ref(false)
const dataList = ref<any[]>([])
const publishLoading = ref(false)

const showCommentTime = (time: number) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const reply = (e: any, item: any) => {
  const value = e.target.value
  console.log(e.target.value);
  item.replyText = value
}
const getDataList = async () => {
  try {
    const data = JSON.parse(JSON.stringify({
      accountId: props.accountId,
      platformId: props.platformId,
      itemId: props.itemId
    }))
    loading.value = true
    const res = await window.electronAPI.apiRequest({
      url: '/platform-account-comment/listNotReplyCommentLatest10',
      method: 'GET',
      data
    })
    if (res.code === 0) {
      dataList.value = res.data || []
      console.log(res.data)
    } else {
      throw new Error(res.message)
    }
  } catch (error: any) {
    console.error("获取评论列表失败：" + error.message)
    message.error("获取评论列表失败：" + error.message)
  } finally {
    loading.value = false
  }
}

const handleOk = async () => {
  const replyList = dataList.value.map(item => {
    return {
      commentId: item.cid,
      replyText: item.replyText
    }
  }).filter(v => v.replyText);
  if (replyList.length === 0) {
    message.error('请填写评论回复')
    return;
  }
  const data = JSON.parse(JSON.stringify({
    accountId: props.accountId,
    platformId: props.platformId,
    itemId: props.itemId,
    replyList
  }))
  try {
    publishLoading.value = true;
    const res = await window.electronAPI.apiRequest({
      url: '/platform-account-comment/publishCommentReply',
      method: 'POST',
      data
    })
    if (res.code === 0) {
      message.success('发布成功', 3)
      emit('update:open', false)
    }
  } catch (error: any) {
    console.error('发布评论回复失败：' + error.message)
    message.error('发布评论回复失败：' + error.message)
  } finally {
    publishLoading.value = false;
  }
}

onMounted(() => {
  getDataList()
})
</script>

<style lang="scss" scoped>
.comment-list-dialog {
  min-height: 500px;
  max-height: 70vh;
  overflow-y: auto;
}
.comment-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 0;
  .item-origin {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .item-reply {
    display: flex;

  }
}
</style>