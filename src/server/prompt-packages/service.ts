import { getSupabaseAdmin } from "@/server/db/client";
import type { ArticleRow, PromptTemplateRow, SourceRow, TopicRow } from "@/server/db/types";
import { promptPackageSchema } from "@/server/enrichment/schemas";
import { MAX_PROMPT_SOURCES } from "@/server/topics/constants";
import { runStructuredCompletion } from "@/server/utils/ai";

function buildFinalPrompt(input: {
  template: PromptTemplateRow;
  workingTitle: string;
  suggestedAngle: string;
  eventSummary: string;
  keyFacts: string[];
  timeline: string[];
  sourceLinks: string[];
  topic: TopicRow;
}) {
  return `You are Shao Xuan.

${input.template.system_prompt}

Task:
Write a 60-second AI news explainer video script

Topic:
${input.workingTitle}

Angle:
${input.suggestedAngle}

Summary:
${input.eventSummary}

Key facts:
${input.keyFacts.map((fact) => `- ${fact}`).join("\n")}

Timeline:
${input.timeline.map((step) => `- ${step}`).join("\n")}

Sources:
${input.sourceLinks.map((link) => `- ${link}`).join("\n")}

Constraints:
- Not news reporting tone
- Strong hook first 3 seconds
- Clear storytelling

Template guidance:
${input.template.instruction_prompt}`;
}

async function readPackageContext(topicId: string, templateId?: string, templateKey?: string) {
  const supabase = getSupabaseAdmin();
  const { data: topic, error: topicError } = await supabase.from("topics").select("*").eq("id", topicId).single();

  if (topicError || !topic) {
    throw new Error(topicError?.message ?? "Topic not found");
  }

  const { data: linkRows, error: linkError } = await supabase
    .from("topic_articles")
    .select("article_id")
    .eq("topic_id", topicId);

  if (linkError) {
    throw new Error(linkError.message);
  }

  const articleIds = (linkRows ?? []).map((row) => row.article_id as string);
  const { data: articles, error: articleError } = await supabase
    .from("articles")
    .select("*")
    .in("id", articleIds)
    .order("published_at", { ascending: false });

  if (articleError) {
    throw new Error(articleError.message);
  }

  const sourceIds = [...new Set((articles ?? []).map((article) => article.source_id as string))];
  const { data: sources, error: sourceError } = await supabase
    .from("sources")
    .select("*")
    .in("id", sourceIds);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  let templateQuery = supabase.from("prompt_templates").select("*");
  if (templateId) {
    templateQuery = templateQuery.eq("id", templateId);
  } else if (templateKey) {
    templateQuery = templateQuery.eq("key", templateKey);
  } else {
    templateQuery = templateQuery.eq("key", "short_video_news");
  }

  const { data: template, error: templateError } = await templateQuery.single();

  if (templateError || !template) {
    throw new Error(templateError?.message ?? "Prompt template not found");
  }

  return {
    topic: topic as TopicRow,
    articles: (articles ?? []) as ArticleRow[],
    sources: (sources ?? []) as SourceRow[],
    template: template as PromptTemplateRow
  };
}

function fallbackPromptPackage(input: {
  topic: TopicRow;
  articles: ArticleRow[];
  sources: SourceRow[];
}) {
  return {
    workingTitle: input.topic.headline,
    suggestedAngle: "Explain the event through the concrete change it creates for creators and builders.",
    coreHookOptions: [
      `The biggest part of this story is not the launch itself, but what it changes next.`,
      `Imagine this landing directly in your daily AI workflow tomorrow.`,
      `Why are so many people paying attention to this update right now?`
    ],
    eventSummary: input.topic.short_summary ?? input.articles[0]?.excerpt ?? "A notable AI story is moving quickly.",
    keyFacts: input.articles.slice(0, 5).map((article) => article.title),
    timeline: (Array.isArray(input.topic.timeline) ? input.topic.timeline : []).map(String).slice(0, 5),
    suggestedVideoTitles: [
      input.topic.headline,
      `Why this AI update matters more than it looks`,
      `The real story behind ${input.topic.headline}`
    ]
  };
}

export async function generatePromptPackage(input: {
  topicId: string;
  templateId?: string;
  templateKey?: string;
}) {
  const supabase = getSupabaseAdmin();
  const context = await readPackageContext(input.topicId, input.templateId, input.templateKey);
  const sourceLinks = context.articles
    .map((article) => {
      const source = context.sources.find((entry) => entry.id === article.source_id);
      return {
        url: article.canonical_url,
        tier: source?.tier ?? "C"
      };
    })
    .filter((entry) => entry.tier === "A" || entry.tier === "B")
    .slice(0, MAX_PROMPT_SOURCES)
    .map((entry) => entry.url);

  const aiPayload = await runStructuredCompletion({
    schema: promptPackageSchema,
    schemaName: "prompt_package",
    system: `You are generating a creator-ready prompt package for short AI / tech explainer videos.

Rules:
- workingTitle should feel publishable
- suggestedAngle should be one sentence describing the best framing
- coreHookOptions must include exactly 3 hooks: one counterintuitive, one concrete scenario, one question
- eventSummary should be crisp and creator-friendly
- keyFacts should stay factual
- timeline should be ordered
- suggestedVideoTitles should feel clickable without sounding spammy

Return JSON only.`,
    user: JSON.stringify(
      {
        topic: {
          headline: context.topic.headline,
          shortSummary: context.topic.short_summary,
          whyInteresting: context.topic.why_interesting,
          keyPoints: context.topic.key_points,
          timeline: context.topic.timeline,
          category: context.topic.category
        },
        sources: context.sources.map((source) => ({
          name: source.name,
          tier: source.tier
        })),
        sourceLinks,
        template: {
          key: context.template.key,
          name: context.template.name
        }
      },
      null,
      2
    ),
    fallback: () => fallbackPromptPackage(context)
  });

  const finalPrompt = buildFinalPrompt({
    template: context.template,
    workingTitle: aiPayload.workingTitle,
    suggestedAngle: aiPayload.suggestedAngle,
    eventSummary: aiPayload.eventSummary,
    keyFacts: aiPayload.keyFacts,
    timeline: aiPayload.timeline,
    sourceLinks,
    topic: context.topic
  });

  const payload = {
    workingTitle: aiPayload.workingTitle,
    suggestedAngle: aiPayload.suggestedAngle,
    coreHookOptions: aiPayload.coreHookOptions,
    eventSummary: aiPayload.eventSummary,
    keyFacts: aiPayload.keyFacts,
    timeline: aiPayload.timeline,
    sourceLinks,
    suggestedVideoTitles: aiPayload.suggestedVideoTitles,
    finalPrompt
  };

  const { data, error } = await supabase
    .from("prompt_packages")
    .insert({
      topic_id: context.topic.id,
      template_id: context.template.id,
      payload,
      final_prompt: finalPrompt
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save prompt package");
  }

  return data;
}
