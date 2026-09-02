import { addServerHandler, addVitePlugin, useLogger, addTemplate, defineNuxtModule, createResolver, addServerImports, hasNuxtModule, extendViteConfig, addPlugin } from '@nuxt/kit';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defu } from 'defu';
import fsDriver from 'unstorage/drivers/fs';
import { createStorage } from 'unstorage';
import { mediaItemFieldsFromKey } from '../../../dist/module/runtime/utils/media.js';
import { readFile } from 'node:fs/promises';

const version = "1.7.0-carlos.10";

const VIRTUAL_MEDIA_COLLECTION_NAME = "public-assets";

function setupDevMode(nuxt, runtime, publicAssetsStorage) {
  nuxt.options.nitro.storage = {
    ...nuxt.options.nitro.storage,
    nuxt_studio_content: {
      driver: "fs",
      base: resolve(nuxt.options.rootDir, "content")
    }
  };
  addServerHandler({
    route: "/__nuxt_studio/dev/content/**",
    handler: runtime("./server/routes/dev/content/[...path]")
  });
  if (publicAssetsStorage) {
    nuxt.options.nitro.storage.nuxt_studio_public_assets = {
      driver: "fs",
      base: resolve(nuxt.options.rootDir, "public")
    };
    addServerHandler({
      route: "/__nuxt_studio/dev/public/**",
      handler: runtime("./server/routes/dev/public/[...path]")
    });
    addVitePlugin({
      name: "nuxt-studio",
      configureServer: (server) => {
        publicAssetsStorage.watch((type, file) => {
          server.ws.send({
            type: "custom",
            event: "nuxt-studio:media:update",
            data: { type, id: `${VIRTUAL_MEDIA_COLLECTION_NAME}/${file}` }
          });
        });
      },
      closeWatcher: () => {
        publicAssetsStorage.unwatch();
      }
    });
  }
}

const logger$1 = useLogger("Nuxt Studio");
function validateAuthConfig(options) {
  const provider = options.repository?.provider || "github";
  const providerUpperCase = provider.toUpperCase();
  const hasGitHubAuth = options.auth?.github?.clientId && options.auth?.github?.clientSecret;
  const hasGitLabAuth = options.auth?.gitlab?.applicationId && options.auth?.gitlab?.applicationSecret;
  const hasGoogleAuth = options.auth?.google?.clientId && options.auth?.google?.clientSecret;
  const hasSSOServer = options.auth?.sso?.serverUrl && options.auth?.sso?.clientId && options.auth?.sso?.clientSecret;
  if (hasSSOServer) {
    return;
  }
  if (hasGoogleAuth) {
    const hasGoogleModeratorsInConfig = options.auth?.google?.moderators;
    if (!hasGoogleModeratorsInConfig) {
      logger$1.warn([
        "Google OAuth moderators are required when using Google OAuth.",
        "Set `auth.google.moderators` in nuxt.config.ts or supply `NUXT_STUDIO_AUTH_GOOGLE_MODERATORS`",
        "(comma-separated list of allowed email addresses) at runtime.",
        "Only users with these email addresses will be able to access Studio with Google OAuth."
      ].join("\n"));
    }
    logger$1.info([
      `A \`NUXT_STUDIO_GIT_${providerUpperCase}_TOKEN\` is required when using Google OAuth`,
      `so Studio can push changes to the ${providerUpperCase} repository.`
    ].join(" "));
  } else {
    const hasProviderAuth = provider === "github" ? hasGitHubAuth : hasGitLabAuth;
    if (!hasProviderAuth) {
      logger$1.warn([
        "In order to use Studio in production mode, you need to setup authentication:",
        "- Read more on `https://nuxt.studio/auth-providers`",
        "- Alternatively, you can disable studio by setting `$production: { studio: false }` in your `nuxt.config.ts`",
        `- Auth credentials can also be supplied at runtime via NUXT_STUDIO_AUTH_${providerUpperCase}_CLIENT_ID / NUXT_STUDIO_AUTH_${providerUpperCase}_CLIENT_SECRET`,
        `  or a personal access token via NUXT_STUDIO_GIT_${providerUpperCase}_TOKEN.`
      ].join("\n"));
    }
  }
}

