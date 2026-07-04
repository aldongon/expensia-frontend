export type RegisterRequest = {
  email: string;
  password: string;
  timezone: string;
};

export type RegisteredUser = {
  id: number;
  email: string;
  timezone: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenResponse = {
  token: string;
  expiresAt: string;
};

export type ProblemDetail = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
};

export class ApiRequestError extends Error {
  status: number;
  data: ProblemDetail | null;

  constructor(status: number, data: ProblemDetail | null, fallbackMessage: string) {
    super(data?.detail || data?.title || fallbackMessage);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return path.startsWith('/') ? path : `/${path}`;
}

async function readProblemDetail(response: Response, fallbackMessage: string): Promise<never> {
  let data: ProblemDetail | null = null;

  try {
    data = (await response.json()) as ProblemDetail;
  } catch {
    data = null;
  }

  throw new ApiRequestError(response.status, data, fallbackMessage);
}

async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    await readProblemDetail(response, fallbackMessage);
  }

  return response.json() as Promise<T>;
}

export async function registerAccount(request: RegisterRequest): Promise<RegisteredUser> {
  const response = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return readJsonResponse<RegisteredUser>(response, 'No se pudo crear la cuenta.');
}

export async function login(request: LoginRequest): Promise<TokenResponse> {
  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return readJsonResponse<TokenResponse>(response, 'No se pudo iniciar sesión.');
}
