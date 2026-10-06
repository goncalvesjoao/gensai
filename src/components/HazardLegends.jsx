import { useSyncExternalStore } from 'react';
import { hazardCategories } from '../lib/hazard-categories.mjs';
import { catalogue, hazardLayers } from '../lib/hazard-layers.mjs';

// eslint-disable-next-line react/prop-types
export default function HazardLegends({ locale, states }) {
  const enabled = useSyncExternalStore(
    hazardCategories.subscribe,
    hazardCategories.getSnapshot,
    hazardCategories.getServerSnapshot,
  );
  const ja = locale === 'ja';
  const layers = hazardLayers.filter((layer) => enabled[layer.category]);
  if (!layers.length) return null;
  return (
    <section
      className="hazard-legends"
      tabIndex={0}
      aria-label={ja ? 'ハザード凡例' : 'Hazard legends'}
    >
      <p>
        <strong>
          {ja
            ? '色なし＝安全ではありません。データが存在しない場合があります'
            : 'No colour does not mean safe. Data may be missing.'}
        </strong>
      </p>
      {layers.map((layer) => (
        <section key={layer.id} data-hazard-legend={layer.id}>
          <h2>{layer.title[locale]}</h2>
          <p aria-live="polite">
            {states?.[layer.id] === 'failed'
              ? ja
                ? 'ハザードタイルの取得に失敗しました。災害がないことを意味しません。再読み込みしてお試しください。'
                : 'Hazard tile request failed. This does not mean no mapped hazard. Reload to retry.'
              : states?.[layer.id] !== 'loaded'
                ? ja
                  ? 'ハザードタイルを読み込み中…'
                  : 'Loading hazard tiles…'
                : ja
                  ? 'タイル取得完了。地理的な収録範囲は不明です。'
                  : 'Tiles loaded. Geographic coverage is unknown.'}
          </p>
          <ul>
            {layer.legend.map(([color, en, japanese]) => (
              <li key={color}>
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: '1.5em',
                    height: '1em',
                    backgroundColor: color,
                    border: '1px solid #666',
                    marginRight: '0.5em',
                  }}
                />
                {ja ? japanese : en}
              </li>
            ))}
          </ul>
          <a href={catalogue}>{layer.attribution}</a>
        </section>
      ))}
      <p>
        {ja
          ? '収録範囲は未確認です。東京都は島しょ部のみ。茨城県の公開タイル経路は掲載されていません。自治体の最新のハザードマップも確認してください。'
          : 'Coverage is unverified. Tokyo publication covers islands only; Ibaraki has no listed open tile path. Consult current municipal hazard maps.'}
      </p>
      <p>
        {ja
          ? '重なった上のレイヤーは下のレイヤーを隠します。他のカテゴリを確認するにはスイッチをオフにしてください。'
          : 'Overlapping upper layers can conceal lower layers. Switch categories off to inspect the others.'}
      </p>
      <p>
        「ハザードマップポータルサイト」を加工してGensaiが作成（表示順序・重なりの処理）
      </p>
    </section>
  );
}
