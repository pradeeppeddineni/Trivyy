import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvatarPicker } from './AvatarPicker';
import type { AvatarPresetKey } from './AvatarPicker';

// ---- Tests ------------------------------------------------------------------

describe('AvatarPicker', () => {
  it('renders all 6 preset colour swatches', () => {
    render(<AvatarPicker onPickPreset={vi.fn()} onUploadFile={vi.fn()} />);
    const swatches = screen.getAllByRole('radio');
    expect(swatches).toHaveLength(6);
  });

  it('renders an Upload photo button', () => {
    render(<AvatarPicker onPickPreset={vi.fn()} onUploadFile={vi.fn()} />);
    expect(screen.getByRole('button', { name: /upload a photo/i })).toBeInTheDocument();
  });

  it.each([
    ['Blue', 'blue'],
    ['Green', 'green'],
    ['Pink', 'pink'],
    ['Amber', 'amber'],
    ['Violet', 'violet'],
    ['Teal', 'teal'],
  ] as ReadonlyArray<[string, AvatarPresetKey]>)(
    'calls onPickPreset with "%s" key when the %s swatch is clicked',
    async (label, expectedKey) => {
      const handler = vi.fn();
      const user = userEvent.setup();
      render(<AvatarPicker onPickPreset={handler} onUploadFile={vi.fn()} />);
      await user.click(screen.getByRole('radio', { name: label }));
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(expectedKey);
    },
  );

  it('marks the active preset swatch as checked', () => {
    render(<AvatarPicker activePreset="teal" onPickPreset={vi.fn()} onUploadFile={vi.fn()} />);
    const teal = screen.getByRole('radio', { name: 'Teal' });
    expect(teal).toHaveAttribute('aria-checked', 'true');
    // Other swatches are not checked
    expect(screen.getByRole('radio', { name: 'Blue' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onUploadFile with the selected File when the user picks an image', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<AvatarPicker onPickPreset={vi.fn()} onUploadFile={handler} />);

    const file = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' });

    // The visible button triggers the hidden input; upload via the input directly.
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(file);
  });

  it('does not call onUploadFile when no file is selected', async () => {
    const handler = vi.fn();
    render(<AvatarPicker onPickPreset={vi.fn()} onUploadFile={handler} />);
    // Fire a change event with empty files list (cancellation scenario)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });
});
