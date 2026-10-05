import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowLeft, Download, Lock, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { DashboardService } from '../services/dashboardService';

export default function ReportsPage({ user, profile, onSignOut }) {
  const [viewState, setViewState] = useState('list'); // 'list' | 'summary' | 'report'
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);
  const [selectedCycleId, setSelectedCycleId] = useState(null);

  // Dynamic state
  const [cycles, setCycles] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail loading states
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [chartLoaded, setChartLoaded] = useState(false);

  const getFontSize = (text) => {
    if (!text) return 11;
    if (text.length > 12) return 8.5;
    if (text.length > 10) return 9.5;
    return 11;
  };

  const getSubFontSize = (text) => {
    if (!text) return 9;
    if (text.length > 15) return 7;
    if (text.length > 12) return 8;
    return 9;
  };

  // Accordion states: maps cycleId to boolean
  const [openCycles, setOpenCycles] = useState({});

  // Trigger manual retry/backfill
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Dynamic Chart.js Loader
  useEffect(() => {
    if (viewState === 'report') {
      const isJsonReport = selectedAssessment && selectedAssessment.report_text && selectedAssessment.report_text.startsWith('{');
      if (isJsonReport) {
        if (!window.Chart) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
          script.async = true;
          script.onload = () => {
            setChartLoaded(true);
          };
          document.body.appendChild(script);
        } else {
          setChartLoaded(true);
        }
      }
    }
  }, [viewState, selectedAssessment]);

  // Chart Initializer
  useEffect(() => {
    if (viewState === 'report' && chartLoaded && selectedAssessment) {
      let reportData = null;
      try {
        if (selectedAssessment?.report_text && selectedAssessment.report_text.startsWith('{')) {
          reportData = JSON.parse(selectedAssessment.report_text);
        }
      } catch (e) {
        console.error(e);
      }

      if (reportData && window.Chart) {
        const arcCtx = document.getElementById('arcChart');
        if (arcCtx) {
          const existingChart = window.Chart.getChart(arcCtx);
          if (existingChart) existingChart.destroy();

          const totalDays = reportData.stats?.totalDays || 30;
          const writtenDays = Array.isArray(reportData.chartData?.arcChart?.writtenDays)
            ? reportData.chartData.arcChart.writtenDays
            : Array(totalDays).fill(null);
          const skippedDays = Array.isArray(reportData.chartData?.arcChart?.skippedDays)
            ? reportData.chartData.arcChart.skippedDays
            : Array(totalDays).fill(null);

          new window.Chart(arcCtx, {
            type: 'line',
            data: {
              labels: Array.from({ length: totalDays }, (_, i) => i + 1),
              datasets: [
                {
                  data: writtenDays,
                  borderColor: '#E0A898',
                  backgroundColor: 'rgba(224,168,152,0.06)',
                  borderWidth: 2,
                  pointRadius: 0,
                  tension: 0.4,
                  fill: true,
                  spanGaps: false
                },
                {
                  data: skippedDays,
                  borderColor: 'transparent',
                  backgroundColor: 'transparent',
                  pointBackgroundColor: '#F5F6F6',
                  pointBorderColor: 'rgba(30,42,46,0.12)',
                  pointBorderWidth: 1,
                  pointRadius: 5,
                  showLine: false
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { font: { size: 10 }, color: 'rgba(30,42,46,0.35)', maxTicksLimit: 8, autoSkip: true }
                },
                y: { display: false, min: 0, max: 12 }
              }
            }
          });
        }

        const radarCtx = document.getElementById('radarChart');
        if (radarCtx) {
          const existingChart = window.Chart.getChart(radarCtx);
          if (existingChart) existingChart.destroy();

          const radar = reportData.chartData?.radarChart || {};
          new window.Chart(radarCtx, {
            type: 'radar',
            data: {
              labels: ['', '', '', ''],
              datasets: [
                {
                  data: [
                    radar.patternPersistence ?? 50,
                    radar.emotionalIntensity ?? 50,
                    radar.agency ?? 50,
                    radar.overallDirection ?? 50
                  ],
                  backgroundColor: 'rgba(224,168,152,0.04)',
                  borderColor: 'rgba(30,42,46,0.3)',
                  borderWidth: 1.5,
                  pointBackgroundColor: ['#E0A898', '#B8A8D4', '#8DBFB4', 'rgba(141,191,180,0.45)'],
                  pointBorderColor: ['#E0A898', '#B8A8D4', '#8DBFB4', 'rgba(141,191,180,0.45)'],
                  pointRadius: 6
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { enabled: false } },
              scales: {
                r: {
                  min: 0,
                  max: 100,
                  ticks: { display: false },
                  grid: { color: 'rgba(30,42,46,0.06)' },
                  angleLines: {
                    color: [
                      'rgba(224,168,152,0.5)',
                      'rgba(184,168,212,0.5)',
                      'rgba(141,191,180,0.5)',
                      'rgba(141,191,180,0.25)'
                    ],
                    lineWidth: 1.5
                  },
                  pointLabels: { display: false }
                }
              }
            }
          });
        }
      }
    }
  }, [viewState, chartLoaded, selectedAssessment]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetches for responsiveness
      const [cyclesData, reportsData] = await Promise.all([
        DashboardService.fetchCyclesList(),
        DashboardService.fetchWeeklyReports()
      ]);

      // Sort cycles by cycle_number descending
      const sortedCycles = [...cyclesData].sort((a, b) => b.cycle_number - a.cycle_number);
      setCycles(sortedCycles);
      setReports(reportsData || []);

      // Auto-open the current active cycle accordion
      if (sortedCycles.length > 0) {
        const activeCycle = sortedCycles.find(c => c.status === 'active' || c.status === 'ACTIVE');
        const defaultOpenId = activeCycle ? activeCycle.id : sortedCycles[0].id;
        setOpenCycles({ [defaultOpenId]: true });
      }
    } catch (err) {
      console.error('[ReportsPage] Error loading reports page data:', err);
      setError('Could not establish connection to reports database.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCycle = (cycleId) => {
    setOpenCycles(prev => ({
      ...prev,
      [cycleId]: !prev[cycleId]
    }));
  };

  const handleOpenSummary = async (reportId) => {
    setSelectedSummaryId(reportId);
    setViewState('summary');
    setLoadingDetail(true);
    setSelectedReport(null);
    try {
      const data = await DashboardService.fetchWeeklyReportDetail(reportId);
      setSelectedReport(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load weekly report detail.');
      setViewState('list');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenAssessment = async (cycleId, force = false) => {
    setSelectedCycleId(cycleId);
    setViewState('report');
    setLoadingDetail(true);
    setSelectedAssessment(null);
    try {
      const data = await DashboardService.fetchCycleAssessment(cycleId, force);
      setSelectedAssessment(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load cycle assessment details.');
      setViewState('list');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRetryReport = async (e, reportId, cycleId, weekNumber) => {
    e.stopPropagation();
    setRetryingId(reportId);
    try {
      // Trigger backfill which scans and re-queues failed jobs
      await fetch('/api/reports/backfill', { method: 'POST' });
      // Poll to check if queued
      setTimeout(async () => {
        const freshReports = await DashboardService.fetchWeeklyReports(undefined, true);
        setReports(freshReports);
        setRetryingId(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setRetryingId(null);
    }
  };

  const handleDownloadAssessment = async (e, cycleId) => {
    e.stopPropagation();
    try {
      const assessment = await DashboardService.fetchCycleAssessment(cycleId);
      if (assessment) {
        downloadPdf(assessment, true);
      } else {
        alert("Cycle assessment is not generated yet.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load assessment report for download.");
    }
  };

  const downloadPdf = (reportData, isDay28 = false) => {
    if (!reportData) return;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      alert('Please allow popups to download the PDF report.');
      return;
    }

    let contentHtml = '';

    if (!isDay28) {
      const data = reportData.report_data || {};
      const stats = data.weekly_stats || {};
      const listEmos = data.vocabThisWeek || [];
      const lengths = data.writing_behaviour?.entry_lengths || [];

      // Parse what_we_saw into facts vs realization
      const parts = (data.what_we_saw || '').split('\n\n');
      const sawText = parts[0] || '';
      const realizationText = parts[1] || '';

      let sinceLastWeekContent = '';
      if (typeof data.since_last_week === 'string') {
        sinceLastWeekContent = data.since_last_week;
      } else if (data.since_last_week && typeof data.since_last_week === 'object') {
        const lastWords = data.since_last_week.last_week_words || [];
        const thisWords = data.since_last_week.this_week_words || [];
        if (lastWords.length === 0) {
          sinceLastWeekContent = 'First week on record. No prior week to compare.';
        } else {
          sinceLastWeekContent = `Last week: ${lastWords.join(', ')}. This week: ${thisWords.join(', ')}.`;
        }
      } else {
        sinceLastWeekContent = 'First week on record. No prior week to compare.';
      }

      contentHtml = `
        <div class="rpt" style="border: none; box-shadow: none; margin: 0;">
          <div class="hdr">
            <div class="hl">
              <div class="logo font-semibold">ingress <span>within</span></div>
              <div class="wl" style="margin-left: 14px; text-transform: uppercase;">Week ${reportData.week_number} Summary</div>
            </div>
            <div class="dr">${stats.week_range || ''}</div>
          </div>
          <div class="body">
            <div class="sr">
              <div class="sc">
                <div class="sl">Entries</div>
                <div class="sv">${stats.entries_completed}<sup>/${stats.total_possible}</sup></div>
                <div class="ss">${stats.skipped_days > 0 ? stats.skipped_days + ' days skipped' : 'Perfect streak'}</div>
              </div>
              <div class="sc">
                <div class="sl">Top focal expression</div>
                <div class="sw">"${listEmos[0]?.word || 'none'}"</div>
                <div class="ss">appeared ${listEmos[0]?.frequency || 0} times</div>
              </div>
              <div class="sc">
                <div class="sl">Week tone</div>
                <div class="st">${reportData.title || 'Neutral baseline'}</div>
              </div>
            </div>

            <div class="since-last">
              <div class="eyebrow">Since Last Week</div>
              <p>${sinceLastWeekContent}</p>
            </div>

            <div class="tc">
              <div>
                <div class="lbl">Emotion language this week</div>
                <div class="cx">Words pulled from your writing this week, grouped with related words you didn't use.</div>
                <div style="margin-top: 10px;">
                  ${data.emotion_clusters && data.emotion_clusters.length > 0 ? (
                    data.emotion_clusters.slice(0, 3).map(cluster => `
                      <div class="cluster-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                        <span class="tag" style="background: var(--terracotta-bg); color: var(--terracotta-text); font-size: 12.5px; padding: 5px 11px; border-radius: 20px;">${cluster.word} →</span>
                        ${(cluster.related || []).slice(0, 3).map(rel => `
                          <span class="related" style="background: #fff; border: 1px solid var(--border); font-size: 12.5px; padding: 5px 11px; border-radius: 20px; color: var(--muted);">${rel}</span>
                        `).join('')}
                      </div>
                    `).join('')
                  ) : (
                    listEmos.slice(0, 3).map(emo => `
                      <div class="cluster-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                        <span class="tag" style="background: var(--terracotta-bg); color: var(--terracotta-text); font-size: 12.5px; padding: 5px 11px; border-radius: 20px;">${emo.word} →</span>
                        <span class="related" style="background: #fff; border: 1px solid var(--border); font-size: 12.5px; padding: 5px 11px; border-radius: 20px; color: var(--muted);">${emo.normalized_word}</span>
                      </div>
                    `).join('')
                  )}
                </div>
                ${data.analytical_block ? `
                  <div class="cluster-note" style="font-size: 13.5px; line-height: 1.6; margin-top: 12px; color: var(--ink);">
                    Theme: ${data.analytical_block.primary_theme}. Emotional register: ${data.analytical_block.emotional_tone}.
                  </div>
                ` : ''}

                <div class="dv"></div>
                <div class="lbl">How the week moved</div>
                <div class="rpt-bars-container">
                  ${[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                    const h = lengths[dayIdx] || 0;
                    return `
                      <div class="rpt-bar-wrapper">
                        ${h > 0 ? `<div class="rpt-bar-element" style="height: ${h}%; width: 100%; background: var(--sage); border-radius: 3px 3px 0 0;"></div>` : `<div class="rpt-bar-element empty" style="width: 100%;"></div>`}
                        <span class="rpt-bar-label">D${dayIdx + 1}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
                <div class="arc-note" style="margin-top: 10px;">${data.writing_behaviour?.consistency || 'Writing patterns logged consistently.'}</div>
              </div>
              <div>
                <div class="lbl">What we saw</div>
                <div class="ws">
                  ${sawText}
                </div>
                ${realizationText ? `
                  <div class="yt">
                    ${realizationText}
                  </div>
                ` : ''}
                <div class="why-hedge" style="margin-top: 12px;">Based on ${stats.entries_completed || 0} of 7 entries this week.</div>
              </div>
            </div>
            ${data.crisis_review ? `
              <div class="status-bar">
                ${data.crisis_review.occurred ? `<span style="color: #8a3020; font-weight: 600;">⚠️ Alert: ${data.crisis_review.summary}</span>` : 'No crisis indicators were detected this week.'}
              </div>
            ` : ''}
            <div class="cb" style="margin-top: 24px;">
              <div class="cq">"${data.candidate_quote || 'Reflecting on your logs helps align focus.'}"</div>
              <div class="carry-label">Carry Question</div>
              <div class="co">${reportData.open_question || data.carry_question}</div>
            </div>
          </div>
        </div>
      `;
    } else {
      const cycleObj = cycles.find(c => c.id === selectedCycleId) || {};
      const isJsonReport = reportData.report_text && reportData.report_text.startsWith('{');
      let parsedReport = null;
      if (isJsonReport) {
        try {
          parsedReport = JSON.parse(reportData.report_text);
        } catch (e) {
          console.error(e);
        }
      }

      if (isJsonReport && parsedReport) {
        const whatShowed = parsedReport.whatThisCycleShowed || {
          openingObs: `Cycle ${parsedReport.cycleNumber || 1} completed with ${parsedReport.stats?.entriesCount || 0} entries written.`,
          pulledQuote: 'Taking time each day to reflect provides clarity.',
          narrative: 'Reflections recorded for this cycle.'
        };
        const patterns = Array.isArray(parsedReport.patterns) ? parsedReport.patterns : [];
        const recurringThemes = Array.isArray(parsedReport.recurringThemes) ? parsedReport.recurringThemes : [];
        const wordsReachedFor = parsedReport.wordsReachedFor || { analysisNote: '', unusedWords: [] };
        const fourThingsWeTracked = Array.isArray(parsedReport.fourThingsWeTracked) && parsedReport.fourThingsWeTracked.length === 4
          ? parsedReport.fourThingsWeTracked
          : [
              { label: "How stuck the patterns were", color: "#E0A898", title: "Pattern persistence", desc: "Analysis of pattern rigidity based on entries." },
              { label: "How intense things felt", color: "#B8A8D4", title: "Emotional intensity", desc: "Analysis of emotional variance and intensity based on entries." },
              { label: "How much you felt in control", color: "#8DBFB4", title: "Self-agency", desc: "Analysis of agency vs reactivity/situational framing in entries." },
              { label: "Which direction things moved", color: "#8DBFB4", title: "Overall stability", desc: "Analysis of overall emotional stability/direction and shift across the cycle." }
            ];
        const peopleWhoShowedUp = Array.isArray(parsedReport.peopleWhoShowedUp) ? parsedReport.peopleWhoShowedUp : [];
        const saidVsShowed = parsedReport.saidVsShowed || { said: [], showed: [], analysisNote: '' };
        const exercises = parsedReport.exercises || { collectiveInsight: 'Completed cycle reframing tasks.', items: [] };
        const whereLeavesYou = parsedReport.whereLeavesYou || { title: `Cycle ${parsedReport.cycleNumber || 1} Complete`, body: 'Cycle reflections complete.' };
        const closingQuote = parsedReport.closingQuote || { quote: 'Consistent daily practice supports emotional grounding.', observation: '' };
        const chartData = parsedReport.chartData || { arcChart: { writtenDays: [], skippedDays: [] }, radarChart: {} };
        const stats = parsedReport.stats || {
          entriesCount: 0,
          totalDays: 30,
          daysSkipped: 0,
          mostUsedWord: 'reflection',
          mostUsedWordFreq: 0,
          mostUsedWordContext: '',
          exercisesCompletedCount: 0,
          totalExercisesCount: 4,
          missedExercisesText: ''
        };

        printWindow.document.write(`
          <html>
            <head>
              <title>Ingress Within — Cycle ${parsedReport.cycleNumber || 1} Monthly Report</title>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
              <style>
                :root {
                  --teal-black:#1E2A2E;
                  --mint-grey:#ECEFF0;
                  --terracotta-rose:#E0A898;
                  --ocean-sage:#8DBFB4;
                  --soft-iris:#B8A8D4;
                  --border-tertiary: rgba(30,42,46,0.12);
                  --bg-secondary: #F5F6F6;
                  --text-secondary: rgba(30,42,46,0.6);
                }
                body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; background: #fff; padding: 40px; color: var(--teal-black); }
                .report { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid var(--border-tertiary); border-radius: 16px; overflow: hidden; }
                .hdr { background: var(--teal-black); padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
                .hdr-l { display: flex; align-items: center; gap: 10px; }
                .logo { font-size: 14px; font-weight: 500; color: #ECEFF0; }
                .logo span { color: var(--ocean-sage); }
                .hdiv { width: 1px; height: 14px; background: rgba(236,239,240,0.2); }
                .htag { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--ocean-sage); font-weight: 500; }
                .hdate { font-size: 12px; color: rgba(236,239,240,0.4); }
                .body { padding: 24px; text-align: left; }
                .sec { margin-bottom: 28px; }
                .sec-label { font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--ocean-sage); margin-bottom: 12px; }
                .divider { height: 1px; background: var(--border-tertiary); margin: 24px 0; }
                .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid var(--border-tertiary); border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
                .stat { padding: 12px 16px; border-right: 1px solid var(--border-tertiary); }
                .stat:last-child { border-right: none; }
                .stat-lbl { font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px; }
                .stat-val { font-size: 26px; font-weight: 400; color: var(--teal-black); line-height: 1.1; }
                .stat-val sup { font-size: 13px; color: var(--text-secondary); }
                .stat-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
                .stat-word { font-size: 20px; font-weight: 400; color: var(--terracotta-rose); font-style: italic; }
                .opening { font-size: 21px; font-weight: 400; line-height: 1.55; color: var(--teal-black); margin-bottom: 12px; }
                .pulled-quote { display: flex; align-items: baseline; gap: 10px; padding: 10px 14px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 14px; }
                .pq-lbl { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--ocean-sage); font-weight: 500; white-space: nowrap; flex-shrink: 0; }
                .pq-text { font-size: 13px; font-style: italic; color: var(--text-secondary); line-height: 1.5; }
                .narr { font-size: 13px; line-height: 1.75; color: var(--text-secondary); }
                .pattern-hero { border: 1px solid var(--border-tertiary); border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
                .ph-top { padding: 13px 16px; border-bottom: 1px solid var(--border-tertiary); display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
                .ph-label { font-size: 17px; font-weight: 500; color: var(--teal-black); }
                .ph-tag { font-size: 10px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; padding: 3px 8px; border-radius: 20px; }
                .tag-red { background: #FDF0ED; color: #C27A68; }
                .tag-purple { background: #F5F3F8; color: #7B6B9A; }
                .tag-teal { background: #EDF5F4; color: #4A7F78; }
                .ph-body { padding: 13px 16px; display: grid; grid-template-columns: 1fr 200px; gap: 20px; align-items: start; }
                .ph-mechanic { font-size: 13px; line-height: 1.75; color: var(--text-secondary); margin-bottom: 10px; }
                .ph-cost { padding: 10px 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 12px; line-height: 1.65; color: var(--text-secondary); }
                .ph-cost-lbl { font-size: 9px; font-weight: 500; letter-spacing: .09em; text-transform: uppercase; color: var(--ocean-sage); margin-bottom: 4px; }
                .loop-wrap { display: flex; align-items: center; justify-content: center; }
                .theme-card { border: 1px solid var(--border-tertiary); border-radius: 8px; overflow: hidden; margin-bottom: 8px; }
                .theme-top { padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-tertiary); }
                .theme-name { font-size: 13px; font-weight: 500; color: var(--teal-black); }
                .theme-freq { font-size: 11px; color: var(--text-secondary); }
                .theme-bar-wrap { height: 3px; background: var(--bg-secondary); }
                .theme-bar { height: 100%; }
                .theme-text { padding: 10px 12px; font-size: 12px; line-height: 1.7; color: var(--text-secondary); }
                .theme-contra { margin: 0 12px 10px; padding: 8px 10px; background: #FDF0ED; border-left: 2px solid var(--terracotta-rose); font-size: 11px; line-height: 1.5; color: var(--teal-black); }
                .contra-lbl { font-size: 9px; letter-spacing: .08em; text-transform: uppercase; font-weight: 500; color: #C27A68; margin-bottom: 2px; }
                .cluster-exp { font-size: 12px; color: var(--text-secondary); line-height: 1.5; padding: 8px 10px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 10px; }
                .cluster-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
                .word-used { background: var(--terracotta-rose); color: #7A3A28; font-size: 12px; padding: 3px 8px; border-radius: 20px; font-weight: 500; }
                .word-unused { border: 1px solid var(--border-tertiary); font-size: 12px; padding: 3px 8px; border-radius: 20px; color: var(--text-secondary); }
                .cluster-note { margin-top: 8px; padding: 8px 10px; background: #F5F3F8; border-left: 2px solid var(--soft-iris); font-size: 12px; font-style: italic; line-height: 1.6; color: var(--text-secondary); }
                .dim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
                .dim-desc { display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
                .dim-item { padding: 8px 10px; border-left: 2px solid; }
                .dim-item-name { font-size: 11px; font-weight: 500; color: var(--teal-black); margin-bottom: 2px; }
                .dim-item-text { font-size: 11px; color: var(--text-secondary); line-height: 1.5; }
                .rel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border-tertiary); border-radius: 8px; overflow: hidden; }
                .rel-cell { background: #fff; padding: 10px 12px; }
                .rel-name { font-size: 12px; font-weight: 500; color: var(--teal-black); margin-bottom: 2px; }
                .rel-freq { font-size: 10px; color: var(--ocean-sage); margin-bottom: 4px; }
                .rel-text { font-size: 11px; line-height: 1.6; color: var(--text-secondary); }
                .gap-visual { display: grid; grid-template-columns: 1fr 24px 1fr; margin-bottom: 8px; }
                .gap-col { display: flex; flex-direction: column; gap: 1px; }
                .gap-header { padding: 8px 10px; text-align: center; font-size: 10px; font-weight: 500; letter-spacing: .07em; text-transform: uppercase; }
                .gap-said-h { background: #F5F3F8; color: var(--soft-iris); border-radius: 8px 8px 0 0; }
                .gap-show-h { background: #FDF0ED; color: #C27A68; border-radius: 8px 8px 0 0; }
                .gap-item { padding: 8px 10px; font-size: 12px; line-height: 1.6; color: var(--text-secondary); border: 1px solid var(--border-tertiary); border-top: none; }
                .gap-middle { display: flex; flex-direction: column; justify-content: space-around; align-items: center; padding: 32px 0 0; }
                .gap-note { padding: 8px 12px; background: #FDF0ED; border-left: 2px solid var(--terracotta-rose); font-size: 12px; line-height: 1.6; color: var(--text-secondary); margin-top: 8px; }
                .ex-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
                .dots { display: flex; gap: 6px; }
                .dot { width: 10px; height: 10px; border-radius: 50%; }
                .dot-done { background: var(--ocean-sage); }
                .dot-skip { background: var(--bg-secondary); border: 1px solid var(--border-tertiary); }
                .completion-text { font-size: 13px; color: var(--text-secondary); }
                .completion-text strong { color: var(--teal-black); }
                .ex-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
                .ex-row-card { border: 1px solid var(--border-tertiary); border-radius: 8px; overflow: hidden; }
                .ex-row-top { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; border-bottom: 1px solid var(--border-tertiary); background: var(--bg-secondary); }
                .ex-name { font-size: 12px; font-weight: 500; color: var(--teal-black); }
                .ex-day { font-size: 11px; color: var(--text-secondary); }
                .ex-cols { display: grid; grid-template-columns: 1fr 1px 1fr; }
                .ex-col { padding: 10px 14px; }
                .ex-col-lbl { font-size: 9px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 4px; }
                .lbl-e { color: var(--soft-iris); }
                .lbl-x { color: var(--terracotta-rose); }
                .ex-col-text { font-size: 12px; line-height: 1.6; color: var(--text-secondary); }
                .ex-col-sep { background: var(--border-tertiary); }
                .ex-skip-row { border: 1px solid var(--border-tertiary); border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; opacity: 0.35; }
                .ex-skip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border-tertiary); }
                .ex-skip-text { font-size: 12px; color: var(--text-secondary); }
                .collective { background: var(--teal-black); border-radius: 8px; padding: 14px 16px; }
                .collective-lbl { font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: var(--ocean-sage); font-weight: 500; margin-bottom: 6px; }
                .collective-text { font-size: 13px; line-height: 1.7; color: rgba(236,239,240,0.7); }
                .triage { border: 1px solid rgba(184,168,212,0.4); border-radius: 8px; padding: 16px 18px; }
                .triage-lbl { font-size: 10px; letter-spacing: .09em; text-transform: uppercase; font-weight: 500; color: var(--soft-iris); margin-bottom: 6px; }
                .triage-body { font-size: 13px; line-height: 1.75; color: var(--text-secondary); }
                .closing { background: var(--teal-black); padding: 24px; }
                .closing-quote { font-size: 22px; font-style: italic; color: var(--terracotta-rose); line-height: 1.5; margin-bottom: 10px; }
                .closing-obs { font-size: 13px; color: rgba(236,239,240,0.5); line-height: 1.7; }
                .foot { display: none !important; }
                @media print {
                  body { padding: 0; background: #fff; }
                  .report { border: none; border-radius: 0; box-shadow: none; max-width: 100%; }
                  .hdr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .ph-tag { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .closing { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .divider { background: var(--border-tertiary) !important; }
                  rect { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <div class="report">
                <!-- 1. Header -->
                <div class="hdr">
                  <div class="hdr-l">
                    <div class="logo">ingress <span>within</span></div>
                    <div class="hdiv"></div>
                    <div class="htag">Cycle ${parsedReport.cycleNumber || 1} — Monthly Report</div>
                  </div>
                  <div class="hdate">${parsedReport.startDate || 'Day 1'} – ${parsedReport.endDate || 'Day 30'}</div>
                </div>
                <div class="body">
                  <!-- 2. Overview Statistics -->
                  <div class="stats">
                    <div class="stat">
                      <div class="stat-lbl">Entries written</div>
                      <div class="stat-val">${stats.entriesCount}<sup>/${stats.totalDays}</sup></div>
                      <div class="stat-sub">${stats.daysSkipped} day${stats.daysSkipped > 1 ? 's' : ''} skipped</div>
                    </div>
                    <div class="stat">
                      <div class="stat-lbl">Most used word</div>
                      <div class="stat-word">"${stats.mostUsedWord}"</div>
                      <div class="stat-sub">${stats.mostUsedWordContext}</div>
                    </div>
                    <div class="stat">
                      <div class="stat-lbl">Exercises completed</div>
                      <div class="stat-val">${stats.exercisesCompletedCount}<sup>/${stats.totalExercisesCount}</sup></div>
                      <div class="stat-sub">${stats.missedExercisesText}</div>
                    </div>
                  </div>

                  <!-- 3. How the Month Moved -->
                  <div class="sec">
                    <div class="sec-label">How the month moved</div>
                    <div style="position: relative; width: 100%; height: 120px; margin-bottom: 6px;">
                      <canvas id="arcChart"></canvas>
                    </div>
                    <div style="display: flex; gap: 16px;">
                      <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
                        <div style="width: 20px; height: 2px; background: var(--terracotta-rose); border-radius: 1px;"></div>
                        entry written
                      </div>
                      <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--bg-secondary); border: 1px solid var(--border-tertiary);"></div>
                        day skipped
                      </div>
                    </div>
                  </div>

                  <div class="divider"></div>

                  <!-- 4. What This Cycle Showed -->
                  <div class="sec">
                    <div class="sec-label">What this cycle showed</div>
                    <div class="opening">${(whatShowed.openingObs || '').replace(/\n/g, '<br>')}</div>
                    <div class="pulled-quote">
                      <div class="pq-lbl">From your writing</div>
                      <div class="pq-text">"${whatShowed.pulledQuote || 'Taking time each day to reflect provides clarity.'}"</div>
                    </div>
                    <div class="narr">${whatShowed.narrative || ''}</div>
                  </div>

                  <div class="divider"></div>

                  <!-- 5. Patterns This Cycle Found In You -->
                  <div class="sec">
                    <div class="sec-label">Patterns this cycle found in you</div>
                    ${patterns.length > 0 ? patterns.map((pat, pIdx) => `
                      <div class="pattern-hero">
                        <div class="ph-top">
                          <div class="ph-label">${pat.name}</div>
                          <div class="ph-tag ${pat.tagClass || 'tag-red'}">${pat.tag}</div>
                        </div>
                        <div class="ph-body">
                          <div>
                            <div class="ph-mechanic">${pat.mechanism}</div>
                            <div class="ph-cost">
                              <div class="ph-cost-lbl">What this costs you</div>
                              ${pat.cost}
                            </div>
                          </div>
                          <div class="loop-wrap">
                            <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <marker id="a-marker-${pIdx}" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                                  <path d="M0,0.5 L5,3 L0,5.5 Z" fill="${pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'}" />
                                </marker>
                              </defs>
                              <rect x="4" y="4" width="68" height="34" rx="8" fill="${pat.tagClass === 'tag-red' ? 'rgba(224,168,152,0.15)' : pat.tagClass === 'tag-purple' ? 'rgba(184,168,212,0.15)' : 'rgba(141,191,180,0.15)'}" stroke="${pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'}" stroke-width="1.5" />
                              <text x="38" y="19" text-anchor="middle" font-size="${getFontSize(pat.loopNodes?.[0]?.title)}" font-weight="700" fill="${pat.tagClass === 'tag-red' ? '#C27A68' : pat.tagClass === 'tag-purple' ? '#7B6B9A' : '#4A7F78'}">${pat.loopNodes?.[0]?.title || ''}</text>
                              <text x="38" y="32" text-anchor="middle" font-size="${getSubFontSize(pat.loopNodes?.[0]?.sub)}" fill="${pat.tagClass === 'tag-red' ? '#C27A68' : pat.tagClass === 'tag-purple' ? '#7B6B9A' : '#4A7F78'}" opacity="0.8">${pat.loopNodes?.[0]?.sub || ''}</text>

                              <rect x="88" y="4" width="68" height="34" rx="8" fill="var(--bg-secondary)" stroke="var(--border-tertiary)" stroke-width="1" />
                              <text x="122" y="19" text-anchor="middle" font-size="${getFontSize(pat.loopNodes?.[1]?.title)}" font-weight="600" fill="var(--teal-black)">${pat.loopNodes?.[1]?.title || ''}</text>
                              <text x="122" y="32" text-anchor="middle" font-size="${getSubFontSize(pat.loopNodes?.[1]?.sub)}" fill="var(--text-secondary)">${pat.loopNodes?.[1]?.sub || ''}</text>

                              <rect x="88" y="142" width="68" height="34" rx="8" fill="var(--bg-secondary)" stroke="var(--border-tertiary)" stroke-width="1" />
                              <text x="122" y="157" text-anchor="middle" font-size="${getFontSize(pat.loopNodes?.[2]?.title)}" font-weight="600" fill="var(--teal-black)">${pat.loopNodes?.[2]?.title || ''}</text>
                              <text x="122" y="170" text-anchor="middle" font-size="${getSubFontSize(pat.loopNodes?.[2]?.sub)}" fill="var(--text-secondary)">${pat.loopNodes?.[2]?.sub || ''}</text>

                              <rect x="4" y="142" width="68" height="34" rx="8" fill="var(--bg-secondary)" stroke="var(--border-tertiary)" stroke-width="1" />
                              <text x="38" y="157" text-anchor="middle" font-size="${getFontSize(pat.loopNodes?.[3]?.title)}" font-weight="600" fill="var(--teal-black)">${pat.loopNodes?.[3]?.title || ''}</text>
                              <text x="38" y="170" text-anchor="middle" font-size="${getSubFontSize(pat.loopNodes?.[3]?.sub)}" fill="var(--text-secondary)">${pat.loopNodes?.[3]?.sub || ''}</text>

                              <path d="M72,21 L88,21" fill="none" stroke="${pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'}" stroke-width="1.5" stroke-opacity="0.7" marker-end="url(#a-marker-${pIdx})" />
                              <path d="M122,38 L122,142" fill="none" stroke="${pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'}" stroke-width="1.5" stroke-opacity="0.5" marker-end="url(#a-marker-${pIdx})" />
                              <path d="M88,159 L72,159" fill="none" stroke="${pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'}" stroke-width="1.5" stroke-opacity="0.4" marker-end="url(#a-marker-${pIdx})" />
                              <path d="M38,142 L38,38" fill="none" stroke="${pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'}" stroke-width="1.5" stroke-opacity="0.3" marker-end="url(#a-marker-${pIdx})" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    `).join('') : '<div style="font-size:12px;color:var(--text-secondary);padding:10px;text-align:center;">No repetitive patterns recorded for this cycle.</div>'}
                  </div>

                  <div class="divider"></div>

                  <!-- 6. What Kept Coming Up -->
                  <div class="sec">
                    <div class="sec-label">What kept coming up</div>
                    ${recurringThemes.length > 0 ? recurringThemes.map(theme => `
                      <div class="theme-card">
                        <div class="theme-top">
                          <div class="theme-name">${theme.name}</div>
                          <div class="theme-freq">${theme.frequencyText}</div>
                        </div>
                        <div class="theme-bar-wrap">
                          <div class="theme-bar" style="width: ${theme.percentage}%; background: ${theme.color || '#E0A898'};"></div>
                        </div>
                        <div class="theme-text">${theme.description}</div>
                        ${theme.contraInsight ? `
                          <div class="theme-contra">
                            <div class="contra-lbl">What entries and exercises showed together</div>
                            ${theme.contraInsight}
                          </div>
                        ` : ''}
                      </div>
                    `).join('') : '<div style="font-size:12px;color:var(--text-secondary);padding:10px;text-align:center;">No recurring themes reached significance this cycle.</div>'}
                  </div>

                  <div class="divider"></div>

                  <!-- 7. Words You Reached For -->
                  <div class="sec">
                    <div class="sec-label">Words you reached for</div>
                    <div class="cluster-exp">Words from your writing this month, with related words you didn't use.</div>
                    ${(wordsReachedFor.unusedWords || []).map(item => `
                      <div class="cluster-row">
                        <span class="word-used">${item.word}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">→</span>
                        ${(item.synonyms || []).map(syn => `<span class="word-unused">${syn}</span>`).join('')}
                      </div>
                    `).join('')}
                    <div class="cluster-note">${wordsReachedFor.analysisNote || ''}</div>
                  </div>

                  <div class="divider"></div>

                  <!-- 8. Four Things We Tracked -->
                  <div class="sec">
                    <div class="sec-label">Four things we tracked</div>
                    <div class="dim-grid">
                      <div style="position: relative; height: 220px;">
                        <canvas id="radarChart"></canvas>
                      </div>
                      <div class="dim-desc">
                        ${fourThingsWeTracked.map((dim, idx) => `
                          <div class="dim-item" style="border-color: ${dim.color || '#E0A898'};${idx === 3 ? ' opacity: 0.6;' : ''}">
                            <div class="dim-item-name">${dim.label}</div>
                            <div class="dim-item-text">${dim.desc}</div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </div>

                  <div class="divider"></div>

                  <!-- 9. People Who Showed Up -->
                  <div class="sec">
                    <div class="sec-label">People who showed up in your writing</div>
                    <div class="rel-grid">
                      ${peopleWhoShowedUp.length > 0 ? peopleWhoShowedUp.map(person => `
                        <div class="rel-cell">
                          <div class="rel-name">${person.name}</div>
                          <div class="rel-freq">${person.frequency}</div>
                          <div class="rel-text">${person.description}</div>
                        </div>
                      `).join('') : '<div class="rel-cell" style="grid-column: span 2; text-align: center; color: var(--text-secondary); font-size: 11px;">No specific individual mentions recorded.</div>'}
                    </div>
                  </div>

                  <div class="divider"></div>

                  <!-- 10. What You Said vs What Your Writing Showed -->
                  <div class="sec">
                    <div class="sec-label">What you said vs what your writing showed</div>
                    <div class="gap-visual">
                      <div class="gap-col">
                        <div class="gap-header gap-said-h">What you said about yourself</div>
                        ${(saidVsShowed.said || []).map(item => `
                          <div class="gap-item">"${item}"</div>
                        `).join('')}
                      </div>
                      <div class="gap-middle">
                        ${(saidVsShowed.said || []).map(() => `
                          <div style="font-size: 14px; color: var(--text-secondary); opacity: 0.3;">→</div>
                        `).join('')}
                      </div>
                      <div class="gap-col">
                        <div class="gap-header gap-show-h">What your writing showed</div>
                        ${(saidVsShowed.showed || []).map(item => `
                          <div class="gap-item">${item}</div>
                        `).join('')}
                      </div>
                    </div>
                    <div class="gap-note">${saidVsShowed.analysisNote || ''}</div>
                  </div>

                <div class="divider"></div>

                <!-- 11. Exercises -->
                <div class="sec">
                  <div class="sec-label">What the exercises showed</div>
                  <div class="ex-top">
                    <div class="dots">
                      ${Array.from({ length: Math.max(3, stats.totalExercisesCount || 4) }).map((_, i) => `
                        <div class="dot ${i < (stats.exercisesCompletedCount || 0) ? 'dot-done' : 'dot-skip'}"></div>
                      `).join('')}
                    </div>
                    <div class="completion-text">
                      <strong>${stats.exercisesCompletedCount} of ${stats.totalExercisesCount}</strong> completed this cycle
                    </div>
                  </div>

                  <div class="ex-list">
                    <!-- Core Values / Baseline Assessment -->
                    ${(() => {
                      const cbtEx = parsedReport.exercises?.items?.find(item =>
                        item.name?.toLowerCase().includes('core values') ||
                        item.name?.toLowerCase().includes('baseline') ||
                        item.id === 'exercise_0' ||
                        item.dayText?.includes('1') ||
                        item.dayText?.includes('4')
                      );
                      if (cbtEx) {
                        return `
                          <div class="ex-row-card">
                            <div class="ex-row-top">
                              <div class="ex-name">${cbtEx.name || 'Core Values & Baseline Assessment'}</div>
                              <div class="ex-day">${cbtEx.dayText || 'Day 1'}</div>
                            </div>
                            <div class="ex-cols">
                              <div class="ex-col">
                                <div class="ex-col-lbl lbl-e">Entries said</div>
                                <div class="ex-col-text">${cbtEx.entriesSaid}</div>
                              </div>
                              <div class="ex-col-sep"></div>
                              <div class="ex-col">
                                <div class="ex-col-lbl lbl-x">Exercise showed</div>
                                <div class="ex-col-text">${cbtEx.exerciseShowed}</div>
                              </div>
                            </div>
                          </div>
                        `;
                      } else {
                        return `
                          <div class="ex-skip-row">
                            <div class="ex-skip-dot"></div>
                            <div class="ex-skip-text">Baseline / Core Values Assessment — not completed this cycle.</div>
                          </div>
                        `;
                      }
                    })()}

                    <!-- Emotional Vocabulary Wheel -->
                    ${(() => {
                      const cbtEx = parsedReport.exercises?.items?.find(item =>
                        item.name?.toLowerCase().includes('vocabulary') ||
                        item.name?.toLowerCase().includes('word association') ||
                        item.id === 'exercise_1' ||
                        item.dayText?.includes('9') ||
                        item.dayText?.includes('10')
                      );
                      if (cbtEx) {
                        return `
                          <div class="ex-row-card">
                            <div class="ex-row-top">
                              <div class="ex-name">${cbtEx.name || 'Emotional Vocabulary Wheel'}</div>
                              <div class="ex-day">${cbtEx.dayText || 'Day 10'}</div>
                            </div>
                            <div class="ex-cols">
                              <div class="ex-col">
                                <div class="ex-col-lbl lbl-e">Entries said</div>
                                <div class="ex-col-text">${cbtEx.entriesSaid}</div>
                              </div>
                              <div class="ex-col-sep"></div>
                              <div class="ex-col">
                                <div class="ex-col-lbl lbl-x">Exercise showed</div>
                                <div class="ex-col-text">${cbtEx.exerciseShowed}</div>
                              </div>
                            </div>
                          </div>
                        `;
                      } else {
                        return `
                          <div class="ex-skip-row">
                            <div class="ex-skip-dot"></div>
                            <div class="ex-skip-text">Emotional Vocabulary Wheel — not completed this cycle.</div>
                          </div>
                        `;
                      }
                    })()}

                    <!-- Self-Perception Check -->
                    ${(() => {
                      const cbtEx = parsedReport.exercises?.items?.find(item =>
                        item.name?.toLowerCase().includes('self-perception') ||
                        item.name?.toLowerCase().includes('self perception') ||
                        item.id === 'exercise_3' ||
                        item.dayText?.includes('14') ||
                        item.dayText?.includes('24') ||
                        item.dayText?.includes('28')
                      );
                      if (cbtEx) {
                        return `
                          <div class="ex-row-card">
                            <div class="ex-row-top">
                              <div class="ex-name">${cbtEx.name || 'Self-Perception Check'}</div>
                              <div class="ex-day">${cbtEx.dayText || 'Day 24'}</div>
                            </div>
                            <div class="ex-cols">
                              <div class="ex-col">
                                <div class="ex-col-lbl lbl-e">Entries said</div>
                                <div class="ex-col-text">${cbtEx.entriesSaid}</div>
                              </div>
                              <div class="ex-col-sep"></div>
                              <div class="ex-col">
                                <div class="ex-col-lbl lbl-x">Exercise showed</div>
                                <div class="ex-col-text">${cbtEx.exerciseShowed}</div>
                              </div>
                            </div>
                          </div>
                        `;
                      } else {
                        return `
                          <div class="ex-skip-row">
                            <div class="ex-skip-dot"></div>
                            <div class="ex-skip-text">Self-Perception Check — not completed this cycle.</div>
                          </div>
                        `;
                      }
                    })()}

                    <!-- Additional completed exercises -->
                    ${(() => {
                      const ex1 = parsedReport.exercises?.items?.find(item =>
                        item.name?.toLowerCase().includes('core values') ||
                        item.name?.toLowerCase().includes('baseline') ||
                        item.id === 'exercise_0' ||
                        item.dayText?.includes('1') ||
                        item.dayText?.includes('4')
                      );
                      const ex2 = parsedReport.exercises?.items?.find(item =>
                        item.name?.toLowerCase().includes('vocabulary') ||
                        item.name?.toLowerCase().includes('word association') ||
                        item.id === 'exercise_1' ||
                        item.dayText?.includes('9') ||
                        item.dayText?.includes('10')
                      );
                      const ex3 = parsedReport.exercises?.items?.find(item =>
                        item.name?.toLowerCase().includes('self-perception') ||
                        item.name?.toLowerCase().includes('self perception') ||
                        item.id === 'exercise_3' ||
                        item.dayText?.includes('14') ||
                        item.dayText?.includes('24') ||
                        item.dayText?.includes('28')
                      );
                      const matched = new Set([ex1, ex2, ex3].filter(Boolean));
                      const others = (parsedReport.exercises?.items || []).filter(item => !matched.has(item));
                      if (!others.length) return '';
                      return others.map(item => `
                        <div class="ex-row-card">
                          <div class="ex-row-top">
                            <div class="ex-name">${item.name}</div>
                            <div class="ex-day">${item.dayText || 'Completed'}</div>
                          </div>
                          <div class="ex-cols">
                            <div class="ex-col">
                              <div class="ex-col-lbl lbl-e">Entries said</div>
                              <div class="ex-col-text">${item.entriesSaid || 'Reflective journaling entry recorded.'}</div>
                            </div>
                            <div class="ex-col-sep"></div>
                            <div class="ex-col">
                              <div class="ex-col-lbl lbl-x">Exercise showed</div>
                              <div class="ex-col-text">${item.exerciseShowed || 'Pattern analysis completed.'}</div>
                            </div>
                          </div>
                        </div>
                      `).join('');
                    })()}
                  </div>

                  <div class="collective">
                    <div class="collective-lbl">What the exercises showed together</div>
                    <div class="collective-text">${exercises.collectiveInsight || 'Completed cycle reframing tasks.'}</div>
                  </div>
                </div>

                <div class="divider"></div>

                <!-- 12. Where This Cycle Leaves You -->
                <div class="sec">
                  <div class="sec-label">Where this cycle leaves you</div>
                  <div class="triage">
                    <div class="triage-lbl">${whereLeavesYou.title || 'Cycle complete'}</div>
                    <div class="triage-body">${(whereLeavesYou.body || '').replace(/\n\n/g, '<br><br>')}</div>
                  </div>
                </div>
              </div>

              <!-- 13. Closing Quote -->
              <div class="closing">
                <div class="closing-quote">"${closingQuote.quote || ''}"</div>
                <div class="closing-obs">${closingQuote.observation || ''}</div>
              </div>
            </div>

            <script>
              window.onload = function() {
                // Initialize line chart
                new Chart(document.getElementById('arcChart'), {
                  type: 'line',
                  data: {
                    labels: Array.from({ length: ${stats.totalDays || 30} }, (_, i) => i + 1),
                    datasets: [
                      {
                        data: ${JSON.stringify(chartData.arcChart?.writtenDays || Array(stats.totalDays || 30).fill(null))},
                        borderColor: '#E0A898',
                        backgroundColor: 'rgba(224,168,152,0.06)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true,
                        spanGaps: false
                      },
                      {
                        data: ${JSON.stringify(chartData.arcChart?.skippedDays || Array(stats.totalDays || 30).fill(null))},
                        borderColor: 'transparent',
                        backgroundColor: 'transparent',
                        pointBackgroundColor: '#F5F6F6',
                        pointBorderColor: 'rgba(30,42,46,0.12)',
                        pointBorderWidth: 1,
                        pointRadius: 5,
                        showLine: false
                      }
                    ]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: 'rgba(30,42,46,0.35)', maxTicksLimit: 8 } },
                      y: { display: false, min: 0, max: 12 }
                    }
                  }
                });

                // Initialize radar chart
                new Chart(document.getElementById('radarChart'), {
                  type: 'radar',
                  data: {
                    labels: ['', '', '', ''],
                    datasets: [
                      {
                        data: [
                          ${chartData.radarChart?.patternPersistence ?? 50},
                          ${chartData.radarChart?.emotionalIntensity ?? 50},
                          ${chartData.radarChart?.agency ?? 50},
                          ${chartData.radarChart?.overallDirection ?? 50}
                        ],
                        backgroundColor: 'rgba(224,168,152,0.04)',
                        borderColor: 'rgba(30,42,46,0.3)',
                        borderWidth: 1.5,
                        pointBackgroundColor: ['#E0A898', '#B8A8D4', '#8DBFB4', 'rgba(141,191,180,0.45)'],
                        pointBorderColor: ['#E0A898', '#B8A8D4', '#8DBFB4', 'rgba(141,191,180,0.45)'],
                        pointRadius: 6
                      }
                    ]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: {
                      r: {
                        min: 0,
                        max: 100,
                        ticks: { display: false },
                        grid: { color: 'rgba(30,42,46,0.06)' },
                        angleLines: {
                          color: [
                            'rgba(224,168,152,0.5)',
                            'rgba(184,168,212,0.5)',
                            'rgba(141,191,180,0.5)',
                            'rgba(141,191,180,0.25)'
                          ],
                          lineWidth: 1.5
                        },
                        pointLabels: { display: false }
                      }
                    }
                  }
                });

                // Trigger print
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Ingress Within - Report</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
          <style>
            :root {
              --navy: #011627;
              --sage: #8AA688;
              --sage-dark: #283D38;
              --bg: #F6F1EA;
              --border: rgba(40, 61, 56, 0.12);
              --terracotta-bg: rgba(121, 86, 99, 0.08);
              --terracotta-text: #795663;
              --ink: #011627;
              --muted: #4F635E;
              --cream: #FDFBF8;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; background: #fff; padding: 40px; color: var(--ink); }
            .rpt { max-width: 920px; margin: 0 auto; background: #fff; }
            .hdr { background: var(--navy); padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; border-radius: 10px 10px 0 0; }
            .hl { display: flex; align-items: center; gap: 10px; }
            .logo { font-size: 16px; font-weight: 600; color: #fff; }
            .logo span { color: var(--sage); }
            .wl { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--sage); font-weight: 500; margin-left: 14px; }
            .dr { font-size: 13px; color: #b9c0c7; }
            .body { padding: 30px 24px; border: 1px solid var(--border); border-top: none; border-radius: 0 0 10px 10px; }
            .sr { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid var(--border); border-radius: 10px; margin-bottom: 24px; overflow: hidden; }
            .sc { padding: 14px 16px; border-right: 1px solid var(--border); }
            .sc:last-child { border-right: none; }
            .sl { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
            .sv { font-size: 28px; font-weight: 600; color: var(--ink); line-height: 1.1; }
            .sv sup { font-size: 14px; font-weight: 400; color: var(--muted); }
            .ss { font-size: 12px; color: var(--muted); margin-top: 3px; }
            .sw { font-family: Georgia, serif; font-style: italic; font-size: 18px; color: var(--ink); }
            .st { font-size: 16px; font-weight: 600; color: var(--ink); line-height: 1.3; }
            .tc { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
            .lbl { font-size: 12px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; font-weight: 600; }
            .cx { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin-bottom: 12px; }
            .tag { background: var(--terracotta-bg); color: var(--terracotta-text); font-size: 12.5px; padding: 5px 11px; border-radius: 20px; font-weight: 500; }
            .related { background: #fff; border: 1px solid var(--border); font-size: 12.5px; padding: 5px 11px; border-radius: 20px; color: var(--muted); }
            .dv { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
            
            .since-last { border: 1px solid var(--border); border-radius: 10px; background: #fff; padding: 16px 22px; margin-bottom: 24px; }
            .since-last .eyrow { font-weight: 600; font-size: 11px; text-transform: uppercase; }
            .since-last p { font-size: 13.5px; color: var(--muted); margin: 6px 0 0; }

            .rpt-bars-container { display: flex; align-items: flex-end; justify-content: space-between; height: 70px; margin-top: 16px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid var(--border); }
            .rpt-bar-wrapper { display: flex; flex-direction: column; align-items: center; flex: 1; max-width: 38px; justify-content: flex-end; height: 100%; }
            .rpt-bar-element { width: 100%; background: var(--sage); border-radius: 3px 3px 0 0; }
            .rpt-bar-element.empty { background: var(--border); height: 3px !important; border-radius: 2px; }
            .rpt-bar-label { font-size: 10.5px; color: var(--muted); margin-top: 5px; }
            .arc-note { font-size: 12.5px; color: var(--muted); line-height: 1.5; }

            .ws { font-size: 14.5px; line-height: 1.7; color: var(--ink); margin-bottom: 16px; }
            .yt { font-size: 16px; font-weight: 600; line-height: 1.6; color: var(--navy); border-left: 3px solid #d98b6b; padding-left: 14px; margin-bottom: 14px; }
            .why-hedge { font-size: 12px; color: var(--muted); }

            .status-bar { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 13px 18px; font-size: 13px; color: var(--muted); text-align: center; margin-bottom: 24px; }

            .cb { background: var(--navy); border-radius: 12px; padding: 26px 28px; color: var(--cream); }
            .cq { font-family: Georgia, serif; font-style: italic; font-size: 17px; line-height: 1.6; margin-bottom: 16px; }
            .co { font-size: 14px; line-height: 1.7; color: #d9dee2; }
            .carry-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--sage); margin-bottom: 6px; font-weight: 600; }

            @media print {
              body { padding: 0; }
              .hdr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .tag { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .cb { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .rpt-bar-element { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .since-last { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --navy: #1c2733;
          --sage: #9db9a8;
          --sage-dark: #6b8b78;
          --bg: #fbfaf8;
          --border: #e7e3da;
          --terracotta-bg: #f2dccb;
          --terracotta-text: #9c5a2e;
          --ink: #22262b;
          --muted: #767c72;
          --cream: #f4efe4;
        }
        .rpt {
          max-width: 920px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(34,38,43,0.04);
        }
        .hdr {
          background: var(--navy);
          color: #fff;
          padding: 22px 32px;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .hl {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        .logo span {
          color: var(--sage);
          font-weight: 400;
        }
        .hdiv {
          width: 1px;
          height: 14px;
          background: rgba(236,239,240,0.2);
        }
        .wl {
          font-size: 12px;
          letter-spacing: 1.5px;
          color: var(--sage);
          margin-left: 14px;
          text-transform: uppercase;
          font-weight: 500;
        }
        .dr {
          font-size: 13px;
          color: #b9c0c7;
        }
        .body {
          padding: 30px 32px;
        }
        .sr {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border: 1px solid var(--border);
          border-radius: 10px;
          margin-bottom: 28px;
          overflow: hidden;
          background: #fff;
        }
        .sc {
          padding: 18px 22px;
          border-right: 1px solid var(--border);
        }
        .sc:last-child {
          border-right: none;
        }
        .sl {
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
          font-weight: 600;
        }
        .sv {
          font-size: 28px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.1;
        }
        .sv sup {
          font-size: 14px;
          font-weight: 400;
          color: var(--muted);
        }
        .ss {
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
        }
        .sw {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 18px;
          color: var(--ink);
        }
        .st {
          font-size: 16px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.3;
        }
        .tc {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 20px;
        }
        .lbl {
          font-size: 12px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 600;
          margin-bottom: 6px;
        }
        .cx {
          font-size: 12.5px;
          color: var(--muted);
          line-height: 1.5;
          margin-bottom: 14px;
        }
        .cr {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .wu {
          background: var(--terracotta-bg);
          color: var(--terracotta-text);
          font-size: 12.5px;
          padding: 5px 11px;
          border-radius: 20px;
          font-weight: 500;
        }
        .wn {
          background: #fff;
          border: 1px solid var(--border);
          font-size: 12.5px;
          padding: 5px 11px;
          border-radius: 20px;
          color: var(--muted);
        }
        .dv {
          border: none;
          border-top: 1px solid var(--border);
          margin: 20px 0;
        }
        .rpt-bars-container {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 70px;
          margin: 10px 0 6px;
        }
        .rpt-bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
        }
        .rpt-bar-element {
          width: 100%;
          background: var(--sage);
          border-radius: 3px 3px 0 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rpt-bar-element.empty {
          background: var(--border);
          height: 3px !important;
          border-radius: 2px;
        }
        .rpt-bar-label {
          font-size: 10.5px;
          color: var(--muted);
          margin-top: 5px;
        }
        .arc-note {
          font-size: 12.5px;
          color: var(--muted);
          line-height: 1.5;
        }
        .ws {
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--ink);
          margin-bottom: 16px;
        }
        .yl {
          display: none;
        }
        .yt {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.6;
          color: var(--navy);
          border-left: 3px solid #d98b6b;
          padding-left: 14px;
          margin-bottom: 14px;
          background: transparent;
          border-radius: 0;
          padding-top: 2px;
          padding-bottom: 2px;
        }
        .why-hedge {
          font-size: 12px;
          color: var(--muted);
        }
        .cb {
          background: var(--navy);
          border-radius: 12px;
          padding: 26px 28px;
          color: var(--cream);
        }
        .cq {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 17px;
          line-height: 1.6;
          color: var(--cream);
          margin-bottom: 16px;
        }
        .co {
          font-size: 14px;
          line-height: 1.7;
          color: #d9dee2;
        }
        .carry-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--sage);
          margin-bottom: 6px;
          font-weight: 600;
        }
        .since-last {
          border: 1px solid var(--border);
          border-radius: 10px;
          background: #fff;
          padding: 16px 22px;
          margin-bottom: 24px;
        }
        .since-last .eyebrow {
          color: var(--sage-dark);
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .since-last p {
          font-size: 13.5px;
          color: var(--muted);
          margin: 6px 0 0;
        }
        .status-bar {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 13px 18px;
          font-size: 13px;
          color: var(--muted);
          text-align: center;
          margin-bottom: 24px;
        }
        .foot {
          background: var(--navy);
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 24px -24px -24px;
        }
        .foot-link {
          font-size: 11px;
          color: var(--sage);
          text-decoration: none;
        }
        /* Cycle Report V1 Styles */
        :root {
          --teal-black:#1E2A2E;
          --mint-grey:#ECEFF0;
          --terracotta-rose:#E0A898;
          --ocean-sage:#8DBFB4;
          --soft-iris:#B8A8D4;
          --border-tertiary: rgba(30,42,46,0.12);
          --bg-secondary: #F5F6F6;
          --text-secondary: rgba(30,42,46,0.6);
        }
        .report {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid var(--border-tertiary);
          border-radius: 16px;
          overflow: hidden;
        }
        .report .hdr {
          background: var(--teal-black);
          padding: 14px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .report .hdr-l {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .report .logo {
          font-size: 14px;
          font-weight: 500;
          color: #ECEFF0;
        }
        .report .logo span {
          color: var(--ocean-sage);
        }
        .report .hdiv {
          width: 1px;
          height: 14px;
          background: rgba(236,239,240,0.2);
        }
        .report .htag {
          font-size: 11px;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ocean-sage);
          font-weight: 500;
        }
        .report .hdate {
          font-size: 12px;
          color: rgba(236,239,240,0.4);
        }
        .report .body {
          padding: 24px;
        }
        .report .sec {
          margin-bottom: 28px;
        }
        .report .sec-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ocean-sage);
          margin-bottom: 12px;
        }
        .report .divider {
          height: 1px;
          background: var(--border-tertiary);
          margin: 24px 0;
        }
        .report .stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border: 1px solid var(--border-tertiary);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .report .stat {
          padding: 12px 16px;
          border-right: 1px solid var(--border-tertiary);
        }
        .report .stat:last-child {
          border-right: none;
        }
        .report .stat-lbl {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .report .stat-val {
          font-size: 26px;
          font-weight: 400;
          color: var(--teal-black);
          line-height: 1.1;
        }
        .report .stat-val sup {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .report .stat-sub {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .report .stat-word {
          font-size: 20px;
          font-weight: 400;
          color: var(--terracotta-rose);
          font-style: italic;
        }
        .report .opening {
          font-size: 21px;
          font-weight: 400;
          line-height: 1.55;
          color: var(--teal-black);
          margin-bottom: 12px;
        }
        .report .opening em {
          font-style: italic;
          color: var(--soft-iris);
        }
        .report .pulled-quote {
          display: flex;
          align-items: baseline;
          gap: 10px;
          padding: 10px 14px;
          background: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 14px;
        }
        .report .pq-lbl {
          font-size: 10px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--ocean-sage);
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .report .pq-text {
          font-size: 13px;
          font-style: italic;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .report .narr {
          font-size: 13px;
          line-height: 1.75;
          color: var(--text-secondary);
        }
        .report .pattern-hero {
          border: 1px solid var(--border-tertiary);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .report .pattern-hero:last-child {
          margin-bottom: 0;
        }
        .report .ph-top {
          padding: 13px 16px;
          border-bottom: 1px solid var(--border-tertiary);
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        .report .ph-label {
          font-size: 17px;
          font-weight: 500;
          color: var(--teal-black);
          letter-spacing: -0.3px;
        }
        .report .ph-tag {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .report .tag-red {
          background: #FDF0ED;
          color: #C27A68;
        }
        .report .tag-purple {
          background: #F5F3F8;
          color: #7B6B9A;
        }
        .report .tag-teal {
          background: #EDF5F4;
          color: #4A7F78;
        }
        .report .ph-body {
          padding: 13px 16px;
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 20px;
          align-items: start;
        }
        .report .ph-mechanic {
          font-size: 13px;
          line-height: 1.75;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }
        .report .ph-cost {
          padding: 10px 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.65;
          color: var(--text-secondary);
        }
        .report .ph-cost-lbl {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: .09em;
          text-transform: uppercase;
          color: var(--ocean-sage);
          margin-bottom: 4px;
        }
        .report .loop-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .report .theme-card {
          border: 1px solid var(--border-tertiary);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .report .theme-card:last-child {
          margin-bottom: 0;
        }
        .report .theme-top {
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-tertiary);
          gap: 16px;
          flex-wrap: wrap;
        }
        .report .theme-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--teal-black);
        }
        .report .theme-freq {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .report .theme-bar-wrap {
          height: 3px;
          background: var(--bg-secondary);
        }
        .report .theme-bar {
          height: 100%;
        }
        .report .theme-text {
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.7;
          color: var(--text-secondary);
        }
        .report .theme-contra {
          margin: 0 12px 10px;
          padding: 8px 10px;
          background: #FDF0ED;
          border-left: 2px solid var(--terracotta-rose);
          font-size: 11px;
          line-height: 1.5;
          color: var(--teal-black);
        }
        .report .contra-lbl {
          font-size: 9px;
          letter-spacing: .08em;
          text-transform: uppercase;
          font-weight: 500;
          color: #C27A68;
          margin-bottom: 2px;
        }
        .report .cluster-exp {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          padding: 8px 10px;
          background: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .report .cluster-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .report .word-used {
          background: var(--terracotta-rose);
          color: #7A3A28;
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 20px;
          font-weight: 500;
        }
        .report .word-unused {
          border: 1px solid var(--border-tertiary);
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 20px;
          color: var(--text-secondary);
        }
        .report .cluster-note {
          margin-top: 8px;
          padding: 8px 10px;
          background: #F5F3F8;
          border-left: 2px solid var(--soft-iris);
          font-size: 12px;
          font-style: italic;
          line-height: 1.6;
          color: var(--text-secondary);
        }
        .report .dim-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
        }
        .report .dim-desc {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 4px;
        }
        .report .dim-item {
          padding: 8px 10px;
          border-left: 2px solid;
        }
        .report .dim-item-name {
          font-size: 11px;
          font-weight: 500;
          color: var(--teal-black);
          margin-bottom: 2px;
        }
        .report .dim-item-text {
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .report .rel-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--border-tertiary);
          border-radius: 8px;
          overflow: hidden;
        }
        .report .rel-cell {
          background: #fff;
          padding: 10px 12px;
        }
        .report .rel-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--teal-black);
          margin-bottom: 2px;
        }
        .report .rel-freq {
          font-size: 10px;
          color: var(--ocean-sage);
          margin-bottom: 4px;
        }
        .report .rel-text {
          font-size: 11px;
          line-height: 1.6;
          color: var(--text-secondary);
        }
        .report .gap-visual {
          display: grid;
          grid-template-columns: 1fr 24px 1fr;
          margin-bottom: 8px;
        }
        .report .gap-col {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .report .gap-header {
          padding: 8px 10px;
          text-align: center;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .07em;
          text-transform: uppercase;
        }
        .report .gap-said-h {
          background: #F5F3F8;
          color: var(--soft-iris);
          border-radius: 8px 8px 0 0;
        }
        .report .gap-show-h {
          background: #FDF0ED;
          color: #C27A68;
          border-radius: 8px 8px 0 0;
        }
        .report .gap-item {
          padding: 8px 10px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--text-secondary);
          border: 1px solid var(--border-tertiary);
          border-top: none;
        }
        .report .gap-middle {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
          padding: 32px 0 0;
        }
        .report .gap-note {
          padding: 8px 12px;
          background: #FDF0ED;
          border-left: 2px solid var(--terracotta-rose);
          font-size: 12px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-top: 8px;
        }
        .report .ex-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .report .dots {
          display: flex;
          gap: 6px;
        }
        .report .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .report .dot-done {
          background: var(--ocean-sage);
        }
        .report .dot-skip {
          background: var(--bg-secondary);
          border: 1px solid var(--border-tertiary);
        }
        .report .completion-text {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .report .completion-text strong {
          color: var(--teal-black);
        }
        .report .ex-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .report .ex-row-card {
          border: 1px solid var(--border-tertiary);
          border-radius: 8px;
          overflow: hidden;
        }
        .report .ex-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          border-bottom: 1px solid var(--border-tertiary);
          background: var(--bg-secondary);
        }
        .report .ex-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--teal-black);
        }
        .report .ex-day {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .report .ex-cols {
          display: grid;
          grid-template-columns: 1fr 1px 1fr;
        }
        .report .ex-col {
          padding: 10px 14px;
        }
        .report .ex-col-lbl {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .report .lbl-e {
          color: var(--soft-iris);
        }
        .report .lbl-x {
          color: var(--terracotta-rose);
        }
        .report .ex-col-text {
          font-size: 12px;
          line-height: 1.6;
          color: var(--text-secondary);
        }
        .report .ex-col-sep {
          background: var(--border-tertiary);
        }
        .report .ex-skip-row {
          border: 1px solid var(--border-tertiary);
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.35;
        }
        .report .ex-skip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--border-tertiary);
          flex-shrink: 0;
        }
        .report .ex-skip-text {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .report .collective {
          background: var(--teal-black);
          border-radius: 8px;
          padding: 14px 16px;
        }
        .report .collective-lbl {
          font-size: 9px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--ocean-sage);
          font-weight: 500;
          margin-bottom: 6px;
        }
        .report .collective-text {
          font-size: 13px;
          line-height: 1.7;
          color: rgba(236,239,240,0.7);
        }
        .report .triage {
          border: 1px solid rgba(184,168,212,0.4);
          border-radius: 8px;
          padding: 16px 18px;
        }
        .report .triage-lbl {
          font-size: 10px;
          letter-spacing: .09em;
          text-transform: uppercase;
          font-weight: 500;
          color: var(--soft-iris);
          margin-bottom: 6px;
        }
        .report .triage-body {
          font-size: 13px;
          line-height: 1.75;
          color: var(--text-secondary);
        }
        .report .closing {
          background: var(--teal-black);
          padding: 24px;
        }
        .report .closing-quote {
          font-size: 22px;
          font-style: italic;
          color: var(--terracotta-rose);
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .report .closing-obs {
          font-size: 13px;
          color: rgba(236,239,240,0.5);
          line-height: 1.7;
        }
        .report .foot {
          background: var(--teal-black);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0;
        }
        .report .foot-link {
          font-size: 12px;
          color: var(--ocean-sage);
          cursor: pointer;
          text-decoration: none;
        }
        .report .foot-center {
          font-size: 10px;
          color: rgba(236,239,240,0.2);
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        @media(max-width: 640px) {
          .report .stats {
            grid-template-columns: 1fr !important;
          }
          .report .stat {
            border-right: none !important;
            border-bottom: 1px solid var(--border-tertiary) !important;
          }
          .report .stat:last-child {
            border-bottom: none !important;
          }
          .report .ph-body {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .report .loop-wrap {
            margin: 0 auto !important;
          }
          .report .dim-grid {
            grid-template-columns: 1fr !important;
          }
          .report .rel-grid {
            grid-template-columns: 1fr !important;
          }
          .report .gap-visual {
            grid-template-columns: 1fr !important;
          }
          .report .gap-middle {
            padding: 8px 0 !important;
            transform: rotate(90deg) !important;
          }
          .report .ex-cols {
            grid-template-columns: 1fr !important;
          }
          .report .ex-col-sep {
            height: 1px !important;
            width: 100% !important;
          }
        }

        @media(max-width: 768px) {
          .tc {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .sr {
            grid-template-columns: 1fr;
          }
          .sc {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .sc:last-child {
            border-bottom: none;
          }
        }
      `}} />
      <DashboardNavbar activeTab="reports" />

      <main className={`${viewState === 'list' ? 'max-w-[680px]' : 'max-w-[900px]'} mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-20 sm:pb-24 transition-all duration-300`}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-secondary" size={32} />
            <p className="text-sm font-serif italic text-mid">Retrieving writing history...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white border border-primary/10 rounded-xl p-6 text-center space-y-4 my-10 shadow-xs">
            <AlertCircle size={36} className="mx-auto text-accent" />
            <h2 className="font-serif text-lg text-primary">Connection Interrupted</h2>
            <p className="text-xs text-mid leading-relaxed max-w-sm mx-auto">
              We encountered a database error checking your cycle records.
            </p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* View State: LIST */}
        {!loading && !error && viewState === 'list' && (
          <div className="space-y-6">
            <button
              onClick={() => window.navigateTo('/dashboard')}
              className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft size={14} /> Back to dashboard
            </button>

            <div>
              <h1 className="font-serif text-[22px] text-primary mb-0.5">Reports</h1>
              <p className="text-xs text-mid">Your reports and summaries — organised by cycle.</p>
            </div>

            <div className="flex gap-3 text-[12px] text-[#4A6A64] pb-1.5 border-b border-[#1E2A2E]/5">
              <span><strong className="text-primary">{cycles.length}</strong> cycles</span>
              <span>·</span>
              <span>
                <strong className="text-primary">
                  {cycles.filter(c => c.assessment_completed).length}
                </strong> Day 28 reports
              </span>
              <span>·</span>
              <span>
                <strong className="text-primary">
                  {reports.filter(r => r.status?.toUpperCase() === 'READY').length}
                </strong> weekly summaries
              </span>
            </div>

            {cycles.length === 0 ? (
              <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-8 text-center text-mid text-xs">
                No active cycles found. Start writing daily entries to initialize your first cycle.
              </div>
            ) : (
              cycles.map((cycle) => {
                const cycleReports = reports.filter(r => r.cycle_id === cycle.id);
                const isOpen = !!openCycles[cycle.id];
                const isCurrent = cycle.status === 'active' || cycle.status === 'ACTIVE';

                      const isDay28Unlocked = Boolean(
                        cycle.assessment_completed ||
                        cycle.assessment_available ||
                        cycle.has_assessment ||
                        cycle.status === 'COMPLETED' ||
                        cycle.status === 'completed' ||
                        (cycle.current_day && cycle.current_day >= 28) ||
                        (cycle.entries_count && cycle.entries_count > 0)
                      );
                      const isCompletedCycle = Boolean(
                        cycle.status === 'COMPLETED' ||
                        cycle.status === 'completed' ||
                        (cycle.current_day && cycle.current_day >= 28) ||
                        cycle.assessment_completed
                      );

                      return (
                        <div key={cycle.id} className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs">
                          <div
                            onClick={() => handleToggleCycle(cycle.id)}
                            className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#F5F8F8] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isCurrent ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e0a898]/15 text-[#8a3020]">
                                  Current
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#8DBFB4]/12 text-[#1A5040]">
                                  Completed
                                </span>
                              )}
                              <div>
                                <div className="text-[13.5px] font-semibold">Cycle {cycle.cycle_number}</div>
                                <div className="text-[11px] text-[#8DBFB4] mt-0.5">
                                  {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Started'} – {cycle.end_date ? new Date(cycle.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[11px] text-[#8DBFB4] hidden sm:inline">
                                {cycleReports.length} summaries · {isDay28Unlocked ? 'report unlocked' : 'report locked'}
                              </span>
                              <ChevronDown size={16} className={`text-mid transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          {isOpen && (
                            <div className="border-t border-[#1E2A2E]/5 bg-[#FAFBFB] divide-y divide-[#1E2A2E]/5">
                              {/* Cycle Report Section */}
                              <div className="px-3.5 py-1.5 bg-[#F5F8F8] text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">
                                {isCompletedCycle ? 'Day 28 report' : 'Cycle report'}
                              </div>
                              {isDay28Unlocked ? (
                                <div
                                  onClick={() => handleOpenAssessment(cycle.id)}
                                  className="p-3.5 flex items-center justify-between hover:bg-[#F5F8F8]/60 cursor-pointer bg-white transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e0a898]/15 text-[#8a3020]">
                                      {isCompletedCycle ? 'Complete' : 'Ready'}
                                    </span>
                                    <div>
                                      <div className="text-[13px] font-semibold text-primary group-hover:text-secondary-dark transition-colors">
                                        {isCompletedCycle ? 'Day 28 report' : `Cycle ${cycle.cycle_number} report`}
                                      </div>
                                      <div className="text-[11px] text-[#4A6A64]">
                                        {isCompletedCycle ? 'Completed cycle analysis' : `Cycle synthesis · ${cycle.entries_count || 0} entries recorded`}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <button onClick={(e) => handleDownloadAssessment(e, cycle.id)} className="text-[#8DBFB4] hover:text-primary transition-colors border-none bg-transparent">
                                      <Download size={15} />
                                    </button>
                                    <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                                      Read <ArrowLeft size={11} className="rotate-180" />
                                    </span>
                                  </div>
                                </div>
                        ) : (
                          <div className="p-3.5 flex items-center justify-between bg-white text-mid">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-mint-grey flex items-center justify-center text-[#8DBFB4]">
                                <Lock size={14} />
                              </span>
                              <div>
                                <div className="text-[13px] font-semibold text-primary">Day 28 report</div>
                                <div className="text-[11px] text-[#4A6A64]">
                                  {isCurrent ? `Generates at end of cycle (or after writing entries)` : `Awaiting cycle assessment completion`}
                                </div>
                              </div>
                            </div>
                            {isCurrent && (
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-1 bg-mint-grey rounded overflow-hidden">
                                  <div
                                    className="bg-accent h-full"
                                    style={{ width: `${Math.min(100, Math.round(((cycle.current_day || 1) / (cycle.total_days || 30)) * 100))}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-[#8DBFB4]">
                                  {Math.max(0, (cycle.total_days || 30) - (cycle.current_day || 1))} days left
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Weekly Summaries Section */}
                        <div className="px-3.5 py-1.5 bg-[#F5F8F8] text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">
                          Weekly summaries
                        </div>

                        {(() => {
                          const weeksList = [1, 2, 3, 4];
                          return weeksList.map(weekNum => {
                            const report = cycleReports.find(r => r.week_number === weekNum);
                            const isWeekCompleted = (cycle.current_day || 1) > (weekNum * 7) || (report && report.status?.toUpperCase() === 'READY');

                            // Calculate completion date based on cycle start_date
                            const startDate = cycle.start_date ? new Date(cycle.start_date) : null;
                            const formattedDate = startDate
                              ? new Date(startDate.getTime() + (weekNum * 7) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                              : (report?.generated_at ? new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

                            if (!isWeekCompleted) {
                            return (
                              <div key={`locked-week-${weekNum}`} className="p-3.5 flex items-center justify-between bg-white text-mid border-b border-[#1E2A2E]/5 last:border-b-0 opacity-70">
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-mint-grey text-[#4A6A64]/70">
                                    Week {weekNum}
                                  </span>
                                  <div>
                                    <div className="text-[13px] font-semibold text-[#1E2A2E]/70">Week {weekNum} summary yet to complete</div>
                                    <div className="text-[11px] text-[#4A6A64]">
                                      Will compile automatically on {formattedDate || 'soon'} (Cycle Day {weekNum * 7}).
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10px] font-semibold text-[#8DBFB4] uppercase tracking-wider">
                                  In Progress
                                </span>
                              </div>
                            );
                          }

                          if (!report) {
                            return (
                              <div key={`generating-week-${weekNum}`} className="p-3.5 flex items-center justify-between bg-white text-mid border-b border-[#1E2A2E]/5 last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <Loader2 className="animate-spin text-secondary" size={14} />
                                  <div>
                                    <div className="text-[13px] font-semibold text-primary">Week {weekNum} summary</div>
                                    <div className="text-[11px] text-[#4A6A64]">
                                      Preparing weekly writing analysis report... {formattedDate && `(${formattedDate})`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                           const status = report.status?.toUpperCase() || 'PENDING';
                           if (status !== 'READY' && status !== 'FAILED') {
                             let statusText = "Queued for generation...";
                             let statusIcon = <Loader2 className="animate-spin text-secondary" size={14} />;
                             if (status === 'GRACE_PERIOD') {
                               statusText = "Almost ready...";
                             } else if (status === 'GENERATING') {
                               statusText = "Finalizing your report...";
                               statusIcon = <Loader2 className="animate-spin text-secondary" size={14} />;
                             } else if (status === 'WAITING_FOR_PROCESSING' || status.startsWith('WAITING_FOR_')) {
                               statusText = "Your weekly insights are being compiled...";
                             } else if (status === 'PENDING') {
                               statusText = "Scheduled for processing...";
                               statusIcon = <span className="w-3.5 h-3.5 rounded-full bg-[#8DBFB4]/30 border border-[#8DBFB4]/50 inline-block" />;
                             }

                             return (
                               <div key={report.id} className="p-3.5 flex items-center justify-between bg-white text-mid border-b border-[#1E2A2E]/5 last:border-b-0">
                                 <div className="flex items-center gap-3">
                                   {statusIcon}
                                   <div>
                                     <div className="text-[13px] font-semibold text-primary">Week {weekNum} summary</div>
                                     <div className="text-[11px] text-[#4A6A64]">
                                       {statusText} {formattedDate && `(${formattedDate})`}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             );
                           }

                           if (status === 'FAILED') {
                            return (
                              <div key={report.id} className="p-3.5 flex items-center justify-between bg-white text-[#8a3020] border-b border-[#1E2A2E]/5 last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <AlertCircle size={14} className="text-[#8a3020]" />
                                  <div>
                                    <div className="text-[13px] font-semibold text-[#8a3020]">Week {weekNum} summary compilation failed</div>
                                    <div className="text-[11px] text-[#4A6A64]">
                                      Click retry to restart processor {formattedDate && `(${formattedDate})`}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => handleRetryReport(e, report.id, cycle.id, weekNum)}
                                  className="px-2.5 py-1 text-[10.5px] font-semibold text-primary bg-[#e0a898]/15 hover:bg-[#e0a898]/25 rounded transition-all cursor-pointer flex items-center gap-1 border-none"
                                  disabled={retryingId === report.id}
                                >
                                  {retryingId === report.id ? (
                                    <Loader2 className="animate-spin" size={11} />
                                  ) : (
                                    <RefreshCw size={11} />
                                  )}
                                  Retry
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={report.id}
                              onClick={() => handleOpenSummary(report.id)}
                              className="p-3.5 flex items-center justify-between hover:bg-[#F5F8F8]/60 cursor-pointer bg-white transition-colors group border-b border-[#1E2A2E]/5 last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-mint-grey text-primary">
                                  Week {weekNum}
                                </span>
                                <div>
                                  <div className="text-[13px] font-semibold text-primary group-hover:text-secondary-dark transition-colors">
                                    {report.title || `Week ${weekNum} summary`}
                                  </div>
                                  <div className="text-[11px] text-[#4A6A64]">
                                    {formattedDate || 'Ready'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <button onClick={(e) => { e.stopPropagation(); downloadPdf(report); }} className="text-[#8DBFB4] hover:text-primary transition-colors border-none bg-transparent">
                                  <Download size={15} />
                                </button>
                                <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                                  Read <ArrowLeft size={11} className="rotate-180" />
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* View State: SUMMARY (Weekly Detail Screen) */}
        {!loading && !error && viewState === 'summary' && (
          <div className="space-y-4 max-w-[920px] mx-auto page-fade-enter-active">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setViewState('list')}
                className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
              >
                <ArrowLeft size={14} /> Back to reports
              </button>
              {selectedReport && !loadingDetail && (
                <button
                  onClick={() => downloadPdf(selectedReport)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors border border-[#1E2A2E]/10 px-2.5 py-1 rounded bg-white cursor-pointer"
                >
                  <Download size={13} /> Save PDF
                </button>
              )}
            </div>

            {loadingDetail || !selectedReport ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="animate-spin text-secondary" size={24} />
                <p className="text-xs font-serif italic text-mid">Reading weekly patterns...</p>
              </div>
            ) : (
              (() => {
                const data = selectedReport.report_data || {};
                const stats = data.weekly_stats || {};
                const listEmos = data.vocabThisWeek || [];
                const lengths = data.writing_behaviour?.entry_lengths || [];

                // Parse what_we_saw into facts vs realization
                const parts = (data.what_we_saw || '').split('\n\n');
                const sawText = parts[0] || '';
                const realizationText = parts[1] || '';

                let sinceLastWeekContent = '';
                if (typeof data.since_last_week === 'string') {
                  sinceLastWeekContent = data.since_last_week;
                } else if (data.since_last_week && typeof data.since_last_week === 'object') {
                  const lastWords = data.since_last_week.last_week_words || [];
                  const thisWords = data.since_last_week.this_week_words || [];
                  if (lastWords.length === 0) {
                    sinceLastWeekContent = 'First week on record. No prior week to compare.';
                  } else {
                    sinceLastWeekContent = `Last week: ${lastWords.join(', ')}. This week: ${thisWords.join(', ')}.`;
                  }
                } else {
                  sinceLastWeekContent = 'First week on record. No prior week to compare.';
                }

                return (
                  <div className="rpt">
                    <div className="hdr">
                      <div className="hl">
                        <div className="logo font-semibold flex items-center gap-1.5">
                          <img src="/logo-mark-transparent.png" alt="Ingress Within" className="w-4 h-4 object-contain inline-block" />
                          <span>ingress <span>within</span></span>
                        </div>
                        <div className="wl" style={{ textTransform: 'uppercase' }}>Week {selectedReport.week_number} Summary</div>
                      </div>
                      <div className="dr">{stats.week_range || (selectedReport.generated_at ? new Date(selectedReport.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '')}</div>
                    </div>

                    <div className="body">
                      {/* STATS SECTION */}
                      <div className="sr">
                        <div className="sc">
                          <div className="sl">Entries</div>
                          <div className="sv">{stats.entries_completed}<sup>/{stats.total_possible}</sup></div>
                          <div className="ss">
                            {stats.skipped_days > 0 ? `${stats.skipped_days} day${stats.skipped_days > 1 ? 's' : ''} skipped` : 'Perfect streak'}
                          </div>
                        </div>
                        <div className="sc">
                          <div className="sl">Top focal expression</div>
                          <div className="sw">"{listEmos[0]?.word || 'none'}"</div>
                          <div className="ss">appeared {listEmos[0]?.frequency || 0} times</div>
                        </div>
                        <div className="sc">
                          <div className="sl">Week tone</div>
                          <div className="st">{selectedReport.title || 'Neutral baseline'}</div>
                        </div>
                      </div>

                      {/* SINCE LAST WEEK */}
                      <div className="since-last">
                        <div className="eyebrow">Since Last Week</div>
                        <p>{sinceLastWeekContent}</p>
                      </div>

                      <div className="tc">
                        {/* LEFT COLUMN */}
                        <div>
                          <div className="lbl">Emotion language this week</div>
                          <div className="cx">Words pulled from your writing this week, grouped with related words you didn't use.</div>

                          <div className="space-y-3">
                            {data.emotion_clusters && data.emotion_clusters.length > 0 ? (
                              data.emotion_clusters.slice(0, 3).map((cluster, index) => (
                                <div key={index} className="cr">
                                  <span className="wu">{cluster.word} →</span>
                                  {(cluster.related || []).slice(0, 3).map((rel, rIdx) => (
                                    <span key={rIdx} className="wn">{rel}</span>
                                  ))}
                                </div>
                              ))
                            ) : (
                              listEmos.slice(0, 3).map((emo, index) => (
                                <div key={index} className="cr">
                                  <span className="wu">{emo.word} →</span>
                                  <span className="wn">{emo.normalized_word}</span>
                                </div>
                              ))
                            )}
                          </div>

                          {data.analytical_block && (
                            <div className="cluster-note mt-3 text-xs leading-relaxed text-[#22262b]">
                              Theme: <strong>{data.analytical_block.primary_theme}</strong>. Emotional register: <strong>{data.analytical_block.emotional_tone}</strong>.
                            </div>
                          )}

                          <div className="dv"></div>

                          <div className="lbl">How the week moved</div>
                          <div className="rpt-bars-container">
                            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                              const h = lengths[dayIdx] || 0;
                              const isEmpty = h === 0;

                              return (
                                <div key={dayIdx} className="rpt-bar-wrapper">
                                  {isEmpty ? (
                                    <div className="rpt-bar-element empty" />
                                  ) : (
                                    <div
                                      className="rpt-bar-element"
                                      style={{ height: `${h}%` }}
                                    />
                                  )}
                                  <span className="rpt-bar-label">D{dayIdx + 1}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="arc-note">
                            {data.writing_behaviour?.consistency || 'Writing patterns logged consistently.'}
                          </div>

                        </div>

                        {/* RIGHT COLUMN */}
                        <div>
                          <div className="lbl">What we saw</div>
                          <div className="ws font-serif text-[15px] leading-[1.8] text-[#22262b] mb-6">
                            {sawText || selectedReport.body}
                          </div>

                          {realizationText && (
                            <div className="yt font-serif text-[15.5px] leading-relaxed text-[#1c2733] border-l-[3px] border-[#d98b6b] pl-[14px] mb-5 bg-transparent rounded-none">
                              {realizationText}
                            </div>
                          )}

                          <div className="why-hedge">
                            Based on {stats.entries_completed || 0} of {stats.total_possible || 7} entries this week.
                          </div>

                        </div>
                      </div>

                      {/* CRISIS STATUS */}
                      {data.crisis_review && (
                        <div className="status-bar">
                          {data.crisis_review.occurred ? (
                            <span className="text-[#8a3020] font-semibold">⚠️ Alert: {data.crisis_review.summary}</span>
                          ) : (
                            <span>No crisis indicators were detected this week.</span>
                          )}
                        </div>
                      )}

                      <div className="cb mt-5">
                        <div className="cq">
                          "{data.candidate_quote || 'Reflecting on your logs helps align focus.'}"
                        </div>
                        <div className="carry-label">Carry Question</div>
                        <div className="co">
                          {selectedReport.open_question || data.carry_question}
                        </div>
                      </div>
                    </div>

                    <div className="foot">
                      <button
                        onClick={() => setViewState('list')}
                        className="foot-link border-none bg-transparent hover:text-primary transition-colors cursor-pointer"
                      >
                        ← Back to progress
                      </button>
                      <div className="foot-center">Ingress Within · Week {selectedReport.week_number}</div>
                      <button
                        onClick={() => window.navigateTo('/write')}
                        className="foot-link border-none bg-transparent hover:text-primary transition-colors cursor-pointer"
                      >
                        Write today's entry
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* View State: REPORT (Day 28 Synthesis Report) */}
        {!loading && !error && viewState === 'report' && (
          (() => {
            const isJsonReport = selectedAssessment && selectedAssessment.report_text && selectedAssessment.report_text.startsWith('{');
            return (
              <div className={`space-y-4 ${isJsonReport ? 'max-w-[900px]' : 'max-w-[620px]'} mx-auto page-fade-enter-active`}>
                <button
                  onClick={() => setViewState('list')}
                  className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent mb-2"
                >
                  <ArrowLeft size={14} /> Back to reports
                </button>

                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 className="animate-spin text-secondary" size={24} />
                    <p className="text-xs font-serif italic text-mid">Decoding monthly cycle data...</p>
                  </div>
                ) : !selectedAssessment ? (
                  <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm text-center space-y-4 max-w-[420px] mx-auto my-12 font-sans">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                    <p className="text-sm text-stone-800 font-serif">Assessment report details could not be loaded.</p>
                    <button
                      onClick={() => handleOpenAssessment(selectedCycleId, true)}
                      className="w-full py-3 rounded-xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 cursor-pointer"
                    >
                      Retry Loading Report
                    </button>
                  </div>
                ) : (
                  (() => {
                    const cycleObj = cycles.find(c => c.id === selectedCycleId) || {};
                    let reportData = null;
                    if (isJsonReport) {
                      try {
                        reportData = JSON.parse(selectedAssessment.report_text);
                      } catch (e) {
                        console.error(e);
                      }
                    }

                    if (!reportData) {
                      // Fallback plain-text layout for legacy reports
                      return (
                        <div className="space-y-4">
                          <div className="bg-[#1E2A2E] border-none text-white rounded-xl p-4.5 flex flex-col justify-between shadow-md">
                            <div className="space-y-1.5">
                              <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">
                                Cycle {cycleObj.cycle_number} · Day 28 report · Generated {selectedAssessment.generated_at ? new Date(selectedAssessment.generated_at).toLocaleDateString('en-GB') : ''}
                              </div>
                              <h2 className="font-serif text-lg text-white leading-snug">28 days of honest writing — here is what it showed.</h2>
                              <p className="text-[11.5px] text-[#5A8A84]">
                                {selectedAssessment.entry_count} entries · {selectedAssessment.path_assignment || 'Guided pathway'}
                              </p>
                            </div>
                            <button
                              onClick={() => downloadPdf(selectedAssessment, true)}
                              className="mt-3 px-3.5 py-1.5 border border-white/15 rounded text-xs font-semibold bg-white/8 hover:bg-white/15 transition-all text-white w-fit cursor-pointer flex items-center gap-1.5"
                            >
                              <Download size={13} /> Save PDF
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">What this cycle showed</div>
                            <p className="text-[14.5px] text-[#1E2A2E] leading-relaxed font-serif bg-white border border-[#1E2A2E]/5 p-4.5 rounded-xl">
                              {selectedAssessment.report_text || 'No cycle summary narrative compiled.'}
                            </p>
                          </div>

                          <div className="bg-primary text-[#E0EEEC] rounded-xl p-4.5 space-y-3">
                            <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">Carry into Cycle {Number(cycleObj.cycle_number || 1) + 1}</div>
                            <p className="text-[13px] leading-relaxed">
                              Pathway assignment for your integration is: <strong>{selectedAssessment.path_assignment || 'second_cycle'}</strong>.
                              Branch code: <strong>{selectedAssessment.branch_assignment || 'A'}</strong>.
                            </p>
                            <div className="border-l-[2.5px] border-[#E0A898]/40 pl-4 space-y-1">
                              <p className="text-[14px] text-[#E0A898] italic font-serif leading-relaxed">
                                " visibility is the first condition for change. Fix focus on agency."
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const whatShowed = reportData.whatThisCycleShowed || {
                      openingObs: `Cycle ${reportData.cycleNumber || 1} completed with ${reportData.stats?.entriesCount || 0} entries written.`,
                      pulledQuote: 'Taking time each day to reflect provides clarity.',
                      narrative: 'Reflections recorded for this cycle.'
                    };
                    const patterns = Array.isArray(reportData.patterns) ? reportData.patterns : [];
                    const recurringThemes = Array.isArray(reportData.recurringThemes) ? reportData.recurringThemes : [];
                    const wordsReachedFor = reportData.wordsReachedFor || { analysisNote: '', unusedWords: [] };
                    const fourThingsWeTracked = Array.isArray(reportData.fourThingsWeTracked) && reportData.fourThingsWeTracked.length === 4
                      ? reportData.fourThingsWeTracked
                      : [
                          { label: "How stuck the patterns were", color: "#E0A898", title: "Pattern persistence", desc: "Analysis of pattern rigidity based on entries." },
                          { label: "How intense things felt", color: "#B8A8D4", title: "Emotional intensity", desc: "Analysis of emotional variance and intensity based on entries." },
                          { label: "How much you felt in control", color: "#8DBFB4", title: "Self-agency", desc: "Analysis of agency vs reactivity/situational framing in entries." },
                          { label: "Which direction things moved", color: "#8DBFB4", title: "Overall stability", desc: "Analysis of overall emotional stability/direction and shift across the cycle." }
                        ];
                    const peopleWhoShowedUp = Array.isArray(reportData.peopleWhoShowedUp) ? reportData.peopleWhoShowedUp : [];
                    const saidVsShowed = reportData.saidVsShowed || { said: [], showed: [], analysisNote: '' };
                    const exercises = reportData.exercises || { collectiveInsight: 'Completed cycle reframing tasks.', items: [] };
                    const whereLeavesYou = reportData.whereLeavesYou || { title: `Cycle ${reportData.cycleNumber || 1} Summary`, body: 'Cycle reflections complete.' };
                    const closingQuote = reportData.closingQuote || { quote: 'Consistent daily practice supports emotional grounding.', observation: 'Observed during cycle reflections.' };
                    const stats = reportData.stats || {
                      entriesCount: 0,
                      totalDays: 30,
                      daysSkipped: 0,
                      mostUsedWord: 'reflection',
                      mostUsedWordFreq: 0,
                      mostUsedWordContext: '',
                      exercisesCompletedCount: 0,
                      totalExercisesCount: 4,
                      missedExercisesText: ''
                    };

                    // Structured Report view matching HTML design spec
                    return (
                      <div className="report font-sans">
                        {/* 1. Header */}
                        <div className="hdr">
                          <div className="hdr-l">
                            <div className="logo font-medium text-[#ECEFF0] text-[14px] flex items-center gap-1.5">
                              <img src="/logo-mark-light.png" alt="Ingress Within" className="w-4 h-4 object-contain inline-block" />
                              <span>ingress <span className="text-ocean-sage">within</span></span>
                            </div>
                            <div className="hdiv"></div>
                            <div className="htag">Cycle ${reportData.cycleNumber || 1} — Monthly Report</div>
                          </div>
                          <div className="hdate">${reportData.startDate || 'Day 1'} – ${reportData.endDate || 'Day 30'}</div>
                        </div>
                        <div className="body text-left">
                          {/* 2. Overview Statistics */}
                          <div className="stats">
                            <div className="stat">
                              <div className="stat-lbl">Entries written</div>
                              <div className="stat-val">{stats.entriesCount}<sup>/{stats.totalDays}</sup></div>
                              <div className="stat-sub">{stats.daysSkipped} day{stats.daysSkipped > 1 ? 's' : ''} skipped</div>
                            </div>
                            <div className="stat">
                              <div className="stat-lbl">Most used word</div>
                              <div className="stat-word">"{stats.mostUsedWord}"</div>
                              <div className="stat-sub">{stats.mostUsedWordContext}</div>
                            </div>
                            <div className="stat">
                              <div className="stat-lbl">Exercises completed</div>
                              <div className="stat-val">{stats.exercisesCompletedCount}<sup>/{stats.totalExercisesCount}</sup></div>
                              <div className="stat-sub">{stats.missedExercisesText}</div>
                            </div>
                          </div>

                          {/* 3. How the Month Moved */}
                          <div className="sec">
                            <div className="sec-label">How the month moved</div>
                            <div style={{ position: 'relative', width: '100%', height: '120px', marginBottom: '6px' }}>
                              <canvas id="arcChart"></canvas>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <div style={{ width: '20px', height: '2px', background: 'var(--terracotta-rose)', borderRadius: '1px' }}></div>
                                entry written
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-tertiary)' }}></div>
                                day skipped
                              </div>
                            </div>
                          </div>

                          <div className="divider"></div>

                          {/* 4. What This Cycle Showed */}
                          <div className="sec">
                            <div className="sec-label">What this cycle showed</div>
                            <div className="opening" dangerouslySetInnerHTML={{ __html: (whatShowed.openingObs || '').replace(/\n/g, '<br>') }} />
                            <div className="pulled-quote">
                              <div className="pq-lbl">From your writing</div>
                              <div className="pq-text">"{whatShowed.pulledQuote || 'Taking time each day to reflect provides clarity.'}"</div>
                            </div>
                            <div className="narr">{whatShowed.narrative || ''}</div>
                          </div>

                          <div className="divider"></div>

                          {/* 5. Patterns This Cycle Found In You */}
                          <div className="sec">
                            <div className="sec-label">Patterns this cycle found in you</div>
                            {patterns && patterns.length > 0 ? (
                              patterns.map((pat, pIdx) => (
                                <div key={pIdx} className="pattern-hero">
                                  <div className="ph-top">
                                    <div className="ph-label">{pat.name}</div>
                                    <div className={`ph-tag ${pat.tagClass || 'tag-red'}`}>{pat.tag}</div>
                                  </div>
                                  <div className="ph-body">
                                    <div>
                                      <div className="ph-mechanic">{pat.mechanism}</div>
                                      <div className="ph-cost">
                                        <div className="ph-cost-lbl">What this costs you</div>
                                        {pat.cost}
                                      </div>
                                    </div>
                                    <div className="loop-wrap text-center">
                                      <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                          <marker id={`a-marker-${pIdx}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                                            <path d="M0,0.5 L5,3 L0,5.5 Z" fill={pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'} />
                                          </marker>
                                        </defs>
                                        {/* Step 1 Rect */}
                                        <rect x="4" y="4" width="68" height="34" rx="8" fill={pat.tagClass === 'tag-red' ? 'rgba(224,168,152,0.15)' : pat.tagClass === 'tag-purple' ? 'rgba(184,168,212,0.15)' : 'rgba(141,191,180,0.15)'} stroke={pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'} strokeWidth="1.5" />
                                        <text x="38" y="19" textAnchor="middle" fontSize={getFontSize(pat.loopNodes?.[0]?.title)} fontWeight="700" fill={pat.tagClass === 'tag-red' ? '#C27A68' : pat.tagClass === 'tag-purple' ? '#7B6B9A' : '#4A7F78'} fontFamily="var(--font-ui), 'Instrument Sans', sans-serif">{pat.loopNodes?.[0]?.title || 'Happens'}</text>
                                        <text x="38" y="32" textAnchor="middle" fontSize={getSubFontSize(pat.loopNodes?.[0]?.sub)} fill={pat.tagClass === 'tag-red' ? '#C27A68' : pat.tagClass === 'tag-purple' ? '#7B6B9A' : '#4A7F78'} fontFamily="var(--font-ui), 'Instrument Sans', sans-serif" opacity="0.8">{pat.loopNodes?.[0]?.sub || ''}</text>

                                        {/* Step 2 Rect */}
                                        <rect x="88" y="4" width="68" height="34" rx="8" fill="var(--bg-secondary)" stroke="var(--border-tertiary)" strokeWidth="1" />
                                        <text x="122" y="19" textAnchor="middle" fontSize={getFontSize(pat.loopNodes?.[1]?.title)} fontWeight="600" fill="var(--teal-black)" fontFamily="var(--font-ui), 'Instrument Sans', sans-serif">{pat.loopNodes?.[1]?.title || 'Notice'}</text>
                                        <text x="122" y="32" textAnchor="middle" fontSize={getSubFontSize(pat.loopNodes?.[1]?.sub)} fill="var(--text-secondary)" fontFamily="var(--font-ui), 'Instrument Sans', sans-serif">{pat.loopNodes?.[1]?.sub || ''}</text>

                                        {/* Step 3 Rect */}
                                        <rect x="88" y="142" width="68" height="34" rx="8" fill="var(--bg-secondary)" stroke="var(--border-tertiary)" strokeWidth="1" />
                                        <text x="122" y="157" textAnchor="middle" fontSize={getFontSize(pat.loopNodes?.[2]?.title)} fontWeight="600" fill="var(--teal-black)" fontFamily="var(--font-ui), 'Instrument Sans', sans-serif">{pat.loopNodes?.[2]?.title || 'Dismiss'}</text>
                                        <text x="122" y="170" textAnchor="middle" fontSize={getSubFontSize(pat.loopNodes?.[2]?.sub)} fill="var(--text-secondary)" fontFamily="var(--font-ui), 'Instrument Sans', sans-serif">{pat.loopNodes?.[2]?.sub || ''}</text>

                                        {/* Step 4 Rect */}
                                        <rect x="4" y="142" width="68" height="34" rx="8" fill="var(--bg-secondary)" stroke="var(--border-tertiary)" strokeWidth="1" />
                                        <text x="38" y="157" textAnchor="middle" fontSize={getFontSize(pat.loopNodes?.[3]?.title)} fontWeight="600" fill="var(--teal-black)" fontFamily="var(--font-ui), 'Instrument Sans', sans-serif">{pat.loopNodes?.[3]?.title || 'Say okay'}</text>
                                        <text x="38" y="170" textAnchor="middle" fontSize={getSubFontSize(pat.loopNodes?.[3]?.sub)} fill="var(--text-secondary)" fontFamily="var(--font-ui), 'Instrument Sans', sans-serif">{pat.loopNodes?.[3]?.sub || ''}</text>

                                        {/* Edges */}
                                        <path d="M72,21 L88,21" fill="none" stroke={pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'} strokeWidth="1.5" strokeOpacity="0.7" markerEnd={`url(#a-marker-${pIdx})`} />
                                        <path d="M122,38 L122,142" fill="none" stroke={pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'} strokeWidth="1.5" strokeOpacity="0.5" markerEnd={`url(#a-marker-${pIdx})`} />
                                        <path d="M88,159 L72,159" fill="none" stroke={pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'} strokeWidth="1.5" strokeOpacity="0.4" markerEnd={`url(#a-marker-${pIdx})`} />
                                        <path d="M38,142 L38,38" fill="none" stroke={pat.tagClass === 'tag-red' ? '#E0A898' : pat.tagClass === 'tag-purple' ? '#B8A8D4' : '#8DBFB4'} strokeWidth="1.5" strokeOpacity="0.3" markerEnd={`url(#a-marker-${pIdx})`} />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-mid p-3 border border-dashed rounded text-center">
                                No repetitive patterns were identified in your writing this cycle.
                              </div>
                            )}
                          </div>

                          <div className="divider"></div>

                          {/* 6. What Kept Coming Up */}
                          <div className="sec">
                            <div className="sec-label">What kept coming up</div>
                            {recurringThemes && recurringThemes.length > 0 ? (
                              recurringThemes.map((theme, tIdx) => (
                                <div key={tIdx} className="theme-card">
                                  <div className="theme-top">
                                    <div className="theme-name">{theme.name}</div>
                                    <div className="theme-freq">{theme.frequencyText}</div>
                                  </div>
                                  <div className="theme-bar-wrap">
                                    <div className="theme-bar" style={{ width: `${theme.percentage}%`, background: theme.color || '#E0A898' }}></div>
                                  </div>
                                  <div className="theme-text">{theme.description}</div>
                                  {theme.contraInsight && (
                                    <div className="theme-contra">
                                      <div className="contra-lbl">What entries and exercises showed together</div>
                                      {theme.contraInsight}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-mid p-3 border border-dashed rounded text-center">
                                No recurring themes reached the clinical significance threshold this cycle.
                              </div>
                            )}
                          </div>

                          <div className="divider"></div>

                          {/* 7. Words You Reached For */}
                          <div className="sec">
                            <div className="sec-label">Words you reached for</div>
                            <div className="cluster-exp">Words from your writing this month, with related words you didn't use. The ones you didn't reach for sometimes say as much as the ones you did.</div>
                            {wordsReachedFor?.unusedWords?.map((item, wIdx) => (
                              <div key={wIdx} className="cluster-row">
                                <span className="word-used">{item.word}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>→</span>
                                {(item.synonyms || []).map((syn, sIdx) => (
                                  <span key={sIdx} className="word-unused">{syn}</span>
                                ))}
                              </div>
                            ))}
                            <div className="cluster-note">{wordsReachedFor.analysisNote || ''}</div>
                          </div>

                          <div className="divider"></div>

                          {/* 8. Four Things We Tracked */}
                          <div className="sec">
                            <div className="sec-label">Four things we tracked</div>
                            <div className="dim-grid">
                              <div style={{ position: 'relative', height: '220px' }}>
                                <canvas id="radarChart"></canvas>
                              </div>
                              <div className="dim-desc">
                                {fourThingsWeTracked.map((dim, dIdx) => (
                                  <div key={dIdx} className="dim-item" style={{ borderColor: dim.color || '#E0A898', opacity: dIdx === 3 ? 0.6 : 1 }}>
                                    <div className="dim-item-name">{dim.label}</div>
                                    <div className="dim-item-text">{dim.desc}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="divider"></div>

                          {/* 9. People Who Showed Up */}
                          <div className="sec">
                            <div className="sec-label">People who showed up in your writing</div>
                            <div className="rel-grid">
                              {peopleWhoShowedUp && peopleWhoShowedUp.length > 0 ? (
                                peopleWhoShowedUp.map((person, pIdx) => (
                                  <div key={pIdx} className="rel-cell">
                                    <div className="rel-name">{person.name}</div>
                                    <div className="rel-freq">{person.frequency}</div>
                                    <div className="rel-text">{person.description}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="rel-cell col-span-2 text-center text-xs text-mid p-3">
                                  No specific relationships or individuals were mentioned with sufficient frequency to summarize.
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="divider"></div>

                          {/* 10. What You Said vs What Your Writing Showed */}
                          <div className="sec">
                            <div className="sec-label">What you said vs what your writing showed</div>
                            <div className="gap-visual">
                              <div className="gap-col">
                                <div className="gap-header gap-said-h">What you said about yourself</div>
                                {(saidVsShowed.said || []).map((item, idx) => (
                                  <div key={idx} className="gap-item" style={{ marginTop: idx > 0 ? '1px' : '0', borderTop: idx > 0 ? '1px solid var(--border-tertiary)' : 'none' }}>
                                    "{item}"
                                  </div>
                                ))}
                              </div>
                              <div className="gap-middle">
                                {(saidVsShowed.said || []).map((_, idx) => (
                                  <div key={idx} style={{ fontSize: '14px', color: 'var(--text-secondary)', opacity: '0.3' }}>→</div>
                                ))}
                              </div>
                              <div className="gap-col">
                                <div className="gap-header gap-show-h">What your writing showed</div>
                                {(saidVsShowed.showed || []).map((item, idx) => (
                                  <div key={idx} className="gap-item" style={{ marginTop: idx > 0 ? '1px' : '0', borderTop: idx > 0 ? '1px solid var(--border-tertiary)' : 'none' }}>
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="gap-note">{saidVsShowed.analysisNote || ''}</div>
                          </div>

                          <div className="divider"></div>

                          {/* 11. Exercises */}
                          <div className="sec">
                            <div className="sec-label">What the exercises showed</div>
                            <div className="ex-top">
                              <div className="dots">
                                {Array.from({ length: Math.max(3, stats.totalExercisesCount || 4) }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`dot ${i < (stats.exercisesCompletedCount || 0) ? 'dot-done' : 'dot-skip'}`}
                                  />
                                ))}
                              </div>
                              <div className="completion-text">
                                <strong>{stats.exercisesCompletedCount} of {stats.totalExercisesCount}</strong> completed this cycle
                              </div>
                            </div>

                            <div className="ex-list">
                              {/* Core Values / Baseline Assessment */}
                              {(() => {
                                const cbtEx = exercises?.items?.find(item =>
                                  item.name?.toLowerCase().includes('core values') ||
                                  item.name?.toLowerCase().includes('baseline') ||
                                  item.id === 'exercise_0' ||
                                  item.dayText?.includes('1') ||
                                  item.dayText?.includes('4')
                                );
                                if (cbtEx) {
                                  return (
                                    <div className="ex-row-card">
                                      <div className="ex-row-top">
                                        <div className="ex-name">{cbtEx.name || 'Core Values & Baseline Assessment'}</div>
                                        <div className="ex-day">{cbtEx.dayText || 'Day 1'}</div>
                                      </div>
                                      <div className="ex-cols">
                                        <div className="ex-col">
                                          <div className="ex-col-lbl lbl-e">Entries said</div>
                                          <div className="ex-col-text">{cbtEx.entriesSaid}</div>
                                        </div>
                                        <div className="ex-col-sep"></div>
                                        <div className="ex-col">
                                          <div className="ex-col-lbl lbl-x">Exercise showed</div>
                                          <div className="ex-col-text">{cbtEx.exerciseShowed}</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="ex-skip-row">
                                      <div className="ex-skip-dot"></div>
                                      <div className="ex-skip-text">Baseline / Core Values Assessment — not completed this cycle.</div>
                                    </div>
                                  );
                                }
                              })()}

                              {/* Emotional Vocabulary Wheel */}
                              {(() => {
                                const cbtEx = exercises?.items?.find(item =>
                                  item.name?.toLowerCase().includes('vocabulary') ||
                                  item.name?.toLowerCase().includes('word association') ||
                                  item.id === 'exercise_1' ||
                                  item.dayText?.includes('9') ||
                                  item.dayText?.includes('10')
                                );
                                if (cbtEx) {
                                  return (
                                    <div className="ex-row-card">
                                      <div className="ex-row-top">
                                        <div className="ex-name">{cbtEx.name || 'Emotional Vocabulary Wheel'}</div>
                                        <div className="ex-day">{cbtEx.dayText || 'Day 10'}</div>
                                      </div>
                                      <div className="ex-cols">
                                        <div className="ex-col">
                                          <div className="ex-col-lbl lbl-e">Entries said</div>
                                          <div className="ex-col-text">{cbtEx.entriesSaid}</div>
                                        </div>
                                        <div className="ex-col-sep"></div>
                                        <div className="ex-col">
                                          <div className="ex-col-lbl lbl-x">Exercise showed</div>
                                          <div className="ex-col-text">{cbtEx.exerciseShowed}</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="ex-skip-row">
                                      <div className="ex-skip-dot"></div>
                                      <div className="ex-skip-text">Emotional Vocabulary Wheel — not completed this cycle.</div>
                                    </div>
                                  );
                                }
                              })()}

                              {/* Self-Perception Check */}
                              {(() => {
                                const cbtEx = exercises?.items?.find(item =>
                                  item.name?.toLowerCase().includes('self-perception') ||
                                  item.name?.toLowerCase().includes('self perception') ||
                                  item.id === 'exercise_3' ||
                                  item.dayText?.includes('14') ||
                                  item.dayText?.includes('24') ||
                                  item.dayText?.includes('28')
                                );
                                if (cbtEx) {
                                  return (
                                    <div className="ex-row-card">
                                      <div className="ex-row-top">
                                        <div className="ex-name">{cbtEx.name || 'Self-Perception Check'}</div>
                                        <div className="ex-day">{cbtEx.dayText || 'Day 24'}</div>
                                      </div>
                                      <div className="ex-cols">
                                        <div className="ex-col">
                                          <div className="ex-col-lbl lbl-e">Entries said</div>
                                          <div className="ex-col-text">{cbtEx.entriesSaid}</div>
                                        </div>
                                        <div className="ex-col-sep"></div>
                                        <div className="ex-col">
                                          <div className="ex-col-lbl lbl-x">Exercise showed</div>
                                          <div className="ex-col-text">{cbtEx.exerciseShowed}</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="ex-skip-row">
                                      <div className="ex-skip-dot"></div>
                                      <div className="ex-skip-text">Self-Perception Check — not completed this cycle.</div>
                                    </div>
                                  );
                                }
                              })()}

                              {/* Additional completed exercises */}
                              {(() => {
                                const ex1 = exercises?.items?.find(item =>
                                  item.name?.toLowerCase().includes('core values') ||
                                  item.name?.toLowerCase().includes('baseline') ||
                                  item.id === 'exercise_0' ||
                                  item.dayText?.includes('1') ||
                                  item.dayText?.includes('4')
                                );
                                const ex2 = exercises?.items?.find(item =>
                                  item.name?.toLowerCase().includes('vocabulary') ||
                                  item.name?.toLowerCase().includes('word association') ||
                                  item.id === 'exercise_1' ||
                                  item.dayText?.includes('9') ||
                                  item.dayText?.includes('10')
                                );
                                const ex3 = exercises?.items?.find(item =>
                                  item.name?.toLowerCase().includes('self-perception') ||
                                  item.name?.toLowerCase().includes('self perception') ||
                                  item.id === 'exercise_3' ||
                                  item.dayText?.includes('14') ||
                                  item.dayText?.includes('24') ||
                                  item.dayText?.includes('28')
                                );
                                const matched = new Set([ex1, ex2, ex3].filter(Boolean));
                                const others = (exercises?.items || []).filter(item => !matched.has(item));
                                return others.map((item, idx) => (
                                  <div className="ex-row-card" key={`other-ex-${item.id || idx}`}>
                                    <div className="ex-row-top">
                                      <div className="ex-name">{item.name}</div>
                                      <div className="ex-day">{item.dayText || 'Completed'}</div>
                                    </div>
                                    <div className="ex-cols">
                                      <div className="ex-col">
                                        <div className="ex-col-lbl lbl-e">Entries said</div>
                                        <div className="ex-col-text">{item.entriesSaid || 'Reflective journaling entry recorded.'}</div>
                                      </div>
                                      <div className="ex-col-sep"></div>
                                      <div className="ex-col">
                                        <div className="ex-col-lbl lbl-x">Exercise showed</div>
                                        <div className="ex-col-text">{item.exerciseShowed || 'Pattern analysis completed.'}</div>
                                      </div>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>

                            <div className="collective">
                              <div className="collective-lbl">What the exercises showed together</div>
                              <div className="collective-text">{exercises.collectiveInsight || 'Completed cycle reframing tasks.'}</div>
                            </div>
                          </div>

                          <div className="divider"></div>

                          {/* 12. Where This Cycle Leaves You */}
                          <div className="sec">
                            <div className="sec-label">Where this cycle leaves you</div>
                            <div className="triage">
                              <div className="triage-lbl">{whereLeavesYou.title || 'Cycle complete'}</div>
                              <div className="triage-body" dangerouslySetInnerHTML={{ __html: (whereLeavesYou.body || '').replace(/\n\n/g, '<br><br>') }} />
                            </div>
                          </div>
                        </div>

                        {/* 13. Closing Quote */}
                        <div className="closing">
                          <div className="closing-quote">"{closingQuote.quote || ''}"</div>
                          <div className="closing-obs">{closingQuote.observation || ''}</div>
                        </div>

                        {/* 14. Footer */}
                        <div className="foot">
                          <button onClick={() => setViewState('list')} className="foot-link border-none bg-transparent hover:text-primary transition-colors cursor-pointer text-ocean-sage">
                            ← Back to progress
                          </button>
                          <div className="foot-center">Ingress Within · Cycle ${reportData.cycleNumber || 1} · Complete</div>
                          <div style={{ display: 'flex', gap: '14px' }}>
                            <button onClick={() => window.navigateTo('/write')} className="foot-link border-none bg-transparent hover:text-primary transition-colors cursor-pointer text-ocean-sage">
                              Write today's entry
                            </button>
                            <button onClick={() => downloadPdf(selectedAssessment, true)} className="foot-link border-none bg-transparent hover:text-primary transition-colors cursor-pointer text-ocean-sage">
                              Save as PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            );
          })()
        )}
      </main>
    </div>
  );
}
