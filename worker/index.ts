/**
 * Cloudflare Worker for LINE Rich Menu API Proxy
 * Stateless proxy to interact with LINE Messaging API
 */

interface Env {
  // You can add environment variables here if needed
}

const LINE_API_BASE = 'https://api.line.me/v2/bot';
const LINE_API_DATA_BASE = 'https://api-data.line.me/v2/bot';

// Allowed origins for CORS (production only)
const ALLOWED_ORIGINS = [
  'https://toru-takahashi.github.io',
  'http://localhost:5173', // For local development
];

/**
 * Get CORS headers based on request origin
 */
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = getCorsHeaders(request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Extract channel access token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Missing or invalid Authorization header' }, 401);
    }

    const channelAccessToken = authHeader.substring(7);

    try {
      console.log('Request:', request.method, path);

      // Route requests
      if (path === '/api/richmenu' && request.method === 'POST') {
        return await createRichMenu(request, channelAccessToken, corsHeaders);
      } else if (path.match(/^\/api\/richmenu\/[^\/]+\/content$/) && request.method === 'POST') {
        console.log('Matched upload image route');
        const richMenuId = path.split('/')[3];
        return await uploadRichMenuImage(request, channelAccessToken, richMenuId, corsHeaders);
      } else if (path.match(/^\/api\/richmenu\/[^\/]+\/content$/) && request.method === 'GET') {
        const richMenuId = path.split('/')[3];
        return await downloadRichMenuImage(channelAccessToken, richMenuId, corsHeaders);
      } else if (path === '/api/richmenu/list' && request.method === 'GET') {
        return await listRichMenus(channelAccessToken, corsHeaders);
      } else if (path.match(/^\/api\/richmenu\/[^\/]+$/) && request.method === 'GET') {
        const richMenuId = path.split('/')[3];
        return await getRichMenu(channelAccessToken, richMenuId, corsHeaders);
      } else if (path.match(/^\/api\/richmenu\/[^\/]+$/) && request.method === 'DELETE') {
        const richMenuId = path.split('/')[3];
        return await deleteRichMenu(channelAccessToken, richMenuId, corsHeaders);
      } else if (path.match(/^\/api\/richmenu\/[^\/]+\/default$/) && request.method === 'POST') {
        const richMenuId = path.split('/')[3];
        return await setDefaultRichMenu(channelAccessToken, richMenuId, corsHeaders);
      } else if (path === '/api/richmenu/default' && request.method === 'DELETE') {
        return await cancelDefaultRichMenu(channelAccessToken, corsHeaders);
      } else if (path.match(/^\/api\/user\/[^\/]+\/richmenu\/[^\/]+$/) && request.method === 'POST') {
        const parts = path.split('/');
        const userId = parts[3];
        const richMenuId = parts[5];
        return await linkRichMenuToUser(channelAccessToken, userId, richMenuId, corsHeaders);
      } else if (path.match(/^\/api\/user\/[^\/]+\/richmenu$/) && request.method === 'DELETE') {
        const userId = path.split('/')[3];
        return await unlinkRichMenuFromUser(channelAccessToken, userId, corsHeaders);
      } else if (path.match(/^\/api\/user\/[^\/]+\/richmenu$/) && request.method === 'GET') {
        const userId = path.split('/')[3];
        return await getUserRichMenu(channelAccessToken, userId, corsHeaders);
      } else if (path === '/api/richmenu/alias/list' && request.method === 'GET') {
        return await listRichMenuAliases(channelAccessToken, corsHeaders);
      } else if (path === '/api/richmenu/alias' && request.method === 'POST') {
        return await createRichMenuAlias(request, channelAccessToken, corsHeaders);
      } else if (path.match(/^\/api\/richmenu\/alias\/[^\/]+$/) && request.method === 'GET') {
        const aliasId = path.split('/')[4];
        return await getRichMenuAlias(channelAccessToken, aliasId, corsHeaders);
      } else if (path.match(/^\/api\/richmenu\/alias\/[^\/]+$/) && request.method === 'POST') {
        const aliasId = path.split('/')[4];
        return await updateRichMenuAlias(request, channelAccessToken, aliasId, corsHeaders);
      } else if (path.match(/^\/api\/richmenu\/alias\/[^\/]+$/) && request.method === 'DELETE') {
        const aliasId = path.split('/')[4];
        return await deleteRichMenuAlias(channelAccessToken, aliasId, corsHeaders);
      } else {
        return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
      }
    } catch (error) {
      console.error('Error:', error);
      return jsonResponse(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        500,
        corsHeaders
      );
    }
  },
};

/**
 * Create a new rich menu
 */
async function createRichMenu(request: Request, token: string, corsHeaders: Record<string, string>): Promise<Response> {
  const body = await request.json();

  const response = await fetch(`${LINE_API_BASE}/richmenu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return jsonResponse(data, response.status, corsHeaders);
}

/**
 * Upload rich menu image
 */
async function uploadRichMenuImage(
  request: Request,
  token: string,
  richMenuId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  console.log('uploadRichMenuImage called for richMenuId:', richMenuId);

  // Get the image data from the request
  const contentType = request.headers.get('Content-Type') || 'image/png';
  const imageData = await request.arrayBuffer();

  console.log('Image data size:', imageData.byteLength, 'bytes, Content-Type:', contentType);

  const response = await fetch(`${LINE_API_DATA_BASE}/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Authorization: `Bearer ${token}`,
    },
    body: imageData,
  });

  console.log('LINE API response status:', response.status);

  if (response.ok) {
    return jsonResponse({ message: 'Image uploaded successfully' }, 200, corsHeaders);
  } else {
    const error = await response.text();
    console.error('LINE API error:', error);
    return jsonResponse({ error: 'Failed to upload image', details: error }, response.status, corsHeaders);
  }
}

