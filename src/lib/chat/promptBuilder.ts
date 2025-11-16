/**
 * System Prompt Builder for WebLLM
 * Injects dynamic context into LLM for every query
 */

import type {
  DynamicChatContext,
  UserData,
  CurrentView,
  RegionalStats,
  HierarchicalStateStats,
  DistrictData,
  PreviousContext
} from './types';

/**
 * Build system prompt with current context
 */
export function buildSystemPrompt(context: DynamicChatContext): string {
  const { currentView, geoMetadata, userData } = context;

  let prompt = `You are a data analysis assistant for BharatViz, an interactive map visualization tool for India.

## Current Context

**View:** ${getViewDescription(currentView.tab, currentView.selectedState)}
**Map Type:** ${currentView.mapType} boundaries
`;

  if (currentView.selectedState && geoMetadata.selectedStateInfo) {
    prompt += `**Selected State:** ${currentView.selectedState}
**Districts in view:** ${geoMetadata.selectedStateInfo.districtCount}
`;
  }

  if (userData.hasData) {
    prompt += buildUserDataSection(userData, currentView);
  } else {
    prompt += buildNoDataSection();
  }

  if (context.previousContext) {
    prompt += buildPreviousContextSection(context.previousContext);
  }

  prompt += buildCapabilitiesSection();
  prompt += buildGuidelinesSection();

  return prompt;
}

function getViewDescription(tab: string, selectedState?: string): string {
  switch (tab) {
    case 'states':
      return 'State-level map of India';
    case 'districts':
      return 'All-India districts map';
    case 'state-districts':
      return `Districts in ${selectedState} state`;
    default:
      return 'Map view';
  }
}

function buildUserDataSection(userData: UserData, currentView: CurrentView): string {
  // Use the actual metric name if provided, otherwise fall back to generic "values"
  const metricLabel = userData.metricName || 'values';

  let section = `
## User's Data

**Metric:** ${metricLabel}
**Data Type:** ${userData.dataType}-level ${metricLabel}
**Entities with data:** ${userData.count} out of ${userData.totalExpected} expected
**Missing data:** ${userData.missingEntities.length} entities (${userData.missingPercentage.toFixed(1)}%)

**IMPORTANT:** Always refer to the data as "${metricLabel}" in your responses, not as "data" or "values".
`;

  // Add explicit restriction for state-level views
  if (currentView.tab === 'states') {
    section += `
**IMPORTANT:** This is STATE-LEVEL data only. Do NOT mention, infer, or reference any district names or district-level information. Only discuss states and state-level patterns.
`;
  }

  if (userData.missingEntities.length > 0 && userData.missingEntities.length <= 10) {
    section += `**Missing entities:** ${userData.missingEntities.join(', ')}
`;
  } else if (userData.missingEntities.length > 10) {
    section += `**Missing entities:** ${userData.missingEntities.slice(0, 10).join(', ')} and ${userData.missingEntities.length - 10} more
`;
  }

  if (userData.stats) {
    section += `
**Statistics:**
- Range: ${userData.stats.min.toFixed(2)} to ${userData.stats.max.toFixed(2)}
- Mean: ${userData.stats.mean.toFixed(2)}
- Median: ${userData.stats.median.toFixed(2)}
- Std Dev: ${userData.stats.stdDev.toFixed(2)}
- Q25/Q75: ${userData.stats.q25.toFixed(2)} / ${userData.stats.q75.toFixed(2)}
`;
  }

  if (userData.top10.length > 0) {
    section += `
**Top 5:**
${userData.top10.slice(0, 5).map((d: { name: string; value: number }, i: number) => `${i + 1}. ${d.name}: ${d.value.toFixed(2)}`).join('\n')}

**Bottom 5:**
${userData.bottom10.slice(0, 5).map((d: { name: string; value: number }, i: number) => `${i + 1}. ${d.name}: ${d.value.toFixed(2)}`).join('\n')}
`;
  }

  // For state-level view, include all state values
  if (currentView.tab === 'states' && userData.allData && userData.allData.length > 0) {
    section += `
**All states with data:**
${userData.allData.map(d => `- ${d.name}: ${d.value.toFixed(2)}`).join('\n')}
`;
  }

  if (userData.regionalStats && Object.keys(userData.regionalStats).length > 0) {
    section += `
**Regional Averages:**
${Object.entries(userData.regionalStats)
  .map(([region, stats]: [string, RegionalStats]) =>
    `- ${region}: ${stats.mean.toFixed(2)} (${stats.dataCount} entities with data)`
  )
  .join('\n')}
`;
  }

  // Include detailed data for state-districts view
  if (userData.hierarchicalStats && currentView.tab === 'state-districts' && currentView.selectedState) {
    const state = currentView.selectedState;
    const stateStats = userData.hierarchicalStats[state];
    if (stateStats) {
      section += `
**${state} Districts:**
- Total districts: ${stateStats.districtCount}
- Districts with data: ${stateStats.dataCount}
- Missing data: ${stateStats.missingCount} districts
- Average: ${stateStats.mean?.toFixed(2) || 'N/A'}
- Range: ${stateStats.min?.toFixed(2) || 'N/A'} to ${stateStats.max?.toFixed(2) || 'N/A'}
`;

      // Include actual district values
      if (stateStats.districts && stateStats.districts.length > 0) {
        const districtsWithData = stateStats.districts.filter(d => !d.missing);
        const missingDistricts = stateStats.districts.filter(d => d.missing);

        if (districtsWithData.length > 0) {
          section += `
**Districts with values:**
${districtsWithData.map(d => `- ${d.name}: ${d.value?.toFixed(2)}`).join('\n')}
`;
        }

        if (missingDistricts.length > 0 && missingDistricts.length <= 10) {
          section += `
**Missing districts:** ${missingDistricts.map(d => d.name).join(', ')}
`;
        }
      }
    }
  }

  // Include hierarchical data for all-India district views
  if (userData.hierarchicalStats && currentView.tab === 'districts') {
    const statesWithData = Object.entries(userData.hierarchicalStats)
      .filter(([_, stats]: [string, HierarchicalStateStats]) => stats.dataCount > 0)
      .sort((a, b) => b[1].dataCount - a[1].dataCount);

    // Check if specific states were mentioned in the query
    const mentionedStates = context.mentionedStates || [];
    const shouldIncludeAllDetails = mentionedStates.length === 0;

    if (mentionedStates.length > 0) {
      section += `
**District Data for ${mentionedStates.join(', ')}:**
`;
      // Include detailed district data only for mentioned states
      for (const [state, stats] of statesWithData) {
        if (mentionedStates.includes(state)) {
          const statsTyped = stats as HierarchicalStateStats;
          const districtsWithData = statsTyped.districts.filter((d: DistrictData) => !d.missing);

          section += `
**${state}** (${statsTyped.dataCount}/${statsTyped.districtCount} districts with data):
${districtsWithData.map((d: DistrictData) => `  - ${d.name}: ${d.value?.toFixed(2)}`).join('\n')}
`;
        }
      }
    } else {
      // No specific states mentioned - only include state-level summaries
      section += `
**State-wise Summary:**
${statesWithData.map(([state, stats]) => {
  const s = stats as HierarchicalStateStats;
  return `- ${state}: ${s.dataCount}/${s.districtCount} districts, Mean: ${s.mean?.toFixed(2) || 'N/A'}, Range: ${s.min?.toFixed(2)}-${s.max?.toFixed(2)}`;
}).join('\n')}

*Note: Ask about a specific state to see detailed district values.*
`;
    }
  }

  return section;
}

