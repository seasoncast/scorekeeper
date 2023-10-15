import React from 'react';
import { render } from '@testing-library/react-native';

import TeamScores from './team-scores';

describe('TeamScores', () => {
  it('should render successfully', () => {
    const { root } = render(< TeamScores />);
    expect(root).toBeTruthy();
  });
});
