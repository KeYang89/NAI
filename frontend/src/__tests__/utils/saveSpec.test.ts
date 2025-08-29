import { saveSpec, Spec } from '../../utils/saveSpec';
import { jest } from '@jest/globals';

global.fetch = jest.fn();

describe('saveSpec', () => {
  const handleToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validSpec: Spec = {
    name: 'Test Config',
    description: 'A test config',
    parameters: [{ key: 'param1', type: 'int', values: [1, 2] }],
  };

  test('returns null and shows error if name is empty', async () => {
    const spec = { ...validSpec, name: '  ' };
    const result = await saveSpec(spec, handleToast);
    expect(result).toBeNull();
    expect(handleToast).toHaveBeenCalledWith('Name is required', 'error');
  });

  test('returns null and shows error if description is empty', async () => {
    const spec = { ...validSpec, description: '' };
    const result = await saveSpec(spec, handleToast);
    expect(result).toBeNull();
    expect(handleToast).toHaveBeenCalledWith('Description is required', 'error');
  });

  test('returns null and shows error if parameters are empty', async () => {
    const spec = { ...validSpec, parameters: [] };
    const result = await saveSpec(spec, handleToast);
    expect(result).toBeNull();
    expect(handleToast).toHaveBeenCalledWith('At least one parameter is required', 'error');
  });

  test('saves spec successfully', async () => {
    const mockId = '12345';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: mockId }),
    });

    const result = await saveSpec(validSpec, handleToast);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/configs'), expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSpec),
    }));

    expect(result).toEqual({ ...validSpec, id: mockId });
    expect(handleToast).toHaveBeenCalledWith(`Saved config with ID: ${mockId}`, 'success');
  });

  test('handles backend error', async () => {
    const errorMessage = 'Server error';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => errorMessage,
    });

    const result = await saveSpec(validSpec, handleToast);

    expect(result).toBeNull();
    expect(handleToast).toHaveBeenCalledWith(`Error saving config: ${errorMessage}`, 'error');
  });

  test('handles fetch throwing exception', async () => {
    const fetchError = new Error('Network failure');
    (fetch as jest.Mock).mockRejectedValueOnce(fetchError);

    const result = await saveSpec(validSpec, handleToast);

    expect(result).toBeNull();
    expect(handleToast).toHaveBeenCalledWith(`Error saving config: ${fetchError.message}`, 'error');
  });
});
