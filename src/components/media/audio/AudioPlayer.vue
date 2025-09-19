<template>
  <div class="audio-player-wrapper">
    <div class="audio-player">
      <AlignCenterOutlined class="audio-icon" />
      <div class="audio-content">
        <div class="audio-name">{{ props.modelValue.name }}</div>
        <div class="audio-controls">
          <PlayCircleFilled v-if="!playing" class="control-btn" @click="play" />
          <PauseCircleFilled v-else class="control-btn" @click="pause" />
          <a-progress class="control-progress" :percent="progress" 
            status="active" :show-info="false" />
        </div>
        <div class="audio-duration">
          <span class="current-time">{{ formatShortDuration(currentTime, 0) }}</span>
          <span class="total-time">{{ formatShortDuration(props.modelValue.duration, 0) }}</span>
        </div>
      </div>
    </div>
    <CloseCircleOutlined class="remove-btn" @click="emit('remove')" />
    <audio ref="audioRef" :src="props.modelValue.url"
      @play="onPlay" @pause="onPause" @timeupdate="onTimeUpdate" 
      @loadedmetadata="onLoadedMetadata" crossorigin="anonymous"></audio>
  </div>
  
</template>

<script setup lang="ts">
import { ref } from "vue";
import { CloseCircleOutlined, PlayCircleFilled, PauseCircleFilled, AlignCenterOutlined } from "@ant-design/icons-vue";
import { formatShortDuration } from "@/utils/common-utils";

const props  = defineProps<{
  modelValue: any;
}>();
const emit = defineEmits(["remove", "update:modelValue"]);
const playing = ref(false);
const progress = ref(0);
const audioRef = ref<HTMLAudioElement>();
const currentTime = ref(0);

const onLoadedMetadata = () => {
  if (audioRef.value) {
    if (!props.modelValue.duration) {
      emit('update:modelValue', {
        ...props.modelValue,
        duration: audioRef.value.duration
      })
    }
  }
}
const onPlay = () => {
  playing.value = true;
}

const onPause = () => {
  playing.value = false;
}

const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime;
    progress.value = currentTime.value / props.modelValue.duration * 100;
  }
}

const play = () => {
  if (audioRef.value) {
    audioRef.value.play();
  }
}

const pause = () => {
  if (audioRef.value) {
    audioRef.value.pause();
  }
}
</script>

<style scoped lang="scss">
.audio-player-wrapper {
  width: 100%;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  position: relative;
  border: 2px solid #eeeeee;
  border-radius: 4px;
  &:hover {
    .remove-btn {
      display: block;
    }
  }
  .remove-btn {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
    display: none;
    font-size: 25px;
  }
}
.audio-player {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  .audio-icon {
    font-size: 24px;
    color: #1677ff;
  }
  .audio-content {
    flex: 1;
    gap: 2px;
  }
}
.audio-controls {
  display: flex;
  align-items: center;
  gap: 5px;
  .control-btn {
    font-size: 16px;
  }
  .control-progress {
    transform: translateY(2px);
  }
}
.audio-duration {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>