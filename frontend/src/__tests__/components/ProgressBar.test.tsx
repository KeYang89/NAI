import React from 'react';
import { render, screen, act } from '@testing-library/react';
import ProgressBar from '../../components/ProgressBar';

// Mock the config import
jest.mock('../../config', () => ({
  BACKEND_WS_URL: 'ws://localhost:53045',
}));

describe('ProgressBar Component', () => {
  let mockWebSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mockWebSocket before each test
    mockWebSocket = {
      onopen: () => {},
      onmessage: () => {},
      onclose: () => {},
      onerror: () => {},
      close: jest.fn(),
    };

    // Mock global WebSocket
    global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket);
  });

  test('renders initial state correctly', () => {
    render(<ProgressBar configId="test-config-123" />);

    expect(screen.getByText(/ID: test-config-123/)).toBeInTheDocument();
    expect(screen.getByText(/Progress: 0%/)).toBeInTheDocument();
    expect(screen.getByText(/IDLE/)).toBeInTheDocument();
    expect(screen.getByText(/Viewers: 1/)).toBeInTheDocument();
  });

  test('updates progress when WebSocket message received', () => {
    render(<ProgressBar configId="test-config-123" />);

    // Simulate WebSocket connection
    act(() => {
      mockWebSocket.onopen({});
    });

    // Simulate progress message
    act(() => {
      mockWebSocket.onmessage({
        data: JSON.stringify({
          progress: 50,
          state: 'RUNNING',
          viewers: 3,
        }),
      });
    });

    expect(screen.getByText(/Progress: 50%/)).toBeInTheDocument();
    expect(screen.getByText(/RUNNING/)).toBeInTheDocument();
    expect(screen.getByText(/Viewers: 3/)).toBeInTheDocument();
  });

  test('handles completion state', () => {
    render(<ProgressBar configId="test-config-123" />);

    act(() => {
      mockWebSocket.onmessage({
        data: JSON.stringify({
          progress: 100,
          state: 'DONE',
          viewers: 2,
        }),
      });
    });

    expect(screen.getByText(/Progress: 100%/)).toBeInTheDocument();
    expect(screen.getByText(/DONE/)).toBeInTheDocument();
  });

  test('closes WebSocket on unmount', () => {
    const { unmount } = render(<ProgressBar configId="test-config-123" />);

    unmount();

    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});
