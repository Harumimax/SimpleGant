import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the login screen', () => {
    window.history.pushState({}, '', '/login');
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Войти в SimpleGant' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeEnabled();
  });
});
