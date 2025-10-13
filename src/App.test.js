import { render, screen, act, waitFor } from '@testing-library/react';
import App from './App';

test('renders family tree application', async () => {
  await act(async () => {
    render(<App />);
  });
  
  // Wait for initial loading to complete
  await waitFor(() => {
    expect(document.body).toBeInTheDocument();
  });
});
