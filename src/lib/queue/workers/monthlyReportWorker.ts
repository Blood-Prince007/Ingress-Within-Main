import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';

export async function processMonthlyReport(jobData: {
  cycle_id: string;
  user_id: string;
  assessment_id?: string;
  monthly_score_id?: string;
  month_number?: number;
}) {
  const { cycle_id, user_id, assessment_id, monthly_score_id, month_number } = jobData;

  console.log(`[Monthly Report Worker] Processing monthly report for user ${user_id} cycle ${cycle_id}`);

  // 1. Fetch entries for the cycle (joining reflections)
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('*, reflections(*)')
    .eq('cycle_id', cycle_id)
    .eq('user_id', user_id)
    .order('cycle_day', { ascending: true });

  if (entriesError) {
    throw new Error(`Failed to fetch entries: ${entriesError.message}`);
  }

  const validEntries = (entries || []).filter(e => e.entry_type !== 'empty');
  const entry_count = validEntries.length;

  // 3. Compute Averages (handling sparse/zero entry cycles gracefully)
  const ei_avg = entry_count > 0 
    ? parseFloat((validEntries.reduce((sum, e) => sum + Number(e.day_ei || 5), 0) / entry_count).toFixed(2))
    : 5.0;
  const pr_avg = entry_count > 0 
    ? parseFloat((validEntries.reduce((sum, e) => sum + Number(e.day_pr || 5), 0) / entry_count).toFixed(2))
    : 5.0;
  const sa_avg = entry_count > 0 
    ? parseFloat((validEntries.reduce((sum, e) => sum + Number(e.day_sa || 5), 0) / entry_count).toFixed(2))
    : 5.0;

  // 4. Derive Distress Trajectory (DT)
  let dt_score = 5.0;
  if (entry_count > 1) {
    const sorted = [...validEntries].sort((a, b) => {
      const timeA = new Date(a.written_at || a.created_at).getTime();
      const timeB = new Date(b.written_at || b.created_at).getTime();
      return timeA - timeB;
    });

    const midpoint = Math.floor(sorted.length / 2);
    const early = sorted.slice(0, midpoint);
    const late = sorted.slice(midpoint);

    const early_ei = early.reduce((sum, e) => sum + Number(e.day_ei || 5), 0) / (early.length || 1);
    const early_pr = early.reduce((sum, e) => sum + Number(e.day_pr || 5), 0) / (early.length || 1);
    const early_sa = early.reduce((sum, e) => sum + Number(e.day_sa || 5), 0) / (early.length || 1);

    const late_ei = late.reduce((sum, e) => sum + Number(e.day_ei || 5), 0) / (late.length || 1);
    const late_pr = late.reduce((sum, e) => sum + Number(e.day_pr || 5), 0) / (late.length || 1);
    const late_sa = late.reduce((sum, e) => sum + Number(e.day_sa || 5), 0) / (late.length || 1);

    const ei_traj = early_ei - late_ei;
    const pr_traj = early_pr - late_pr;
    const sa_traj = late_sa - early_sa; // Flipped: positive is improvement

    const raw_dt = (ei_traj + pr_traj + sa_traj) / 3;
    dt_score = parseFloat((10 - ((raw_dt + 9) / 18 * 9)).toFixed(2));
  }

  // 5. Normalised SA and Risk Total
  const normalised_sa = parseFloat((11 - sa_avg).toFixed(2));
  const risk_total = Math.round(ei_avg + pr_avg + normalised_sa + dt_score);

  // 6. Path Assignment (Stability Gate check first)
  let path_assignment = 'second_cycle';
  let stability_gate_triggered = false;

  if (ei_avg >= 8 && pr_avg >= 7 && sa_avg <= 3 && dt_score >= 7) {
    path_assignment = 'professional_pathway_supported';
    stability_gate_triggered = true;
  } else {
    if (risk_total <= 15) {
      path_assignment = 'maintenance';
    } else if (risk_total <= 29) {
      path_assignment = 'second_cycle';
    } else if (risk_total <= 35) {
      path_assignment = 'professional_pathway_supported';
    } else {
      path_assignment = 'professional_pathway_referred';
    }
  }

  // 7. Branch Assignment
  let branch_assignment = 'A';
  if (ei_avg <= 3 && pr_avg >= 7) {
    branch_assignment = 'C';
  } else if (ei_avg >= 7 && pr_avg <= 6) {
    branch_assignment = 'D';
  } else if (pr_avg >= 7) {
    branch_assignment = 'A';
  } else if (sa_avg <= 3) {
    branch_assignment = 'B';
  } else {
    const normalised_sa_for_branch = 11 - sa_avg;
    const highest = Math.max(ei_avg, pr_avg, normalised_sa_for_branch);
    if (pr_avg === highest) {
      branch_assignment = 'A';
    } else if (ei_avg === highest) {
      branch_assignment = 'D';
    } else if (normalised_sa_for_branch === highest) {
      branch_assignment = 'B';
    } else {
      branch_assignment = 'A';
    }
  }

  // 8. Decrypt entries for AI Report Generation (including completed reflection answers)
  const formattedEntries = validEntries.map(e => {
    const text = decrypt(e.new_entry_text_encrypted, e.new_entry_text_iv) || e.content;
    let content = text || '';

    const rawReflection = e.reflections;
    const reflection = Array.isArray(rawReflection)
      ? (rawReflection[0] || null)
      : (rawReflection || null);

    if (reflection && reflection.status === 'completed' && reflection.reflection_answer) {
      content += `\n[Reflection Question]: ${reflection.closing_question}\n[User Reflection Response]: ${reflection.reflection_answer}`;
    }

    return {
      content: content,
      created_at: e.written_at || e.created_at
    };
  });

  try {
    // 9. Collect Platform Intelligence Data
    const { data: weeklySummaries } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('cycle_id', cycle_id)
      .eq('status', 'READY')
      .order('week_number', { ascending: true });

    const { data: cycleObj } = await supabase
      .from('cycles')
      .select('cycle_number, start_date, end_date')
      .eq('id', cycle_id)
      .maybeSingle();

    const { fetchCompletedExercisesForCycle } = await import('../../reports/cycleReportBuilder');
    const completedExercises = await fetchCompletedExercisesForCycle(user_id, cycleObj, [cycle_id, String(cycleObj?.cycle_number || 1)]);

    const { data: vocabExts } = await supabase
      .from('vocab_extractions')
      .select('word, normalized_word, sentence')
      .in('entry_id', validEntries.map(e => e.id));

    // Decrypt journal entries and gather candidate user quotes
    const candidateQuotes: string[] = [];
    const decryptedEntries = validEntries.map(e => {
      const text = decrypt(e.new_entry_text_encrypted, e.new_entry_text_iv) || e.content || '';
      // Extract candidate quotes (sentences of 6 to 25 words)
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
      sentences.forEach(s => {
        const words = s.split(/\s+/).filter(Boolean);
        if (words.length >= 6 && words.length <= 25) {
          candidateQuotes.push(s);
        }
      });
      return {
        content: text,
        created_at: e.written_at || e.created_at,
        day: e.cycle_day
      };
    });

    // Populate fallback candidate quotes if none found
    if (candidateQuotes.length === 0) {
      candidateQuotes.push("I need to focus on what I can control.");
      candidateQuotes.push("Things at work have been exhausting recently.");
      candidateQuotes.push("Taking some space to write down my thoughts has been useful.");
    }

    // Vocabulary count aggregates
    const vocabCounts: { [key: string]: { word: string; count: number } } = {};
    (vocabExts || []).forEach(v => {
      const norm = (v.normalized_word || v.word || '').toLowerCase().trim();
      if (!norm) return;
      if (!vocabCounts[norm]) {
        vocabCounts[norm] = { word: v.normalized_word || v.word, count: 0 };
      }
      vocabCounts[norm].count++;
    });
    const sortedVocab = Object.values(vocabCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topWord = sortedVocab[0]?.word || 'fine';
    const topWordFreq = sortedVocab[0]?.count || 0;

    // Timeline written vs skipped days
    const totalDays = 30;
    const timelineWritten: (number | null)[] = Array(totalDays).fill(null);
    const timelineSkipped: (number | null)[] = Array(totalDays).fill(null);

    for (let day = 1; day <= totalDays; day++) {
      const dayEntry = validEntries.find(e => e.cycle_day === day);
      if (dayEntry) {
        const ei = Number(dayEntry.day_ei || 5);
        const pr = Number(dayEntry.day_pr || 5);
        const sa = Number(dayEntry.day_sa || 5);
        timelineWritten[day - 1] = parseFloat(((ei + pr + sa) / 3).toFixed(1));
        timelineSkipped[day - 1] = null;
      } else {
        timelineWritten[day - 1] = null;
        timelineSkipped[day - 1] = 1;
      }
    }


    const cycleNum = cycleObj?.cycle_number || 1;
    const startDateFormatted = cycleObj?.start_date
      ? new Date(cycleObj.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : '1 May';
    const endDateFormatted = cycleObj?.end_date
      ? new Date(cycleObj.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '30 May 2026';

    const exercisesCompletedCount = completedExercises?.length || 0;
    const baseTotalExercises = (cycleObj?.cycle_number || 1) === 1 ? 4 : 3;
    const totalExercisesCount = Math.max(baseTotalExercises, exercisesCompletedCount);

    let compiledReport: any = null;

    try {
      // Build the AI Prompt
      const prompt = `You are an experienced clinical psychologist writing a Day 28 Cycle Summary Report for a user who has completed a 30-day journal reflection cycle.
Write in a calm, observational, direct, and precise therapist voice.
DO NOT use motivational speaker, coaching, or AI assistant language. Avoid phrases like "You're growing", "Keep going", "Amazing progress", "We are proud of you", "Healing journey", or "Growth mindset". Do not validate emotions unnecessarily. Use objective clinical observation based strictly on evidence.

INPUT DATA:
- Decrypted entries for the month: ${JSON.stringify(decryptedEntries.slice(0, 40))}
- Weekly summaries: ${JSON.stringify(weeklySummaries)}
- Completed cognitive reframing exercises: ${JSON.stringify(completedExercises)}
- Vocabulary count aggregates: ${JSON.stringify(sortedVocab)}
- Candidate user quotes (you MUST choose one of these exact quotes where requested, do not fabricate or alter them):
  ${JSON.stringify(candidateQuotes.slice(0, 50))}
- Pathway assignment: ${path_assignment}
- Branch code: ${branch_assignment}

Format your response as a strict JSON object with the following schema:
{
  "whatThisCycleShowed": {
    "openingObs": "A short, two-line italic observation of their month (e.g. 'The situations kept changing.\\nWhat you felt inside them mostly did not.')",
    "pulledQuote": "A single exact quote selected from the candidate quotes pool above.",
    "narrative": "A clinical synthesis paragraph summarizing their writing history, week-by-week progression, and cognitive shifts."
  },
  "patterns": [
    {
      "name": "Name of pattern 1",
      "tag": "Most dominant",
      "tagClass": "tag-red",
      "mechanism": "Clinical explanation of the repeating sequence of this pattern.",
      "cost": "What this pattern costs the user in terms of agency, growth, or self-clarity.",
      "confidence": 0.9,
      "supportingEvidence": ["Real quote from entries indicating this pattern"],
      "loopNodes": [
        { "step": 1, "title": "Step 1 title (MUST be 1-2 words, max 10 chars, e.g. 'Happens')", "sub": "subtitle (MUST be 1-2 words, max 12 chars, e.g. 'at work')" },
        { "step": 2, "title": "Step 2 title (MUST be 1-2 words, max 10 chars, e.g. 'Notice')", "sub": "subtitle (MUST be 1-2 words, max 12 chars, e.g. 'name it')" },
        { "step": 3, "title": "Step 3 title (MUST be 1-2 words, max 10 chars, e.g. 'Dismiss')", "sub": "subtitle (MUST be 1-2 words, max 12 chars, e.g. 'probably fine')" },
        { "step": 4, "title": "Step 4 title (MUST be 1-2 words, max 10 chars, e.g. 'Say okay')", "sub": "subtitle (MUST be 1-2 words, max 12 chars, e.g. 'move on')" }
      ]
    }
  ],
  "recurringThemes": [
    {
      "name": "Theme name",
      "frequencyText": "Weeks observed (e.g. 'Weeks 1 and 4')",
      "percentage": 80,
      "color": "#E0A898",
      "description": "Brief description of how it manifested.",
      "contraInsight": "Comparison with exercises showing contradictions (e.g., 'Entries said this, but the Core Values exercise showed...')"
    }
  ],
  "wordsReachedFor": {
    "analysisNote": "Analysis note about their top emotional words (e.g., 'Fine appeared more than tired and frustrated combined...')",
    "unusedWords": [
      {
        "word": "tired",
        "synonyms": ["exhausted", "depleted"]
      }
    ]
  },
  "fourThingsWeTracked": [
    {
      "label": "How stuck the patterns were",
      "color": "#E0A898",
      "title": "Pattern persistence",
      "desc": "Clinical evaluation of pattern rigidity based on entries this cycle."
    },
    {
      "label": "How intense things felt",
      "color": "#B8A8D4",
      "title": "Emotional intensity",
      "desc": "Clinical evaluation of emotional intensity and volatility."
    },
    {
      "label": "How much you felt in control",
      "color": "#8DBFB4",
      "title": "Self-agency",
      "desc": "Clinical evaluation of self-agency vs reactive/passive stance."
    },
    {
      "label": "Which direction things moved",
      "color": "#8DBFB4",
      "title": "Overall stability",
      "desc": "Clinical evaluation of overall stability and movement trend."
    }
  ],
  "peopleWhoShowedUp": [
    {
      "name": "Person name/relationship (e.g. 'Your manager')",
      "frequency": "Frequency text",
      "description": "Clinical summary of their presence."
    }
  ],
  "saidVsShowed": {
    "said": ["Statement 1", "Statement 2"],
    "showed": ["Evidence 1", "Evidence 2"],
    "analysisNote": "Concluding comparative note."
  },
  "exercises": {
    "collectiveInsight": "Insight combining values and vocab exercises.",
    "items": [
      {
        "name": "CBT Reframing",
        "dayText": "Day X",
        "status": "completed",
        "entriesSaid": "Brief summary of entry text.",
        "exerciseShowed": "Brief summary of exercise reframing."
      }
    ]
  },
  "whereLeavesYou": {
    "title": "Cycle X complete",
    "body": "Concluding calm triage paragraph."
  },
  "closingQuote": {
    "quote": "A single exact quote selected from the candidate quotes pool above.",
    "observation": "Observation commentary on their quote."
  }
}

Generate up to 3 patterns, up to 3 recurring themes, and up to 3 people who showed up. Fill in exercise items corresponding to completed reframing tasks or general cycle milestones.
Do not include markdown wrappers (like \`\`\`json) in your raw response. Return only the raw JSON.`;

      const aiStartTime = Date.now();
      const rawResponse = await aiProvider.callRaw(prompt);
      const actualProvider = (aiProvider as any).lastProviderUsed || process.env.AI_PROVIDER || 'claude';
      const actualModel = (aiProvider as any).model || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
      const fallbackUsed = (aiProvider as any).lastFallbackUsed || false;
      const primaryProvider = (aiProvider as any).lastPrimaryProvider || 'claude';

      let cleaned = rawResponse.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }
      const aiReport = JSON.parse(cleaned);

      if (
        !aiReport ||
        typeof aiReport !== 'object' ||
        !aiReport.whatThisCycleShowed?.openingObs ||
        !aiReport.whereLeavesYou?.body ||
        !Array.isArray(aiReport.patterns) ||
        aiReport.patterns.length === 0
      ) {
        throw new Error('AI report response missing essential sections (whatThisCycleShowed/patterns/whereLeavesYou)');
      }

      // Ensure exactly 4 items in fourThingsWeTracked
      const defaults = [
        { label: "How stuck the patterns were", color: "#E0A898", title: "Pattern persistence", desc: "Analysis of pattern rigidity based on entries." },
        { label: "How intense things felt", color: "#B8A8D4", title: "Emotional intensity", desc: "Analysis of emotional variance and intensity based on entries." },
        { label: "How much you felt in control", color: "#8DBFB4", title: "Self-agency", desc: "Analysis of agency vs reactivity/situational framing in entries." },
        { label: "Which direction things moved", color: "#8DBFB4", title: "Overall stability", desc: "Analysis of overall emotional stability/direction and shift across the cycle." }
      ];
      if (!Array.isArray(aiReport.fourThingsWeTracked)) {
        aiReport.fourThingsWeTracked = defaults;
      } else {
        aiReport.fourThingsWeTracked = defaults.map((def, idx) => {
          const item = aiReport.fourThingsWeTracked[idx];
          if (!item) return def;
          return {
            label: item.label || def.label,
            color: def.color, // Always enforce CSS styling color token
            title: item.title || def.title,
            desc: item.desc || def.desc
          };
        });
      }

      compiledReport = {
        ...aiReport,
        cycleNumber: cycleNum,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        stats: {
          entriesCount: entry_count,
          totalDays: totalDays,
          daysSkipped: totalDays - entry_count,
          mostUsedWord: topWord,
          mostUsedWordFreq: topWordFreq,
          mostUsedWordContext: `${topWordFreq} times, always about yourself`,
          exercisesCompletedCount,
          totalExercisesCount,
          missedExercisesText: exercisesCompletedCount >= totalExercisesCount ? 'All completed' : (exercisesCompletedCount === 0 ? `${totalExercisesCount} pending` : `${totalExercisesCount - exercisesCompletedCount} pending`)
        },
        exercises: (aiReport?.exercises?.items && aiReport.exercises.items.length > 0) ? aiReport.exercises : {
          collectiveInsight: exercisesCompletedCount > 0
            ? `Completed ${exercisesCompletedCount} reframing and assessment tasks during Cycle ${cycleNum}.`
            : `No cognitive reframing exercises completed this cycle.`,
          items: (completedExercises || []).map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            dayText: ex.dayText,
            status: ex.status || 'completed',
            entriesSaid: ex.entriesSaid,
            exerciseShowed: ex.exerciseShowed
          }))
        },
        chartData: {
          arcChart: {
            writtenDays: timelineWritten,
            skippedDays: timelineSkipped
          },
          radarChart: {
            patternPersistence: Math.round(pr_avg * 10),
            emotionalIntensity: Math.round(ei_avg * 10),
            agency: Math.round(sa_avg * 10),
            overallDirection: Math.round(dt_score * 10)
          }
        }
      };

      // Record to ai_observability
      try {
        await supabase.from('ai_observability').insert({
          entry_id: assessment_id || monthly_score_id || null,
          provider: actualProvider,
          raw_provider_response: rawResponse || JSON.stringify(aiReport),
          parsed_response: {
            ...aiReport,
            _metadata: {
              module: 'monthly_report',
              cycle_id,
              user_id,
              assessment_id,
              monthly_score_id,
              fallback_used: fallbackUsed,
              primary_provider: primaryProvider,
              usage: (aiProvider as any).lastUsage || null
            }
          },
          validation_result: {
            status: 'passed',
            path_assignment,
            branch_assignment,
            fallback_used: fallbackUsed,
            primary_provider: primaryProvider
          },
          processing_time: Date.now() - aiStartTime,
          retry_count: fallbackUsed ? 1 : 0,
          error_reason: null
        });
      } catch (obsErr) {
        console.warn('[Monthly Report Worker] Failed to write ai_observability:', obsErr);
      }
    } catch (parseErr: any) {
      console.error('[Monthly Report Worker] AI JSON generation failed, compiling real cycle report fallback:', parseErr.message);
      const { resolveCycleAndEntries, compileRealCycleReport } = await import('../../reports/cycleReportBuilder');
      const reportContext = await resolveCycleAndEntries(user_id, cycle_id);
      compiledReport = compileRealCycleReport(reportContext);
    }

    if (
      !compiledReport?.whatThisCycleShowed?.openingObs ||
      !compiledReport?.whereLeavesYou?.body ||
      !Array.isArray(compiledReport?.patterns) ||
      compiledReport.patterns.length === 0
    ) {
      const { resolveCycleAndEntries, compileRealCycleReport } = await import('../../reports/cycleReportBuilder');
      const reportContext = await resolveCycleAndEntries(user_id, cycle_id);
      const baseline = compileRealCycleReport(reportContext);
      compiledReport = {
        ...baseline,
        ...(compiledReport || {}),
        whatThisCycleShowed: compiledReport?.whatThisCycleShowed?.openingObs ? compiledReport.whatThisCycleShowed : baseline.whatThisCycleShowed,
        whereLeavesYou: compiledReport?.whereLeavesYou?.body ? compiledReport.whereLeavesYou : baseline.whereLeavesYou,
        patterns: Array.isArray(compiledReport?.patterns) && compiledReport.patterns.length > 0 ? compiledReport.patterns : baseline.patterns,
        recurringThemes: Array.isArray(compiledReport?.recurringThemes) && compiledReport.recurringThemes.length > 0 ? compiledReport.recurringThemes : baseline.recurringThemes,
        wordsReachedFor: compiledReport?.wordsReachedFor?.analysisNote ? compiledReport.wordsReachedFor : baseline.wordsReachedFor,
        fourThingsWeTracked: Array.isArray(compiledReport?.fourThingsWeTracked) && compiledReport.fourThingsWeTracked.length === 4 ? compiledReport.fourThingsWeTracked : baseline.fourThingsWeTracked,
        saidVsShowed: compiledReport?.saidVsShowed?.analysisNote ? compiledReport.saidVsShowed : baseline.saidVsShowed,
        exercises: compiledReport?.exercises?.items ? compiledReport.exercises : baseline.exercises,
        closingQuote: compiledReport?.closingQuote?.quote ? compiledReport.closingQuote : baseline.closingQuote,
      };
    }

    const reportTextPayload = JSON.stringify(compiledReport);

    // 10. Update assessments Table (Day 30 Report)
    if (assessment_id) {
      const { error: updateAssessmentError } = await supabase
        .from('assessments')
        .update({
          ei_avg,
          pr_avg,
          sa_avg,
          dt_score,
          normalised_sa,
          risk_total,
          path_assignment,
          branch_assignment,
          stability_gate_triggered,
          entry_count,
          generation_status: 'ready',
          report_text: reportTextPayload,
          generated_at: new Date().toISOString()
        })
        .eq('id', assessment_id);

      if (updateAssessmentError) {
        throw new Error(`Failed to update assessments table: ${updateAssessmentError.message}`);
      }
    }

    // 11. Handle subsequent Month-over-Month Delta Routing
    if (monthly_score_id || month_number) {
      const actualMonth = month_number || 2;

      // Fetch prior score baseline (either prior monthly score or Day 30 assessment)
      let prior: any = null;
      const { data: priorMonthlyScores } = await supabase
        .from('monthly_scores')
        .select('*')
        .eq('user_id', user_id)
        .lt('month_number', actualMonth)
        .order('month_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (priorMonthlyScores) {
        prior = {
          ei_score: Number(priorMonthlyScores.ei_score),
          pr_score: Number(priorMonthlyScores.pr_score),
          sa_score: Number(priorMonthlyScores.sa_score),
          dt_score: Number(priorMonthlyScores.dt_score),
          consecutive_worsening_count: priorMonthlyScores.consecutive_worsening_count || 0,
          consecutive_improvement_count: priorMonthlyScores.consecutive_improvement_count || 0,
          routing_action: priorMonthlyScores.routing_action
        };
      } else {
        const { data: assessment } = await supabase
          .from('assessments')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();
        
        if (assessment) {
          prior = {
            ei_score: Number(assessment.ei_avg),
            pr_score: Number(assessment.pr_avg),
            sa_score: Number(assessment.sa_avg),
            dt_score: Number(assessment.dt_score),
            consecutive_worsening_count: 0,
            consecutive_improvement_count: 0,
            routing_action: 'no_change'
          };
        }
      }

      // Compute Deltas
      let ei_delta = 0;
      let pr_delta = 0;
      let sa_delta = 0;
      let dt_delta = 0;

      if (prior) {
        ei_delta = ei_avg - prior.ei_score;
        pr_delta = pr_avg - prior.pr_score;
        sa_delta = sa_avg - prior.sa_score; // positive = improving
        dt_delta = dt_score - prior.dt_score;
      }

      // Watch dimension based on user branch
      let primary_dimension: 'EI' | 'PR' | 'SA' | 'both_EI_PR' = 'PR';
      if (branch_assignment === 'A') primary_dimension = 'PR';
      else if (branch_assignment === 'B') primary_dimension = 'SA';
      else if (branch_assignment === 'C') primary_dimension = 'both_EI_PR';
      else if (branch_assignment === 'D') primary_dimension = 'EI';

      // Worsening / Improving evaluation
      let primary_worsening = false;
      let primary_improving = false;

      if (primary_dimension === 'both_EI_PR') {
        primary_worsening = (ei_delta >= 2) || (pr_delta >= 2);
        primary_improving = (ei_delta <= -2) && (pr_delta <= -2);
      } else if (primary_dimension === 'PR') {
        primary_worsening = pr_delta >= 2;
        primary_improving = pr_delta <= -2;
      } else if (primary_dimension === 'EI') {
        primary_worsening = ei_delta >= 2;
        primary_improving = ei_delta <= -2;
      } else if (primary_dimension === 'SA') {
        primary_worsening = sa_delta <= -2;
        primary_improving = sa_delta >= 2;
      }

      // Spike and Recover check (Month number - 2)
      let flag_spike_recovery = false;
      let routing_action = 'no_change';

      const { data: priorPriorRecord } = await supabase
        .from('monthly_scores')
        .select('*')
        .eq('user_id', user_id)
        .eq('month_number', actualMonth - 2)
        .maybeSingle();

      if (prior && prior.routing_action === 'step_back' && priorPriorRecord) {
        let isRecovered = false;
        if (primary_dimension === 'PR') {
          isRecovered = Math.abs(pr_avg - Number(priorPriorRecord.pr_score)) < 2;
        } else if (primary_dimension === 'EI') {
          isRecovered = Math.abs(ei_avg - Number(priorPriorRecord.ei_score)) < 2;
        } else if (primary_dimension === 'SA') {
          isRecovered = Math.abs(sa_avg - Number(priorPriorRecord.sa_score)) < 2;
        } else if (primary_dimension === 'both_EI_PR') {
          isRecovered = Math.abs(pr_avg - Number(priorPriorRecord.pr_score)) < 2 &&
                        Math.abs(ei_avg - Number(priorPriorRecord.ei_score)) < 2;
        }

        if (isRecovered) {
          routing_action = 'no_change';
          flag_spike_recovery = true;
        }
      }

      // Routing decisions (if no spike recovery triggered)
      let consecutive_improvement_count = 0;
      let consecutive_worsening_count = 0;
      let professional_nudge_active = false;

      if (!flag_spike_recovery) {
        if (primary_improving) {
          consecutive_improvement_count = (prior?.consecutive_improvement_count || 0) + 1;
          consecutive_worsening_count = 0;
          routing_action = 'advance';
        } else if (primary_worsening) {
          consecutive_worsening_count = (prior?.consecutive_worsening_count || 0) + 1;
          consecutive_improvement_count = 0;
          if (consecutive_worsening_count >= 2) {
            routing_action = 'professional_nudge';
            professional_nudge_active = true;
          } else {
            routing_action = 'step_back';
          }
        } else {
          consecutive_worsening_count = 0;
          consecutive_improvement_count = 0;
          routing_action = 'no_change';
        }
      }

      const scorePayload = {
        user_id,
        assessment_id: assessment_id || null,
        month_number: actualMonth,
        window_start: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString().split('T')[0], // 28 days back
        window_end: new Date().toISOString().split('T')[0],
        ei_score: ei_avg,
        pr_score: pr_avg,
        sa_score: sa_avg,
        dt_score: dt_score,
        ei_delta,
        pr_delta,
        sa_delta,
        dt_delta,
        primary_dimension,
        routing_action,
        professional_nudge_active,
        consecutive_worsening_count,
        consecutive_improvement_count,
        flag_spike_recovery,
        entry_count,
        generation_status: 'ready',
        report_text: reportTextPayload,
        generated_at: new Date().toISOString()
      };

      if (monthly_score_id) {
        const { error: scoreUpdateError } = await supabase
          .from('monthly_scores')
          .update(scorePayload)
          .eq('id', monthly_score_id);

        if (scoreUpdateError) {
          throw new Error(`Failed to update monthly_scores row: ${scoreUpdateError.message}`);
        }
      } else {
        // Upsert based on unique constraint (user_id, month_number)
        const { error: scoreInsertError } = await supabase
          .from('monthly_scores')
          .upsert(scorePayload, { onConflict: 'user_id,month_number' });

        if (scoreInsertError) {
          throw new Error(`Failed to insert monthly_scores row: ${scoreInsertError.message}`);
        }
      }
    }

    console.log(`[Monthly Report Worker] Successfully processed monthly report for user ${user_id}`);

    // Emit AssessmentCompleted event
    try {
      const { KnowledgeService } = await import('../../knowledge/knowledgeService');
      await KnowledgeService.emitKnowledgeEvent(
        user_id,
        cycle_id,
        null,
        'AssessmentCompleted',
        'monthly_report_worker',
        { assessment_id: assessment_id }
      );
    } catch (assErr: any) {
      console.error(`[Monthly Report Worker] Failed to emit AssessmentCompleted event:`, assErr.message);
    }
  } catch (err: any) {
    console.error(`[Monthly Report Worker] Error generating monthly report:`, err);
    if (assessment_id) {
      await supabase.from('assessments').update({ generation_status: 'failed' }).eq('id', assessment_id);
    }
    if (monthly_score_id) {
      await supabase.from('monthly_scores').update({ generation_status: 'failed' }).eq('id', monthly_score_id);
    }
    throw err;
  }
}
