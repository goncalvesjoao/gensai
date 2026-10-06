/* eslint-disable react/prop-types */
import {
  DEPTH_LEGEND,
  HAZARD_SOURCES,
  LANDSLIDE_CREDITS,
} from '../lib/hazard-sources.mjs';

export default function HazardLegend({ japanese, categories, statuses }) {
  const index = japanese ? 1 : 0;
  return (
    <section
      className="hazard-legend"
      aria-label={
        japanese ? 'ハザードの凡例と出典' : 'Hazard legends and sources'
      }
    >
      <p className="hazard-warning">
        {japanese
          ? '色なし＝安全ではありません。データが存在しない場合があります'
          : 'No colour does not mean safe. Data may be missing'}
      </p>
      <p>
        {japanese
          ? '透明な部分のデータ収録範囲は確認できません。現在の災害状況を示す地図ではありません。'
          : 'Coverage of transparent areas is unknown. These maps do not show current disaster conditions.'}
      </p>
      {!Object.values(categories).some(Boolean) && (
        <p>
          {japanese
            ? 'ハザードの種類が選択されていません。安全性の評価ではありません。'
            : 'No hazard categories enabled. This is not a safety assessment.'}
        </p>
      )}
      {['tsunami', 'flooding', 'landslide']
        .filter((category) => categories[category])
        .map((category) => (
          <details
            open
            key={category}
            data-hazard-legend={category}
            className="hazard-category"
          >
            <summary>
              {category === 'landslide'
                ? japanese
                  ? '土砂災害：警戒区域'
                  : 'Landslide: warning zones'
                : category === 'flooding'
                  ? japanese
                    ? '洪水：想定最大規模の河川浸水深'
                    : 'Flooding: maximum-scale river inundation depth'
                  : japanese
                    ? '津波：想定浸水深'
                    : 'Tsunami: modelled inundation depth'}
            </summary>
            {category === 'landslide' ? (
              <>
                {HAZARD_SOURCES.filter(
                  (source) => source.category === category,
                ).map((source) => (
                  <div key={source.id}>
                    <h3>{source.name[index]}</h3>
                    <ul className="hazard-swatches">
                      {source.colours.map((colour, row) => (
                        <li key={colour}>
                          <span
                            className="hazard-swatch"
                            style={{ backgroundColor: colour }}
                            aria-hidden="true"
                          />
                          {
                            [
                              ['Designated warning zone', '指定済み警戒区域'],
                              [
                                'Designated special warning zone',
                                '指定済み特別警戒区域',
                              ],
                              ['Planned warning zone', '指定予定警戒区域'],
                              [
                                'Planned special warning zone',
                                '指定予定特別警戒区域',
                              ],
                            ][row][index]
                          }
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <details className="hazard-source-details">
                  <summary>
                    {japanese
                      ? '土砂災害の出典・利用条件'
                      : 'Landslide sources and use conditions'}
                  </summary>
                  <p>
                    <a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A33-2025.html">
                      {japanese
                        ? '国土交通省国土数値情報「令和7年度土砂災害警戒区域」をもとに国土地理院が加工'
                        : 'GSI processing of MLIT National Land Numerical Information, 2025 landslide warning zones'}
                    </a>
                  </p>
                  <p>
                    {japanese
                      ? 'この地図は非商用です。京都府のデータは商用の二次利用が禁止されています。神奈川県・和歌山県のデータは申請・証拠資料として使用できません。鳥取県・広島県の区域は参考となる概略位置であり、正確な境界は各自治体に確認してください。データは区域の追加・解除を反映していない場合があります。'
                      : 'This map is noncommercial. Kyoto data prohibits commercial secondary use. Kanagawa and Wakayama data cannot support statutory applications or evidentiary material. Tottori and Hiroshima boundaries are approximate references; consult the authorities for exact boundaries. Data may omit designated areas or lag additions and removals.'}
                  </p>
                  <p>
                    {japanese
                      ? '原典の出典（国土地理院・国土交通省が加工）：'
                      : 'Original sources processed by GSI / MLIT:'}
                  </p>
                  <ul>
                    {LANDSLIDE_CREDITS.map((credit) => (
                      <li key={credit}>{credit}</li>
                    ))}
                  </ul>
                  <p>
                    <a href="https://creativecommons.org/licenses/by/4.0/deed.ja">
                      CC BY 4.0
                    </a>{' '}
                    ·{' '}
                    <a href="https://creativecommons.org/licenses/by/2.1/jp/">
                      CC BY 2.1 JP
                    </a>{' '}
                    ·{' '}
                    <a href="https://nlftp.mlit.go.jp/ksj/gml/codelist/A33_permision_R7.xlsx">
                      {japanese
                        ? '都道府県別の利用条件と原典の完全な出典'
                        : 'Complete prefectural conditions and original-source statements'}
                    </a>
                  </p>
                </details>
                <p>
                  {japanese
                    ? '特別警戒区域は重大な被害のおそれがあります。青い破線は指定予定の境界であり、データ欠損を示すものではありません。区域は概略位置であり、法的な境界の証明には使用できません。'
                    : 'Special warning zones indicate potential severe damage. Blue dashed boundaries indicate planned designation, not missing coverage. Zones show approximate positions and cannot establish legal boundaries.'}
                </p>
              </>
            ) : (
              <>
                <ul className="hazard-swatches">
                  {DEPTH_LEGEND.map(([colour, en, ja]) => (
                    <li key={en}>
                      <span
                        className="hazard-swatch"
                        style={{ backgroundColor: colour }}
                        aria-hidden="true"
                      />
                      {japanese ? ja : en}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {HAZARD_SOURCES.filter(
              (source) => source.category === category,
            ).map((source) => (
              <p
                key={source.id}
                className="hazard-dataset"
                data-hazard-source={source.id}
              >
                {source.name[index]}:{' '}
                {statuses[source.id] === 'unavailable'
                  ? japanese
                    ? '要求したタイルの一部は提供されていません。データ収録範囲は不明です。安全を意味しません。'
                    : 'Some requested tiles were not supplied. Coverage is unknown; this does not mean safe.'
                  : statuses[source.id] === 'failed'
                    ? japanese
                      ? 'タイルを読み込めませんでした。無着色の地域とは異なります。他のデータは引き続き利用できます。'
                      : 'Tile request failed. This is different from an area with no mapped hazard. Other datasets remain usable.'
                    : statuses[source.id] === 'loading' || !statuses[source.id]
                      ? japanese
                        ? 'タイルを読み込み中…'
                        : 'Loading tiles…'
                      : japanese
                        ? '表示範囲のタイルを読み込みました。透明な部分の収録範囲は不明です。'
                        : 'Viewport tiles loaded. Coverage of transparent areas is unknown.'}
              </p>
            ))}
          </details>
        ))}
      <p>
        {japanese
          ? '上のレイヤーが下のレイヤーを隠す場合があります。各災害の種類を個別に確認してください。ハザードマップポータルサイトをもとにGensaiが重ね合わせ表示。'
          : 'Upper layers can obscure lower layers. Inspect each category separately. Gensai displays layers from the Hazard Map Portal.'}
      </p>
      <p>{japanese ? '津波データ：都道府県' : 'Tsunami data: Prefectures'}</p>
      {categories['flooding'] && (
        <p>
          {japanese
            ? '河川データ：国土交通省各地方整備局等、都道府県・市町村等。重複する箇所では国管理河川の表示を優先します。危険度の順位ではありません。'
            : 'River data: MLIT regional development bureaus, prefectures and municipalities. National river data is drawn above combined data where they overlap; this is not a danger ranking.'}
        </p>
      )}
      <p>
        <a href="https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/">
          {japanese
            ? '自治体のハザードマップ・公表情報を確認する（わがまちハザードマップ）'
            : 'Check municipal hazard maps and publication information (GSI directory)'}
        </a>
      </p>
      <details className="hazard-source-details">
        <summary>{japanese ? '海岸線の出典' : 'Shoreline attribution'}</summary>
        <p>
          Shoreline data is derived from: United States. National Imagery and
          Mapping Agency. &quot;Vector Map Level 0 (VMAP0).&quot; Bethesda, MD:
          Denver, CO: The Agency; USGS Information Services, 1997.
        </p>
      </details>
      <p>
        <a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">
          {japanese
            ? '出典：国土交通省・国土地理院 ハザードマップポータルサイト'
            : 'Source: MLIT / GSI Hazard Map Portal'}
        </a>{' '}
        ·{' '}
        <a href="https://maps.gsi.go.jp/development/ichiran.html">
          {japanese ? '背景地図：国土地理院' : 'Basemap: GSI'}
        </a>
      </p>
    </section>
  );
}