async function getAssetsDefaultStorageDevTemplate() {
  return [
    "import { createStorage } from 'unstorage'",
    "import httpDriver from 'unstorage/drivers/http'",
    "",
    `export const publicAssetsStorage = createStorage({ driver: httpDriver({ base: '/__nuxt_studio/dev/public' }) })`,
    "export const externalAssetsStorage = null"
  ].join("\n");
}
async function getAssetsDefaultStorageTemplate(assetsStorage) {
  const keys = await assetsStorage.getKeys();
  return [
    "import { createStorage } from 'unstorage'",
    "const storage = createStorage({})",
    "",
    ...keys.map((key) => {
      const value = mediaItemFieldsFromKey(key);
      return `storage.setItem('${value.id}', ${JSON.stringify(value)})`;
    }),
    "",
    "export const publicAssetsStorage = storage",
    "export const externalAssetsStorage = null"
  ].join("\n");
}
async function getAssetsExternalStorageTemplate() {
  return [
    "import { createStorage } from 'unstorage'",
    "import httpDriver from 'unstorage/drivers/http'",
    "",
    "export const externalAssetsStorage = createStorage({",
    "  driver: httpDriver({",
    "    base: '/__nuxt_studio/medias'",
    "  })",
    "})",
    "export const publicAssetsStorage = null"
  ].join("\n");
}

const ASSETS_TEMPLATE = "studio-assets.mjs";
async function setExternalMediaStorage(nuxt, runtime) {
  addTemplate({
    filename: ASSETS_TEMPLATE,
    getContents: () => getAssetsExternalStorageTemplate()
  });
  addServerHandler({
    route: "/__nuxt_studio/medias/**",
    handler: runtime("./server/routes/medias/[...path]")
  });
  addServerHandler({
    route: "/__nuxt_studio/medias-move",
    method: "post",
    handler: runtime("./server/routes/medias-move.post")
  });
}
function setDefaultMediaStorage(nuxt, options) {
  const publicAssetsStorage = createStorage({
    driver: fsDriver({
      base: resolve(nuxt.options.rootDir, "public")
    })
  });
  addTemplate({
    filename: ASSETS_TEMPLATE,
    getContents: () => options.dev ? getAssetsDefaultStorageDevTemplate() : getAssetsDefaultStorageTemplate(publicAssetsStorage)
  });
  return publicAssetsStorage;
}

async function setAIFeature(options, nuxt, runtime) {
  if (!options.ai.context?.title || !options.ai.context?.description) {
    try {
      const pkgPath = resolve(nuxt.options.rootDir, "package.json");
      const pkgContent = await readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgContent);
      options.ai.context.title = options.ai.context?.title || pkg.name;
      options.ai.context.description = options.ai.context?.description || pkg.description;
    } catch {
    }
  }
  addServerHandler({
    method: "post",
    route: "/__nuxt_studio/ai/generate",
    handler: runtime("./server/routes/ai/generate.post")
  });
  addServerHandler({
    method: "post",
    route: "/__nuxt_studio/ai/commit",
    handler: runtime("./server/routes/ai/commit.post")
  });
  if (options.ai?.experimental?.collectionContext) {
    addServerHandler({
      method: "post",
      route: "/__nuxt_studio/ai/analyze",
      handler: runtime("./server/routes/ai/analyze.post")
    });
  }
}