function buildNoDataSection(): string {
  return `
## No User Data

User has not uploaded any data yet. You can only answer questions about:
- Geographic information (areas, neighbors, regions)
- Available entities in the current map
- GeoJSON structure and metadata
- General information about Indian states and districts
`;
}

function buildPreviousContextSection(previousContext: PreviousContext): string {
  return `
## Previous Context (for comparison)

User switched from ${previousContext.mapType} map.
${previousContext.stats ? `Previous stats: Mean=${previousContext.stats.mean.toFixed(2)}, Range=${previousContext.stats.min.toFixed(2)}-${previousContext.stats.max.toFixed(2)}` : ''}

You can compare the current data with the previous map version if user asks.
`;
}

function buildCapabilitiesSection(): string {
  return `
## Your Capabilities

You can answer questions about:
1. **Statistics:** Calculate and explain statistical measures (mean, median, percentiles, etc.)
2. **Rankings:** Top N, bottom N, percentile ranks
3. **Regional comparisons:** North vs South, East vs West, coastal vs inland, etc.
4. **Hierarchical queries:** Districts within states, state-level aggregations
5. **Missing data:** Identify and explain gaps in the dataset, impact on analysis
6. **Patterns:** Identify hotspots, coldspots, clusters, spatial trends
7. **Interpretations:** Explain what the data might indicate based on geography
8. **Comparisons:** Compare across regions, states, or between map versions
9. **Data quality:** Assess completeness, outliers, distribution characteristics
`;
}

function buildGuidelinesSection(): string {
  return `
## Important Guidelines

1. **Be concise:** Keep responses to 2-4 paragraphs maximum
2. **Be data-driven:** Use the statistics and data provided in context
3. **Acknowledge gaps:** Mention missing data when it affects your analysis
4. **No speculation:** Don't make claims about causation without supporting evidence
5. **Geographic awareness:** Consider Indian geography and regional characteristics
6. **Hierarchical awareness:** For state-specific views, focus on that state's data
7. **Suggest follow-ups:** Offer relevant follow-up questions when appropriate
8. **Handle missing data gracefully:** Explain impact and suggest workarounds
9. **Context-aware:** Adjust your analysis based on whether viewing states or districts
10. **Comparative analysis:** When previous context exists, highlight changes

## Specific Query Handling

**For "median of districts in [state]":**
- Use hierarchicalStats for that state
- Account for missing districts
- Explain if sample size is too small

**For "which districts are missing":**
- List from missingEntities
- Group by state if helpful
- Calculate percentage impact

**For regional comparisons:**
- Use regionalStats data
- Compare means, ranges, and variations
- Consider geographic/demographic factors

**For interpretive questions:**
- Base insights on data patterns
- Consider geographic context
- Acknowledge limitations
- Suggest what might explain patterns (without claiming causation)

Ready to assist with data analysis!`;
}

/**
 * Build a compact context string for token efficiency
 */
export function buildCompactContext(context: DynamicChatContext): string {
  const { currentView, userData } = context;

  let compact = `View: ${currentView.tab}`;
  if (currentView.selectedState) {
    compact += ` (${currentView.selectedState})`;
  }
  compact += ` | ${currentView.mapType}`;

  if (userData.hasData && userData.stats) {
    compact += ` | n=${userData.count}/${userData.totalExpected}`;
    compact += ` | ${userData.stats.min.toFixed(1)}-${userData.stats.max.toFixed(1)}`;
    compact += ` | μ=${userData.stats.mean.toFixed(1)}`;
    compact += ` | missing=${userData.missingPercentage.toFixed(1)}%`;
  } else {
    compact += ` | No data`;
  }

  return compact;
}
