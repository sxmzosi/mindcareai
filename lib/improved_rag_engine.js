// Improved RAG Therapy Engine with semantic similarity
import fs from 'fs';
import path from 'path';

class ImprovedRAGEngine {
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

  // Extract meaningful terms from text
  extractTerms(text) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
    
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter(word => !word.match(/^\d+$/));
  }

  // Calculate semantic similarity using multiple factors
  calculateSemanticSimilarity(userMessage, entry) {
    const userTerms = this.extractTerms(userMessage);
    const entryKeywords = entry.keywords.map(k => k.toLowerCase());
    const entryContext = this.extractTerms(entry.user_context);
    const entryResponse = this.extractTerms(entry.response);
    
    let score = 0;
    const weights = {
      exactKeywordMatch: 10,
      partialKeywordMatch: 6,
      contextMatch: 8,
      responseTermMatch: 4,
      emotionalResonance: 12,
      topicRelevance: 15
    };

    // 1. Exact keyword matching
    entryKeywords.forEach(keyword => {
      if (userMessage.toLowerCase().includes(keyword)) {
        score += weights.exactKeywordMatch;
      }
    });

    // 2. Partial keyword matching
    userTerms.forEach(userTerm => {
      entryKeywords.forEach(keyword => {
        if (keyword.includes(userTerm) || userTerm.includes(keyword)) {
          score += weights.partialKeywordMatch;
        }
      });
    });

    // 3. Context similarity
    const contextOverlap = entryContext.filter(term => userTerms.includes(term)).length;
    score += contextOverlap * weights.contextMatch;

    // 4. Response term matching (indicates similar solutions)
    const responseOverlap = entryResponse.filter(term => userTerms.includes(term)).length;
    score += responseOverlap * weights.responseTermMatch;

    // 5. Emotional resonance detection
    const emotionalTerms = {
      anxiety: ['anxious', 'worried', 'nervous', 'panic', 'overwhelmed', 'stressed', 'tense'],
      depression: ['sad', 'depressed', 'hopeless', 'empty', 'worthless', 'tired', 'exhausted'],
      anger: ['angry', 'frustrated', 'furious', 'irritated', 'mad', 'rage', 'annoyed'],
      fear: ['scared', 'afraid', 'terrified', 'frightened', 'worried', 'anxious'],
      grief: ['loss', 'grief', 'mourning', 'death', 'goodbye', 'missing', 'gone'],
      stress: ['pressure', 'overwhelmed', 'burden', 'demanding', 'exhausted', 'burnout']
    };

    Object.entries(emotionalTerms).forEach(([emotion, terms]) => {
      const userHasEmotion = terms.some(term => userMessage.toLowerCase().includes(term));
      const entryAddressesEmotion = terms.some(term => 
        entryKeywords.includes(term) || entry.topic.includes(emotion)
      );
      
      if (userHasEmotion && entryAddressesEmotion) {
        score += weights.emotionalResonance;
      }
    });

    // 6. Topic relevance scoring
    const topicRelevanceMap = {
      'anxiety_coping': ['anxiety', 'panic', 'worry', 'overwhelmed', 'nervous'],
      'workplace_stress': ['work', 'job', 'career', 'boss', 'deadline', 'pressure'],
      'depression_support': ['sad', 'depressed', 'hopeless', 'empty', 'tired'],
      'relationship_issues': ['relationship', 'partner', 'marriage', 'dating', 'love'],
      'grief_loss': ['loss', 'death', 'grief', 'mourning', 'goodbye'],
      'anger_management': ['angry', 'frustrated', 'rage', 'mad', 'irritated'],
      'self_esteem': ['confidence', 'self-worth', 'insecure', 'doubt', 'inadequate'],
      'trauma_response': ['trauma', 'ptsd', 'flashback', 'triggered', 'abuse'],
      'panic_attacks': ['panic', 'attack', 'breathing', 'heart racing', 'dizzy'],
      'social_anxiety': ['social', 'people', 'embarrassed', 'judged', 'awkward']
    };

    const relevantTerms = topicRelevanceMap[entry.topic] || [];
    const topicMatches = relevantTerms.filter(term => 
      userMessage.toLowerCase().includes(term)
    ).length;
    score += topicMatches * weights.topicRelevance;

    // 7. Conversation context bonus
    const conversationBonus = this.calculateConversationContextBonus(userMessage, entry);
    score += conversationBonus;

    return Math.round(score);
  }

  // Analyze conversation flow for better matching
  calculateConversationContextBonus(userMessage, entry) {
    let bonus = 0;
    
    // Length-based relevance
    const messageLength = userMessage.split(' ').length;
    if (messageLength > 10 && entry.technique === 'active_listening') bonus += 5;
    if (messageLength < 5 && entry.technique === 'brief_intervention') bonus += 5;
    
    // Urgency detection
    const urgencyWords = ['urgent', 'emergency', 'crisis', 'immediate', 'help', 'now'];
    const hasUrgency = urgencyWords.some(word => userMessage.toLowerCase().includes(word));
    if (hasUrgency && entry.tone === 'crisis_support') bonus += 15;
    
    // Question vs statement
    const isQuestion = userMessage.includes('?') || userMessage.toLowerCase().startsWith('how') || 
                     userMessage.toLowerCase().startsWith('what') || userMessage.toLowerCase().startsWith('why');
    if (isQuestion && entry.technique === 'psychoeducation') bonus += 8;
    
    return bonus;
  }

  // Find best matches with improved scoring
  findBestMatches(userMessage, conversationHistory = [], topK = 3) {
    if (!this.dataset || !this.dataset.entries) {
      return [];
    }

    const matches = this.dataset.entries.map(entry => ({
      ...entry,
      similarity: this.calculateSemanticSimilarity(userMessage, entry)
    }));

    // Sort by similarity score
    matches.sort((a, b) => b.similarity - a.similarity);
    
    // Filter out very low scores (threshold: 10)
    let relevantMatches = matches.filter(match => match.similarity >= 10);
    // If nothing passes threshold, use the top scored matches anyway
    if (relevantMatches.length === 0) {
      relevantMatches = matches.slice(0, topK);
    }

    // Ensure diversity in top matches
    const diverseMatches = this.ensureTopicDiversity(relevantMatches, topK);

    return diverseMatches.slice(0, topK);
  }

  // Ensure topic diversity in results
  ensureTopicDiversity(matches, topK) {
    if (matches.length <= topK) return matches;
    
    const diverseMatches = [];
    const usedTopics = new Set();
    
    // First pass: add highest scoring unique topics
    for (const match of matches) {
      if (!usedTopics.has(match.topic) && diverseMatches.length < topK) {
        diverseMatches.push(match);
        usedTopics.add(match.topic);
      }
    }
    
    // Second pass: fill remaining slots with highest scores
    for (const match of matches) {
      if (diverseMatches.length >= topK) break;
      if (!diverseMatches.includes(match)) {
        diverseMatches.push(match);
      }
    }
    
    return diverseMatches;
  }

  // Generate contextually aware therapeutic prompt
  generateTherapeuticPrompt(userMessage, conversationHistory = []) {
    const matches = this.findBestMatches(userMessage, conversationHistory, 3);
    
    if (matches.length === 0) {
      return null;
    }

    const primaryMatch = matches[0];
    const supportingMatches = matches.slice(1);
    
    // Analyze conversation patterns
    const conversationContext = this.analyzeConversationContext(conversationHistory);
    
    const prompt = `You are MindCare AI, a compassionate therapeutic companion trained in evidence-based therapeutic approaches.

USER MESSAGE: "${userMessage}"

CONTEXTUAL ANALYSIS:
- Primary therapeutic focus: ${primaryMatch.topic.replace(/_/g, ' ')}
- Recommended approach: ${primaryMatch.technique.replace(/_/g, ' ')}
- Optimal tone: ${primaryMatch.tone.replace(/_/g, ' ')}
- Similarity confidence: ${primaryMatch.similarity}%

THERAPEUTIC GUIDANCE:
Primary Response Framework:
"${primaryMatch.response}"

${supportingMatches.length > 0 ? `
Alternative Approaches to Consider:
${supportingMatches.map(match => 
  `- ${match.topic.replace(/_/g, ' ')}: ${match.technique.replace(/_/g, ' ')} (${match.tone.replace(/_/g, ' ')})`
).join('\n')}` : ''}

${conversationContext.patterns.length > 0 ? `
CONVERSATION CONTEXT:
${conversationContext.patterns.join('\n')}` : ''}

RESPONSE REQUIREMENTS:
1. EMPATHY FIRST: Begin with validation and emotional attunement
2. TECHNIQUE APPLICATION: Integrate the ${primaryMatch.technique.replace(/_/g, ' ')} approach naturally
3. TONE MATCHING: Maintain a ${primaryMatch.tone.replace(/_/g, ' ')} tone throughout
4. PERSONALIZATION: Address their specific situation, not generic advice
5. ACTION ORIENTATION: Provide concrete, actionable steps they can take
6. HOPE BUILDING: End with encouragement and forward momentum

THERAPEUTIC PRINCIPLES:
- Meet them where they are emotionally
- Validate their experience before offering solutions
- Use their own words and metaphors when possible
- Provide specific techniques, not just general advice
- Maintain appropriate boundaries while being warm

Generate a response that feels like talking to a skilled therapist who truly understands their situation and has specific, helpful guidance tailored to their needs.`;

    return {
      prompt,
      confidence: primaryMatch.similarity,
      primaryTopic: primaryMatch.topic,
      technique: primaryMatch.technique,
      tone: primaryMatch.tone,
      matches: matches.length
    };
  }

  // Analyze conversation patterns for better context
  analyzeConversationContext(conversationHistory) {
    const patterns = [];
    
    if (conversationHistory.length === 0) {
      patterns.push("- First interaction: Focus on building rapport and understanding");
      return { patterns };
    }
    
    const recentMessages = conversationHistory.slice(-3);
    const stressLevels = recentMessages.map(h => h.stress_level || 5);
    const avgStress = stressLevels.reduce((a, b) => a + b, 0) / stressLevels.length;
    
    if (avgStress > 7) {
      patterns.push("- High stress pattern detected: Prioritize immediate coping strategies");
    } else if (avgStress < 4) {
      patterns.push("- Lower stress context: Focus on growth and skill building");
    }
    
    // Check for recurring themes
    const allMessages = conversationHistory.map(h => h.message).join(' ').toLowerCase();
    const themes = {
      work: ['work', 'job', 'career', 'boss'],
      relationships: ['relationship', 'partner', 'family', 'friend'],
      anxiety: ['anxious', 'worry', 'panic', 'nervous'],
      depression: ['sad', 'depressed', 'hopeless', 'tired']
    };
    
    Object.entries(themes).forEach(([theme, keywords]) => {
      const mentions = keywords.filter(keyword => allMessages.includes(keyword)).length;
      if (mentions >= 2) {
        patterns.push(`- Recurring ${theme} theme: Build on previous discussions`);
      }
    });
    
    return { patterns, avgStress };
  }

  // Get enhanced keywords for stress detection
  getEnhancedStressKeywords() {
    if (!this.dataset || !this.dataset.entries) {
      return { crisis: [], high: [], moderate: [], mild: [], positive: [] };
    }

    const keywords = {
      crisis: [],
      high: [],
      moderate: [],
      mild: [],
      positive: []
    };

    this.dataset.entries.forEach(entry => {
      const entryKeywords = entry.keywords;
      
      // More nuanced categorization
      if (['trauma_response', 'panic_attacks', 'grief_loss'].includes(entry.topic)) {
        keywords.crisis.push(...entryKeywords);
      } else if (['depression_support', 'anger_management'].includes(entry.topic)) {
        keywords.high.push(...entryKeywords);
      } else if (['anxiety_coping', 'workplace_stress', 'social_anxiety'].includes(entry.topic)) {
        keywords.moderate.push(...entryKeywords);
      } else if (['procrastination', 'decision_making', 'comparison'].includes(entry.topic)) {
        keywords.mild.push(...entryKeywords);
      } else if (['mindfulness_introduction', 'self_esteem', 'boundary_setting'].includes(entry.topic)) {
        keywords.positive.push(...entryKeywords);
      }
    });

    // Remove duplicates and return
    Object.keys(keywords).forEach(key => {
      keywords[key] = [...new Set(keywords[key])];
    });

    return keywords;
  }
}

export default ImprovedRAGEngine;
