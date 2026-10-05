import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth-helper';
import { STATIC_MODULE_CATALOG } from '../../../lib/modules/moduleCatalogService';
import { SEED_INTERVENTIONS } from '../../../lib/interventions/catalog/seed-data';
import { DICTIONARY_EMOTIONS, PATTERNS, FAMILIES, SITUATIONS } from '../../../lib/knowledge/dictionaryData';

// Authoritative list of published developmental milestone exercises
const DEVELOPMENTAL_EXERCISES = [
  {
    id: 'ocean',
    title: 'Baseline Assessment',
    category: 'Baseline',
    description: '12-question initial personality and self-perception assessment to establish your baseline.',
    path: '/exercise',
    tags: ['assessment', 'baseline', 'ocean', 'personality']
  },
  {
    id: 'word_association',
    title: 'Word Association',
    category: 'Cognitive',
    description: 'Projective linguistic mapping to uncover instinctual emotional associations.',
    path: '/exercise',
    tags: ['linguistic', 'associations', 'instinct']
  },
  {
    id: 'inkblot_projective',
    title: 'Projective Reflection',
    category: 'Projective',
    description: 'Ambiguous visual stimulus exercise exploring spontaneous perception and meaning-making.',
    path: '/exercise',
    tags: ['projective', 'visual', 'perception']
  },
  {
    id: 'self_perception',
    title: 'Self-Perception & Discrepancy',
    category: 'Self-Concept',
    description: 'Maps the gap between who you believe you are, who you project, and who you aspire to be.',
    path: '/exercise',
    tags: ['identity', 'self-concept', 'discrepancy']
  },
  {
    id: 'core_values',
    title: 'Core Values Card Sort',
    category: 'Values',
    description: 'Hierarchical values prioritization to clarify internal decision-making drivers.',
    path: '/exercise',
    tags: ['values', 'clarity', 'decision-making']
  },
  {
    id: 'relationship_map',
    title: 'Relationship Network Map',
    category: 'Relational',
    description: 'Identifies emotional dynamics, energy drains, and sources of safety across your interpersonal circle.',
    path: '/exercise',
    tags: ['relationships', 'boundaries', 'interpersonal']
  },
  {
    id: 'body_signal_inventory',
    title: 'Body Signal Inventory',
    category: 'Somatic',
    description: 'Somatic awareness exercise linking bodily sensations with emotional states and stress triggers.',
    path: '/exercise',
    tags: ['somatic', 'body', 'nervous-system']
  },
  {
    id: 'avoidance_audit',
    title: 'Avoidance Audit',
    category: 'Behavioral',
    description: 'Examines behaviors used to deflect anxiety, difficult conversations, or emotional truth.',
    path: '/exercise',
    tags: ['avoidance', 'cbt', 'defense-mechanisms']
  },
  {
    id: 'cost_benefit_audit',
    title: 'Cost-Benefit Analysis',
    category: 'Decision-Making',
    description: 'Rigorous cognitive audit of the hidden emotional payoff and actual toll of maintaining old patterns.',
    path: '/exercise',
    tags: ['cbt', 'patterns', 'habits']
  },
  {
    id: 'trigger_mapping',
    title: 'Trigger Mapping',
    category: 'Emotional Regulation',
    description: 'Traces the chain from environmental stimulus to emotional surge, bodily reaction, and behavioral impulse.',
    path: '/exercise',
    tags: ['triggers', 'regulation', 'awareness']
  },
  {
    id: 'narrative_arc',
    title: 'Narrative Arc Reconstruction',
    category: 'Narrative',
    description: 'Re-authors core life chapters to recognize resilience and unlearn disempowering interpretations.',
    path: '/exercise',
    tags: ['narrative', 'story', 'meaning-making']
  },
  {
    id: 'unfinished_conversation',
    title: 'Unfinished Conversation',
    category: 'Relational',
    description: 'Examines an unresolved interpersonal exchange, exploring what silence protects and what it costs.',
    path: '/exercise',
    tags: ['communication', 'grief', 'closure']
  },
  {
    id: 'recurring_scenario',
    title: 'Recurring Scenario Analysis',
    category: 'Cognitive',
    description: 'Analyzes anticipatory cognition and scripts rehearsed before, during, and after high-stakes interactions.',
    path: '/exercise',
    tags: ['anticipation', 'overthinking', 'scripts']
  },
  {
    id: 'year_end_portrait',
    title: 'Annual Self-Portrait',
    category: 'Integration',
    description: 'Synthesizes 12 months of self-reflection, recurring patterns, and internal shifts into a comprehensive portrait.',
    path: '/exercise',
    tags: ['reflection', 'milestone', 'growth']
  }
];

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  path: string;
  badge?: string;
  score: number;
}

