/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header, AppTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { KpiCards } from './components/KpiCards';
import { MainChart } from './components/MainChart';
import { GuideTable } from './components/GuideTable';
import { WeightsChart } from './components/WeightsChart';
import { PlaceboChart } from './components/PlaceboChart';
import { DecayChart } from './components/DecayChart';
import { TheoryAccordion } from './components/TheoryAccordion';
import { TutorialModal } from './components/TutorialModal';
import { SafetyStockTutorialModal } from './components/SafetyStockTutorialModal';
import { OptimalPricingTutorialModal } from './components/OptimalPricingTutorialModal';
import { DataTableModal } from './components/DataTableModal';
import { DemoDataViewer } from './components/DemoDataViewer';
import { CsvFormatGuideModal } from './components/CsvFormatGuideModal';
import { SafetyStockModule } from './components/SafetyStockModule';
import { OptimalPricingModule } from './components/OptimalPricingModule';
import { UserVoiceModule } from './components/UserVoiceModule';
import { Footer } from './components/Footer';
import { generateScenarioData, SCENARIOS } from './utils/demoData';
import { computeSCM } from './utils/scm';
import { testFirestoreConnection } from './firebase/config';
import { DataPoint, SimulationParams, ScenarioMeta } from './types';
import { Table, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function App() {
  // 1. Scenario & Domain State
  const [currentScenarioId, setCurrentScenarioId] = useState<string>('retail');
  const currentScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === currentScenarioId) || SCENARIOS[0],
    [currentScenarioId]
  );

  // 2. Data & Config State
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(() =>
    generateScenarioData('retail')
  );
  const [targetUnit, setTargetUnit] = useState<string>(currentScenario.targetUnit);
  const [interventionDate, setInterventionDate] = useState<string>(
    currentScenario.interventionDate
  );
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>('scm');

  // Simulation parameters (Cost, Gross margin, Decay rate, Forecast horizon)
  const [params, setParams] = useState<SimulationParams>({
    interventionCost: currentScenario.defaultCost,
    grossMarginPercent: currentScenario.defaultMargin,
    monthlyDecayRate: 15,
    forecastMonths: 6,
  });

  // Modals
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSafetyStockTutorialOpen, setIsSafetyStockTutorialOpen] = useState(false);
  const [isOptimalPricingTutorialOpen, setIsOptimalPricingTutorialOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isCsvGuideOpen, setIsCsvGuideOpen] = useState(false);

  const handleOpenGuide = () => {
    if (activeTab === 'safety_stock') {
      setIsSafetyStockTutorialOpen(true);
    } else if (activeTab === 'optimal_pricing') {
      setIsOptimalPricingTutorialOpen(true);
    } else {
      setIsTutorialOpen(true);
    }
  };

  // Test Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Check if first-time visitor for automatic tutorial opening
  useEffect(() => {
    try {
      const isOff = localStorage.getItem('impactsynth_tutorial_off') === '1';
      if (!isOff) {
        const timer = setTimeout(() => {
          setIsTutorialOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  // 3. Extract unique units and sorted dates
  const { availableUnits, availableDates, unitSeriesMap } = useMemo(() => {
    const unitsSet = new Set<string>();
    const datesSet = new Set<string>();

    for (const p of dataPoints) {
      unitsSet.add(p.unit);
      datesSet.add(p.date);
    }

    const units = Array.from(unitsSet);
    const dates = Array.from(datesSet).sort();

    const map = new Map<string, number[]>();
    for (const u of units) {
      map.set(u, new Array(dates.length).fill(0));
    }

    const dateIdxMap = new Map<string, number>();
    dates.forEach((d, i) => dateIdxMap.set(d, i));

    for (const p of dataPoints) {
      const arr = map.get(p.unit);
      const idx = dateIdxMap.get(p.date);
      if (arr && idx !== undefined) {
        arr[idx] = p.value;
      }
    }

    return {
      availableUnits: units,
      availableDates: dates,
      unitSeriesMap: map,
    };
  }, [dataPoints]);

  // Ensure targetUnit is valid
  useEffect(() => {
    if (!availableUnits.includes(targetUnit) && availableUnits.length > 0) {
      setTargetUnit(availableUnits[0]);
    }
  }, [availableUnits, targetUnit]);

  // All donor units (all units except target)
  const allDonorUnits = useMemo(() => {
    return availableUnits.filter((u) => u !== targetUnit);
  }, [availableUnits, targetUnit]);

  // Initialize or prune selected donors
  useEffect(() => {
    setSelectedDonors((prev) => {
      const valid = prev.filter((u) => allDonorUnits.includes(u));
      if (valid.length > 0) return valid;
      return [...allDonorUnits];
    });
  }, [allDonorUnits]);

  // Ensure intervention date is valid
  useEffect(() => {
    if (!availableDates.includes(interventionDate) && availableDates.length > 0) {
      const targetIdx = Math.floor(availableDates.length * 0.65);
      setInterventionDate(availableDates[targetIdx] || availableDates[0]);
    }
  }, [availableDates, interventionDate]);

  // 4. Compute SCM Model
  const scmResult = useMemo(() => {
    if (!targetUnit || selectedDonors.length === 0 || availableDates.length === 0) {
      return null;
    }
    return computeSCM({
      targetUnit,
      donorUnits: selectedDonors,
      dates: availableDates,
      interventionDate,
      unitSeriesMap,
    });
  }, [targetUnit, selectedDonors, availableDates, interventionDate, unitSeriesMap]);

  // Donor weights map for fast lookup
  const donorWeightsMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (scmResult) {
      for (const dw of scmResult.donorWeights) {
        map[dw.unit] = dw.weight;
      }
    }
    return map;
  }, [scmResult]);

  // Trigger celebratory confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 65,
      origin: { y: 0.7 },
    });
  };

  // Scenario Switcher
  const handleSelectScenario = (sc: ScenarioMeta) => {
    setCurrentScenarioId(sc.id);
    const newData = generateScenarioData(sc.id);
    setDataPoints(newData);
    setTargetUnit(sc.targetUnit);
    setInterventionDate(sc.interventionDate);
    setSelectedDonors([...sc.donorUnits]);
    setParams((p) => ({
      ...p,
      interventionCost: sc.defaultCost,
      grossMarginPercent: sc.defaultMargin,
    }));
    triggerConfetti();
  };

  // Handlers for Donor selection
  const handleToggleDonor = (unit: string) => {
    setSelectedDonors((prev) => {
      if (prev.includes(unit)) {
        if (prev.length <= 1) return prev;
        return prev.filter((u) => u !== unit);
      } else {
        return [...prev, unit];
      }
    });
  };

  const handleSelectAllDonors = () => {
    setSelectedDonors([...allDonorUnits]);
  };

  const handleClearAllDonors = () => {
    if (allDonorUnits.length > 0) {
      setSelectedDonors([allDonorUnits[0]]);
    }
  };

  const handleLoadDemoData = () => {
    handleSelectScenario(currentScenario);
  };

  const handleCustomDataLoaded = (points: DataPoint[]) => {
    setDataPoints(points);
    const newUnits = Array.from(new Set(points.map((p) => p.unit)));
    if (newUnits.length > 0) {
      setTargetUnit(newUnits[0]);
    }
  };

  const handleExportReport = () => {
    if (!scmResult) return;
    const header = `日付,対象,実際の実績(${currentScenario.metricUnit}),合成対照(${currentScenario.metricUnit}),純増差分(${currentScenario.metricUnit})\n`;
    const rows = scmResult.dates
      .map(
        (d, idx) =>
          `${d},${targetUnit},${Math.round(scmResult.actualValues[idx])},${Math.round(scmResult.syntheticValues[idx])},${Math.round(scmResult.gapValues[idx])}`
      )
      .join('\n');
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), header + rows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impactsynth_${targetUnit}_summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const prePeriodCount = scmResult ? scmResult.interventionIndex : 0;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header with Collapsible & Auto-Hide Behavior */}
      <Header
        onOpenTutorial={handleOpenGuide}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExportReport={handleExportReport}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scm' && (
          <div className="space-y-6">
            {/* On-Page Demo Data Viewer & Multi-Domain Scenario Switcher */}
            <DemoDataViewer
              currentScenarioId={currentScenarioId}
              onSelectScenario={handleSelectScenario}
              dataPoints={dataPoints}
              metricUnit={currentScenario.metricUnit}
            />

            {/* Theoretical Assumptions Accordion (Abadie et al. 2010 Guardrails) */}
            <TheoryAccordion
              result={scmResult}
              prePeriodCount={prePeriodCount}
              unitTypeName={currentScenario.unitTypeName}
            />

            {/* Layout: Sidebar + Main Output Area */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Sidebar Settings Area */}
              <Sidebar
                availableUnits={availableUnits}
                targetUnit={targetUnit}
                onTargetUnitChange={setTargetUnit}
                availableDates={availableDates}
                interventionDate={interventionDate}
                onInterventionDateChange={setInterventionDate}
                allDonorUnits={allDonorUnits}
                selectedDonors={selectedDonors}
                onToggleDonor={handleToggleDonor}
                onSelectAllDonors={handleSelectAllDonors}
                onClearAllDonors={handleClearAllDonors}
                donorWeightsMap={donorWeightsMap}
                params={params}
                onParamsChange={(newParams) => setParams((p) => ({ ...p, ...newParams }))}
                onLoadDemoData={handleLoadDemoData}
                onCustomDataLoaded={handleCustomDataLoaded}
                currentDataPoints={dataPoints}
                metricName={currentScenario.metricName}
                metricUnit={currentScenario.metricUnit}
                unitTypeName={currentScenario.unitTypeName}
                totalIncrementalEffect={scmResult ? scmResult.totalIncrementalEffect : 0}
                onOpenCsvGuideModal={() => setIsCsvGuideOpen(true)}
              />

              {/* Main Report Area */}
              <div className="flex-1 w-full space-y-6 min-w-0">
                {scmResult ? (
                  <>
                    {/* 1. KPI Summary Cards */}
                    <KpiCards
                      result={scmResult}
                      cost={params.interventionCost}
                      margin={params.grossMarginPercent}
                      metricName={currentScenario.metricName}
                      metricUnit={currentScenario.metricUnit}
                      unitTypeName={currentScenario.unitTypeName}
                    />

                    {/* 2. Main Plotly Chart (Actual vs Synthetic) with Gap Explainer */}
                    <MainChart
                      result={scmResult}
                      metricName={currentScenario.metricName}
                      metricUnit={currentScenario.metricUnit}
                      unitTypeName={currentScenario.unitTypeName}
                    />

                    {/* 3. Metric Interpretation Guide Table (◎/△/×) */}
                    <GuideTable
                      result={scmResult}
                      cost={params.interventionCost}
                      margin={params.grossMarginPercent}
                      metricName={currentScenario.metricName}
                      metricUnit={currentScenario.metricUnit}
                      unitTypeName={currentScenario.unitTypeName}
                    />

                    {/* 4. Model Breakdown & Placebo Test (2 Columns) */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <WeightsChart
                        result={scmResult}
                        unitTypeName={currentScenario.unitTypeName}
                      />
                      <PlaceboChart
                        result={scmResult}
                        metricUnit={currentScenario.metricUnit}
                        unitTypeName={currentScenario.unitTypeName}
                      />
                    </div>

                    {/* 5. What-if Effect Decay Simulation */}
                    <DecayChart
                      result={scmResult}
                      params={params}
                      onParamsChange={(newParams) => setParams((p) => ({ ...p, ...newParams }))}
                      metricName={currentScenario.metricName}
                      metricUnit={currentScenario.metricUnit}
                    />

                    {/* Action Bar: View Full Data Table */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          測定数値の全期間生データを確認・出力
                        </h3>
                        <p className="text-xs text-slate-500">
                          施策前後の各期間における実際値、合成対照値、純増差分（Gap）、累積効果の一覧表
                        </p>
                      </div>
                      <button
                        onClick={() => setIsTableModalOpen(true)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 active:scale-98 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>データテーブルを開く</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      モデルを計算できませんでした
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                      比較対象（ドナー）ユニットが選択されているか、施策開始日の前に十分なデータ期間（2時点以上）があるか確認してください。
                    </p>
                    <button
                      onClick={handleLoadDemoData}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      デモデータで初期化する
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Safety Stock Optimization Module */}
        {activeTab === 'safety_stock' && <SafetyStockModule />}

        {/* Optimal Pricing Determination Module */}
        {activeTab === 'optimal_pricing' && <OptimalPricingModule />}

        {/* User Voice / Private Feedback Module */}
        {activeTab === 'user_voice' && <UserVoiceModule />}
      </main>

      {/* CSV Format Visual Guide Modal */}
      <CsvFormatGuideModal
        isOpen={isCsvGuideOpen}
        onClose={() => setIsCsvGuideOpen(false)}
        sampleDataPoints={dataPoints}
      />

      {/* Tutorial Modal (Onboarding guide with concrete data preview) */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        targetUnit={targetUnit}
        donorUnits={selectedDonors}
        interventionDate={interventionDate}
        metricName={currentScenario.metricName}
        metricUnit={currentScenario.metricUnit}
        unitTypeName={currentScenario.unitTypeName}
        interventionName={currentScenario.interventionName}
        samplePoints={dataPoints}
      />

      {/* Safety Stock Tutorial Modal */}
      <SafetyStockTutorialModal
        isOpen={isSafetyStockTutorialOpen}
        onClose={() => setIsSafetyStockTutorialOpen(false)}
      />

      {/* Optimal Pricing Tutorial Modal */}
      <OptimalPricingTutorialModal
        isOpen={isOptimalPricingTutorialOpen}
        onClose={() => setIsOptimalPricingTutorialOpen(false)}
      />

      {/* Data Table Modal */}
      {scmResult && (
        <DataTableModal
          isOpen={isTableModalOpen}
          onClose={() => setIsTableModalOpen(false)}
          result={scmResult}
          metricName={currentScenario.metricName}
          metricUnit={currentScenario.metricUnit}
        />
      )}

      {/* Footer with academic foundations, license & AI disclaimer */}
      <Footer />
    </div>
  );
}
