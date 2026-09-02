<script setup lang="ts">
import { computed } from 'vue'
import type { MediaUploadTask } from '../../types'
import { MediaUploadStatus } from '../../types/media'
import { formatBytes } from '../../utils/file'

const props = defineProps<{
  tasks: MediaUploadTask[]
}>()

const uploadingCount = computed(() => props.tasks.filter(task => task.status === MediaUploadStatus.Uploading).length)
const overallProgress = computed(() => {
  if (props.tasks.length === 0) return 0
  const total = props.tasks.reduce((sum, task) => sum + task.progress, 0)
  return Math.round(total / props.tasks.length)
})

function statusIcon(task: MediaUploadTask): string {
  return task.status === MediaUploadStatus.Success ? 'i-lucide-check' : 'i-lucide-x'
}
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-150"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="tasks.length > 0"
      class="absolute bottom-4 right-4 z-20 w-80 max-w-[calc(100%-2rem)] rounded-lg border-[0.5px] border-default bg-default shadow-lg overflow-hidden"
    >
      <div class="flex items-center gap-2 px-3 py-2 border-b-[0.5px] border-default bg-muted/70">
        <UIcon
          name="i-lucide-upload-cloud"
          class="size-3.5 text-muted shrink-0"
        />
        <span class="text-xs font-medium truncate">
          {{ uploadingCount > 0
            ? $t('studio.media.uploadingCount', { count: uploadingCount }, uploadingCount)
            : $t('studio.media.uploadComplete') }}
        </span>
        <UProgress
          v-if="uploadingCount > 0"
          :model-value="overallProgress"
          size="sm"
          class="ml-auto w-12"
        />
      </div>

      <ul class="max-h-56 overflow-y-auto divide-y-[0.5px] divide-default">
        <li
          v-for="task in tasks"
          :key="task.id"
          class="flex flex-col gap-1 px-3 py-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <UIcon
              name="i-lucide-image"
              class="size-3.5 text-muted shrink-0"
            />
            <span class="text-xs truncate flex-1">{{ task.name }}</span>
            <span
              v-if="task.status === MediaUploadStatus.Uploading"
              class="text-[10px] text-muted tabular-nums shrink-0"
            >{{ task.progress }}%</span>
            <UIcon
              v-else
              :name="statusIcon(task)"
              class="size-3.5 shrink-0"
              :class="task.status === MediaUploadStatus.Success ? 'text-success' : 'text-error'"
            />
          </div>

          <UProgress
            v-if="task.status === MediaUploadStatus.Uploading"
            :model-value="task.progress"
            size="xs"
          />
          <p
            v-else-if="task.status === MediaUploadStatus.Error"
            class="text-[10px] text-error truncate"
          >
            {{ task.error || $t('studio.media.uploadError') }}
          </p>
          <p
            v-else
            class="text-[10px] text-muted"
          >
            {{ formatBytes(task.size) }}
          </p>
        </li>
      </ul>
    </div>
  </Transition>
</template>
