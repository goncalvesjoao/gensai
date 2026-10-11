// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import HazardLegend from '../../src/components/HazardLegend.jsx';

afterEach(cleanup);

for (const japanese of [false, true]) {
  test(`disabled hazard categories retain the safety warning (${japanese ? 'Japanese' : 'English'})`, () => {
    const { container, rerender } = render(
      <HazardLegend
        japanese={japanese}
        categories={{ tsunami: true, flooding: false, landslide: false }}
        statuses={{}}
      />,
    );
    expect(container.querySelectorAll('[data-hazard-legend]')).toHaveLength(1);
    rerender(
      <HazardLegend
        japanese={japanese}
        categories={{ tsunami: false, flooding: false, landslide: false }}
        statuses={{}}
      />,
    );
    expect(
      screen.getByText(
        japanese
          ? 'ハザードの種類が選択されていません。安全性の評価ではありません。'
          : 'No hazard categories enabled. This is not a safety assessment.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        japanese
          ? '色なし＝安全ではありません。データが存在しない場合があります'
          : 'No colour does not mean safe. Data may be missing',
      ),
    ).toBeTruthy();
    expect(container.querySelectorAll('[data-hazard-legend]')).toHaveLength(0);
  });
}
