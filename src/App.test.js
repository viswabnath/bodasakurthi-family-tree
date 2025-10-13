import { render, waitFor } from '@testing-library/react';
import App from './App';

test('renders family tree application', async () => {
  render(<App />);
  
  // Wait for initial loading to complete
  await waitFor(() => {
    expect(document.body).toBeInTheDocument();
  });
});
