import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InitialSetup from './InitialSetup';

// Mock the family tree service
jest.mock('../services/familyTreeService', () => ({
  familyTreeService: {
    createInitialAdmin: jest.fn(() => 
      Promise.resolve({ success: true, message: 'Admin created successfully!' })
    ),
  },
}));

describe('InitialSetup Component', () => {
  const mockOnSetupComplete = jest.fn();

  beforeEach(() => {
    mockOnSetupComplete.mockClear();
  });

  test('renders initial setup form', () => {
    render(<InitialSetup onSetupComplete={mockOnSetupComplete} />);
    
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
    expect(screen.getByText("Let's set up your family tree")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Smith, Johnson, Garcia...')).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    render(<InitialSetup onSetupComplete={mockOnSetupComplete} />);
    
    const submitButton = screen.getByRole('button', { name: /create family tree/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Family name is required')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });

  test('validates email format', async () => {
    render(<InitialSetup onSetupComplete={mockOnSetupComplete} />);
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /create family tree/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
  });

  test('validates password confirmation', async () => {
    render(<InitialSetup onSetupComplete={mockOnSetupComplete} />);
    
    const passwordInput = screen.getByPlaceholderText('Choose a strong password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    
    const submitButton = screen.getByRole('button', { name: /create family tree/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  test('navigation links work correctly', () => {
    render(<InitialSetup onSetupComplete={mockOnSetupComplete} />);
    
    const publicViewButton = screen.getByText('View Public Tree');
    const adminLoginButton = screen.getByText('Admin Login');
    
    expect(publicViewButton).toBeInTheDocument();
    expect(adminLoginButton).toBeInTheDocument();
  });
});