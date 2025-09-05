// RAG Therapy Engine for contextual therapeutic responses
import fs from 'fs';
import path from 'path';

class RAGTherapyEngine {
  constructor() {
    this.dataset = null;
    this.loadDataset();
  }

  loadDataset() {
    try {
      const datasetPath = path.join(process.cwd(), 'therapy_rag_dataset (1).json');
      const rawData = fs.readFileSync(datasetPath, 'utf8');
      this.dataset = JSON.parse(rawData);
      console.log(`Loaded ${this.dataset.entries.length} therapeutic response templates`);
    } catch (error) {
      console.error('Failed to load RAG dataset:', error);
      this.dataset = { entries: [] };
    }
  }

  // Simple keyword-based similarity scoring
  calculateSimilarity(userMessage, entry) {
    const userWords = userMessage.toLowerCase().split(/\s+/);
    const keywords = entry.keywords.map(k => k.toLowerCase());
    const contextWords = entry.user_context.toLowerCase().split(/\s+/);
    
    let score = 0;
    
    // Keyword matching (high weight)
    keywords.forEach(keyword => {
      if (userMessage.toLowerCase().includes(keyword)) {
        score += 3;
      }
    });
    
    // Context word matching (medium weight)
    contextWords.forEach(word => {
      if (userWords.includes(word) && word.length > 3) {
        score += 2;
      }
    });
    
    // Partial word matching (low weight)
    userWords.forEach(userWord => {
      if (userWord.length > 4) {
        keywords.forEach(keyword => {
          if (keyword.includes(userWord) || userWord.includes(keyword)) {
            score += 1;
          }
        });
      }
    });
    
    return score;
  }

  // Find the best matching therapeutic response
  findBestMatch(userMessage, conversationHistory = []) {
    if (!this.dataset || !this.dataset.entries) {
      return null;
    }

    const matches = this.dataset.entries.map(entry => ({
      ...entry,
      similarity: this.calculateSimilarity(userMessage, entry)
    }));

    // Sort by similarity score
    matches.sort((a, b) => b.similarity - a.similarity);
    
    // Filter out very low scores
    const relevantMatches = matches.filter(match => match.similarity > 0);
    
    if (relevantMatches.length === 0) {
      return null;
    }

    // Return top 3 matches for variety
    return relevantMatches.slice(0, 3);
  }

  // Generate enhanced prompt with RAG context
  generateEnhancedPrompt(userMessage, conversationHistory = []) {
    const matches = this.findBestMatch(userMessage, conversationHistory);
    
    if (!matches || matches.length === 0) {
      return null;
    }

    const topMatch = matches[0];
    const alternativeMatches = matches.slice(1);

    return {
      ragContext: {
        primaryMatch: {
          topic: topMatch.topic,
          technique: topMatch.technique,
          tone: topMatch.tone,
          response: topMatch.response,
          similarity: topMatch.similarity
        },
        alternatives: alternativeMatches.map(match => ({
          topic: match.topic,
          technique: match.technique,
          tone: match.tone,
          similarity: match.similarity
        })),
        totalMatches: matches.length
      },
      enhancedPrompt: this.buildTherapeuticPrompt(userMessage, topMatch, alternativeMatches)
    };
  }

  buildTherapeuticPrompt(userMessage, primaryMatch, alternatives) {
    const prompt = `You are MindCare AI, a deeply empathetic therapeutic companion. 

USER MESSAGE: "${userMessage}"

RAG THERAPEUTIC GUIDANCE:
PRIMARY MATCH (${primaryMatch.similarity} relevance):
- Topic: ${primaryMatch.topic}
- Recommended Tone: ${primaryMatch.tone}
- Therapeutic Technique: ${primaryMatch.technique}
- Example Response Style: "${primaryMatch.response.substring(0, 150)}..."

${alternatives.length > 0 ? `
ALTERNATIVE APPROACHES:
${alternatives.map(alt => `- ${alt.topic} (${alt.technique}, ${alt.tone})`).join('\n')}
` : ''}

RESPONSE GUIDELINES:
1. TONE: Match the recommended tone (${primaryMatch.tone}) - be ${primaryMatch.tone.replace(/_/g, ' ')}
2. TECHNIQUE: Incorporate the ${primaryMatch.technique.replace(/_/g, ' ')} approach
3. PERSONALIZATION: Adapt the guidance to the user's specific situation
4. LENGTH: Provide 2-3 paragraphs with specific, actionable advice
5. EMPATHY: Lead with validation and understanding
6. HOPE: End with encouragement and forward momentum

AVOID:
- Generic responses
- Overly clinical language  
- Dismissing their feelings
- Giving medical advice

Respond with genuine warmth, specific techniques, and personalized support that addresses their unique situation while incorporating the RAG guidance above.`;

    return prompt;
  }

  // Get topic-specific techniques for stress level calculation
  getTopicKeywords() {
    if (!this.dataset || !this.dataset.entries) {
      return { high: [], moderate: [], mild: [], positive: [] };
    }

    const keywords = {
      high: [],
      moderate: [],
      mild: [],
      positive: []
    };

    this.dataset.entries.forEach(entry => {
      const entryKeywords = entry.keywords;
      
      // Categorize based on topic severity
      if (['trauma_response', 'panic_attacks', 'grief_loss', 'depression_support'].includes(entry.topic)) {
        keywords.high.push(...entryKeywords);
      } else if (['anxiety_coping', 'workplace_stress', 'social_anxiety', 'anger_management'].includes(entry.topic)) {
        keywords.moderate.push(...entryKeywords);
      } else if (['procrastination', 'decision_making', 'comparison', 'motivation_loss'].includes(entry.topic)) {
        keywords.mild.push(...entryKeywords);
      } else if (['mindfulness_introduction', 'self_esteem', 'boundary_setting'].includes(entry.topic)) {
        keywords.positive.push(...entryKeywords);
      }
    });

    // Remove duplicates
    Object.keys(keywords).forEach(key => {
      keywords[key] = [...new Set(keywords[key])];
    });

    return keywords;
  }
}

export default RAGTherapyEngine;
