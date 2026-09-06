// RFC 9457 application/problem+json parsing, per project-description-and-endpoints.md section 2.

export type Problem = {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
};

export class ApiProblemError extends Error {
  status: number;
  problem: Problem | null;

  constructor(status: number, problem: Problem | null, fallbackMessage: string) {
    super(problem?.detail || fallbackMessage);
    this.name = 'ApiProblemError';
    this.status = status;
    this.problem = problem;
  }
}

export async function readProblem(response: Response, fallbackMessage: string): Promise<never> {
  let problem: Problem | null = null;

  try {
    problem = (await response.json()) as Problem;
  } catch {
    problem = null;
  }

  throw new ApiProblemError(response.status, problem, fallbackMessage);
}
