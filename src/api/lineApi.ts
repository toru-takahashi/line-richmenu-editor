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

export interface RichMenuAlias {
  richMenuAliasId: string;
  richMenuId: string;
}

export interface RichMenuAliasListResponse {
  aliases: RichMenuAlias[];
}

export interface ErrorDetail {
  message: string;
  property: string;
}

export interface LineApiErrorResponse {
  message: string;
  details?: ErrorDetail[];
}

export class LineApiError extends Error {
  public details?: ErrorDetail[];
  public fullResponse?: LineApiErrorResponse;

  constructor(message: string, errorResponse?: LineApiErrorResponse) {
    super(message);
    this.name = 'LineApiError';
    this.details = errorResponse?.details;
    this.fullResponse = errorResponse;
  }

  public getDetailedMessage(): string {
    if (!this.details || this.details.length === 0) {
      return this.message;
    }

    const detailsText = this.details
      .map((detail, index) => `  ${index + 1}. ${detail.property}: ${detail.message}`)
      .join('\n');

    return `${this.message}\n\n詳細 / Details:\n${detailsText}`;
  }
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
      const errorResponse: LineApiErrorResponse = await response.json();
      throw new LineApiError(
        errorResponse.message || 'Failed to create rich menu',
        errorResponse
      );
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
      const errorResponse: LineApiErrorResponse = await response.json();
      throw new LineApiError(
        errorResponse.message || 'Failed to upload image',
        errorResponse
      );
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

  /**
   * Get list of all rich menu aliases
   */
  async listRichMenuAliases(): Promise<RichMenuAliasListResponse> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/alias/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const errorResponse: LineApiErrorResponse = await response.json();
      throw new LineApiError(
        errorResponse.message || 'Failed to list rich menu aliases',
        errorResponse
      );
    }

    return response.json();
  }

  /**
   * Create a new rich menu alias
   */
  async createRichMenuAlias(richMenuAliasId: string, richMenuId: string): Promise<void> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/alias`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ richMenuAliasId, richMenuId }),
    });

    if (!response.ok) {
      const errorResponse: LineApiErrorResponse = await response.json();
      throw new LineApiError(
        errorResponse.message || 'Failed to create rich menu alias',
        errorResponse
      );
    }
  }

  /**
   * Update an existing rich menu alias
   */
  async updateRichMenuAlias(richMenuAliasId: string, richMenuId: string): Promise<void> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/alias/${richMenuAliasId}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ richMenuId }),
    });

    if (!response.ok) {
      const errorResponse: LineApiErrorResponse = await response.json();
      throw new LineApiError(
        errorResponse.message || 'Failed to update rich menu alias',
        errorResponse
      );
    }
  }

  /**
   * Delete a rich menu alias
   */
  async deleteRichMenuAlias(richMenuAliasId: string): Promise<void> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/alias/${richMenuAliasId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const errorResponse: LineApiErrorResponse = await response.json();
      throw new LineApiError(
        errorResponse.message || 'Failed to delete rich menu alias',
        errorResponse
      );
    }
  }

  /**
   * Get a specific rich menu alias by ID
   */
  async getRichMenuAlias(richMenuAliasId: string): Promise<RichMenuAlias> {
    const response = await fetch(`${this.config.workerUrl}/api/richmenu/alias/${richMenuAliasId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const errorResponse: LineApiErrorResponse = await response.json();
      throw new LineApiError(
        errorResponse.message || 'Failed to get rich menu alias',
        errorResponse
      );
    }

    return response.json();
  }
}
