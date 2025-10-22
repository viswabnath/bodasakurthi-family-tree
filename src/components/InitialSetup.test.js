import { render, screen } from '@testing-library/react';
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

  test('renders initial setup form with welcome message', () => {
    render(<InitialSetup onSetupComplete={mockOnSetupComplete} />);
    
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
    expect(screen.getByText("Let's set up your family tree")).toBeInTheDocument();
  });

  test('shows all form fields', () => {
    render(<InitialSetup onSetupComplete={mockOnSetupComplete} />);
    
    expect(screen.getByPlaceholderText('e.g., Smith, Johnson, Garcia...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose a strong password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
  });

  test('shows create family tree button', () => {
    render(<InitialSetup onSetupComplete={mockOnSetupComplete} />);
    
    const submitButton = screen.getByRole('button', { name: /create family tree/i });
    expect(submitButton).toBeInTheDocument();
  });

  test('shows family name format selector', () => {
    render(<InitialSetup onSetupComplete={mockOnSetupComplete} />);
    
    expect(screen.getByText('Family Name Format')).toBeInTheDocument();
    expect(screen.getByText('Select Suffix')).toBeInTheDocument();
  });
});
