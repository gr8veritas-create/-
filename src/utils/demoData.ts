import { DataPoint, ScenarioMeta } from '../types';

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'retail',
    title: '店舗・小売売上（キャンペーン効果）',
    domain: '店舗運営・リテール・B2C',
    targetUnit: '渋谷店',
    donorUnits: ['新宿店', '池袋店', '横浜店', '吉祥寺店', '秋葉原店', '銀座店'],
    interventionDate: '2025-01-05',
    metricName: '週売上金額',
    metricUnit: '円',
    unitTypeName: '店舗',
    interventionName: '全品ポイント2倍キャンペーン',
    description: '季節変動や天候要因を近隣他店舗で相殺し、渋谷店で実施した独自キャンペーンによる純増売上を測定します。',
    defaultCost: 500000,
    defaultMargin: 30,
  },
  {
    id: 'marketing',
    title: 'Web・アプリマーケティング（特定地域広告）',
    domain: 'デジタル広告・マーケティング',
    targetUnit: '関東エリア',
    donorUnits: ['関西エリア', '中部エリア', '九州エリア', '東北エリア', '北海道エリア'],
    interventionDate: '2025-02-02',
    metricName: '週間新規登録数',
    metricUnit: '人',
    unitTypeName: '配信エリア',
    interventionName: '地域限定動画広告集中投下',
    description: '全国的な自然オーガニック増や季節トレンドから切り離し、関東エリアに集中投下した動画広告の真の獲得増を検証します。',
    defaultCost: 1200000,
    defaultMargin: 80,
  },
  {
    id: 'b2b_sales',
    title: 'B2B営業（インサイドセールス体制の先行導入）',
    domain: '法人営業・SaaS・B2B',
    targetUnit: '東日本第1営業部',
    donorUnits: ['東日本第2部', '西日本第1部', '西日本第2部', '中部営業部', '九州営業部'],
    interventionDate: '2024-10-06',
    metricName: '月間商談獲得数',
    metricUnit: '件',
    unitTypeName: '営業部',
    interventionName: 'インサイドセールス専任部隊の新設',
    description: '業界の商戦期や景気動向の影響を他営業部データで調整し、東日本第1部で先行導入した新体制による商談創出増を測定します。',
    defaultCost: 900000,
    defaultMargin: 90,
  },
  {
    id: 'manufacturing',
    title: '製造工場（IoT予知保全によるライン停止削減）',
    domain: '製造・生産管理・品質管理',
    targetUnit: '第2マザー工場',
    donorUnits: ['第1マザー工場', '第3組立工場', '第4加工工場', '九州製造所', '東北工場'],
    interventionDate: '2024-11-03',
    metricName: '突発設備停止時間',
    metricUnit: '分',
    unitTypeName: '製造工場',
    interventionName: 'AI振動解析・予知保全センサー全台導入',
    description: '生産負荷や季節要因による突発故障を他工場と比較し、予知保全システム導入による停止時間の削減効果（短縮）を実証します。',
    defaultCost: 1500000,
    defaultMargin: 100,
  },
  {
    id: 'healthcare',
    title: 'ヘルスケア・健保（特定保健指導プログラム）',
    domain: '医療・健康保険組合・福祉',
    targetUnit: 'つばさ地区',
    donorUnits: ['あおば地区', 'ひかり地区', 'みどり地区', 'さくら地区', '若葉地区'],
    interventionDate: '2024-09-01',
    metricName: '1人あたり医療費',
    metricUnit: '円',
    unitTypeName: '健保地区',
    interventionName: 'ウェアラブル連動・遠隔生活習慣病予防指導',
    description: '高齢化や季節性インフルエンザ等の医療費自然増を他地区で補正し、予防医療プログラムによる医療費抑制効果を検証します。',
    defaultCost: 800000,
    defaultMargin: 100,
  },
  {
    id: 'policy',
    title: '自治体・公共政策（家庭用省エネ設備補助金）',
    domain: '公共政策・自治体・環境',
    targetUnit: 'みらい市',
    donorUnits: ['あおば市', 'ひかり市', 'みどり市', 'さくら市', 'つばさ市'],
    interventionDate: '2024-10-06',
    metricName: '週平均電力消費量',
    metricUnit: 'MWh',
    unitTypeName: '自治体・都市',
    interventionName: '家庭用蓄電池・太陽光ゼロ円導入補助事業',
    description: '猛暑や厳冬などの気象要因を近隣都市データで相殺し、みらい市の環境補助事業による電力消費削減効果を評価します。',
    defaultCost: 2000000,
    defaultMargin: 100,
  },
  {
    id: 'efficiency',
    title: '人事・業務効率化（生成AIアシスタント導入）',
    domain: '組織・人事・DX推進',
    targetUnit: '東京営業本部',
    donorUnits: ['大阪支社', '名古屋支社', '福岡支社', '札幌支社', '仙台支社'],
    interventionDate: '2024-11-03',
    metricName: '週間総残業時間',
    metricUnit: '時間',
    unitTypeName: '拠点・事業部',
    interventionName: 'AI業務アシスタント＆自動化ツール導入',
    description: '繁忙期・決算期の全社的な残業増加トレンドの中で、先行導入した東京営業本部でどれだけ残業時間を圧縮できたかを実証します。',
    defaultCost: 800000,
    defaultMargin: 100,
  },
];

