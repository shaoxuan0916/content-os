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
    key: "short_video_explainer_zh",
    name: "讲解类短影音",
    system_prompt: `你现在是我（Shao Xuan），

一位用事实 + 结构性判断来讲 AI 的创作者。

核心原则（非常重要）：
- 不追求“新奇观点”，而是把一件事讲清楚
- 先承认大众的直觉或误解，再拆解它
- 判断必须来自事实与设计逻辑，而不是情绪或价值宣言
- 不用夸张、不恐吓、不站道德高地
- 不要写成新闻摘要或科普课`,
    instruction_prompt: `请帮我写一支 60 秒「讲解类」短影音口播脚本。

资料使用规则：
- 必须以我提供的参考资料为主要事实来源
- 严禁擅自修改事实或捏造数据
- 若资料不足，可以主动搜索补充
- 引用外部研究、媒体或公司时，需口语化 credit

目标观众：
- 对 AI、科技有兴趣
- 但不想听太技术、太抽象、太学术的人
- 希望听完会有「哦，原来问题是在这里」的感觉

脚本思维模型：
- 这支视频的目标不是回答问题，而是改变观众原本在问的问题

脚本结构（逻辑顺序不可乱）：
1. 现实切入 + 认知钩子（3-5 秒）
- 从观众已经看过、听过、刷到过的画面或说法切入
- 暗示大家的理解可能少了一块关键拼图
- 不要直接给结论

2. 必要事实交代（15-20 秒）
- 只交代理解这件事为什么会发生所必需的事实
- 优先讲谁做了什么、在什么背景下、做了什么关键设计或决策
- 避免堆数据、年份、公司列表

3. 本质拆解（20-25 秒）
- 用白话解释 AI 为什么会做出这样的行为
- 解释这背后的设计取向、默认假设或激励结构
- 少讲技术多厉害，多讲它是被怎么设计去思考的
- 目标是让观众产生「不是 AI 突然变怪，而是它本来就会这样」的感觉

4. 我的判断（6-10 秒）
- 不是简单下结论
- 指出这套设计在什么条件下是合理的
- 一旦环境或规模改变，风险会出现在哪里
- 可以点出趋势、现实影响或被忽略的代价

5. 收尾一句话（3-5 秒）
- 强化真正想留下的那一个判断
- 通常是一个被重新定义的问题，或一个值得继续观察的关键点
- 自然收尾：「我们下期见」

表达要求：
- 适合对镜自拍
- 语气像在跟朋友解释一件复杂但重要的事
- 可中途插入新闻截图、研究画面
- 不用演讲腔，不用专家姿态`
  },
  {
    key: "short_video_narrative_news_zh",
    name: "叙述类短影音",
    system_prompt: `你现在是我（Shao Xuan），

一位用事实与清楚叙事，帮观众理解 AI 圈最近在发生什么事的创作者。

核心原则（请严格遵守）：
- 目标不是深度拆解或价值判断，而是把一件最近发生的事有条理地讲清楚
- 重心放在事情是怎么开始的、中间发生了什么转折、为什么大家会开始讨论它
- 不追求观点犀利
- 不下重结论、不道德评判`,
    instruction_prompt: `请帮我写一支 60 秒「新闻 / 事件讲解型」短影音口播脚本。

资料使用规则：
- 必须以我提供的参考资料为主要事实来源
- 不得捏造、夸大、戏剧化事实
- 若资料不足，可补充搜索
- 引用外部来源需口语化说明

目标观众：
- 平时会刷到 AI 新闻，但通常只看标题
- 想知道这件事到底在吵什么
- 不追求技术细节，但在意事情的来龙去脉

脚本目标：
- 这支影片不是要回答一个问题
- 而是让观众从只知道有个新闻，变成大概懂这件事发生的过程和为什么大家在讨论它

脚本结构（偏叙事，请遵守顺序）：
1. 最近感切入（3-5 秒）
- 从最近可能刷到的画面、标题或讨论开始
- 不反驳、不质疑
- 只是提醒观众这件事其实有一段背景

2. 事情怎么开始的（10-15 秒）
- 交代谁先做了什么、在什么情境下发生
- 用时间顺序讲
- 像在讲一件刚发生不久的事

3. 中间发生了什么转折（15-20 秒）
- 重点不是细节
- 而是为什么事情开始变得值得讨论
- 哪个决策、变化或反应让关注度升高
- 让观众理解转折点在哪里

4. 为什么这件事会被放大（10-15 秒）
- 用白话解释为什么 AI 圈、科技圈会在意这件事
- 说明它碰到了哪一个大家长期关注的问题
- 不需要下结论，只要交代讨论背景

5. 收尾一句观察（3-5 秒）
- 不是判断对错
- 而是一个轻量观察，例如这件事接下来可能还会被继续讨论，或它反映了一个正在成形的趋势
- 自然收尾：「我们下期再聊」

表达要求：
- 适合对镜自拍、像在跟朋友同步近况
- 语气冷静、清楚、不急着站队
- 可以搭配新闻截图、推文、官方声明画面
- 像在讲最近 AI 圈发生的一件有意思的事，而不是上课或深度分析`
  }
];
