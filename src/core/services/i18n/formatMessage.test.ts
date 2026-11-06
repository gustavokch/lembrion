import { describe, expect, it } from 'vitest';
import { formatMessage } from './formatMessage';

describe('formatMessage', () => {
  it('fills every named placeholder and leaves unknown ones untouched', () => {
    expect(formatMessage('{count} of {count} selected by {user}; {missing}', { count: 3, user: '$&' }))
      .toBe('3 of 3 selected by $&; {missing}');
  });
});