/**
 * Download rich menu image
 */
async function downloadRichMenuImage(
  token: string,
  richMenuId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const response = await fetch(`${LINE_API_DATA_BASE}/richmenu/${richMenuId}/content`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    // Return the image with CORS headers
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/png';

    return new Response(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...corsHeaders,
      },
    });
  } else {
    const error = await response.text();
    return jsonResponse({ error: 'Failed to download image', details: error }, response.status, corsHeaders);
  }
}

/**
 * Get list of all rich menus
 */
async function listRichMenus(token: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/richmenu/list`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return jsonResponse(data, response.status, corsHeaders);
}

/**
 * Get a specific rich menu
 */
async function getRichMenu(token: string, richMenuId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/richmenu/${richMenuId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return jsonResponse(data, response.status, corsHeaders);
}

/**
 * Delete a rich menu
 */
async function deleteRichMenu(token: string, richMenuId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/richmenu/${richMenuId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    return jsonResponse({ message: 'Rich menu deleted successfully' }, 200, corsHeaders);
  } else {
    const error = await response.text();
    return jsonResponse({ error: 'Failed to delete rich menu', details: error }, response.status, corsHeaders);
  }
}

/**
 * Set default rich menu
 */
async function setDefaultRichMenu(token: string, richMenuId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    return jsonResponse({ message: 'Default rich menu set successfully' }, 200, corsHeaders);
  } else {
    const error = await response.text();
    return jsonResponse({ error: 'Failed to set default rich menu', details: error }, response.status, corsHeaders);
  }
}

/**
 * Cancel default rich menu
 */
async function cancelDefaultRichMenu(token: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/user/all/richmenu`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    return jsonResponse({ message: 'Default rich menu cancelled successfully' }, 200, corsHeaders);
  } else {
    const error = await response.text();
    return jsonResponse({ error: 'Failed to cancel default rich menu', details: error }, response.status, corsHeaders);
  }
}

/**
 * Link rich menu to a specific user
 */
async function linkRichMenuToUser(token: string, userId: string, richMenuId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/user/${userId}/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    return jsonResponse({ message: 'Rich menu linked to user successfully' }, 200, corsHeaders);
  } else {
    const error = await response.text();
    return jsonResponse({ error: 'Failed to link rich menu to user', details: error }, response.status, corsHeaders);
  }
}

/**
 * Unlink rich menu from a specific user
 */
async function unlinkRichMenuFromUser(token: string, userId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/user/${userId}/richmenu`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    return jsonResponse({ message: 'Rich menu unlinked from user successfully' }, 200, corsHeaders);
  } else {
    const error = await response.text();
    return jsonResponse({ error: 'Failed to unlink rich menu from user', details: error }, response.status, corsHeaders);
  }
}

/**
 * Get rich menu linked to a specific user
 */
async function getUserRichMenu(token: string, userId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/user/${userId}/richmenu`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return jsonResponse(data, 200, corsHeaders);
  } else {
    const error = await response.text();
    return jsonResponse({ error: 'Failed to get user rich menu', details: error }, response.status, corsHeaders);
  }
}

/**
 * Get list of all rich menu aliases
 */
async function listRichMenuAliases(token: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/richmenu/alias/list`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return jsonResponse(data, response.status, corsHeaders);
}

/**
 * Create a new rich menu alias
 */
async function createRichMenuAlias(request: Request, token: string, corsHeaders: Record<string, string>): Promise<Response> {
  const body = await request.json();

  const response = await fetch(`${LINE_API_BASE}/richmenu/alias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    return jsonResponse({ message: 'Rich menu alias created successfully' }, 200, corsHeaders);
  } else {
    const data = await response.json();
    return jsonResponse(data, response.status, corsHeaders);
  }
}

/**
 * Get a specific rich menu alias
 */
async function getRichMenuAlias(token: string, aliasId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/richmenu/alias/${aliasId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return jsonResponse(data, response.status, corsHeaders);
}

/**
 * Update an existing rich menu alias
 */
async function updateRichMenuAlias(request: Request, token: string, aliasId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const body = await request.json();

  const response = await fetch(`${LINE_API_BASE}/richmenu/alias/${aliasId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    return jsonResponse({ message: 'Rich menu alias updated successfully' }, 200, corsHeaders);
  } else {
    const data = await response.json();
    return jsonResponse(data, response.status, corsHeaders);
  }
}

/**
 * Delete a rich menu alias
 */
async function deleteRichMenuAlias(token: string, aliasId: string, corsHeaders: Record<string, string>): Promise<Response> {
  const response = await fetch(`${LINE_API_BASE}/richmenu/alias/${aliasId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    return jsonResponse({ message: 'Rich menu alias deleted successfully' }, 200, corsHeaders);
  } else {
    const error = await response.text();
    return jsonResponse({ error: 'Failed to delete rich menu alias', details: error }, response.status, corsHeaders);
  }
}

/**
 * Helper function to create JSON responses with CORS headers
 */
function jsonResponse(data: any, status: number = 200, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
