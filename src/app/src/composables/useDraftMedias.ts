import { joinURL, withLeadingSlash } from 'ufo'
import type { DraftItem, StudioHost, MediaItem, RawFile, MediaUploadTask } from '../types'
import { VIRTUAL_MEDIA_COLLECTION_NAME, generateStemFromFsPath } from '../utils/media'
import { DraftStatus } from '../types/draft'
import { MediaUploadStatus } from '../types/media'
import type { useGitProvider } from './useGitProvider'
import { createSharedComposable } from './createSharedComposable'
import { useDraftBase } from './useDraftBase'
import { mediaStorage as storage } from '../utils/storage'
import { getFileExtension, slugifyFileName } from '../utils/file'
import { useHooks } from './useHooks'
import { useError } from './useError'
import { consola } from 'consola'
import { reactive, ref } from 'vue'

// Task stays visible long enough for the user to register it, then clears from the queue
const UPLOAD_TASK_SUCCESS_TTL = 1500
const UPLOAD_TASK_ERROR_TTL = 5000

const logger = consola.withTag('Nuxt Studio')
const hooks = useHooks()
const { showError } = useError()

export const useDraftMedias = createSharedComposable((host: StudioHost, gitProvider: ReturnType<typeof useGitProvider>) => {
  const {
    isLoading,
    list,
    current,
    get,
    create,
    remove,
    revert,
    revertAll,
    selectByFsPath,
    unselect,
    load,
    getStatus,
  } = useDraftBase('media', host, gitProvider, storage)

  const isExternalMedia = host.meta.media?.external

  const uploadQueue = ref<MediaUploadTask[]>([])

  async function createFolder(parentFsPath: string): Promise<string | undefined> {
    try {
      const gitkeepFsPath = joinURL(parentFsPath, '.gitkeep')
      const gitKeepMedia: MediaItem = {
        id: joinURL(VIRTUAL_MEDIA_COLLECTION_NAME, gitkeepFsPath),
        fsPath: gitkeepFsPath,
        stem: generateStemFromFsPath(gitkeepFsPath),
        extension: '',
      }

      await host.media.upsert(gitkeepFsPath, gitKeepMedia)

      if (!isExternalMedia) {
        await create(gitkeepFsPath, gitKeepMedia)
      }

      await hooks.callHook('studio:draft:media:updated', { caller: 'useDraftMedias.createFolder' })

      return gitkeepFsPath
    }
    catch (error) {
      showError('Error creating folder', (error as Error).message)
    }
  }

  async function upload(parentFsPath: string, file: File) {
    const task = reactive<MediaUploadTask>({
      id: `${parentFsPath}/${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: MediaUploadStatus.Uploading,
    })
    uploadQueue.value.push(task)

    try {
      const draftItem = await fileToDraftItem(parentFsPath, file, (progress) => {
        task.progress = progress
      })
      await host.media.upsert(draftItem.fsPath, draftItem.modified!)

      if (!isExternalMedia) {
        await create(draftItem.fsPath, draftItem.modified!)
      }

      task.progress = 100
      task.status = MediaUploadStatus.Success

      await hooks.callHook('studio:draft:media:updated', { caller: 'useDraftMedias.upload' })
    }
    catch (error) {
      task.status = MediaUploadStatus.Error
      task.error = (error as Error).message
      logger.error('Error uploading media:', error)
      showError('Error uploading media', (error as Error).message)
    }
    finally {
      setTimeout(() => {
        uploadQueue.value = uploadQueue.value.filter(queuedTask => queuedTask.id !== task.id)
      }, task.status === MediaUploadStatus.Error ? UPLOAD_TASK_ERROR_TTL : UPLOAD_TASK_SUCCESS_TTL)
    }
  }

  async function fileToDraftItem(parentFsPath: string, file: File, onProgress?: (progress: number) => void): Promise<DraftItem<MediaItem>> {
    const rawData = await fileToDataUrl(file, onProgress)
    const slugifiedFileName = slugifyFileName(file.name)
    const fsPath = parentFsPath !== '/' ? joinURL(parentFsPath, slugifiedFileName) : slugifiedFileName

    return {
      fsPath,
      remoteFile: undefined,
      status: DraftStatus.Created,
      modified: {
        id: joinURL(VIRTUAL_MEDIA_COLLECTION_NAME, fsPath),
        fsPath,
        extension: getFileExtension(fsPath),
        stem: generateStemFromFsPath(fsPath),
        path: withLeadingSlash(fsPath),
        raw: rawData,
      },
    }
  }

  async function rename(items: { fsPath: string, newFsPath: string }[]) {
    // External storage cannot be renamed from here: the editor holds only the
    // metadata of an external file, never its bytes, so the read/write/delete
    // below would replace the image with a JSON document. The server owns the
    // bytes, so it owns the move — see server/routes/medias-move.post.ts.
    if (isExternalMedia) {
      for (const { fsPath, newFsPath } of items) {
        const response = await fetch('/__nuxt_studio/medias-move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fsPath, to: newFsPath }),
        })

        if (!response.ok) {
          // The handler's messages are written to be read — a host application
          // may answer "still in use on these pages" — so they belong in the
          // dialog rather than only in the console.
          let message = response.statusText
          try {
            message = (await response.json()).message || message
          }
          catch {
            // no JSON body; the status text stands
          }

          showError('Error renaming media', message)
          return
        }
      }

      await hooks.callHook('studio:draft:media:updated', { caller: 'useDraftMedias.rename' })
      return
    }

    for (const item of items) {
      const { fsPath, newFsPath } = item

      const existingDraftToRename = list.value.find(draftItem => draftItem.fsPath === fsPath) as DraftItem<MediaItem>

      const currentDbItem = await host.media.get(fsPath)
      if (!currentDbItem) {
        throw new Error(`Database item not found for document fsPath: ${fsPath}`)
      }

      await remove([fsPath], { rerender: false })

      const newDbItem: MediaItem = {
        ...currentDbItem,
        fsPath: newFsPath,
        id: joinURL(VIRTUAL_MEDIA_COLLECTION_NAME, newFsPath),
        stem: generateStemFromFsPath(newFsPath),
        path: withLeadingSlash(newFsPath),
      }

      await host.media.upsert(newFsPath, newDbItem)

      let originalDbItem: MediaItem | undefined = currentDbItem
      if (existingDraftToRename) {
        originalDbItem = existingDraftToRename.original
      }

      await create(newFsPath, newDbItem, originalDbItem, { rerender: false })
    }

    await hooks.callHook('studio:draft:media:updated', { caller: 'useDraftMedias.rename' })
  }

  function fileToDataUrl(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          // Reading only accounts for the first ~90%, the remaining share covers the upsert into the local database
          onProgress?.(Math.round((event.loaded / event.total) * 90))
        }
      }
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  async function listAsRawFiles(): Promise<RawFile[]> {
    const files = [] as RawFile[]
    for (const draftItem of list.value) {
      if (draftItem.status === DraftStatus.Pristine) {
        continue
      }

      if (draftItem.status === DraftStatus.Deleted) {
        files.push({ path: joinURL('public', draftItem.fsPath), content: null, status: draftItem.status, encoding: 'base64' })
        continue
      }

      const raw = draftItem.modified?.raw as string | undefined
      const content = raw ? raw.replace(/^data:[^;]+;base64,/, '') : ''
      files.push({ path: joinURL('public', draftItem.fsPath), content, status: draftItem.status, encoding: 'base64' })
    }

    return files
  }

  return {
    isLoading,
    list,
    current,
    get,
    create,
    update: () => {},
    duplicate: () => {},
    remove,
    revert,
    revertAll,
    createFolder,
    rename,
    load,
    selectByFsPath,
    unselect,
    upload,
    uploadQueue,
    listAsRawFiles,
    getStatus,
    applyFormatting: () => {},
  }
})
