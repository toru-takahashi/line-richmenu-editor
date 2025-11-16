/**
 * LINE Rich Menu API Client
 * Communicates with Cloudflare Worker proxy
 */

export interface ApiConfig {
  workerUrl: string;
  channelAccessToken: string;
}

export interface RichMenuResponse {
  richMenuId: string;
}

export interface RichMenuListResponse {
  richmenus: any[];
}

export class LineApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private getHeaders(contentType: string = 'application/json'): HeadersInit {
    return {
      'Content-Type': contentType,
      'Authorization': `Bearer ${this.config.channelAccessToken}`,
    };
  }

  /**
   * Create a new rich menu
   */
  async createRichMenu(menuData: any): Promise<RichMenuResponse> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(menuData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to create rich menu');
    }

    return response.json();
  }

  /**
   * Upload rich menu image
   */
  async uploadRichMenuImage(richMenuId: string, imageBlob: Blob): Promise<void> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': imageBlob.type || 'image/png',
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
      body: imageBlob,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to upload image');
    }
  }

  /**
   * Get list of all rich menus
   */
  async listRichMenus(): Promise<RichMenuListResponse> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to list rich menus');
    }

    return response.json();
  }

  /**
   * Get a specific rich menu
   */
  async getRichMenu(richMenuId: string): Promise<any> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/${richMenuId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to get rich menu');
    }

    return response.json();
  }

  /**
   * Delete a rich menu
   */
  async deleteRichMenu(richMenuId: string): Promise<void> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/${richMenuId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to delete rich menu');
    }
  }

  /**
   * Set default rich menu for all users
   */
  async setDefaultRichMenu(richMenuId: string): Promise<void> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/${richMenuId}/default`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to set default rich menu');
    }
  }

  /**
   * Cancel default rich menu
   */
  async cancelDefaultRichMenu(): Promise<void> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/default`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to cancel default rich menu');
    }
  }

  /**
   * Download rich menu image
   */
  async downloadRichMenuImage(richMenuId: string): Promise<Blob> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/${richMenuId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to download image' }));
      throw new Error(error.message || error.error || 'Failed to download image');
    }

    return response.blob();
  }

  /**
   * Helper method to convert image URL to Blob
   */
  async imageUrlToBlob(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    return response.blob();
  }

  /**
   * Helper method to convert Blob to data URL for display
   */
  async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Link rich menu to a specific user
   */
  async linkRichMenuToUser(userId: string, richMenuId: string): Promise<void> {
    const response = await fetch(`${this.config.workerUrl}/api/user/${userId}/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to link rich menu to user');
    }
  }

  /**
   * Unlink rich menu from a specific user
   */
  async unlinkRichMenuFromUser(userId: string): Promise<void> {
    const response = await fetch(`${this.config.workerUrl}/api/user/${userId}/richmenu`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to unlink rich menu from user');
    }
  }

  /**
   * Get rich menu linked to a specific user
   */
  async getUserRichMenu(userId: string): Promise<{ richMenuId: string }> {
    const response = await fetch(`${this.config.workerUrl}/api/user/${userId}/richmenu`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to get user rich menu');
    }

    return response.json();
  }
}
