// Shared by the admin upload page (browser) and scripts/import-templates.mjs (Node).
// Pure JS, no Node/browser-specific APIs.

const GENERIC_TYPES = new Set([
  "stickyNote", "set", "if", "switch", "merge", "code", "function", "functionItem", "noOp",
  "splitInBatches", "splitOut", "aggregate", "filter", "sort", "limit", "removeDuplicates",
  "itemLists", "wait", "manualTrigger", "scheduleTrigger", "cron", "interval", "start",
  "executeWorkflow", "executeWorkflowTrigger", "respondToWebhook", "dateTime", "crypto",
  "html", "markdown", "xml", "compareDatasets", "summarize", "renameKeys", "stopAndError",
  "errorTrigger", "readBinaryFile", "readBinaryFiles", "writeBinaryFile", "moveBinaryData",
  "convertToFile", "extractFromFile", "spreadsheetFile", "editImage", "executeCommand",
  "formTrigger", "form", "n8nTrigger", "debugHelper", "localFileTrigger", "readWriteFile",
  // LangChain building blocks that aren't a third-party service
  "chainRetrievalQa", "chainLlm", "chainSummarization", "agent", "agentTool", "chatTrigger", "chat",
  "retrieverVectorStore", "retrieverMultiQuery", "retrieverWorkflow",
  "documentDefaultDataLoader", "documentBinaryInputLoader", "documentJsonInputLoader",
  "textSplitterRecursiveCharacterTextSplitter", "textSplitterCharacterTextSplitter",
  "textSplitterTokenSplitter", "memoryBufferWindow", "memoryManager", "outputParserStructured",
  "outputParserAutofixing", "outputParserItemList", "toolCode", "toolWorkflow", "toolCalculator",
  "toolThink", "toolHttpRequest", "informationExtractor", "sentimentAnalysis", "textClassifier",
  "vectorStoreInMemory", "vectorStoreInMemoryInsert", "vectorStoreInMemoryLoad", "mcpTrigger",
]);

const PREFIXES = ["lmChat", "lm", "embeddings", "vectorStore", "memory", "tool", "documentLoader", "mcpClient"];

const BRANDS = {
  openai: "OpenAI", googledrive: "Google Drive", googlesheets: "Google Sheets", gmail: "Gmail",
  googlecalendar: "Google Calendar", googledocs: "Google Docs", googlegemini: "Google Gemini",
  googlepalm: "Google Gemini", googlevertex: "Google Vertex AI", youtube: "YouTube",
  httprequest: "HTTP Request", webhook: "Webhook", hubspot: "HubSpot", github: "GitHub",
  gitlab: "GitLab", linkedin: "LinkedIn", whatsapp: "WhatsApp", mongodb: "MongoDB",
  postgres: "Postgres", mysql: "MySQL", supabase: "Supabase", airtable: "Airtable",
  notion: "Notion", slack: "Slack", telegram: "Telegram", discord: "Discord", anthropic: "Anthropic",
  mistralcloud: "Mistral", ollama: "Ollama", groq: "Groq", deepseek: "DeepSeek", openrouter: "OpenRouter",
  pinecone: "Pinecone", qdrant: "Qdrant", zep: "Zep", redis: "Redis", wordpress: "WordPress",
  woocommerce: "WooCommerce", shopify: "Shopify", stripe: "Stripe", twitter: "X (Twitter)",
  facebookgraphapi: "Facebook", microsoftoutlook: "Outlook", microsoftexcel: "Excel",
  microsoftteams: "Microsoft Teams", onedrive: "OneDrive", microsoftonedrive: "OneDrive",
  clickup: "ClickUp", jira: "Jira", trello: "Trello", asana: "Asana", typeform: "Typeform",
  emailsend: "Email (SMTP)", emailreadimap: "Email (IMAP)", rssfeedread: "RSS", awss3: "AWS S3",
  huggingfaceinference: "Hugging Face", serpapi: "SerpAPI", wikipedia: "Wikipedia",
  wolframalpha: "Wolfram Alpha", elevenlabs: "ElevenLabs", perplexity: "Perplexity",
};