export const DEMO_TARGET = SCENARIOS[0].targetUnit;
export const DEMO_INTERVENTION_DATE = SCENARIOS[0].interventionDate;

function pseudoRandom(seedRef: { seed: number }) {
  seedRef.seed = (seedRef.seed * 9301 + 49297) % 233280;
  return seedRef.seed / 233280;
}

export function generateScenarioData(scenarioId: string = 'retail'): DataPoint[] {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const points: DataPoint[] = [];
  const seedRef = { seed: scenarioId.length * 137 + 42 };

  const totalWeeks = 78;
  const startDate = new Date('2024-01-07T00:00:00Z');

  // Find intervention week index
  const interDate = new Date(scenario.interventionDate + 'T00:00:00Z');
  const interventionWeek = Math.max(
    8,
    Math.min(70, Math.round((interDate.getTime() - startDate.getTime()) / (7 * 24 * 3600 * 1000)))
  );

  if (scenario.id === 'retail') {
    // 1. Retail Store Scenario
    const baseLevels: Record<string, number> = {
      渋谷店: 3450000,
      新宿店: 3750000,
      池袋店: 3200000,
      横浜店: 3100000,
      吉祥寺店: 2600000,
      秋葉原店: 2850000,
      銀座店: 4100000,
    };

    for (let w = 0; w < totalWeeks; w++) {
      const curDate = new Date(startDate);
      curDate.setUTCDate(startDate.getUTCDate() + w * 7);
      const dateStr = curDate.toISOString().split('T')[0];

      const weekOfYear = w % 52;
      let seasonality = 1.0;
      if (weekOfYear >= 16 && weekOfYear <= 18) seasonality += 0.18;
      if (weekOfYear >= 31 && weekOfYear <= 33) seasonality += 0.12;
      if (weekOfYear >= 49 && weekOfYear <= 51) seasonality += 0.30;
      if (weekOfYear >= 1 && weekOfYear <= 3) seasonality -= 0.08;
      if (weekOfYear >= 38 && weekOfYear <= 40) seasonality += 0.08;

      const macroGrowth = 1 + (w / 52) * 0.025;

      const donorValues: Record<string, number> = {};
      for (const donor of scenario.donorUnits) {
        const base = baseLevels[donor] || 3000000;
        const noise = (pseudoRandom(seedRef) - 0.5) * 0.04;
        const val = Math.round(base * seasonality * macroGrowth * (1 + noise));
        donorValues[donor] = val;
        points.push({ date: dateStr, unit: donor, value: val });
      }

      const baseSynthetic =
        0.38 * (donorValues['新宿店'] || 3000000) +
        0.34 * (donorValues['池袋店'] || 3000000) +
        0.28 * (donorValues['横浜店'] || 3000000);

      const targetNoise = (pseudoRandom(seedRef) - 0.5) * 0.024;
      let targetVal = baseSynthetic * (1 + targetNoise);

      if (w >= interventionWeek) {
        const weeksSinceStart = w - interventionWeek;
        const initialBurst = Math.max(0, 1 - weeksSinceStart / 8) * 60000;
        const sustainedLift = 320000 + (pseudoRandom(seedRef) - 0.5) * 40000;
        targetVal += sustainedLift + initialBurst;
      }

      points.push({ date: dateStr, unit: '渋谷店', value: Math.round(targetVal) });
    }
  } else if (scenario.id === 'marketing') {
    // 2. Web Marketing Scenario
    const baseLevels: Record<string, number> = {
      関東エリア: 4200,
      関西エリア: 2800,
      中部エリア: 1950,
      九州エリア: 1600,
      東北エリア: 1100,
      北海道エリア: 980,
    };

    for (let w = 0; w < totalWeeks; w++) {
      const curDate = new Date(startDate);
      curDate.setUTCDate(startDate.getUTCDate() + w * 7);
      const dateStr = curDate.toISOString().split('T')[0];

      const weekOfYear = w % 52;
      let seasonality = 1.0;
      if (weekOfYear >= 10 && weekOfYear <= 14) seasonality += 0.22;
      if (weekOfYear >= 35 && weekOfYear <= 38) seasonality += 0.15;

      const macroTrend = 1 + (w / 52) * 0.08;

      const donorVals: Record<string, number> = {};
      for (const donor of scenario.donorUnits) {
        const base = baseLevels[donor] || 1500;
        const noise = (pseudoRandom(seedRef) - 0.5) * 0.06;
        const val = Math.round(base * seasonality * macroTrend * (1 + noise));
        donorVals[donor] = val;
        points.push({ date: dateStr, unit: donor, value: val });
      }

      const baseSynthetic =
        0.55 * (donorVals['関西エリア'] || 2000) * 1.5 +
        0.30 * (donorVals['中部エリア'] || 1500) * 1.8 +
        0.15 * (donorVals['九州エリア'] || 1200) * 1.3;

      const targetNoise = (pseudoRandom(seedRef) - 0.5) * 0.035;
      let targetVal = baseSynthetic * (1 + targetNoise);

      if (w >= interventionWeek) {
        const lift = 650 + (pseudoRandom(seedRef) - 0.5) * 80;
        targetVal += lift;
      }

      points.push({ date: dateStr, unit: '関東エリア', value: Math.round(targetVal) });
    }
  } else if (scenario.id === 'b2b_sales') {
    // 3. B2B Inside Sales (Meetings booked / month)
    const baseLevels: Record<string, number> = {
      東日本第1営業部: 58,
      東日本第2部: 48,
      西日本第1部: 52,
      西日本第2部: 42,
      中部営業部: 36,
      九州営業部: 28,
    };

    for (let w = 0; w < totalWeeks; w++) {
      const curDate = new Date(startDate);
      curDate.setUTCDate(startDate.getUTCDate() + w * 7);
      const dateStr = curDate.toISOString().split('T')[0];

      const weekOfYear = w % 52;
      let seasonality = 1.0;
      if (weekOfYear >= 8 && weekOfYear <= 12) seasonality += 0.25; // Fiscal year end rush
      if (weekOfYear >= 34 && weekOfYear <= 37) seasonality += 0.18; // Autumn budget season
      if (weekOfYear >= 31 && weekOfYear <= 33) seasonality -= 0.15; // Summer holidays

      const donorVals: Record<string, number> = {};
      for (const donor of scenario.donorUnits) {
        const base = baseLevels[donor] || 40;
        const noise = (pseudoRandom(seedRef) - 0.5) * 0.07;
        const val = Math.round(base * seasonality * (1 + noise));
        donorVals[donor] = val;
        points.push({ date: dateStr, unit: donor, value: val });
      }

      const baseSynthetic =
        0.45 * (donorVals['東日本第2部'] || 40) * 1.2 +
        0.35 * (donorVals['西日本第1部'] || 40) * 1.1 +
        0.20 * (donorVals['中部営業部'] || 30) * 1.6;

      const targetNoise = (pseudoRandom(seedRef) - 0.5) * 0.04;
      let targetVal = baseSynthetic * (1 + targetNoise);

      if (w >= interventionWeek) {
        const lift = 18 + (pseudoRandom(seedRef) - 0.5) * 4;
        targetVal += lift;
      }

      points.push({ date: dateStr, unit: '東日本第1営業部', value: Math.max(10, Math.round(targetVal)) });
    }
  } else if (scenario.id === 'manufacturing') {
    // 4. Manufacturing Unplanned Downtime (Minutes / week - reduction is positive)
    const baseLevels: Record<string, number> = {
      第2マザー工場: 290,
      第1マザー工場: 310,
      第3組立工場: 240,
      第4加工工場: 210,
      九州製造所: 260,
      東北工場: 190,
    };

    for (let w = 0; w < totalWeeks; w++) {
      const curDate = new Date(startDate);
      curDate.setUTCDate(startDate.getUTCDate() + w * 7);
      const dateStr = curDate.toISOString().split('T')[0];

      const weekOfYear = w % 52;
      let wearTrend = 1.0;
      if (weekOfYear >= 26 && weekOfYear <= 32) wearTrend += 0.20; // High heat load in summer
      if (weekOfYear >= 48 && weekOfYear <= 51) wearTrend += 0.25; // Year-end production spike

      const donorVals: Record<string, number> = {};
      for (const donor of scenario.donorUnits) {
        const base = baseLevels[donor] || 250;
        const noise = (pseudoRandom(seedRef) - 0.5) * 0.08;
        const val = Math.round(base * wearTrend * (1 + noise));
        donorVals[donor] = val;
        points.push({ date: dateStr, unit: donor, value: val });
      }

      const baseSynthetic =
        0.52 * (donorVals['第1マザー工場'] || 250) * 0.94 +
        0.30 * (donorVals['九州製造所'] || 250) * 1.12 +
        0.18 * (donorVals['第3組立工場'] || 250) * 1.20;

      const targetNoise = (pseudoRandom(seedRef) - 0.5) * 0.05;
      let targetVal = baseSynthetic * (1 + targetNoise);

      if (w >= interventionWeek) {
        const reduction = 85 + (pseudoRandom(seedRef) - 0.5) * 15;
        targetVal -= reduction;
      }

      points.push({ date: dateStr, unit: '第2マザー工場', value: Math.max(40, Math.round(targetVal)) });
    }
  } else if (scenario.id === 'healthcare') {
    // 5. Healthcare / Preventative Care Cost per capita (JPY / month - suppression is positive)
    const baseLevels: Record<string, number> = {
      つばさ地区: 38200,
      あおば地区: 39500,
      ひかり地区: 37100,
      みどり地区: 34800,
      さくら地区: 33200,
      若葉地区: 36000,
    };

    for (let w = 0; w < totalWeeks; w++) {
      const curDate = new Date(startDate);
      curDate.setUTCDate(startDate.getUTCDate() + w * 7);
      const dateStr = curDate.toISOString().split('T')[0];

      const weekOfYear = w % 52;
      let epidemicLoad = 1.0;
      if (weekOfYear >= 1 && weekOfYear <= 6) epidemicLoad += 0.15; // Winter illness
      if (weekOfYear >= 48 && weekOfYear <= 51) epidemicLoad += 0.10;

      const donorVals: Record<string, number> = {};
      for (const donor of scenario.donorUnits) {
        const base = baseLevels[donor] || 36000;
        const noise = (pseudoRandom(seedRef) - 0.5) * 0.035;
        const val = Math.round(base * epidemicLoad * (1 + noise));
        donorVals[donor] = val;
        points.push({ date: dateStr, unit: donor, value: val });
      }

      const baseSynthetic =
        0.48 * (donorVals['あおば地区'] || 36000) * 0.97 +
        0.34 * (donorVals['ひかり地区'] || 36000) * 1.03 +
        0.18 * (donorVals['若葉地区'] || 36000) * 1.06;

      const targetNoise = (pseudoRandom(seedRef) - 0.5) * 0.025;
      let targetVal = baseSynthetic * (1 + targetNoise);

      if (w >= interventionWeek) {
        const savings = 3400 + (pseudoRandom(seedRef) - 0.5) * 500;
        targetVal -= savings;
      }

      points.push({ date: dateStr, unit: 'つばさ地区', value: Math.round(targetVal) });
    }
  } else if (scenario.id === 'policy') {
    // 6. Environmental Policy (Electricity Consumption MWh)
    const baseLevels: Record<string, number> = {
      みらい市: 850,
      あおば市: 920,
      ひかり市: 780,
      みどり市: 640,
      さくら市: 590,
      つばさ市: 880,
    };

    for (let w = 0; w < totalWeeks; w++) {
      const curDate = new Date(startDate);
      curDate.setUTCDate(startDate.getUTCDate() + w * 7);
      const dateStr = curDate.toISOString().split('T')[0];

      const weekOfYear = w % 52;
      let weatherLoad = 1.0;
      if (weekOfYear >= 28 && weekOfYear <= 33) weatherLoad += 0.35;
      if (weekOfYear >= 1 && weekOfYear <= 7) weatherLoad += 0.28;

      const donorVals: Record<string, number> = {};
      for (const donor of scenario.donorUnits) {
        const base = baseLevels[donor] || 700;
        const noise = (pseudoRandom(seedRef) - 0.5) * 0.04;
        const val = Math.round(base * weatherLoad * (1 + noise));
        donorVals[donor] = val;
        points.push({ date: dateStr, unit: donor, value: val });
      }

      const baseSynthetic =
        0.42 * (donorVals['あおば市'] || 700) * 0.92 +
        0.38 * (donorVals['ひかり市'] || 700) * 1.08 +
        0.20 * (donorVals['つばさ市'] || 700) * 0.96;

      const noise = (pseudoRandom(seedRef) - 0.5) * 0.03;
      let targetVal = baseSynthetic * (1 + noise);

      if (w >= interventionWeek) {
        const reduction = 68 + (pseudoRandom(seedRef) - 0.5) * 10;
        targetVal -= reduction;
      }

      points.push({ date: dateStr, unit: 'みらい市', value: Math.round(targetVal) });
    }
  } else {
    // 7. HR / Operational Efficiency (Weekly Overtime Hours)
    const baseLevels: Record<string, number> = {
      東京営業本部: 480,
      大阪支社: 360,
      名古屋支社: 290,
      福岡支社: 240,
      札幌支社: 180,
      仙台支社: 170,
    };

    for (let w = 0; w < totalWeeks; w++) {
      const curDate = new Date(startDate);
      curDate.setUTCDate(startDate.getUTCDate() + w * 7);
      const dateStr = curDate.toISOString().split('T')[0];

      const weekOfYear = w % 52;
      let busyness = 1.0;
      if (weekOfYear >= 11 && weekOfYear <= 13) busyness += 0.30;
      if (weekOfYear >= 37 && weekOfYear <= 39) busyness += 0.25;

      const donorVals: Record<string, number> = {};
      for (const donor of scenario.donorUnits) {
        const base = baseLevels[donor] || 250;
        const noise = (pseudoRandom(seedRef) - 0.5) * 0.05;
        const val = Math.round(base * busyness * (1 + noise));
        donorVals[donor] = val;
        points.push({ date: dateStr, unit: donor, value: val });
      }

      const baseSynthetic =
        0.50 * (donorVals['大阪支社'] || 250) * 1.33 +
        0.32 * (donorVals['名古屋支社'] || 250) * 1.65 +
        0.18 * (donorVals['福岡支社'] || 250) * 2.0;

      const noise = (pseudoRandom(seedRef) - 0.5) * 0.04;
      let targetVal = baseSynthetic * (1 + noise);

      if (w >= interventionWeek) {
        const savedHours = 75 + (pseudoRandom(seedRef) - 0.5) * 12;
        targetVal -= savedHours;
      }

      points.push({ date: dateStr, unit: '東京営業本部', value: Math.round(targetVal) });
    }
  }

  return points;
}

export function generateDemoData(): DataPoint[] {
  return generateScenarioData('retail');
}

export function dataPointsToCSV(points: DataPoint[]): string {
  const header = '日付,対象ユニット,測定値\n';
  const rows = points.map((p) => `${p.date},${p.unit},${p.value}`).join('\n');
  return header + rows;
}
