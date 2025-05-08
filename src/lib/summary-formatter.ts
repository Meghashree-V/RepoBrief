/**
 * Utility functions to format meeting summaries for better readability
 */

/**
 * Formats a meeting summary into a more structured and readable format
 * @param summaryText The original summary text from AssemblyAI
 * @returns Formatted summary with key points extracted
 */
export function formatMeetingSummary(summaryText: string): {
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
  participants: string[];
  mainSummary: string;
  meetingTitle: string;
  duration: string;
  transcript?: string;
} {
  if (!summaryText) {
    return {
      keyPoints: [],
      actionItems: [],
      decisions: [],
      participants: [],
      mainSummary: "No summary available",
      meetingTitle: "Untitled Meeting",
      duration: "Unknown duration",
      transcript: ""
    };
  }

  // Clean the summary text - sometimes AI transcriptions include artifacts
  summaryText = summaryText
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/\n+/g, '. ')          // Convert newlines to periods
    .replace(/\.\s*\./g, '.')       // Remove duplicate periods
    .replace(/\s+\./g, '.')         // Clean up spaces before periods
    .replace(/\.([a-zA-Z])/g, '. $1'); // Ensure space after periods

  // Break the summary into sentences
  const sentences = summaryText.match(/[^.!?]+[.!?]+/g) || [];
  const cleanedSentences = sentences.map(s => s.trim()).filter(s => s.length > 10);
  
  // Extract key points using more sophisticated approach
  // Prioritize sentences with important-sounding beginnings or keywords
  const keyPointIndicators = [
    /^(key point|importantly|significantly|notably|primarily|essentially|fundamentally)/i,
    /\b(main|primary|critical|essential|key|crucial|important|significant)\s+(point|topic|issue|concern|focus|aspect)\b/i,
    /\b(highlight|emphasized|stressed|pointed out|noted|mentioned)\b/i
  ];

  // Score sentences for key point potential
  const scoredSentences = cleanedSentences.map(sentence => {
    let score = 0;
    
    // Ideal length for key points (not too short, not too long)
    if (sentence.length > 30 && sentence.length < 150) score += 2;
    
    // Presence of key indicators
    keyPointIndicators.forEach(regex => {
      if (regex.test(sentence)) score += 3;
    });
    
    // Good length of words (more substantial)
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 20) score += 2;
    
    // Avoid filler sentences
    if (/\b(um|uh|like|you know|I mean)\b/i.test(sentence)) score -= 3;
    
    // Prefer sentences with concrete information
    if (/\b(percent|\d+|statistic|figure|data|result|outcome)\b/i.test(sentence)) score += 2;
    if (/\b(increasing|decreasing|improved|reduced|changed|impact)\b/i.test(sentence)) score += 1;
    
    return { sentence, score };
  });

  // Sort by score and get top key points
  const keyPoints = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.sentence);

  // Enhanced action item detection
  const actionItemRegexes = [
    // Strong action verbs and assignments
    /\b(will|shall|must|need to|going to|has to|have to|required to|assigned to)\s+[^.!?]*?(complete|finish|deliver|prepare|create|implement|develop|follow up|contact|call|email|review|update|check|research)\b[^.!?]*?[.!?]/gi,
    
    // Clear markers of tasks
    /\b(action item|task|todo|to-do|assignment|deliverable|responsibility|follow-up|next step)\s+[^.!?]*?[.!?]/gi,
    
    // Deadlines and timeframes
    /\b(by|before|due|deadline|within|no later than)\s+[^.!?]*?\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}(st|nd|rd|th)?|week|month|quarter|year)\b[^.!?]*?[.!?]/gi,
    
    // Agreed actions
    /\b(agreed|committed|promised|volunteered)\s+to\s+[^.!?]*?[.!?]/gi,
    
    // Names followed by verbs indicating responsibility
    /\b([A-Z][a-z]+)\s+(will|should|is going to|has to|needs to)\s+[^.!?]*?[.!?]/g
  ];

  // Extract action items with improved approach
  const actionItems: string[] = [];
  // First pass: use regexes
  actionItemRegexes.forEach(regex => {
    const matches = summaryText.match(regex) || [];
    matches.forEach(match => {
      const cleaned = match.trim();
      if (!actionItems.includes(cleaned) && cleaned.length > 15) {
        actionItems.push(cleaned);
      }
    });
  });
  
  // Second pass: check for action-oriented sentences that weren't caught by regexes
  if (actionItems.length < 3) {
    cleanedSentences.forEach(sentence => {
      // Only check if we don't already have this sentence
      if (!actionItems.includes(sentence)) {
        const lowerSentence = sentence.toLowerCase();
        // Check for clear action indicators
        if (
          ((lowerSentence.includes("will") || 
            lowerSentence.includes("should") || 
            lowerSentence.includes("need") ||
            lowerSentence.includes("task") ||
            lowerSentence.includes("action") ||
            lowerSentence.includes("follow") ||
            lowerSentence.includes("by") &&
            lowerSentence.includes("date")) &&
           (lowerSentence.includes("complete") ||
            lowerSentence.includes("prepare") ||
            lowerSentence.includes("create") ||
            lowerSentence.includes("implement") ||
            lowerSentence.includes("review") ||
            lowerSentence.includes("update")))
        ) {
          actionItems.push(sentence);
        }
      }
    });
  }

  // Enhanced decision detection
  const decisionRegexes = [
    // Clear decision markers
    /\b(decided|determined|resolved|agreed|approved|confirmed|finalized|concluded|reached a decision)\s+[^.!?]*?[.!?]/gi,
    
    // Decision outcomes
    /\b(decision|agreement|conclusion|consensus|resolution|outcome|result)\s+(was|is|has been)\s+[^.!?]*?[.!?]/gi,
    
    // Team/group decisions
    /\b(team|group|committee|board|everyone|all)\s+(decided|agreed|determined|concluded)\s+[^.!?]*?[.!?]/gi,
    
    // Formal decisions with specific markers
    /\b(motion|proposal|recommendation)\s+(was|is|has been)\s+(approved|accepted|passed|adopted)\b[^.!?]*?[.!?]/gi
  ];

  // Extract decisions with improved approach
  const decisions: string[] = [];
  // First pass: use regexes
  decisionRegexes.forEach(regex => {
    const matches = summaryText.match(regex) || [];
    matches.forEach(match => {
      const cleaned = match.trim();
      if (!decisions.includes(cleaned) && cleaned.length > 15) {
        decisions.push(cleaned);
      }
    });
  });
  
  // Second pass: check for decision-oriented sentences that weren't caught by regexes
  if (decisions.length < 3) {
    cleanedSentences.forEach(sentence => {
      // Only check if we don't already have this sentence
      if (!decisions.includes(sentence)) {
        const lowerSentence = sentence.toLowerCase();
        // Check for clear decision indicators
        if (
          (lowerSentence.includes("decided") || 
           lowerSentence.includes("agreed") || 
           lowerSentence.includes("determined") ||
           lowerSentence.includes("approved") ||
           lowerSentence.includes("conclusion") ||
           lowerSentence.includes("consensus")) &&
          !lowerSentence.includes("will") && // Avoid action items
          !lowerSentence.includes("should") // Avoid recommendations
        ) {
          decisions.push(sentence);
        }
      }
    });
  }

  // Enhanced participant detection
  const participantRegexes = [
    // Explicit mentions of participants
    /\b(participant|attendee|present|joined|attended by|speaker)s?\b[^.!?]*?[.!?]/gi,
    
    // Lists of names, possibly with titles
    /\b(present|attending|participants|attendees)\s+(were|included|consisted of)\s+[^.!?]*?[.!?]/gi,
    
    // Meeting led by or organized by
    /\b(meeting|call|discussion|session)\s+(was|is)\s+(led by|chaired by|organized by|facilitated by)\s+[^.!?]*?[.!?]/gi,
    
    // Name patterns for individual participants
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(from|of|at|representing|speaking for)\s+[^.!?]*?[.!?]/g
  ];

  // Extract participants with improved approach
  const participantMatches: string[] = [];
  participantRegexes.forEach(regex => {
    const matches = summaryText.match(regex) || [];
    matches.forEach(match => {
      const cleaned = match.trim();
      if (!participantMatches.includes(cleaned) && cleaned.length > 10) {
        participantMatches.push(cleaned);
      }
    });
  });
  
  // Extract names from sentences about participants
  const nameExtractorRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const potentialNames: string[] = [];
  
  participantMatches.forEach(match => {
    const nameMatches = [...match.matchAll(nameExtractorRegex)];
    nameMatches.forEach(nameMatch => {
      const name = nameMatch[0];
      // Exclude common non-name words that might be capitalized
      if (![
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
        "January", "February", "March", "April", "May", "June", "July", 
        "August", "September", "October", "November", "December",
        "Participants", "Attendees", "Present", "Meeting", "The", "A", "An", "And"
      ].includes(name) && name.length > 3) {
        potentialNames.push(name);
      }
    });
  });
  
  // Clean up and remove duplicates from participants list
  const participants = Array.from(new Set(potentialNames));

  // Improved meeting title extraction
  let meetingTitle = "Meeting Summary";
  
  // Look for explicit title patterns
  const titlePatterns = [
    /\b(meeting|discussion|call|session|conference)\s+(about|on|regarding|concerning|for|to discuss)\s+([^.!?]+)/i,
    /\b(the|this)\s+(meeting|discussion|call|session|conference)\s+(was|is)\s+(about|on|regarding|concerning)\s+([^.!?]+)/i,
    /\b(topic|subject|focus|agenda|purpose)\s+(of|for)\s+(the|this)\s+(meeting|discussion|call|session|conference)\s+(was|is)\s+([^.!?]+)/i
  ];
  
  // Try to find an explicit title using patterns
  for (const pattern of titlePatterns) {
    const match = summaryText.match(pattern);
    if (match && match.length > 0) {
      // Extract the relevant capture group based on the pattern
      const titlePart = match[match.length - 1];
      if (titlePart && titlePart.trim().length > 3 && titlePart.trim().length < 100) {
        meetingTitle = titlePart.trim().replace(/\.$/,''); // Remove trailing period if present
        break;
      }
    }
  }
  
  // If no explicit title found, use the first sentence if it's not too long
  if (meetingTitle === "Meeting Summary" && cleanedSentences.length > 0) {
    const firstSentence = cleanedSentences[0] || '';
    if (firstSentence.length < 100 && firstSentence.length > 10) {
      meetingTitle = firstSentence.replace(/^(this|the) meeting (was|is) about/i, '').trim();
    }
  }
  
  // Ensure the title isn't too long
  if (meetingTitle.length > 60) {
    meetingTitle = meetingTitle.substring(0, 60) + '...';
  }

  // Improved duration detection
  const durationRegexes = [
    /\b(meeting|call|discussion|session)\s+(lasted|took|ran for|continued for)\s+([^.!?]*?(hour|minute|min|hr)s?)\b/gi,
    /\b(duration|length|time)\s+(of|for)\s+(the|this)\s+(meeting|call|discussion|session)\s+(was|is)\s+([^.!?]*?(hour|minute|min|hr)s?)\b/gi,
    /\b(lasted|duration|for|took)\s+([\w\s]+)\s+(hour|minute|min|hr)s?\b/gi
  ];
  
  let duration = "Duration not specified";
  
  for (const regex of durationRegexes) {
    const match = summaryText.match(regex);
    if (match && match.length > 0) {
      duration = match[0].trim();
      break;
    }
  }

  // Select the best items for each category and ensure we have at least 3 items in each category if possible
  const bestKeyPoints = keyPoints.slice(0, 5); // Up to 5 key points
  
  // Sort action items by length (preferring medium-length ones) then take top 3-5
  const sortedActionItems = [...actionItems].sort((a, b) => {
    // Prefer items between 50-150 characters
    const aScore = Math.abs(100 - a.length);
    const bScore = Math.abs(100 - b.length);
    return aScore - bScore;
  });
  const bestActionItems = sortedActionItems.slice(0, Math.min(5, sortedActionItems.length));
  
  // Sort decisions similarly
  const sortedDecisions = [...decisions].sort((a, b) => {
    const aScore = Math.abs(100 - a.length);
    const bScore = Math.abs(100 - b.length);
    return aScore - bScore;
  });
  const bestDecisions = sortedDecisions.slice(0, Math.min(5, sortedDecisions.length));
  
  // Limit participants to 5
  const bestParticipants = participants.slice(0, 5);

  return {
    keyPoints: bestKeyPoints,
    actionItems: bestActionItems,
    decisions: bestDecisions,
    participants: bestParticipants,
    mainSummary: summaryText,
    meetingTitle,
    duration,
    transcript: "" // This will be set by the calling function
  };
}