const logger = useLogger("nuxt-studio");
const module$1 = defineNuxtModule({
  meta: {
    name: "nuxt-studio",
    configKey: "studio",
    version,
    docs: "https://content.nuxt.com/studio"
  },
  defaults: {
    dev: true,
    route: "/_studio",
    ai: {
      context: {
        title: "",
        description: "",
        style: "",
        tone: "",
        collection: {
          name: "studio",
          folder: ".studio"
        }
      }
    },
    repository: {
      provider: "github",
      owner: void 0,
      repo: void 0,
      branch: void 0,
      rootDir: "",
      private: true,
      instanceUrl: void 0
    },
    auth: {
      github: {
        clientId: void 0,
        clientSecret: void 0,
        instanceUrl: "https://github.com"
      },
      gitlab: {
        applicationId: void 0,
        applicationSecret: void 0,
        instanceUrl: "https://gitlab.com"
      },
      google: {
        clientId: void 0,
        clientSecret: void 0
      },
      sso: {
        serverUrl: void 0,
        clientId: void 0,
        clientSecret: void 0
      }
    },
    i18n: {
      defaultLocale: "en"
    },
    git: {
      commit: {
        messagePrefix: ""
      }
    },
    editor: {
      commands: {
        exclude: []
      },
      components: {
        include: [],
        exclude: [],
        groups: void 0,
        ungrouped: "include"
      }
    },
    media: {
      external: false,
      publicUrl: void 0,
      maxFileSize: 10 * 1024 * 1024,
      allowedTypes: ["image/*", "video/*", "audio/*"],
      prefix: "studio"
    }
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const runtime = (...args) => resolver.resolve("./runtime", ...args);
    const editorOptions = options.editor ?? options.meta;
    addServerImports([
      {
        name: "setStudioUserSession",
        from: runtime("./server/utils/session")
      },
      {
        name: "clearStudioUserSession",
        from: runtime("./server/utils/session")
      }
    ]);
    if (nuxt.options.dev === false || options.development?.sync === false) {
      options.dev = false;
    }
    const isProdBuild = nuxt.options.dev === false && nuxt.options._prepare === false;
    if (isProdBuild && options.repository?.owner && options.repository?.repo) {
      logger.info(`Using repository (build-time config): ${options.repository?.provider}:${options.repository?.owner}/${options.repository?.repo}#${options.repository?.branch}`);
    }
    if (isProdBuild && !options.repository?.owner && !options.repository?.repo) {
      logger.warn([
        "Repository owner and repository name are not configured at build time.",
        "They can be supplied at runtime via:",
        "  - NUXT_PUBLIC_STUDIO_REPOSITORY_OWNER / NUXT_PUBLIC_STUDIO_REPOSITORY_REPO / NUXT_PUBLIC_STUDIO_REPOSITORY_BRANCH",
        "  - CI platform env vars: VERCEL_GIT_* or Netlify REPOSITORY_URL / BRANCH (resolved at server runtime)",
        "Note: GITHUB_ACTIONS / GITLAB_CI env vars are build-time only; use NUXT_PUBLIC_STUDIO_REPOSITORY_* for those deployments."
      ].join("\n"));
    }
    if (isProdBuild) {
      validateAuthConfig(options);
    }
    if (options.ai) {
      await setAIFeature(options, nuxt, runtime);
    }
    nuxt.options.experimental = nuxt.options.experimental || {};
    nuxt.options.experimental.checkOutdatedBuildInterval = 1e3 * 30;
    let isExternalMediaEnabled = options.media?.external;
    if (isExternalMediaEnabled) {
      const isNuxtHubInstalled = hasNuxtModule("@nuxthub/core");
      if (!isNuxtHubInstalled || !nuxt.options.hub?.blob) {
        logger.warn("You must install and enable @nuxthub/core blob storage to use external media storage. Falling back to default assets storage.");
        isExternalMediaEnabled = false;
      }
    }
    if (!isExternalMediaEnabled && !options.media.publicUrl) {
      options.media.publicUrl = resolve(nuxt.options.rootDir, "public");
    }
    nuxt.options.runtimeConfig.public.studio = {
      route: options.route,
      dev: Boolean(options.dev),
      development: {
        server: process.env.STUDIO_DEV_SERVER
      },
      ai: {
        // Honest build-time baseline; the studio-env middleware recomputes this at runtime
        // once NUXT_STUDIO_AI_API_KEY is resolved.
        enabled: Boolean(options.ai?.apiKey),
        context: {
          collectionName: options.ai?.context?.collection?.name,
          contentFolder: options.ai?.context?.collection?.folder
        },
        experimental: {
          collectionContext: Boolean(options.ai?.experimental?.collectionContext)
        }
      },
      // @ts-expect-error Autogenerated type does not match with options
      repository: options.repository,
      // @ts-expect-error Autogenerated type does not match with options
      i18n: options.i18n,
      // @ts-expect-error Autogenerated type does not match with options
      media: { ...options.media, external: isExternalMediaEnabled },
      git: { commit: { messagePrefix: options.git?.commit?.messagePrefix ?? "" } },
      iconLibraries: editorOptions?.iconLibraries,
      commands: { exclude: [], ...editorOptions?.commands }
    };
    nuxt.options.runtimeConfig.studio = {
      ai: {
        apiKey: options.ai?.apiKey || "",
        context: options.ai?.context,
        experimental: options.ai?.experimental
      },
      auth: {
        sessionSecret: "",
        github: {
          clientId: options.auth?.github?.clientId || "",
          clientSecret: options.auth?.github?.clientSecret || "",
          instanceUrl: options.auth.github.instanceUrl,
          redirectUrl: "",
          moderators: ""
        },
        gitlab: {
          applicationId: options.auth?.gitlab?.applicationId || "",
          applicationSecret: options.auth?.gitlab?.applicationSecret || "",
          instanceUrl: options.auth.gitlab.instanceUrl,
          redirectUrl: "",
          moderators: ""
        },
        google: {
          clientId: options.auth?.google?.clientId || "",
          clientSecret: options.auth?.google?.clientSecret || "",
          redirectUrl: "",
          moderators: ""
        },
        sso: {
          serverUrl: options.auth?.sso?.serverUrl || "",
          clientId: options.auth?.sso?.clientId || "",
          clientSecret: options.auth?.sso?.clientSecret || "",
          redirectUrl: ""
        }
      },
      git: {
        commit: { messagePrefix: options.git?.commit?.messagePrefix ?? "" },
        githubToken: "",
        gitlabToken: ""
      },
      // @ts-expect-error Autogenerated type does not match with options
      repository: options.repository,
      // @ts-expect-error EditorOptions | undefined doesn't match the autogenerated shape
      editor: editorOptions,
      // @ts-expect-error Autogenerated type does not match with options
      markdown: nuxt.options.content?.build?.markdown || {},
      // @ts-expect-error Autogenerated type does not match with options (optional booleans vs required)
      media: {
        ...options.media,
        publicUrl: options.media?.publicUrl || ""
      }
    };
    nuxt.options.vite = defu(nuxt.options.vite, {
      vue: {
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === "nuxt-studio"
          }
        }
      }
    });
    extendViteConfig((config) => {
      config.define ||= {};
      config.define["import.meta.preview"] = true;
      config.optimizeDeps ||= {};
      config.optimizeDeps.include = [
        ...config.optimizeDeps.include || [],
        "nuxt-studio > debug",
        "nuxt-studio > extend",
        // [DEV] Pre-bundled
        "nuxt-studio/app"
      ];
      config.plugins ||= [];
      config.plugins.push({
        name: "nuxt-studio:externalize-app",
        enforce: "pre",
        apply: "build",
        resolveId(id) {
          if (id === "nuxt-studio/app") {
            return { id: `/_studio-app/${version}/main.js`, external: true };
          }
        }
      });
    });
    const distAppDir = [
      resolver.resolve("../../dist/app"),
      // compiled version
      resolver.resolve("../../../dist/app")
      // source version
    ].find(existsSync);
    if (distAppDir) {
      nuxt.hook("nitro:config", (nitroConfig) => {
        nitroConfig.publicAssets ||= [];
        nitroConfig.publicAssets.push({
          dir: distAppDir,
          baseURL: `/_studio-app/${version}`,
          maxAge: 60 * 60 * 24 * 365
        });
      });
    }
    addPlugin(process.env.STUDIO_DEV_SERVER ? runtime("./plugins/studio.client.dev") : runtime("./plugins/studio.client"));
    addServerHandler({ middleware: true, handler: runtime("./server/middleware/studio-env") });
    let publicAssetsStorage;
    if (isExternalMediaEnabled) {
      await setExternalMediaStorage(nuxt, runtime);
    } else {
      publicAssetsStorage = setDefaultMediaStorage(nuxt, options);
    }
    if (options.dev) {
      setupDevMode(nuxt, runtime, publicAssetsStorage);
    }
    addServerHandler({
      route: "/__nuxt_studio/auth/github",
      handler: runtime("./server/routes/auth/github.get")
    });
    addServerHandler({
      route: "/__nuxt_studio/auth/google",
      handler: runtime("./server/routes/auth/google.get")
    });
    addServerHandler({
      route: "/__nuxt_studio/auth/gitlab",
      handler: runtime("./server/routes/auth/gitlab.get")
    });
    addServerHandler({
      route: "/__nuxt_studio/auth/sso",
      handler: runtime("./server/routes/auth/sso.get")
    });
    addServerHandler({
      route: "/__nuxt_studio/auth/session",
      handler: runtime("./server/routes/auth/session.get")
    });
    addServerHandler({
      method: "delete",
      route: "/__nuxt_studio/auth/session",
      handler: runtime("./server/routes/auth/session.delete")
    });
    addServerHandler({
      route: options.route,
      handler: runtime("./server/routes/admin")
    });
    addServerHandler({
      route: "/__nuxt_studio/meta",
      handler: runtime("./server/routes/meta")
    });
    addServerHandler({
      route: "/__nuxt_studio/ipx/**",
      handler: runtime("./server/routes/ipx/[...path]")
    });
    addServerHandler({
      route: "/sw.js",
      handler: runtime("./server/routes/sw")
    });
  }
});

export { module$1 as default };
