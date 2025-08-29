import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadJSON from '../../components/UploadJSON';

const mockOnLoad = jest.fn();
const mockOnSave = jest.fn();

const validConfig = {
  name: "Test Sweep",
  description: "Test description",
  parameters: [{ key: "angle", type: "float", values: [0, 5, 10] }]
};

describe('UploadJSON Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles valid JSON input correctly', async () => {
    render(<UploadJSON onLoad={mockOnLoad} onSave={mockOnSave} />);

    const textArea = screen.getByLabelText('Manual JSON Edit') as HTMLTextAreaElement;
    
    // Directly set value
    fireEvent.change(textArea, { target: { value: JSON.stringify(validConfig) } });

    fireEvent.click(screen.getByText('Verify JSON'));

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalledWith(validConfig);
      expect(mockOnSave).toHaveBeenCalledWith(validConfig);
    });
  });

  test('shows error for invalid JSON syntax', async () => {
    render(<UploadJSON onLoad={mockOnLoad} />);

    const textArea = screen.getByLabelText('Manual JSON Edit') as HTMLTextAreaElement;
    
    fireEvent.change(textArea, { target: { value: '{invalid json}' } });

    fireEvent.click(screen.getByText('Verify JSON'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON:/)).toBeInTheDocument();
    });

    expect(mockOnLoad).not.toHaveBeenCalled();
  });

  test('shows error for missing required fields', async () => {
    render(<UploadJSON onLoad={mockOnLoad} />);

    const textArea = screen.getByLabelText('Manual JSON Edit') as HTMLTextAreaElement;

    fireEvent.change(textArea, { target: { value: JSON.stringify({ name: 'Test Sweep' }) } });

    fireEvent.click(screen.getByText('Verify JSON'));

    await waitFor(() => {
      expect(screen.getByText("Missing 'description' field")).toBeInTheDocument();
    });

    expect(mockOnLoad).not.toHaveBeenCalled();
  });
});