const CATEGORY_RULES = [
  ["AI", (t) => t.some((x) => x.includes("langchain") || /openai|anthropic|gemini|mistral|ollama/i.test(x))],
  ["Communication", (t) => t.some((x) => /slack|telegram|discord|whatsapp|gmail|email|outlook|teams|twilio/i.test(x))],
  ["Sales & CRM", (t) => t.some((x) => /hubspot|salesforce|pipedrive|zoho|crm|lemlist|apollo/i.test(x))],
  ["Marketing & Social", (t) => t.some((x) => /twitter|linkedin|facebook|instagram|mailchimp|youtube|wordpress|reddit/i.test(x))],
  ["E-commerce", (t) => t.some((x) => /shopify|woocommerce|stripe|paypal|gumroad/i.test(x))],
  ["Productivity", (t) => t.some((x) => /googlesheets|notion|airtable|clickup|trello|asana|todoist|googlecalendar|googledrive/i.test(x))],
  ["DevOps & IT", (t) => t.some((x) => /github|gitlab|jira|docker|ssh|aws|postgres|mysql|mongo/i.test(x))],
];

function humanize(raw) {
  let s = raw;
  for (const p of PREFIXES) {
    if (s.startsWith(p) && s.length > p.length && /[A-Z]/.test(s[p.length])) { s = s.slice(p.length); break; }
  }
  s = s.replace(/(Trigger|Tool|Insert|Load)$/, "") || s;
  const key = s.toLowerCase();
  if (BRANDS[key]) return BRANDS[key];
  return s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function cleanTitle(fileName) {
  return fileName
    .replace(/\.(json|txt)$/i, "")
    .replace(/^[0-9a-f]{6,}[-_ ]/i, "") // upload hash prefix like "d9744481-"
    .replace(/^\d+[-_. ]+/, "")          // "0123_" numbering
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkdown(s) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`>~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 70) || "template";
}

// cyrb53 — fast, good-enough 53-bit hash for duplicate detection.
export function hash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Parse + sanitize one exported n8n workflow file.
 * @param {string} text   file contents
 * @param {string} fileName
 * @param {string} [folderCategory] optional category (e.g. the folder the file was in)
 * @returns {{ok:true, item:object} | {ok:false, error:string}}
 */
export function processWorkflowFile(text, fileName, folderCategory) {
  let data;
  try {
    data = JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    return { ok: false, error: "Not valid JSON" };
  }
  if (data && data.workflow && Array.isArray(data.workflow.nodes)) data = { name: data.name, ...data.workflow };
  if (!data || !Array.isArray(data.nodes) || typeof data.connections !== "object") {
    return { ok: false, error: "Not an n8n workflow (no nodes/connections)" };
  }

  const types = [];
  const notes = [];
  const nodes = data.nodes.map((n) => {
    const node = { ...n };
    delete node.credentials; // owner's credential IDs/names must never leak
    if (typeof node.type === "string") types.push(node.type);
    if (node.type === "n8n-nodes-base.stickyNote" && node.parameters?.content) notes.push(String(node.parameters.content));
    return node;
  });

  const workflow = { nodes, connections: data.connections, pinData: {} };
  if (data.settings && typeof data.settings === "object") {
    const { errorWorkflow, ...settings } = data.settings; // errorWorkflow points to owner's instance
    if (Object.keys(settings).length) workflow.settings = settings;
  }

  const services = [...new Set(
    types
      .map((t) => t.split(".").pop() || "")
      .filter((t) => t && !GENERIC_TYPES.has(t))
      .map(humanize)
  )].slice(0, 12);

  const title = (typeof data.name === "string" && data.name.trim() && !/^my workflow/i.test(data.name))
    ? data.name.trim()
    : cleanTitle(fileName) || "Untitled workflow";

  // Join the explanatory sticky notes; fall back to "Try me out"/setup notes if that's all there is.
  const cleanNotes = notes.map(stripMarkdown).filter((s) => s.length > 20);
  const isSetup = (s) => /^(try me|setup|set up|how to|instructions)/i.test(s);
  const picked = cleanNotes.filter((s) => !isSetup(s));
  const description = (picked.length ? picked : cleanNotes).join(" · ").slice(0, 600);

  const lowerTypes = types.map((t) => t.toLowerCase());
  const category = folderCategory || CATEGORY_RULES.find(([, test]) => test(lowerTypes))?.[0] || "Other";

  const json = JSON.stringify(workflow);
  const content_hash = hash(json);

  return {
    ok: true,
    item: {
      slug: `${slugify(title)}-${content_hash.slice(0, 6)}`,
      title: title.slice(0, 200),
      description,
      category,
      services,
      node_count: nodes.filter((n) => n.type !== "n8n-nodes-base.stickyNote").length,
      content_hash,
      workflow,
    },
  };
}
