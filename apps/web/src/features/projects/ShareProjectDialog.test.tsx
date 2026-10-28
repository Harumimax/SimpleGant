import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ShareProjectDialog } from './ShareProjectDialog';

const publicUrl = 'http://localhost:5173/public/permanent-token';

describe('ShareProjectDialog', () => {
  it('copies the permanent public link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(<ShareProjectDialog onClose={vi.fn()} publicUrl={publicUrl} />);

    expect(screen.getByLabelText('Ссылка для просмотра')).toHaveValue(publicUrl);
    fireEvent.click(screen.getByRole('button', { name: 'Копировать' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(publicUrl));
    expect(screen.getByRole('button', { name: 'Скопировано' })).toBeInTheDocument();
  });

  it('keeps the link available for manual copying when clipboard access fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    render(<ShareProjectDialog onClose={vi.fn()} publicUrl={publicUrl} />);
    fireEvent.click(screen.getByRole('button', { name: 'Копировать' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Выделите её и скопируйте вручную',
    );
    expect(screen.getByLabelText('Ссылка для просмотра')).toHaveValue(publicUrl);
  });
});
