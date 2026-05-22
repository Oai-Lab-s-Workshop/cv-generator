import { getErrorMessage } from './error-message';

describe('getErrorMessage', () => {
  it('returns the message from an Error instance', () => {
    const error = new Error('Something went wrong');

    expect(getErrorMessage(error)).toBe('Something went wrong');
  });

  it('returns a fallback for a non-Error value', () => {
    expect(getErrorMessage('plain string')).toBe('An unexpected error occurred.');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred.');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred.');
    expect(getErrorMessage(42)).toBe('An unexpected error occurred.');
  });

  it('returns a fallback for an Error with an empty message', () => {
    const error = new Error();

    error.message = '';

    expect(getErrorMessage(error)).toBe('An unexpected error occurred.');
  });
});
