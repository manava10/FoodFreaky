import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import TrafficStats from './TrafficStats';
import axios from 'axios';
jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ authToken: 'test-token' }) }));
afterEach(() => { jest.useRealTimers(); jest.clearAllMocks(); });
test('shows protected counts and refreshes without retaining a timer after unmount', async () => {
  jest.useFakeTimers();
  axios.get.mockResolvedValue({ data: { data: { onlineVisitors: 7, totalVisits: 123, trackingSince: '2026-10-10T00:00:00Z' } } });
  const { unmount } = render(<TrafficStats />);
  await waitFor(() => expect(screen.getByText('123')).toBeTruthy());
  expect(screen.getByText('7')).toBeTruthy();
  expect(axios.get.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
  await act(async () => { jest.advanceTimersByTime(30000); });
  expect(axios.get).toHaveBeenCalledTimes(2);
  unmount();
  await act(async () => { jest.advanceTimersByTime(30000); });
  expect(axios.get).toHaveBeenCalledTimes(2);
});
test('failed counts show unavailable rather than zero', async () => {
  axios.get.mockRejectedValue(new Error('offline'));
  render(<TrafficStats />);
  await waitFor(() => expect(screen.getAllByText('Unavailable')).toHaveLength(2));
  expect(screen.queryByText('0')).toBeNull();
});
