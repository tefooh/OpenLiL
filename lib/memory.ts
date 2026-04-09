/**
 * OpenLiL AI — Smart Memory System
 * 
 * 100% local & offline memory using AsyncStorage.
 * 
 * Architecture:
 * - Memories are key facts/preferences extracted from conversations
 * - Each memory has: content, category, importance score, timestamps, access count
 * - Smart retrieval uses keyword matching + recency + importance scoring
 * - Automatic deduplication and consolidation
 * - Memory decay: old, low-importance, rarely-accessed memories fade over time
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const MEMORY_KEY = '@openlil:memories';
const MAX_MEMORIES = 200;
const MAX_CONTEXT_MEMORIES = 8; // Max memories injected per conversation

// ─── Types ───────────────────────────────────────────────────────────

export interface Memory {
  id: string;
  content: string;           // The actual memory text
  category: MemoryCategory;
  importance: number;        // 0.0 – 1.0 score
  keywords: string[];        // Extracted keywords for search
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  source: 'extracted' | 'manual';
}

export type MemoryCategory =
  | 'preference'    // User preferences (likes, dislikes)
  | 'fact'          // Facts about the user (name, job, location)
  | 'instruction'   // How the user wants responses
  | 'context'       // Contextual info from conversations
  | 'general';      // Anything else

// ─── Extraction Patterns ─────────────────────────────────────────────

interface ExtractionPattern {
  patterns: RegExp[];
  category: MemoryCategory;
  importance: number;
}

const EXTRACTION_RULES: ExtractionPattern[] = [
  // Identity / personal facts
  {
    patterns: [
      /my name is\s+(\S+(?:\s+\S+)?)/i,
      /i(?:'m| am)\s+called\s+(\S+)/i,
      /call me\s+(\S+)/i,
    ],
    category: 'fact',
    importance: 0.95,
  },
  // Occupation
  {
    patterns: [
      /i(?:'m| am) an?\s+(developer|engineer|designer|student|teacher|doctor|nurse|scientist|writer|artist|manager|ceo|cto|founder)/i,
      /i work (?:as|at|in|for)\s+(.+?)(?:\.|,|$)/i,
      /my (?:job|profession|occupation) is\s+(.+?)(?:\.|,|$)/i,
    ],
    category: 'fact',
    importance: 0.85,
  },
  // Location
  {
    patterns: [
      /i(?:'m| am) from\s+(.+?)(?:\.|,|$)/i,
      /i live in\s+(.+?)(?:\.|,|$)/i,
      /i(?:'m| am) based in\s+(.+?)(?:\.|,|$)/i,
    ],
    category: 'fact',
    importance: 0.8,
  },
  // Preferences
  {
    patterns: [
      /i (?:love|like|enjoy|prefer|adore)\s+(.+?)(?:\.|,|$)/i,
      /i (?:hate|dislike|don't like|can't stand)\s+(.+?)(?:\.|,|$)/i,
      /my fav(?:ou?rite)?\s+(?:\w+\s+)?is\s+(.+?)(?:\.|,|$)/i,
    ],
    category: 'preference',
    importance: 0.7,
  },
  // Instructions / style preferences
  {
    patterns: [
      /(?:always|please|never)\s+(.+?)(?:\.|!|$)/i,
      /i want you to\s+(.+?)(?:\.|!|$)/i,
      /respond (?:in|with|using)\s+(.+?)(?:\.|!|$)/i,
      /use\s+(\w+)\s+(?:language|style|tone)/i,
    ],
    category: 'instruction',
    importance: 0.75,
  },
  // Technical context
  {
    patterns: [
      /i(?:'m| am) (?:learning|studying|working on|building)\s+(.+?)(?:\.|,|$)/i,
      /my (?:project|app|website|code) (?:is|uses)\s+(.+?)(?:\.|,|$)/i,
      /i use\s+([\w\s.]+)(?:\s+for|\.|,|$)/i,
    ],
    category: 'context',
    importance: 0.65,
  },
];

// ─── Core Memory Functions ───────────────────────────────────────────

let memoryCache: Memory[] | null = null;

/**
 * Load all memories from storage
 */
export async function loadMemories(): Promise<Memory[]> {
  if (memoryCache !== null) return memoryCache;
  
  try {
    const json = await AsyncStorage.getItem(MEMORY_KEY);
    if (json) {
      memoryCache = JSON.parse(json) as Memory[];
      return memoryCache;
    }
  } catch (e) {
    console.error('[Memory] Failed to load memories:', e);
  }
  memoryCache = [];
  return memoryCache;
}

/**
 * Save all memories to storage
 */
