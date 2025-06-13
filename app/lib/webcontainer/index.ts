import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '~/utils/constants';
import { WebContainerService } from '~/lib/services/webcontainer.service';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('WebContainer');
const webContainerService = new WebContainerService();

interface WebContainerContext {
  loaded: boolean;
  registeredId?: string;
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
 * Enregistrer le webcontainer dans le backend.
 */
async function registerWebContainerToBackend(
  webcontainerInstance: WebContainer,
  projectId?: string,
): Promise<string | null> {
  try {
    if (!projectId) {
      // essayer de récupérer le projectId depuis l'URL ou le localStorage
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

    // mettre à jour le statut à 'active' une fois que le container est prêt
    await webContainerService.updateWebContainer(webcontainerData.id, {
      status: 'active',
    });

    return webcontainerData.id;
  } catch (error) {
    logger.error('Failed to register webcontainer to backend:', error);
    return null;
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
        logger.info('WebContainer booted successfully');

        // enregistrer le webcontainer dans le backend
        const registeredId = await registerWebContainerToBackend(webcontainer);

        if (registeredId) {
          // écouter les changements de ports pour mettre à jour le backend
          webcontainer.on('port', async (port, type, url) => {
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
        }

        return webcontainer;
      })
      .catch(async (error) => {
        logger.error('Failed to boot WebContainer:', error);

        // mettre à jour le statut à 'error' si l'enregistrement a eu lieu
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
  files?: string[];
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
