import { Queue } from 'bullmq';
import { defaultQueueOptions } from './config';

export const QUEUE_NAMES = {
  ENTRY_SCORING: 'entry_scoring',
  REFLECTION_GENERATION: 'reflection_generation',
  WEEKLY_SUMMARY_GENERATION: 'weekly_summary_generation',
  MONTHLY_REPORT_GENERATION: 'monthly_report_generation',
  OCEAN_SUMMARY_GENERATION: 'ocean_summary_generation',
  CRISIS_DETECTION: 'crisis_detection',
  VOCAB_PROCESSING: 'vocab_processing',
  INTELLIGENCE_REBUILD: 'intelligence_rebuild',
  PATTERN_PROCESSING: 'pattern_processing',
  KNOWLEDGE_PROCESSING: 'knowledge_processing',
  TRANSACTIONAL_EMAIL: 'transactional_email',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

class QueueRegistry {
  private queues: Map<string, Queue> = new Map();

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues() {
    if (process.env.BYPASS_REDIS === 'true') {
      console.log('[Queue Registry] BYPASS_REDIS is enabled. Skipping BullMQ queue instantiation.');
      return;
    }
    Object.values(QUEUE_NAMES).forEach((queueName) => {
      this.queues.set(
        queueName,
        new Queue(queueName, defaultQueueOptions)
      );
    });
    console.log(`[Queue Registry] Instantiated ${this.queues.size} BullMQ queues.`);
  }

  public getQueue(name: QueueName): Queue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue "${name}" not found in registry.`);
    }
    return queue;
  }

  public async addJob(
    queueName: QueueName | 'intelligence_rebuild',
    jobName: string,
    data: any,
    jobId?: string,
    options?: any
  ) {
    if (process.env.BYPASS_REDIS === 'true') {
      console.log(`[Queue Registry] [BYPASS_REDIS] Spawning job "${jobName}" on queue "${queueName}" inline asynchronously.`);
      
      // Run the worker asynchronously in the background without blocking the request
      (async () => {
        try {
          if (queueName === 'entry_scoring') {
            const { processEntryScoring } = await import('./workers/entryScoringWorker');
            await processEntryScoring(data);
          } else if (queueName === 'crisis_detection') {
            const { processCrisisDetection } = await import('./workers/crisisDetectionWorker');
            await processCrisisDetection(data);
          } else if (queueName === 'reflection_generation') {
            const { processReflectionGeneration } = await import('./workers/reflectionWorker');
            await processReflectionGeneration(data);
          } else if (queueName === 'weekly_summary_generation') {
            const { processWeeklySummary } = await import('./workers/weeklySummaryWorker');
            await processWeeklySummary(data);
          } else if (queueName === 'monthly_report_generation') {
            const { processMonthlyReport } = await import('./workers/monthlyReportWorker');
            await processMonthlyReport(data);
          } else if (queueName === 'ocean_summary_generation') {
            const { processOceanSummary } = await import('./workers/oceanSummaryWorker');
            await processOceanSummary(data);
          } else if (queueName === 'vocab_processing') {
            const { processVocabularyExtraction } = await import('./workers/vocabWorker');
            await processVocabularyExtraction(data);
          } else if (queueName === 'intelligence_rebuild') {
            const { processIntelligenceRebuild } = await import('./workers/intelligenceRebuildWorker');
            await processIntelligenceRebuild(data);
          } else if (queueName === 'pattern_processing') {
            const { processPatternExtraction } = await import('./workers/patternWorker');
            await processPatternExtraction(data);
          } else if (queueName === 'knowledge_processing') {
            const { processKnowledgeExtraction } = await import('./workers/knowledgeWorker');
            await processKnowledgeExtraction(data);
          } else if (queueName === 'transactional_email') {
            const { processEmailJob } = await import('./workers/emailWorker');
            await processEmailJob(data);
          }
        } catch (err: any) {
          console.error(`[Queue Registry] Inline background job execution error for ${queueName}:`, err.message || err);
        }
      })();

      return { id: jobId || jobName || `mock_${Date.now()}` } as any;
    }

    const finalJobId = jobId || jobName;
    const queue = this.getQueue(queueName as QueueName);
    const jobOptions = {
      jobId: finalJobId,
      ...(options || {})
    };
    return queue.add(jobName, data, jobOptions);
  }

  public async closeAll() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();
    console.log('[Queue Registry] All queues closed.');
  }
}

export const queueRegistry = new QueueRegistry();
