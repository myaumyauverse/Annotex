import { getSession } from 'next-auth/react';

export class ApiClient {
  private baseUrl: string;
  private inflightGetRequests = new Map<string, Promise<unknown>>();

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authorization headers with JWT token
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getSession();
    
    return {
      'Content-Type': 'application/json',
      ...(session?.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
    };
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    const url = `${this.baseUrl}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();

    // Prevent duplicate concurrent GET requests for the same resource.
    if (method === 'GET' && this.inflightGetRequests.has(url)) {
      return this.inflightGetRequests.get(url) as Promise<T>;
    }

    const execute = async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // Handle non-2xx responses
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          error.message || 'API request failed',
          response.status,
          error
        );
      }

      // Parse and return JSON
      return await response.json();
    };

    const requestPromise = execute()
      .catch((error) => {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError('Network error', 0, error);
      })
      .finally(() => {
        if (method === 'GET') {
          this.inflightGetRequests.delete(url);
        }
      });

    if (method === 'GET') {
      this.inflightGetRequests.set(url, requestPromise as Promise<unknown>);
    }

    try {
      return await requestPromise;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, error);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Singleton instance
export const apiClient = new ApiClient();
