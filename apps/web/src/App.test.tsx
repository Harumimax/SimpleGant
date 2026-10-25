import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the projects workspace', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Проекты' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Создать проект' }),
    ).toBeDisabled();
  });
});
