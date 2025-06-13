import type {
  WebContainerModel,
  CreateWebContainerRequest,
  UpdateWebContainerRequest,
} from '~/lib/persistence/models/webcontainer.model';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('WebContainerService');

/**
 * Service pour gérer les opérations de webcontainer avec le backend.
 */
export class WebContainerService {
  private readonly _apiBaseUrl: string;

  constructor() {
    this._apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  /**
   * Créer et enregistrer un nouveau webcontainer dans le backend.
   */
  async createWebContainer(request: CreateWebContainerRequest): Promise<WebContainerModel> {
    try {
      logger.debug('Creating webcontainer:', request);

      const response = await fetch(`${this._apiBaseUrl}/webcontainers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create webcontainer: ${response.status} ${response.statusText}`);
      }

      const webcontainer = (await response.json()) as WebContainerModel;
      logger.info('Webcontainer created successfully:', webcontainer.id);

      return webcontainer;
    } catch (error) {
      logger.error('Error creating webcontainer:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un webcontainer existant.
   */
  async updateWebContainer(id: string, updates: UpdateWebContainerRequest): Promise<WebContainerModel> {
    try {
      logger.debug('Updating webcontainer:', { id, updates });

      const response = await fetch(`${this._apiBaseUrl}/webcontainers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update webcontainer: ${response.status} ${response.statusText}`);
      }

      const webcontainer = (await response.json()) as WebContainerModel;
      logger.info('Webcontainer updated successfully:', webcontainer.id);

      return webcontainer;
    } catch (error) {
      logger.error('Error updating webcontainer:', error);
      throw error;
    }
  }

  /**
   * Récupérer un webcontainer par son ID.
   */
  async getWebContainer(id: string): Promise<WebContainerModel | null> {
    try {
      const response = await fetch(`${this._apiBaseUrl}/webcontainers/${id}`, {
        credentials: 'include',
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get webcontainer: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as WebContainerModel;
    } catch (error) {
      logger.error('Error getting webcontainer:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les webcontainers d'un projet.
   */
  async getWebContainersByProject(projectId: string): Promise<WebContainerModel[]> {
    try {
      const response = await fetch(`${this._apiBaseUrl}/webcontainers?projectId=${projectId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to get webcontainers: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as WebContainerModel[];
    } catch (error) {
      logger.error('Error getting webcontainers by project:', error);
      throw error;
    }
  }

  /**
   * Supprimer un webcontainer.
   */
  async deleteWebContainer(id: string): Promise<void> {
    try {
      logger.debug('Deleting webcontainer:', id);

      const response = await fetch(`${this._apiBaseUrl}/webcontainers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete webcontainer: ${response.status} ${response.statusText}`);
      }

      logger.info('Webcontainer deleted successfully:', id);
    } catch (error) {
      logger.error('Error deleting webcontainer:', error);
      throw error;
    }
  }
}
