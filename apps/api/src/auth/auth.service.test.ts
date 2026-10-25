import { compare } from 'bcrypt';
import { describe, expect, it, vi } from 'vitest';

import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

function createRepositoryMock() {
  return {
    findUserByEmail: vi.fn(),
    createUserWithSession: vi.fn(),
    createSession: vi.fn(),
    findUserBySession: vi.fn(),
    deleteSession: vi.fn(),
  };
}

describe('AuthService', () => {
  it('normalizes email, hashes the password and returns no password hash', async () => {
    const repository = createRepositoryMock();
    repository.findUserByEmail.mockResolvedValue(null);
    repository.createUserWithSession.mockImplementation(async (input) => ({
      id: '2d47d6aa-6c3f-4d25-b0c0-319f435969f2',
      email: input.email,
      passwordHash: input.passwordHash,
      createdAt: new Date('2026-10-26T00:00:00.000Z'),
    }));
    const service = new AuthService(
      repository as unknown as AuthRepository,
    );

    const result = await service.register('  USER@example.com ', 'long-password');
    const createInput = repository.createUserWithSession.mock.calls[0]?.[0];

    expect(createInput).toBeDefined();

    if (!createInput) {
      throw new Error('Expected createUserWithSession to be called');
    }

    expect(createInput.email).toBe('user@example.com');
    expect(await compare('long-password', createInput.passwordHash)).toBe(true);
    expect(result.user).toEqual({
      id: '2d47d6aa-6c3f-4d25-b0c0-319f435969f2',
      email: 'user@example.com',
      createdAt: new Date('2026-10-26T00:00:00.000Z'),
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.token).toHaveLength(43);
  });

  it('uses the same login error for an unknown email', async () => {
    const repository = createRepositoryMock();
    repository.findUserByEmail.mockResolvedValue(null);
    const service = new AuthService(
      repository as unknown as AuthRepository,
    );

    await expect(
      service.login('missing@example.com', 'long-password'),
    ).rejects.toThrow('Неверный email или пароль');
  });
});
