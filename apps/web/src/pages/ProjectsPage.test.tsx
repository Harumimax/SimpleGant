import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProjectsPage } from './ProjectsPage';

const user = {
  id: '06730751-0464-41e8-b8a6-229d06dd2a23',
  email: 'owner@example.com',
  createdAt: '2026-10-27T10:00:00.000Z',
};

const project = {
  id: 'a54a123b-2a29-4cce-b75a-2140b8450536',
  name: 'Запуск корпоративного портала',
  startDate: '2026-11-01',
  endDate: '2027-01-31',
  createdAt: '2026-10-27T10:00:00.000Z',
  updatedAt: '2026-10-27T10:00:00.000Z',
};

afterEach(() => vi.unstubAllGlobals());

describe('ProjectsPage', () => {
  it('renders projects with semantic navigation and accessible actions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const payload = url.endsWith('/auth/me')
          ? { user }
          : url.endsWith('/projects')
            ? [project]
            : null;

        return new Response(JSON.stringify(payload), {
          headers: { 'Content-Type': 'application/json' },
          status: payload ? 200 : 404,
        });
      }),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Запуск корпоративного портала',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Запуск корпоративного портала' }),
    ).toHaveAttribute('href', `/projects/${project.id}`);
    expect(screen.getByRole('link', { name: 'Открыть' })).toHaveAttribute(
      'href',
      `/projects/${project.id}`,
    );
    expect(
      screen.getByRole('button', {
        name: 'Редактировать Запуск корпоративного портала',
      }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', {
        name: 'Удалить Запуск корпоративного портала',
      }),
    ).toBeEnabled();
  });
});
