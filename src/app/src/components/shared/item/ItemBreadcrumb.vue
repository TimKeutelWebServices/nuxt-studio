<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui/components/Breadcrumb.vue.d.ts'
import { computed, unref } from 'vue'
import { type TreeItem, TreeStatus } from '../../../types'
import { useStudio } from '../../../composables/useStudio'
import { findParentFromFsPath } from '../../../utils/tree'
import { useI18n } from 'vue-i18n'

const { context } = useStudio()
const { t } = useI18n()

const currentItem = computed(() => context.activeTree.value.currentItem.value)
const tree = computed(() => context.activeTree.value.root.value)

const items = computed<BreadcrumbItem[]>(() => {
  const rootTreeItem = context.activeTree.value.rootItem.value
  const rootBreadcrumbItem = {
    icon: 'i-lucide-folder-git',
    label: t(`studio.nav.${rootTreeItem.name.toLowerCase()}`, rootTreeItem.name),
    onClick: () => {
      context.activeTree.value.select(rootTreeItem)
    },
  }

  if (currentItem.value.fsPath === rootTreeItem.fsPath) {
    return [rootBreadcrumbItem]
  }

  const breadcrumbItems: BreadcrumbItem[] = []

  // Walk up to (but not including) the root. When the single content wrapper is
  // folded into the root (useTree.ts) its fsPath is the wrapper's ("<site>"),
  // which must not appear as its own crumb.
  let currentTreeItem: TreeItem | null = unref(currentItem.value)
  while (currentTreeItem && currentTreeItem.fsPath !== rootTreeItem.fsPath) {
    const itemToSelect = currentTreeItem
    breadcrumbItems.unshift({
      label: currentTreeItem.name,
      onClick: async () => {
        await context.activeTree.value.select(itemToSelect)
      },
    })

    currentTreeItem = findParentFromFsPath(tree.value, currentTreeItem.fsPath)
  }

  // Every crumb, always written out — no ellipsis collapsing.
  return [rootBreadcrumbItem, ...breadcrumbItems]
})
</script>

<template>
  <div class="flex items-center gap-1 min-w-0">
    <!--
      dir="rtl" pins the scroll position to the right: when the trail is wider
      than the bar, the current folder stays visible and the earlier crumbs
      scroll off to the left. The inner wrapper switches back to ltr so the
      crumbs and separators render in reading order.
    -->
    <div
      dir="rtl"
      class="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div
        dir="ltr"
        class="w-max"
      >
        <UBreadcrumb
          :items="items"
          color="neutral"
          :ui="{
            list: 'gap-0.5 flex-nowrap',
            item: 'shrink-0',
            link: 'text-sm',
            linkLabel: 'whitespace-nowrap overflow-visible text-clip',
            separatorIcon: 'size-3',
            linkLeadingIcon: 'size-4',
          }"
        />
      </div>
    </div>
    <ItemBadge
      v-if="currentItem.status && currentItem.status !== TreeStatus.Opened"
      :status="currentItem.status"
      size="xs"
      class="shrink-0"
    />
  </div>
</template>