export interface SearchGroup {
  key: string;
  category: string;
  items: SearchResultItem[];
}

function calculateRelevance(
  title: string,
  category: string,
  tags: string[],
  description: string,
  queryLower: string
): number {
  const titleLower = (title || '').toLowerCase();
  const categoryLower = (category || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const tagListLower = (tags || []).map((t) => (t || '').toLowerCase());

  let score = 0;

  // 1. Exact match on title
  if (titleLower === queryLower) {
    score += 100;
  }
  // 2. Title starts with query
  else if (titleLower.startsWith(queryLower)) {
    score += 80;
  }
  // 3. Title contains query as substring or word
  else if (titleLower.includes(queryLower)) {
    score += 60;
  }

  // 4. Category exact / partial match
  if (categoryLower === queryLower) {
    score += 45;
  } else if (categoryLower.includes(queryLower)) {
    score += 35;
  }

  // 5. Tags match
  if (tagListLower.some((t) => t === queryLower)) {
    score += 40;
  } else if (tagListLower.some((t) => t.includes(queryLower))) {
    score += 25;
  }

  // 6. Description contains query
  if (descLower.includes(queryLower)) {
    score += 20;
  }

  return score;
}

/**
 * GET /api/search?q=...
 * Authenticated global self-help search across discoverable psychoeducation,
 * techniques, emotion dictionary, patterns, and exercises.
 *
 * Privacy Guarantees:
 * - Strictly requires authenticated user session.
 * - Does not search private journal entries or user reflections.
 * - Does not expose internal, admin, or therapist-discovery records.
 * - Safe aggregate logging (query terms are not persisted to database).
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'You must be signed in to use self-help search.'
          }
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const query = rawQuery.trim().toLowerCase();

    // Fast return if query is empty or less than 2 characters
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        query: '',
        total: 0,
        groups: []
      });
    }

    // 2. Search Psychoeducation Modules (M1 - M18)
    const moduleResults: SearchResultItem[] = [];
    for (const mod of STATIC_MODULE_CATALOG) {
      if (mod.status && mod.status !== 'active') continue;
      const score = calculateRelevance(
        mod.name,
        'Psychoeducation Module',
        [mod.slug, ...(mod.taxonomy_concerns || [])],
        mod.description,
        query
      );

      if (score > 0) {
        moduleResults.push({
          id: mod.id,
          title: mod.name,
          subtitle: `${mod.duration_weeks}-week structured program`,
          description: mod.description,
          category: 'Psychoeducation Modules',
          path: `/modules/${mod.id}`,
          badge: `${mod.duration_weeks} Weeks`,
          score
        });
      }
    }

    // 3. Search Interventions & Techniques Catalog
    const interventionResults: SearchResultItem[] = [];
    for (const item of SEED_INTERVENTIONS) {
      const desc = item.short_description || item.long_description || '';
      const score = calculateRelevance(
        item.title,
        item.category.replace(/_/g, ' '),
        [item.completion_type, ...(item.tags || [])],
        desc,
        query
      );

      if (score > 0) {
        const catFormatted = item.category
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        interventionResults.push({
          id: item.id,
          title: item.title,
          subtitle: `${item.duration_minutes || item.estimated_duration || 5} min · ${catFormatted}`,
          description: desc,
          category: 'Techniques & Practices',
          path: `/interventions`,
          badge: `${item.duration_minutes || item.estimated_duration || 5}m`,
          score
        });
      }
    }

    // 4. Search Emotion Dictionary & Knowledge Bank
    const knowledgeResults: SearchResultItem[] = [];
    for (const [emotionName, data] of Object.entries(DICTIONARY_EMOTIONS)) {
      const akaWords = (data.aka || '').split('·').map((s: string) => s.trim());
      const bodyHints = (data.body || []).join(' ');
      const confusedWords = (data.cw || []).map((c: any) => `${c.n} ${c.d}`).join(' ');

      const score = calculateRelevance(
        emotionName,
        data.fam || 'Emotion',
        akaWords,
        `${data.plain || ''} ${bodyHints} ${confusedWords}`,
        query
      );

      if (score > 0) {
        knowledgeResults.push({
          id: `emotion-${emotionName.toLowerCase()}`,
          title: emotionName,
          subtitle: data.aka ? `Also known as: ${data.aka}` : `${data.fam} family`,
          description: data.plain || '',
          category: 'Emotional Vocabulary & Dictionary',
          path: `/knowledge`,
          badge: data.fam,
          score
        });
      }
    }

    // 5. Search Behavioral Patterns
    const patternResults: SearchResultItem[] = [];
    const allPatterns = Array.isArray(PATTERNS) ? PATTERNS : [];
    for (const pat of allPatterns) {
      const name = typeof pat === 'string' ? pat : pat.name;
      const desc = typeof pat === 'object' && pat.desc ? pat.desc : 'Recurring behavioral theme tracked in self-reflection.';
      const score = calculateRelevance(name, 'Pattern', ['behavior', 'reflection'], desc, query);

      if (score > 0) {
        patternResults.push({
          id: `pat-${name.toLowerCase().replace(/\s+/g, '-')}`,
          title: name,
          subtitle: 'Behavioral Pattern',
          description: desc,
          category: 'Behavioral Patterns',
          path: `/patterns`,
          badge: 'Pattern',
          score
        });
      }
    }

    // 6. Search Developmental Exercises
    const exerciseResults: SearchResultItem[] = [];
    for (const ex of DEVELOPMENTAL_EXERCISES) {
      const score = calculateRelevance(
        ex.title,
        ex.category,
        ex.tags,
        ex.description,
        query
      );

      if (score > 0) {
        exerciseResults.push({
          id: `ex-${ex.id}`,
          title: ex.title,
          subtitle: `${ex.category} Exercise`,
          description: ex.description,
          category: 'Developmental Exercises',
          path: ex.path,
          badge: ex.category,
          score
        });
      }
    }

    // Sort each group descending by relevance score, limit to top 6 per group
    const sortByScore = (a: SearchResultItem, b: SearchResultItem) => b.score - a.score;
    moduleResults.sort(sortByScore);
    interventionResults.sort(sortByScore);
    knowledgeResults.sort(sortByScore);
    patternResults.sort(sortByScore);
    exerciseResults.sort(sortByScore);

    const groups: SearchGroup[] = [];

    if (moduleResults.length > 0) {
      groups.push({
        key: 'modules',
        category: 'Psychoeducation Modules',
        items: moduleResults.slice(0, 5)
      });
    }

    if (interventionResults.length > 0) {
      groups.push({
        key: 'interventions',
        category: 'Techniques & Practices',
        items: interventionResults.slice(0, 5)
      });
    }

    if (knowledgeResults.length > 0) {
      groups.push({
        key: 'knowledge',
        category: 'Emotional Vocabulary & Dictionary',
        items: knowledgeResults.slice(0, 5)
      });
    }

    if (patternResults.length > 0) {
      groups.push({
        key: 'patterns',
        category: 'Behavioral Patterns',
        items: patternResults.slice(0, 5)
      });
    }

    if (exerciseResults.length > 0) {
      groups.push({
        key: 'exercises',
        category: 'Developmental Exercises',
        items: exerciseResults.slice(0, 5)
      });
    }

    const totalMatches = groups.reduce((acc, g) => acc + g.items.length, 0);

    return NextResponse.json({
      success: true,
      query: rawQuery,
      total: totalMatches,
      groups
    });

  } catch (error) {
    console.error('[GET /api/search] Error executing global search:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Search is temporarily unavailable. Please try again.'
        }
      },
      { status: 500 }
    );
  }
}
