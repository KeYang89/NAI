// src/__tests__/components/UploadJSON.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadJSON from '../../components/UploadJSON';

// Mock config to replace import.meta.env
jest.mock('../../config', () => ({
  BACKEND_HTTP_URL: 'http://localhost:53045',
  BACKEND_WS_URL: 'ws://localhost:53045',
}));

const mockOnLoad = jest.fn();
const mockOnSave = jest.fn();

const validConfig = {
  name: "Test Sweep",
  description: "Test description",
  parameters: [
    { key: "angle", type: "float", values: [0, 5, 10] }
  ]
};

const invalidConfig = {
  name: "Test Sweep"
};

describe('UploadJSON Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form elements correctly', () => {
    render(<UploadJSON onLoad={mockOnLoad} onSave={mockOnSave} />);
    
    expect(screen.getByText('Upload or Edit JSON Config')).toBeInTheDocument();
    expect(screen.getByLabelText('Manual JSON Edit')).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
    expect(screen.getByText('Verify JSON')).toBeInTheDocument();
    expect(screen.getByText('Save JSON')).toBeInTheDocument();
  });

  test('renders without save button when onSave not provided', () => {
    render(<UploadJSON onLoad={mockOnLoad} />);
    
    expect(screen.getByText('Verify JSON')).toBeInTheDocument();
    expect(screen.queryByText('Save JSON')).not.toBeInTheDocument();
  });

  test('handles valid JSON input correctly', async () => {
    render(<UploadJSON onLoad={mockOnLoad} onSave={mockOnSave} />);
    
    const textArea = screen.getByLabelText('Manual JSON Edit');
    fireEvent.change(textArea, { target: { value: JSON.stringify(validConfig) } });
    
    fireEvent.click(screen.getByText('Verify JSON'));
    
    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalledWith(validConfig);
      expect(mockOnSave).toHaveBeenCalledWith(validConfig);
    });
  });

  test('shows error for invalid JSON syntax', async () => {
    render(<UploadJSON onLoad={mockOnLoad} />);
    
    const textArea = screen.getByLabelText('Manual JSON Edit');
    fireEvent.change(textArea, { target: { value: '{invalid json}' } });
    
    fireEvent.click(screen.getByText('Verify JSON'));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON:/)).toBeInTheDocument();
    });
    
    expect(mockOnLoad).not.toHaveBeenCalled();
  });

  test('shows error for missing required fields', async () => {
    render(<UploadJSON onLoad={mockOnLoad} />);
    
    const textArea = screen.getByLabelText('Manual JSON Edit');
    fireEvent.change(textArea, { target: { value: JSON.stringify(invalidConfig) } });
    
    fireEvent.click(screen.getByText('Verify JSON'));
    
    await waitFor(() => {
      expect(screen.getByText("Missing 'description' field")).toBeInTheDocument();
    });
    
    expect(mockOnLoad).not.toHaveBeenCalled();
  });

  test('handles file upload correctly', async () => {
    const user = userEvent.setup();
    render(<UploadJSON onLoad={mockOnLoad} />);
    
    const file = new File([JSON.stringify(validConfig)], 'test-config.json', {
      type: 'application/json'
    });
    
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
    
    // Mock FileReader
    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null as any,
      result: JSON.stringify(validConfig)
    };
    
    global.FileReader = jest.fn(() => mockFileReader);
    
    await user.upload(fileInput, file);
    
    // Simulate FileReader load
    mockFileReader.onload({ target: { result: JSON.stringify(validConfig) } });
    
    await waitFor(() => {
      expect((screen.getByLabelText('Manual JSON Edit') as HTMLTextAreaElement).value)
        .toBe(JSON.stringify(validConfig));
    });
  });

  test('clears error when valid JSON is entered after invalid', async () => {
    render(<UploadJSON onLoad={mockOnLoad} />);
    
    const textArea = screen.getByLabelText('Manual JSON Edit');
    
    fireEvent.change(textArea, { target: { value: '{invalid}' } });
    fireEvent.click(screen.getByText('Verify JSON'));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON:/)).toBeInTheDocument();
    });
    
    fireEvent.change(textArea, { target: { value: JSON.stringify(validConfig) } });
    fireEvent.click(screen.getByText('Verify JSON'));
    
    await waitFor(() => {
      expect(screen.queryByText(/Invalid JSON:/)).not.toBeInTheDocument();
      expect(mockOnLoad).toHaveBeenCalledWith(validConfig);
    });
  });
});
