import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '~/utils/constants';
import { WebContainerService } from '~/lib/services/webcontainer.service';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('WebContainer');
const webContainerService = new WebContainerService();

interface WebContainerContext {
  loaded: boolean;
  registeredId?: string;
  isRegistrationPending?: boolean;
}

export const webcontainerContext: WebContainerContext = import.meta.hot?.data.webcontainerContext ?? {
  loaded: false,
};

if (import.meta.hot) {
  import.meta.hot.data.webcontainerContext = webcontainerContext;
}

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

/**
 * Enregistrer le webcontainer dans le backend lors de la génération.
 */
async function registerWebContainerToBackend(
  webcontainerInstance: WebContainer,
  projectId?: string,
): Promise<string | null> {
  try {
    if (!projectId) {
      const urlParams = new URLSearchParams(window.location.search);
      projectId = urlParams.get('projectId') || localStorage.getItem('currentProjectId') || 'default';
    }

    const webcontainerData = await webContainerService.createWebContainer({
      projectId,
      name: `WebContainer-${Date.now()}`,
      description: 'Generated web container for project development',
      metadata: {
        workdirName: WORK_DIR_NAME,
        ports: [],
        files: [],
      },
    });

    logger.info('WebContainer registered to backend:', webcontainerData.id);
    webcontainerContext.registeredId = webcontainerData.id;

    await webContainerService.updateWebContainer(webcontainerData.id, {
      status: 'active',
    });

    webcontainerInstance.on('port', async (port, type, url) => {
      try {
        if (webcontainerContext.registeredId) {
          await webContainerService.updateWebContainer(webcontainerContext.registeredId, {
            metadata: {
              workdirName: WORK_DIR_NAME,
              ports: [port],
              url,
            },
          });
          logger.debug('Updated webcontainer port info:', { port, url });
        }
      } catch (error) {
        logger.error('Failed to update port info:', error);
      }
    });

    return webcontainerData.id;
  } catch (error) {
    logger.error('Failed to register webcontainer to backend:', error);
    return null;
  }
}

/**
 * Enregistrer le webcontainer lors de la première génération de contenu.
 */
export async function ensureWebContainerRegistered(projectId?: string): Promise<string | null> {
  if (webcontainerContext.registeredId) {
    return webcontainerContext.registeredId;
  }

  if (webcontainerContext.isRegistrationPending) {
    while (webcontainerContext.isRegistrationPending) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return webcontainerContext.registeredId || null;
  }

  try {
    webcontainerContext.isRegistrationPending = true;

    const webcontainerInstance = await webcontainer;

    if (!webcontainerContext.loaded) {
      logger.warn('WebContainer not loaded yet');
      return null;
    }

    const registeredId = await registerWebContainerToBackend(webcontainerInstance, projectId);

    return registeredId;
  } finally {
    webcontainerContext.isRegistrationPending = false;
  }
}

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(() => {
        logger.info('Booting WebContainer...');
        return WebContainer.boot({ workdirName: WORK_DIR_NAME });
      })
      .then(async (webcontainer) => {
        webcontainerContext.loaded = true;
        logger.info('WebContainer booted successfully (not registered yet)');

        return webcontainer;
      })
      .catch(async (error) => {
        logger.error('Failed to boot WebContainer:', error);

        if (webcontainerContext.registeredId) {
          try {
            await webContainerService.updateWebContainer(webcontainerContext.registeredId, {
              status: 'error',
            });
          } catch (updateError) {
            logger.error('Failed to update error status:', updateError);
          }
        }

        throw error;
      });

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}

/**
 * Obtenir l'ID du webcontainer enregistré dans le backend.
 */
export function getRegisteredWebContainerId(): string | undefined {
  return webcontainerContext.registeredId;
}

/**
 * Mettre à jour les métadonnées du webcontainer dans le backend.
 */
export async function updateWebContainerMetadata(metadata: {
  ports?: number[];
  files?: Record<string, string>[];
  url?: string;
}): Promise<void> {
  if (!webcontainerContext.registeredId) {
    logger.warn('No registered webcontainer ID found');
    return;
  }

  try {
    await webContainerService.updateWebContainer(webcontainerContext.registeredId, {
      metadata: {
        workdirName: WORK_DIR_NAME,
        ...metadata,
      },
    });
    logger.debug('WebContainer metadata updated:', metadata);
  } catch (error) {
    logger.error('Failed to update webcontainer metadata:', error);
  }
}

/**
 * Exporter tous les fichiers du webcontainer.
 */
async function exportWebContainerProject(webContainer: WebContainer): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  async function readDirRecursive(dir: string) {
    try {
      const entries = await webContainer.fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;

        // ignorer les dossiers et fichiers système
        if (shouldIgnoreFile(fullPath)) {
          continue;
        }

        try {
          if (entry.isDirectory()) {
            await readDirRecursive(fullPath);
          } else {
            const content = await webContainer.fs.readFile(fullPath, 'utf8');
            files[fullPath] = content;
          }
        } catch (error) {
          logger.warn(`Error reading ${fullPath}:`, error);
          continue;
        }
      }
    } catch (error) {
      logger.warn(`Error reading directory ${dir}:`, error);
    }
  }

  await readDirRecursive('/');

  return files; // { "/index.js": "...", "/package.json": "...", etc. }
}

/**
 * Fonction utilitaire pour ignorer certains fichiers/dossiers.
 */
function shouldIgnoreFile(path: string): boolean {
  const ignoredPaths = [
    '/node_modules',
    '/.git',
    '/.vscode',
    '/__pycache__',
    '/dist',
    '/build',
    '/.cache',
    '/tmp',
    '/.tmp',
  ];

  const ignoredExtensions = ['.log', '.tmp', '.cache', '.lock'];

  // ignorer si le chemin commence par un dossier à ignorer
  if (ignoredPaths.some((ignored) => path.startsWith(ignored))) {
    return true;
  }

  // ignorer si l'extension est dans la liste
  if (ignoredExtensions.some((ext) => path.endsWith(ext))) {
    return true;
  }

  return false;
}

/**
 * Sauvegarder le contenu complet du webcontainer dans le backend.
 */
export async function saveWebContainerContent(projectId?: string): Promise<boolean> {
  try {
    const webcontainerInstance = await webcontainer;

    if (!projectId) {
      const urlParams = new URLSearchParams(window.location.search);
      projectId = urlParams.get('projectId') || localStorage.getItem('currentProjectId') || 'default';
    }

    const webcontainerId = getRegisteredWebContainerId();

    if (!webcontainerId) {
      logger.warn('No registered webcontainer ID found');

      return false;
    }

    logger.info('Reading webcontainer content...');

    const fileContents = await exportWebContainerProject(webcontainerInstance);
    const filesCount = Object.keys(fileContents).length;

    logger.info(`Found ${filesCount} files to save`);

    // mettre à jour le webcontainer avec le contenu des fichiers
    await webContainerService.updateWebContainer(webcontainerId, {
      metadata: {
        workdirName: WORK_DIR_NAME,
        files: Object.entries(fileContents).map(([path, content]) => ({ path, content })),
      },
    });

    logger.info(`Successfully saved ${filesCount} files to backend`);

    return true;
  } catch (error) {
    logger.error('Failed to save webcontainer content:', error);

    return false;
  }
}
