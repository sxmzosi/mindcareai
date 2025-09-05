import type { NextApiRequest, NextApiResponse } from 'next'
import ImprovedRAGEngine from '../../lib/improved_rag_engine.js'

interface ConversationEntry {
  message: string;
  response: string;
  stress_level: number;
  timestamp: string;
  emotion_analysis: {
    primary_emotion: string;
    stress_level: number;
    emotion_intensity: number;
    risk_assessment: string;
    psychological_markers: string[];
  };
}

let conversationHistory: ConversationEntry[] = [];
const ragEngine = new ImprovedRAGEngine();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { message } = req.body

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Empty message' })
      return
    }

    // Boundary checks for abusive or out-of-scope content
    let aiResponse = ''
    let boundaryHandled = false
    const msgLower = message.toLowerCase()
    const abuseKeywords = [
      'abuse','abusive','kill you','kill u','die','kys','fuck','f***','fuk','shit','bitch','bastard','asshole','slut','whore','rape','racist','cunt','dick','cock','pussy','retard','retarded','idiot','moron','fag','faggot'
    ]
    const sexualExplicit = ['nude','nudes','send pics','porn','sexual favor','sex with you','sext','nsfw']
    if (abuseKeywords.some(k => msgLower.includes(k)) || sexualExplicit.some(k => msgLower.includes(k))) {
      aiResponse = "I’m here to support your wellbeing. I can’t engage with abusive or sexual content. If you’re comfortable, tell me a bit about how you’re feeling right now or what’s been on your mind so I can support you safely."
      boundaryHandled = true
    }

    // Get the Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY
    

    if (!boundaryHandled && geminiApiKey) {
      try {
        // Enhanced conversation context analysis with RAG
        const { message, conversationHistory: frontendHistory = [] } = req.body;
        const conversationLength = conversationHistory.length + frontendHistory.length;
        const allMessages = [...conversationHistory.map((h: any) => h.message), ...frontendHistory.map((h: any) => h.message)];
        const recentMessages = allMessages.slice(-5);
        
        // Get RAG-enhanced therapeutic guidance
        const ragGuidance = ragEngine?.generateTherapeuticPrompt(message, conversationHistory);
        console.log('RAG Guidance:', ragGuidance?.primaryTopic || 'No match found');
        
        // Better repetition detection
        const messageWords = message.toLowerCase().split(' ').filter((w: string) => w.length > 3);
        const hasRepeatedConcerns = recentMessages.some(msg => {
          const msgWords = msg.toLowerCase().split(' ').filter((w: string) => w.length > 3);
          return messageWords.some((word: string) => msgWords.includes(word)) && msgWords.length > 2;
        });
        
        // Enhanced stress keyword detection using RAG dataset
        const ragKeywords = ragEngine?.getEnhancedStressKeywords() || { crisis: [], high: [], moderate: [], mild: [], positive: [] };
        const stressKeywords = {
          high: [...ragKeywords.high, 'suicide', 'kill myself', 'end it all', 'hopeless', 'can\'t go on'],
          moderate: [...ragKeywords.moderate, 'overwhelmed', 'stressed', 'anxious', 'worried', 'panic'],
          mild: [...ragKeywords.mild, 'tired', 'frustrated', 'annoyed', 'bothered', 'upset'],
          positive: [...ragKeywords.positive, 'better', 'good', 'happy', 'grateful', 'hopeful']
        };
        
        // Track conversation themes using RAG topics
        const conversationThemes = {
          anxiety: allMessages.some(m => /anxious|worry|nervous|panic|stress/.test(m.toLowerCase())),
          depression: allMessages.some(m => /sad|depressed|hopeless|empty|worthless/.test(m.toLowerCase())),
          relationships: allMessages.some(m => /family|friend|partner|relationship|lonely/.test(m.toLowerCase())),
          work: allMessages.some(m => /work|job|career|boss|colleague/.test(m.toLowerCase())),
          sleep: allMessages.some(m => /sleep|tired|insomnia|exhausted/.test(m.toLowerCase()))
        };
        
        // Dynamic therapeutic approaches based on context
        const therapeuticApproaches = {
          initial: [
            "building rapport and understanding your unique perspective",
            "creating a safe space for you to share openly",
            "exploring what brought you here today with curiosity and care"
          ],
          repeated: [
            "noticing patterns we've discussed and exploring them from a new angle",
            "connecting themes across our conversations to deepen insight",
            "building on the foundation we've established to explore new territory",
            "examining this recurring concern through a different therapeutic lens"
          ],
          thematic: {
            anxiety: "using evidence-based anxiety management techniques and cognitive restructuring",
            depression: "exploring mood patterns and building behavioral activation strategies",
            relationships: "examining interpersonal dynamics and communication patterns",
            work: "addressing workplace stress and professional boundary setting",
            sleep: "exploring sleep hygiene and stress-related sleep disruption"
          },
          advanced: [
            "integrating somatic awareness with cognitive understanding",
            "exploring cultural and family-of-origin influences on current patterns",
            "using narrative therapy to reframe your story with empowerment",
            "applying acceptance and commitment therapy principles",
            "incorporating mindfulness-based stress reduction techniques"
          ]
        };
        
        // Select approach based on conversation context
        let selectedApproach;
        if (conversationLength < 2) {
          selectedApproach = therapeuticApproaches.initial[Math.floor(Math.random() * therapeuticApproaches.initial.length)];
        } else if (hasRepeatedConcerns) {
          selectedApproach = therapeuticApproaches.repeated[Math.floor(Math.random() * therapeuticApproaches.repeated.length)];
        } else {
          // Check for themes
          const activeThemes = Object.keys(conversationThemes).filter((theme: string) => (conversationThemes as any)[theme]);
          if (activeThemes.length > 0) {
            const randomTheme = activeThemes[Math.floor(Math.random() * activeThemes.length)];
            selectedApproach = (therapeuticApproaches.thematic as any)[randomTheme];
          } else {
            selectedApproach = therapeuticApproaches.advanced[Math.floor(Math.random() * therapeuticApproaches.advanced.length)];
          }
        }
        
        // Crisis detection keywords (educational mental health support)
        const crisisKeywords = ['feeling hopeless', 'no way out', 'can\'t go on', 'everything is pointless', 'want it to end', 'tired of living', 'hurt myself', 'dangerous thoughts'];
        const panicKeywords = ['panic attack', 'can\'t breathe', 'heart racing', 'chest pain', 'dizzy', 'losing control', 'going crazy', 'hyperventilating'];
        const escalationKeywords = ['angry', 'furious', 'rage', 'explosive', 'outburst', 'breakdown', 'meltdown'];

        const lowerMessage = message.toLowerCase();
        const isCrisis = crisisKeywords.some(keyword => lowerMessage.includes(keyword));
        const isPanic = panicKeywords.some(keyword => lowerMessage.includes(keyword));
        const isEscalating = escalationKeywords.some(keyword => lowerMessage.includes(keyword));

        let responseType = 'standard';
        if (isCrisis) responseType = 'crisis';
        else if (isPanic) responseType = 'panic';
        else if (isEscalating) responseType = 'escalation';

        const contextualInfo = {
          conversationLength,
          hasRepeatedConcerns,
          activeThemes: Object.keys(conversationThemes).filter((theme: string) => (conversationThemes as any)[theme]),
          recentConcerns: recentMessages.slice(-2),
          selectedApproach
        };
        
        // Use RAG-enhanced prompt if available, otherwise fall back to original
        let therapeuticPrompt;
        if (ragGuidance && ragGuidance.prompt) {
          therapeuticPrompt = ragGuidance.prompt;
          selectedApproach = ragGuidance.technique || 'Supportive Therapy';
        } else {
          therapeuticPrompt = `You are MindCare AI, a deeply empathetic and human-like wellness companion. You have the warmth of a trusted friend combined with the expertise of a seasoned therapist.

CURRENT MESSAGE: "${message}"
CONVERSATION CONTEXT: ${JSON.stringify(contextualInfo)}
RESPONSE MODE: ${responseType.toUpperCase()}
THERAPEUTIC APPROACH: ${selectedApproach}

Your therapeutic focus today is ${selectedApproach}. Provide a comprehensive, deeply empathetic response (3-4 paragraphs) that feels like talking to a caring, wise friend who happens to be a skilled therapist:

HUMAN-LIKE EMPATHY:
- Use warm, conversational language that feels natural and genuine
- Show emotional resonance - "I can feel the weight of what you're carrying"
- Use personal, connecting phrases - "That sounds incredibly difficult" 
- Express genuine care - "I'm really glad you shared this with me"
- Acknowledge their courage - "It takes strength to reach out when you're struggling"

DEEP EMOTIONAL UNDERSTANDING:
- Reflect not just their words but the emotions underneath
- Validate the complexity of human experience
- Show understanding of cultural context (Indian family dynamics, societal pressures)
- Acknowledge the full spectrum of their emotional experience
- Use metaphors and imagery that resonate emotionally
`;
        }

        // Call Gemini AI
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: therapeuticPrompt }]
              }]
            })
          }
        )

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json()
          aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
        }
      } catch (error) {
        console.error('Gemini API error:', error)
      }
    }

    // Fallback to personalized responses if Gemini fails
    if (!aiResponse) {
      // Try RAG-based synthesis without Gemini (compose a tailored response from dataset)
      try {
        const ragMatches = (ragEngine as any).findBestMatches ? (ragEngine as any).findBestMatches(message, conversationHistory, 1) : []
        if (ragMatches && ragMatches.length > 0) {
          const match = ragMatches[0]
          const introByTone: Record<string, string[]> = {
            empathetic_supportive: [
              "I'm really hearing the weight of what you're going through.",
              "Thank you for sharing this with me—what you're carrying sounds heavy.",
            ],
            understanding_practical: [
              "That sounds like a lot to manage—let's make this a bit more workable.",
              "This is tough, and we can break it into steps together.",
            ],
            crisis_support: [
              "I'm here with you now, and your safety matters most.",
              "I hear the urgency in what you're saying, and we’ll take this moment by moment.",
            ],
          }
          const closers: string[] = [
            "What feels like the smallest next step you could take right now?",
            "As you sit with this, what's one thing your body needs in this moment—water, breathing, a short pause?",
            "Would you like to explore one or two concrete steps together?",
          ]

          const tone = (match.tone || '').toLowerCase()
          const intros = introByTone[tone] || [
            "I can feel how important this is for you.",
            "You're not alone in this; I'm here with you.",
          ]

          const intro = intros[Math.floor(Math.random() * intros.length)]
          const closer = closers[Math.floor(Math.random() * closers.length)]

          // Blend the dataset response with a warm intro and an action-oriented closer
          aiResponse = `${intro}\n\n${match.response}\n\n${closer}`
        }
      } catch (e) {
        // If RAG synthesis fails, continue to keyword fallbacks below
        console.warn('RAG synthesis fallback failed:', e)
      }

      // Create more contextual responses based on the message content
      const lowerMessage = message.toLowerCase()
      // Enhanced fallback responses with crisis detection and empathetic language
      const fallbackResponses = {
        crisis: [
          "⚠️ I'm concerned about what you're sharing. Your feelings are valid, and I want you to know that support is available to help you through this difficult time.\n\n**PROFESSIONAL SUPPORT:**\n• Mental Health Helpline: 9152987821\n• AASRA Support: 91-9820466726\n• Vandrevala Foundation: 1860-2662-345\n• Emergency Services: 112\n\nI'm here with you right now. Can you tell me about your current support system? You don't have to navigate this alone.",
          "What you're experiencing sounds incredibly overwhelming. I want you to know that reaching out shows real strength, and professional help can make a significant difference.\n\n**IMMEDIATE RESOURCES:**\n• Call 9152987821 (Mental Health Support)\n• Contact local mental health services\n• Reach out to trusted friends or family\n• Call 112 if you need immediate assistance\n\nThese difficult feelings can be addressed with proper support. Are you in a safe environment? Who in your life could you reach out to?"
        ],
        panic: [
          "I can hear that you're in real distress right now, and I want you to know that you're going to get through this. Let's work together to help you feel safer.\n\n**RIGHT NOW:** Put your feet flat on the floor. Breathe with me - in for 4... hold for 7... out for 8. Again: In... 2... 3... 4... Hold... 2... 3... 4... 5... 6... 7... Out... 2... 3... 4... 5... 6... 7... 8...\n\nYou're safe. This feeling will pass. What's one thing you can see around you right now?",
          "That racing, overwhelming feeling you're experiencing - I can feel how frightening this must be for you. Your body is trying to protect you, but you're actually safe right now.\n\n**GROUNDING TECHNIQUE:** Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste.\n\nPanic attacks feel terrifying but they're not dangerous. You've gotten through every single one before, and you'll get through this one too. I'm right here with you."
        ],
        escalation: [
          "I can feel the intensity of what you're experiencing right now - these big emotions make complete sense given what you're going through. When feelings get this overwhelming, it's like being caught in a storm.\n\nLet's focus on bringing your nervous system back to calmer waters. Can you put your feet flat on the ground and take three deep breaths with me? These emotions are valid, and we're going to find a safe way to work through them together.\n\nWhat's the strongest emotion you're feeling right now? Sometimes naming it helps us understand what it's trying to tell us.",
          "The fire you're feeling inside - I can sense how intense and overwhelming this must be. When emotions feel this big, it's like a wave that threatens to knock us over. But here's what I know: you have the strength to ride this wave.\n\nRight now, let's focus on grounding. Feel your feet on the floor, notice your breathing. These feelings are temporary, even when they feel endless. What's one thing that usually helps you feel more in control when emotions get this intense?"
        ],
        stress: [
          "I can feel the weight of what you're carrying right now - that constant pressure that seems to press down on everything. When stress builds up like this, it's like our nervous system is stuck in overdrive, and that's exhausting.\n\nWhat you're experiencing sounds incredibly overwhelming. I'm wondering, in the middle of all this chaos, what's the one thing that feels most urgent to you? Sometimes when everything feels impossible, focusing on just the next small step can help us find our footing again.\n\nYour stress response is actually your mind trying to protect you, even though it doesn't feel helpful right now. What physical sensations are you noticing in your body as we talk about this?",
          "The juggling act you're describing sounds absolutely exhausting. I can imagine how draining it must be to have so many demands pulling at you from different directions. That kind of chronic stress doesn't just affect our minds - it lives in our bodies too.\n\nI'm curious about something - in the midst of all these stressors, which one feels like it's taking up the most emotional space for you? Sometimes identifying the biggest weight can help us figure out where to start. What would it feel like to have even one of these pressures lifted, even temporarily?"
        ],
        anxiety: [
          "That spiraling feeling you're describing - I can sense how your mind is racing through all those 'what if' scenarios. Anxiety has this way of making our brains work overtime, trying to solve problems that haven't even happened yet. It's like being trapped in a maze of worries.\n\nI'm wondering what specific worry is taking up the most mental space for you right now? Sometimes when we can name the biggest fear, it loses a little bit of its power over us. Your anxiety is actually trying to protect you by preparing for every possibility, but I imagine it's exhausting to live with that constant vigilance.\n\nWhat would it feel like to focus just on this present moment, right here with me? Not the past, not the future, but just this conversation, this breath?",
          "I can feel the weight of uncertainty you're carrying. Anxiety often gets louder when we feel like we're walking into the unknown without a map. Behind all that worry, I'm sensing there's something really important to you that you're trying to protect or achieve.\n\nWhat matters most to you in all of this? Sometimes understanding what we're really trying to safeguard can help us see our anxiety differently. What's one thing you do know for sure about your situation right now, even in the midst of all this uncertainty?"
        ],
        sadness: [
          "There's something so profound about the sadness you're sharing - I can feel the depth of what this means to you. Sadness often arrives when we're processing something significant, like loss or disappointment or change. It's your heart's way of honoring what matters.\n\nThe heaviness you're describing sounds like it connects to something really meaningful in your life. What are you grieving or missing most right now? Sometimes our sadness is trying to tell us something important about what we value, what we've lost, or what we're longing for.\n\nThat capacity you have to feel this deeply - it's actually a strength, even when it hurts so much. What would it look like to honor these feelings instead of fighting them?",
          "I can sense the profound sadness in what you're sharing, and I want you to know that these feelings make complete sense. Sometimes sadness is our heart's way of processing change or recognizing what we've lost or what we're missing.\n\nWhat shift or loss is your sadness helping you understand? There's wisdom in allowing ourselves to feel sadness fully - it's how we process and eventually heal. Your ability to feel this deeply shows how much you care, how much things matter to you."
        ],
        anger: [
          "I can feel the fire in what you're sharing - that anger is pointing to something really important. Anger often shows up when our boundaries have been crossed or when something we value deeply has been threatened or disrespected. It's like your internal alarm system saying 'this isn't right.'\n\nWhat principle or value feels like it's been violated here? If your anger could speak, what would it be demanding? Sometimes understanding what our anger is trying to protect can help us channel that energy in a way that actually creates change.\n\nUnderneath that fire, I'm wondering what other emotions might be present - sometimes anger is the bodyguard for more vulnerable feelings like hurt or fear.",
          "That intensity you're feeling - your anger makes complete sense given what you've described. It's your internal justice system recognizing that something isn't right. Anger can be incredibly clarifying about what needs to change, even when it feels overwhelming.\n\nWhat action would feel most empowering right now? Not necessarily something big or dramatic, but something that honors what your anger is trying to tell you. What would it look like to channel this fire in a way that serves you?"
        ],
        help: [
          "I'm really glad you're here, and I want you to know that reaching out takes real courage. There's wisdom in recognizing when we need someone to talk to, when we need support to navigate what we're facing.\n\nI'm curious about what's been happening in your world that brought you here today. What feels most pressing or confusing right now? Sometimes just having someone witness our experience can help us see things more clearly.\n\nYou don't have to carry whatever you're facing alone. What would feel most valuable for us to focus on together?",
          "Taking the step to reach out shows such self-awareness and strength. I'm here to listen and explore whatever you're going through with you. What's been on your mind that made you decide to seek support today?\n\nReaching out is often the hardest part - you've already done something really important by being here. Now that you're here, what would feel most helpful to talk about?"
        ],
        generic: [
          "What you're sharing sounds like it carries real weight for you, and I can sense there's a lot beneath the surface. I'm interested in understanding more about how this is affecting not just your thoughts, but your whole experience - your emotions, your body, your daily life.\n\nThere's complexity in what you're describing, and that makes complete sense. Human experiences are rarely simple or straightforward. Sometimes talking through these layers can help us see patterns or possibilities we hadn't noticed before. What stands out most to you as we sit with this together?",
          "Thank you for trusting me with what you're experiencing. I can feel that this is significant for you, and your experience is completely valid. Every situation has multiple dimensions, multiple layers of meaning and feeling.\n\nI'm curious about which part of this feels most important to explore first. What aspect feels most confusing or challenging right now? Sometimes starting with what feels most alive or present can help us understand the bigger picture."
        ]
      }

      // Only pick from keyword fallbacks if RAG synthesis above didn't produce a response
      if (!aiResponse) {
        // Crisis detection first (highest priority) - educational mental health support
        const crisisKeywords = ['feeling hopeless', 'no way out', 'can\'t go on', 'everything is pointless', 'want it to end', 'tired of living', 'hurt myself', 'dangerous thoughts'];
        const panicKeywords = ['panic attack', 'can\'t breathe', 'heart racing', 'chest pain', 'dizzy', 'losing control', 'going crazy', 'hyperventilating'];
        const escalationKeywords = ['angry', 'furious', 'rage', 'explosive', 'outburst', 'breakdown', 'meltdown'];

        const isCrisis = crisisKeywords.some(keyword => lowerMessage.includes(keyword));
        const isPanic = panicKeywords.some(keyword => lowerMessage.includes(keyword));
        const isEscalating = escalationKeywords.some(keyword => lowerMessage.includes(keyword));

        if (isCrisis) {
          aiResponse = fallbackResponses.crisis[Math.floor(Math.random() * fallbackResponses.crisis.length)]
        } else if (isPanic) {
          aiResponse = fallbackResponses.panic[Math.floor(Math.random() * fallbackResponses.panic.length)]
        } else if (isEscalating) {
          aiResponse = fallbackResponses.escalation[Math.floor(Math.random() * fallbackResponses.escalation.length)]
        } else if (lowerMessage.includes('stress')) {
          aiResponse = fallbackResponses.stress[Math.floor(Math.random() * fallbackResponses.stress.length)]
        } else if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
          aiResponse = fallbackResponses.anxiety[Math.floor(Math.random() * fallbackResponses.anxiety.length)]
        } else if (lowerMessage.includes('sad') || lowerMessage.includes('depressed')) {
          aiResponse = fallbackResponses.sadness[Math.floor(Math.random() * fallbackResponses.sadness.length)]
        } else if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated')) {
          aiResponse = fallbackResponses.anger[Math.floor(Math.random() * fallbackResponses.anger.length)]
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
          aiResponse = fallbackResponses.help[Math.floor(Math.random() * fallbackResponses.help.length)]
        } else {
          aiResponse = fallbackResponses.generic[Math.floor(Math.random() * fallbackResponses.generic.length)]
        }
      }
    }

    // Dynamic stress level analysis based on message content and conversation context
    // Use RAG-enhanced stress keywords if available
    const ragKeywords = ragEngine?.getEnhancedStressKeywords() || { crisis: [], high: [], moderate: [], mild: [], positive: [] };
    const stressKeywords = {
      high: [...(ragKeywords.crisis || []), ...(ragKeywords.high || []), 'suicide', 'kill myself', 'end it all', 'hopeless', 'can\'t go on', 'worthless', 'hate myself', 'no point', 'give up', 'hurt myself'],
      moderate: [...ragKeywords.moderate, 'overwhelmed', 'stressed', 'anxious', 'worried', 'panic', 'scared', 'nervous', 'tense', 'pressure', 'burden'],
      mild: [...ragKeywords.mild, 'tired', 'frustrated', 'annoyed', 'bothered', 'upset', 'disappointed', 'confused', 'uncertain', 'restless', 'irritated'],
      positive: [...ragKeywords.positive, 'better', 'good', 'happy', 'grateful', 'hopeful', 'calm', 'peaceful', 'confident', 'excited', 'motivated']
    };
    
    const messageWords = message.toLowerCase().split(/\s+/)
    const lowerMessage = message.toLowerCase()
    
    // Count keyword matches by severity
    const highStressMatches = stressKeywords.high.filter(keyword => lowerMessage.includes(keyword)).length
    const moderateStressMatches = stressKeywords.moderate.filter(keyword => lowerMessage.includes(keyword)).length
    const mildStressMatches = stressKeywords.mild.filter(keyword => lowerMessage.includes(keyword)).length
    const positiveMatches = stressKeywords.positive.filter(keyword => lowerMessage.includes(keyword)).length
    
    // Calculate base stress with more nuanced approach
    let baseStress = 5 // neutral baseline
    
    if (highStressMatches > 0) {
      baseStress = Math.min(9 + highStressMatches, 10)
    } else if (moderateStressMatches > 0) {
      baseStress = Math.min(6 + moderateStressMatches * 1.5, 9)
    } else if (mildStressMatches > 0) {
      baseStress = Math.min(4 + mildStressMatches, 7)
    } else if (positiveMatches > 0) {
      baseStress = Math.max(3 - positiveMatches * 0.5, 1)
    }
    
    // Adjust based on message length and intensity
    const messageLength = messageWords.length
    const intensityWords = ['very', 'extremely', 'really', 'so', 'incredibly', 'absolutely']
    const intensityCount = intensityWords.filter(word => lowerMessage.includes(word)).length
    
    if (intensityCount > 0 && (highStressMatches > 0 || moderateStressMatches > 0)) {
      baseStress = Math.min(baseStress + intensityCount * 0.5, 10)
    }
    
    // Consider conversation history for trend analysis
    if (conversationHistory.length > 0) {
      const recentStressLevels = conversationHistory.slice(-3).map(h => h.stress_level)
      const avgRecentStress = recentStressLevels.reduce((a, b) => a + b, 0) / recentStressLevels.length
      
      // Gradual adjustment based on conversation trend
      if (Math.abs(baseStress - avgRecentStress) > 3) {
        baseStress = avgRecentStress + (baseStress - avgRecentStress) * 0.7 // Smooth transitions
      }
    }
    
    baseStress = Math.round(Math.max(1, Math.min(10, baseStress)))

    const getStressColor = (level: number) => level >= 8 ? 'red' : level >= 6 ? 'orange' : level >= 4 ? 'yellow' : 'green'
    const getStressLabel = (level: number) => level >= 9 ? 'Crisis' : level >= 7 ? 'High Stress' : level >= 5 ? 'Moderate' : level >= 3 ? 'Low Stress' : 'Calm'
    const getStressAnimation = (level: number) => level >= 8 ? 'warning-pulse' : level >= 6 ? 'pulse-stress' : level >= 4 ? 'heartbeat' : 'none'

    // Store conversation with emotion analysis
    const emotionAnalysis = {
      primary_emotion: highStressMatches > 0 ? 'crisis' : 
                      moderateStressMatches > 0 ? 'anxious' : 
                      mildStressMatches > 0 ? 'distressed' : 
                      positiveMatches > 0 ? 'positive' : 'neutral',
      stress_level: baseStress,
      emotion_intensity: 0.5 + (baseStress / 20),
      risk_assessment: baseStress >= 8 ? 'high' : baseStress >= 6 ? 'moderate' : 'low',
      psychological_markers: [
        ...stressKeywords.high.filter(k => lowerMessage.includes(k)),
        ...stressKeywords.moderate.filter(k => lowerMessage.includes(k)),
        ...stressKeywords.mild.filter(k => lowerMessage.includes(k))
      ]
    };

    conversationHistory.push({
      message,
      response: aiResponse,
      stress_level: baseStress,
      timestamp: new Date().toISOString(),
      emotion_analysis: emotionAnalysis
    });

    // Keep conversation history manageable
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }

    // Calculate trend
    let trend = 'stable'
    if (conversationHistory.length > 1) {
      const prevStress = conversationHistory[conversationHistory.length - 2].stress_level
      if (baseStress > prevStress) trend = 'increasing'
      else if (baseStress < prevStress) trend = 'decreasing'
    }

    // Avoid repeating the exact same AI response back-to-back
    const lastResponse = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1].response : ''
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
    if (aiResponse && lastResponse && normalize(aiResponse) === normalize(lastResponse)) {
      const varietyClosers = [
        "As we sit with this, what's one small shift that might feel possible this week?",
        "Would it help if we mapped this into one practical step for today?",
        "If you had support from someone you trust, what would you ask them for right now?",
        "What's one sign you might notice when things feel even a little bit lighter?",
      ]
      const extra = varietyClosers[Math.floor(Math.random() * varietyClosers.length)]
      aiResponse = `${aiResponse}\n\n${extra}`
    }

    res.status(200).json({
      status: 'success',
      response: aiResponse,
      emotion_analysis: {
        primary_emotion: highStressMatches > 0 ? 'crisis' : moderateStressMatches > 0 ? 'anxious' : mildStressMatches > 0 ? 'distressed' : positiveMatches > 0 ? 'positive' : 'neutral',
        stress_level: baseStress,
        emotion_intensity: 0.5 + (baseStress / 20),
        risk_assessment: baseStress >= 8 ? 'high' : baseStress >= 6 ? 'moderate' : 'low',
        psychological_markers: [...stressKeywords.high.filter(k => lowerMessage.includes(k)), ...stressKeywords.moderate.filter(k => lowerMessage.includes(k)), ...stressKeywords.mild.filter(k => lowerMessage.includes(k))]
      },
      stress_meter: {
        current: baseStress,
        percentage: (baseStress / 10) * 100,
        color: getStressColor(baseStress),
        label: getStressLabel(baseStress),
        animation: getStressAnimation(baseStress),
        trend
      },
      therapeutic_insights: {
        approach: 'Supportive',
        coping_suggestion: baseStress >= 7 ? 'Consider taking some deep breaths and grounding yourself' : 'Continue sharing your thoughts and feelings',
        is_crisis: baseStress >= 9
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    res.status(500).json({
      status: 'error',
      response: 'I apologize for the technical difficulty. I\'m still here to support you.',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