async function saveMemories(memories: Memory[]): Promise<void> {
  memoryCache = memories;
  try {
    await AsyncStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
  } catch (e) {
    console.error('[Memory] Failed to save memories:', e);
  }
}

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Extract keywords from text for search matching
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'i', 'me', 'my', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
    'for', 'of', 'with', 'by', 'from', 'it', 'its', 'this', 'that',
    'do', 'does', 'did', 'has', 'have', 'had', 'not', 'no', 'so',
    'if', 'can', 'will', 'just', 'very', 'really', 'also', 'like',
    'about', 'up', 'out', 'as', 'what', 'when', 'where', 'how', 'all',
    'would', 'could', 'should', 'there', 'their', 'them', 'they', 'you',
    'your', 'we', 'our', 'he', 'she', 'him', 'her', 'his', 'hers',
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i) // unique
    .slice(0, 15);
}

/**
 * Calculate similarity between two sets of keywords (Jaccard-ish)
 */
function keywordSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Check if a new memory is too similar to an existing one
 */
function isDuplicate(existing: Memory[], newContent: string, newKeywords: string[]): Memory | null {
  for (const mem of existing) {
    const similarity = keywordSimilarity(mem.keywords, newKeywords);
    if (similarity > 0.6) return mem;
    
    // Also check content substring overlap
    const normalizedExisting = mem.content.toLowerCase().trim();
    const normalizedNew = newContent.toLowerCase().trim();
    if (normalizedExisting.includes(normalizedNew) || normalizedNew.includes(normalizedExisting)) {
      return mem;
    }
  }
  return null;
}

// ─── Smart Extraction ────────────────────────────────────────────────

/**
 * Extract memorable facts from a user message.
 * Returns new Memory objects (not yet saved).
 */
export function extractMemories(userMessage: string): Omit<Memory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>[] {
  const results: Omit<Memory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>[] = [];
  
  for (const rule of EXTRACTION_RULES) {
    for (const pattern of rule.patterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const captured = match[1]?.trim() || match[0].trim();
        if (captured.length < 3 || captured.length > 200) continue;

        // Build a clean memory content
        const content = buildMemoryContent(userMessage, match[0], rule.category);
        if (!content) continue;

        results.push({
          content,
          category: rule.category,
          importance: rule.importance,
          keywords: extractKeywords(content),
          source: 'extracted',
        });
        break; // One match per rule is enough
      }
    }
  }
  
  return results;
}

/**
 * Build a clean, concise memory string from a match
 */
function buildMemoryContent(fullMessage: string, matchedPhrase: string, category: MemoryCategory): string | null {
  // Clean up the matched phrase 
  let content = matchedPhrase.trim();
  
  // Remove trailing punctuation
  content = content.replace(/[.,!?;:]+$/, '').trim();
  
  // Capitalize first letter
  content = content.charAt(0).toUpperCase() + content.slice(1);
  
  // Prefix with "User:" to make it clear in the system prompt
  switch (category) {
    case 'fact':
      return `User: ${content}`;
    case 'preference':
      return `User preference: ${content}`;
    case 'instruction':
      return `User instruction: ${content}`;
    case 'context':
      return `User context: ${content}`;
    default:
      return `User info: ${content}`;
  }
}

// ─── Smart Retrieval ─────────────────────────────────────────────────

/**
 * Score a memory for relevance to a given query.
 * Combines: keyword relevance, recency, importance, access frequency.
 */
function scoreMemory(memory: Memory, queryKeywords: string[], now: number): number {
  // 1. Keyword relevance (0-1) — strongest signal
  const relevance = keywordSimilarity(memory.keywords, queryKeywords);
  
  // 2. Recency score (0-1) — exponential decay over 30 days
  const ageMs = now - memory.lastAccessedAt;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recency = Math.exp(-ageDays / 30);
  
  // 3. Importance (0-1) — from extraction
  const importance = memory.importance;
  
  // 4. Access frequency bonus (0-0.2)
  const accessBonus = Math.min(0.2, memory.accessCount * 0.02);
  
  // Weighted combination
  return (relevance * 0.40) + (importance * 0.30) + (recency * 0.20) + (accessBonus * 0.10);
}

/**
 * Retrieve the most relevant memories for a given user message.
 * Updates access timestamps/counts for retrieved memories.
 */
