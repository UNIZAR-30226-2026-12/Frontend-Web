import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../src/services/api'

describe('api', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('auth.login sends form data and returns parsed json on success', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ access_token: 'token-123' }),
    } as unknown as Response)

    const formData = new URLSearchParams()
    formData.append('username', 'tester')
    formData.append('password', 'secret')

    const result = await api.auth.login(formData)

    expect(result).toEqual({ access_token: 'token-123' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      }),
    )
  })

  it('auth.login surfaces backend error details when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ detail: 'Credenciales inválidas' }),
    } as unknown as Response)

    await expect(api.auth.login(new URLSearchParams())).rejects.toThrow('Credenciales inválidas')
  })

  it('users.getMe includes the bearer token header', async () => {
    localStorage.setItem('token', 'abc123')

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ username: 'player1' }),
    } as unknown as Response)

    const result = await api.users.getMe()

    expect(result).toEqual({ username: 'player1' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer abc123',
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('forgotPassword returns the backend message on non-blocking server errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ detail: 'No se pudo enviar el correo' }),
    } as unknown as Response)

    await expect(api.auth.forgotPassword('test@example.com')).resolves.toEqual({
      message: 'No se pudo enviar el correo',
    })
  })

  it('forgotPassword throws when the email does not exist', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ detail: 'No existe ninguna cuenta con ese correo' }),
    } as unknown as Response)

    await expect(api.auth.forgotPassword('missing@example.com')).rejects.toThrow(
      'No existe ninguna cuenta con ese correo',
    )
  })

  it('users.getMe throws SESSION_EXPIRED for unauthorized requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as unknown as Response)

    await expect(api.users.getMe()).rejects.toThrow('SESSION_EXPIRED')
  })

  it('friends.sendRequest surfaces backend validation errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ detail: 'No puedes enviarte una solicitud a ti mismo' }),
    } as unknown as Response)

    await expect(api.friends.sendRequest('tester')).rejects.toThrow(
      'No puedes enviarte una solicitud a ti mismo',
    )
  })
})
