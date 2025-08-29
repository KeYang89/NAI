import React from 'react';
import { render, screen } from '@testing-library/react';
import JsonPreview from '../../components/JsonPreview';

describe('JsonPreview Component', () => {
  test('renders "No data to display" when json prop is null', () => {
    render(<JsonPreview json={null} />);
    expect(screen.getByText('No data to display.')).toBeInTheDocument();
  });

  test('renders "No data to display" when json prop is undefined', () => {
    render(<JsonPreview json={undefined} />);
    expect(screen.getByText('No data to display.')).toBeInTheDocument();
  });

  test('displays JSON content when valid data is provided', () => {
    const testData = { name: 'Test', value: 123 };
    render(<JsonPreview json={testData} />);
    
    expect(screen.getByText('JSON Preview')).toBeInTheDocument();
    expect(screen.getByText(/"name": "Test"/)).toBeInTheDocument();
    expect(screen.getByText(/"value": 123/)).toBeInTheDocument();
  });

  test('handles complex nested objects', () => {
    const complexData = {
      name: 'Complex Test',
      parameters: [
        { key: 'angle', values: [0, 5, 10] },
        { key: 'speed', values: [20, 40] }
      ]
    };
    
    render(<JsonPreview json={complexData} />);
    expect(screen.getByText('JSON Preview')).toBeInTheDocument();
    expect(screen.getByText(/"name": "Complex Test"/)).toBeInTheDocument();
  });
});