export async function retrieveRelevantMemories(
  userMessage: string,
  maxResults: number = MAX_CONTEXT_MEMORIES,
): Promise<Memory[]> {
  const memories = await loadMemories();
  if (memories.length === 0) return [];
  
  const now = Date.now();
  const queryKeywords = extractKeywords(userMessage);
  
  // Score all memories
  const scored = memories.map(mem => ({
    memory: mem,
    score: scoreMemory(mem, queryKeywords, now),
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Always include high-importance memories (facts, instructions) even with low relevance
  const highImportance = scored.filter(
    s => s.memory.importance >= 0.85 && s.memory.category === 'fact'
  );
  
  // Merge: top relevant + high-importance, deduped
  const resultSet = new Set<string>();
  const results: Memory[] = [];
  
  // Add high-importance first
  for (const item of highImportance) {
    if (results.length >= maxResults) break;
    if (!resultSet.has(item.memory.id)) {
      resultSet.add(item.memory.id);
      results.push(item.memory);
    }
  }
  
  // Fill with top scored
  for (const item of scored) {
    if (results.length >= maxResults) break;
    if (item.score < 0.15) break; // Threshold — don't include irrelevant memories
    if (!resultSet.has(item.memory.id)) {
      resultSet.add(item.memory.id);
      results.push(item.memory);
    }
  }
  
  // Update access metadata for retrieved memories
  if (results.length > 0) {
    const updatedMemories = memories.map(mem => {
      if (resultSet.has(mem.id)) {
        return {
          ...mem,
          lastAccessedAt: now,
          accessCount: mem.accessCount + 1,
        };
      }
      return mem;
    });
    await saveMemories(updatedMemories);
  }
  
  return results;
}

// ─── Memory Lifecycle ────────────────────────────────────────────────

/**
 * Process a user message: extract and store new memories.
 * Called after each user message is sent.
 */
export async function processUserMessage(userMessage: string): Promise<number> {
  const extracted = extractMemories(userMessage);
  if (extracted.length === 0) return 0;
  
  const memories = await loadMemories();
  const now = Date.now();
  let addedCount = 0;
  
  for (const item of extracted) {
    const duplicate = isDuplicate(memories, item.content, item.keywords);
    
    if (duplicate) {
      // Update existing memory — consolidate: bump importance & recency
      duplicate.importance = Math.min(1.0, duplicate.importance + 0.05);
      duplicate.lastAccessedAt = now;
      duplicate.accessCount++;
      // If the new content is more detailed, update it
      if (item.content.length > duplicate.content.length) {
        duplicate.content = item.content;
        duplicate.keywords = item.keywords;
      }
    } else {
      // Add new memory
      const newMemory: Memory = {
        id: generateId(),
        ...item,
        createdAt: now,
        lastAccessedAt: now,
        accessCount: 0,
      };
      memories.push(newMemory);
      addedCount++;
    }
  }
  
  // Enforce memory limit — evict lowest-scoring memories
  if (memories.length > MAX_MEMORIES) {
    const now = Date.now();
    const scored = memories.map(mem => ({
      memory: mem,
      score: scoreMemory(mem, [], now),
    }));
    scored.sort((a, b) => b.score - a.score);
    const kept = scored.slice(0, MAX_MEMORIES).map(s => s.memory);
    await saveMemories(kept);
  } else {
    await saveMemories(memories);
  }
  
  if (addedCount > 0) {
    console.log(`[Memory] Stored ${addedCount} new memories (total: ${memories.length})`);
  }
  
  return addedCount;
}

/**
 * Build the memory context string to inject into the system prompt.
 */
export function buildMemoryContext(memories: Memory[]): string {
  if (memories.length === 0) return '';
  
  const lines = memories.map(m => `• ${m.content}`);
  return [
    '\n\n[Memory — things you know about this user from past conversations]:',
    ...lines,
    '[End of memory — use this context naturally, do not mention that you have a memory system unless asked]',
  ].join('\n');
}

// ─── Manual Memory Management ────────────────────────────────────────

/**
 * Add a manual memory
 */
export async function addManualMemory(content: string, category: MemoryCategory = 'general'): Promise<void> {
  const memories = await loadMemories();
  const keywords = extractKeywords(content);
  
  const duplicate = isDuplicate(memories, content, keywords);
  if (duplicate) {
    console.log('[Memory] Duplicate manual memory, skipping');
    return;
  }
  
  const now = Date.now();
  memories.push({
    id: generateId(),
    content,
    category,
    importance: 0.9, // Manual memories are high importance
    keywords,
    createdAt: now,
    lastAccessedAt: now,
    accessCount: 0,
    source: 'manual',
  });
  
  await saveMemories(memories);
}

/**
 * Delete a memory by ID
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const memories = await loadMemories();
  const filtered = memories.filter(m => m.id !== memoryId);
  await saveMemories(filtered);
}

/**
 * Clear all memories
 */
export async function clearAllMemories(): Promise<void> {
  memoryCache = [];
  await AsyncStorage.removeItem(MEMORY_KEY);
  console.log('[Memory] All memories cleared');
}

/**
 * Get all memories (for settings/debug UI)
 */
export async function getAllMemories(): Promise<Memory[]> {
  return loadMemories();
}

/**
 * Get memory count
 */
export async function getMemoryCount(): Promise<number> {
  const memories = await loadMemories();
  return memories.length;
}
