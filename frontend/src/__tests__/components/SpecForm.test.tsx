import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpecForm from '../../components/SpecForm';
import { SpecContext } from '../../App';

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-123'
}));

const mockContextValue = {
  specJson: {},
  setSpecJson: jest.fn(),
  handleToast: jest.fn(),
  loadedConfigs: [],
  setLoadedConfigs: jest.fn()
};

const renderWithContext = (contextValue = mockContextValue) => {
  return render(
    <SpecContext.Provider value={contextValue}>
      <SpecForm />
    </SpecContext.Provider>
  );
};

describe('SpecForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form elements', () => {
    renderWithContext();
    expect(screen.getByText('Specification Form')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Add Parameter')).toBeInTheDocument();
    expect(screen.getByText('Save Config')).toBeInTheDocument();
  });

  test('adds and removes a parameter', async () => {
    const user = userEvent.setup();
    renderWithContext();

    await user.click(screen.getByText('Add Parameter'));
    expect(screen.getByLabelText('Key')).toBeInTheDocument();

    const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!;
    await user.click(deleteButton);
    expect(screen.queryByLabelText('Key')).not.toBeInTheDocument();
  });


  test('validates float values', async () => {
    const user = userEvent.setup();
    renderWithContext();

    await user.click(screen.getByText('Add Parameter'));

    // Type float
    const typeSelect = screen.getByLabelText('Type');
    await user.click(typeSelect);
    const listbox = screen.getByRole('listbox');
    await user.click(within(listbox).getByText('float'));

    const valuesInput = screen.getByLabelText('Values (comma-separated)');
    await user.type(valuesInput, 'a,b,c');
    fireEvent.blur(valuesInput);

    await waitFor(() => {
      expect(screen.getByText('Must be a float')).toBeInTheDocument();
    });
  });

  test('validates integer values', async () => {
    const user = userEvent.setup();
    renderWithContext();

    await user.click(screen.getByText('Add Parameter'));

    // Type int
    const typeSelect = screen.getByLabelText('Type');
    await user.click(typeSelect);
    const listbox = screen.getByRole('listbox');
    await user.click(within(listbox).getByText('int'));

    const valuesInput = screen.getByLabelText('Values (comma-separated)');
    await user.type(valuesInput, '1.5,2.7,abc');
    fireEvent.blur(valuesInput);

    await waitFor(() => {
      expect(screen.getByText('Must be an integer')).toBeInTheDocument();
    });
  });

  test('accepts valid float values', async () => {
    const user = userEvent.setup();
    renderWithContext();

    await user.click(screen.getByText('Add Parameter'));

    // Type float
    const typeSelect = screen.getByLabelText('Type');
    await user.click(typeSelect);
    const listbox = screen.getByRole('listbox');
    await user.click(within(listbox).getByText('float'));

    const valuesInput = screen.getByLabelText('Values (comma-separated)');
    await user.type(valuesInput, '1.0,2.5,3.14');
    fireEvent.blur(valuesInput);

    await waitFor(() => {
      expect(screen.queryByText('Must be a float')).not.toBeInTheDocument();
    });
  });

  test('accepts valid integer values', async () => {
    const user = userEvent.setup();
    renderWithContext();

    await user.click(screen.getByText('Add Parameter'));

    // Type int
    const typeSelect = screen.getByLabelText('Type');
    await user.click(typeSelect);
    const listbox = screen.getByRole('listbox');
    await user.click(within(listbox).getByText('int'));

    const valuesInput = screen.getByLabelText('Values (comma-separated)');
    await user.type(valuesInput, '1,2,3,10,-5');
    fireEvent.blur(valuesInput);

    await waitFor(() => {
      expect(screen.queryByText('Must be an integer')).not.toBeInTheDocument();
    });
  });

  test('saves valid config', async () => {
    const user = userEvent.setup();
    const contextValue = { ...mockContextValue };
    renderWithContext(contextValue);

    await user.type(screen.getByLabelText('Name'), 'Config 1');
    await user.type(screen.getByLabelText('Description'), 'Test config');

    await user.click(screen.getByText('Add Parameter'));
    await user.type(screen.getByLabelText('Key'), 'angle');

    // Type float
    const typeSelect = screen.getByLabelText('Type');
    await user.click(typeSelect);
    const listbox = screen.getByRole('listbox');
    await user.click(within(listbox).getByText('float'));

    const valuesInput = screen.getByLabelText('Values (comma-separated)');
    await user.type(valuesInput, '0,1,2');
    fireEvent.blur(valuesInput);

    await user.click(screen.getByText('Save Config'));

    await waitFor(() => {
      expect(contextValue.setSpecJson).toHaveBeenCalled();
      expect(contextValue.setLoadedConfigs).toHaveBeenCalled();
      expect(contextValue.handleToast).toHaveBeenCalledWith(
        'Config saved and plot updated',
        'success'
      );
    });
  });

  test('shows error if parameter values are empty', async () => {
    const user = userEvent.setup();
    const contextValue = { ...mockContextValue };
    renderWithContext(contextValue);

    await user.type(screen.getByLabelText('Name'), 'Config 1');
    await user.type(screen.getByLabelText('Description'), 'Test config');
    await user.click(screen.getByText('Add Parameter'));

    await user.click(screen.getByText('Save Config'));

    await waitFor(() => {
      expect(contextValue.handleToast).toHaveBeenCalledWith(
        expect.stringContaining('has no values'),
        'error'
      );
    });
  });

});
