import { z } from "zod";

export const enrichmentSchema = z.object({
  headline: z.string().min(10),
  shortSummary: z.string().min(30),
  whyInteresting: z.string().min(20),
  keyPoints: z.array(z.string().min(5)).min(3).max(6),
  timeline: z.array(z.string().min(5)).min(2).max(6),
  tags: z.array(z.string().min(2)).min(2).max(6),
  category: z.string().min(2)
});

export const llmScoreSchema = z.object({
  novelty: z.number().min(0).max(10),
  story: z.number().min(0).max(10),
  relevance: z.number().min(0).max(10),
  reasoning: z.string().min(10)
});

export const promptPackageSchema = z.object({
  workingTitle: z.string().min(8),
  suggestedAngle: z.string().min(5),
  coreHookOptions: z.array(z.string().min(5)).length(3),
  eventSummary: z.string().min(20),
  keyFacts: z.array(z.string().min(5)).min(3).max(8),
  timeline: z.array(z.string().min(5)).min(2).max(6),
  suggestedVideoTitles: z.array(z.string().min(5)).min(3).max(5)
});
