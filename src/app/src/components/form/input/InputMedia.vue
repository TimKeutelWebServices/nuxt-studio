<script setup lang="ts">
import type { FormItem, TreeItem } from '../../../types'
import type { PropType } from 'vue'
import { ref } from 'vue'
import { Image } from '@unpic/vue'

defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    default: () => ({}),
  },
})

const model = defineModel<string>({ default: '' })

const isMediaPickerOpen = ref(false)

function handleMediaSelect(media: TreeItem | null) {
  // `null` is the picker's "use an external URL" answer. It cannot arrive while
  // the footer actions are hidden, but the field stays writable either way.
  if (media) {
    model.value = media.routePath || media.fsPath
  }

  isMediaPickerOpen.value = false
}
</script>

<template>
  <div class="flex items-center gap-1">
    <div
      class="flex items-center justify-center size-6 bg-muted border border-muted rounded shrink-0 overflow-hidden"
    >
      <Image
        v-if="model"
        :src="model"
        width="24"
        height="24"
        :alt="model"
        class="size-6 object-cover"
      />
      <UIcon
        v-else
        name="i-lucide-image"
        class="text-dimmed"
      />
    </div>

    <UInput
      v-model="model"
      :placeholder="$t('studio.form.media.placeholder')"
      size="xs"
      class="flex-1"
    >
      <template #trailing>
        <UTooltip :text="$t('studio.mediaPicker.image.title')">
          <UButton
            size="xs"
            color="neutral"
            variant="none"
            icon="i-lucide-search"
            class="cursor-pointer"
            @click="isMediaPickerOpen = true"
          />
        </UTooltip>
      </template>
    </UInput>

    <!--
      The same picker the rich-text editor and the text fields open: folder tree,
      search across the whole path, and paged thumbnails. It replaces a popover
      that showed the first eight matches by *name* only — unusable when the file
      names say nothing about what is in the picture.

      `actions` is off: uploading belongs in the media library, and the field next
      to this button already takes an external URL.
    -->
    <ModalMediaPicker
      :open="isMediaPickerOpen"
      type="image"
      :actions="false"
      @select="handleMediaSelect"
      @cancel="isMediaPickerOpen = false"
    />
  </div>
</template>
