import type { PromptTemplateRow, SourceType, SourceTier } from "@/server/db/types";

export interface SourceSeed {
  name: string;
  rss_url: string;
  source_type: SourceType;
  tier: SourceTier;
}

export const SOURCE_SEEDS: SourceSeed[] = [
  {
    name: "OpenAI blog",
    rss_url: "https://openai.com/news/rss.xml",
    source_type: "official",
    tier: "A"
  },
  {
    name: "Anthropic blog",
    rss_url: "https://www.anthropic.com/news",
    source_type: "official",
    tier: "A"
  },
  {
    name: "Google DeepMind",
    rss_url: "https://deepmind.google/blog/",
    source_type: "official",
    tier: "A"
  },
  {
    name: "Meta AI",
    rss_url: "https://ai.meta.com/blog/",
    source_type: "official",
    tier: "A"
  },
  {
    name: "TechCrunch AI",
    rss_url: "https://techcrunch.com/tag/ai/feed/",
    source_type: "media",
    tier: "B"
  },
  {
    name: "The Verge AI",
    rss_url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    source_type: "media",
    tier: "B"
  },
  {
    name: "Reuters Technology",
    rss_url: "https://www.reuters.com/technology/",
    source_type: "media",
    tier: "B"
  },
  {
    name: "WIRED AI",
    rss_url: "https://www.wired.com/category/artificial-intelligence/",
    source_type: "media",
    tier: "B"
  },
  {
    name: "BBC Technology",
    rss_url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
    source_type: "media",
    tier: "B"
  },
  {
    name: "CNBC Technology",
    rss_url: "https://www.cnbc.com/technology/",
    source_type: "media",
    tier: "B"
  }
];

export const TEMPLATE_SEEDS: Pick<
  PromptTemplateRow,
  "key" | "name" | "system_prompt" | "instruction_prompt"
>[] = [
  {
    key: "short_video_news",
    name: "Short Video — News Explainer (60s)",
    system_prompt: `你现在是 Shao Xuan，
一位用清晰叙事解释 AI 与科技事件的内容创作者。

你的特点：
- 用简单叙事解释复杂科技
- 以事件过程为主线，而不是抽象观点
- 不写成新闻播报，不用“近日/据报道/宣布”等表达
- 优先讲“发生了什么 → 怎么发生 → 为什么大家在讨论”`,
    instruction_prompt: `请写一支 60 秒短视频口播稿。

必须遵守：

1. 开头（前3秒）
- 用反直觉 / 好奇点作为 hook
- 一句话抓住观众

2. 事件背景（简洁）
- 谁做了什么
- 发生在哪里

3. 关键过程（最重要）
- 按步骤讲清楚“怎么做到的”
- 用最容易理解的方式表达

4. 为什么会被讨论
- 解释大家在关注什么点
- 不做过度判断

5. 结尾
- 可留一个开放问题或轻微总结

风格：
- 像在讲一个科技故事
- 不要写成新闻稿
- 不要堆术语`
  },
  {
    key: "short_video_practical",
    name: "Short Video — Practical AI Workflow",
    system_prompt: `你现在是 Shao Xuan，
一位分享 AI 实际使用方式的创作者。

你的内容重点：
- 分享真实操作过程
- 不介绍工具，而是讲“怎么用 AI 解决问题”
- 可以包含失败经验`,
    instruction_prompt: `请写一支 60-90 秒短视频口播稿。

结构必须：

1. Hook（问题）
- 一个真实痛点

2. 我怎么解决
- 不说工具名字，直接讲行为

3. 实际过程
- 展示 workflow（输入 → 处理 → 输出）
- 可以提到踩坑

4. 结果
- 节省了什么 / 改善了什么

5. CTA
- 引导观众留言或私信获取资源

风格：
- 真实、直接
- 不要像教程
- 不要像广告`
  }
];
