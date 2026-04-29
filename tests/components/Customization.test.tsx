import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMeMock, updateCustomizationMock, uploadAvatarMock } = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  updateCustomizationMock: vi.fn(),
  uploadAvatarMock: vi.fn(),
}))

vi.mock('../../src/services/api', () => ({
  api: {
    users: {
      getMe: getMeMock,
      updateCustomization: updateCustomizationMock,
      uploadAvatar: uploadAvatarMock,
    },
  },
}))

import Customization from '../../src/pages/Customization'

describe('Customization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMeMock.mockResolvedValue({
      preferred_piece_color: 'd1-q2',
      avatar_url: 'bluefire',
    })
    updateCustomizationMock.mockResolvedValue({})
    uploadAvatarMock.mockResolvedValue({ avatar_url: 'https://example.com/custom-avatar.png' })
  })

  it('loads the saved customization for the user', async () => {
    render(<Customization onNavigate={vi.fn()} />)

    expect(await screen.findByRole('button', { name: 'Seleccionar avatar Blue Fire' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Seleccionar fichas 1v1: Fuego y Hielo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Seleccionar fichas 1v1v1v1: Cyber Pop' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('saves a new preset avatar selection', async () => {
    render(<Customization onNavigate={vi.fn()} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Seleccionar avatar Purple Sun' }))

    await waitFor(() => {
      expect(updateCustomizationMock).toHaveBeenCalledWith({
        preferred_piece_color: 'd1-q2',
        avatar_url: 'purplesun',
      })
    })

    expect(await screen.findByText('Personalización guardada')).toBeInTheDocument()
  })

  it('uploads a custom avatar and persists it', async () => {
    const { container } = render(<Customization onNavigate={vi.fn()} />)
    await screen.findByRole('button', { name: 'Seleccionar avatar Blue Fire' })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(input).not.toBeNull()

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() => {
      expect(uploadAvatarMock).toHaveBeenCalledTimes(1)
    })

    const uploadedFormData = uploadAvatarMock.mock.calls[0][0] as FormData
    expect(uploadedFormData.get('file')).toBe(file)

    await waitFor(() => {
      expect(updateCustomizationMock).toHaveBeenCalledWith({
        preferred_piece_color: 'd1-q2',
        avatar_url: 'https://example.com/custom-avatar.png',
      })
    })

    expect(await screen.findByRole('button', { name: 'Seleccionar avatar subido' })).toBeInTheDocument()
    expect(screen.getByText('Avatar guardado correctamente')).toBeInTheDocument()
  })

  it('navigates back to the menu from the back button', async () => {
    const onNavigate = vi.fn()

    render(<Customization onNavigate={onNavigate} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Volver al menÃº principal' }))

    expect(onNavigate).toHaveBeenCalledWith('menu')
  })
})
