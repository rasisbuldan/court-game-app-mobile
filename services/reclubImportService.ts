// services/reclubImportService.ts

/**
 * Service for importing player lists and event details from Reclub event URLs
 * Mobile implementation - fetches HTML directly without API proxy
 */

import { Logger } from '../utils/logger';

export interface ImportedPlayer {
  name: string;
}

export interface EventDetails {
  date?: string;        // YYYY-MM-DD format
  time?: string;        // HH:MM format
  duration?: number;    // Hours as decimal (e.g., 2.5 for 2h 30m)
}

export interface ReclubImportResult {
  players: ImportedPlayer[];
  eventDetails?: EventDetails;
  error?: string;
}

/**
 * Validates if a URL is a valid Reclub URL
 */
export function isValidReclubUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'reclub.co' && urlObj.pathname.startsWith('/m/');
  } catch {
    return false;
  }
}

/**
 * Extracts player names from HTML content
 * Uses multiple strategies to find player names in Reclub's HTML
 */
export function extractPlayerNamesFromHtml(html: string): string[] {
  Logger.debug('extractPlayerNames: Starting extraction', { htmlLength: html.length });
  const playerNames: string[] = [];
  const seenNames = new Set<string>();

  // REBUILD FROM SCRATCH - Simple approach:
  // 1. Find "Confirmed" text
  // 2. Extract a reasonable chunk after it (15000 chars)
  // 3. Find all <p> tags with player avatar pattern
  // 4. Extract the text content

  const confirmedIndex = html.indexOf('Confirmed');

  if (confirmedIndex === -1) {
    Logger.debug('extractPlayerNames: "Confirmed" text not found');
    return playerNames;
  }

  // Get a chunk of HTML after "Confirmed" - should contain the player grid
  // Use 15000 chars to support events with up to ~50 players
  const startChunk = confirmedIndex;
  const endChunk = Math.min(confirmedIndex + 15000, html.length);
  const chunk = html.substring(startChunk, endChunk);

  Logger.debug('extractPlayerNames: Analyzing chunk', { chunkLength: chunk.length, confirmedIndex });

  // Look for the pattern that appears in Reclub's player cards:
  // <div class="align-top my-2 p-1">
  //   <div class="bg-reclub-blue..."><img...></div>
  //   <p class="font-semibold mt-1 text-center truncate text-sm">PlayerName</p>
  // </div>

  // Match each player card
  const playerCardRegex = /<div class="align-top my-2 p-1">.*?<p class="font-semibold[^"]*"[^>]*>\s*([^<]+)\s*<\/p>/gs;
  let match;

  while ((match = playerCardRegex.exec(chunk)) !== null) {
    const name = match[1].trim();

    // Only accept if it looks like a real name
    // Allow letters, spaces, numbers, parentheses, +, -, . for names like "Vincent (+1)", "John-Paul", or "Y.T"
    if (name &&
        name.length > 1 &&
        name.length < 50 &&
        /^[\p{L}\s\d\+\-\(\)\.]+$/u.test(name) &&
        !seenNames.has(name.toLowerCase())) {
      playerNames.push(name);
      seenNames.add(name.toLowerCase());
      Logger.debug('extractPlayerNames: Added player', { name });
    }
  }

  Logger.info('extractPlayerNames: Extraction completed', {
    action: 'reclub_extract_players',
    metadata: { playerCount: playerNames.length },
  });

  return playerNames;
}

/**
 * Extracts event date, time, and duration from HTML content
 * Example formats:
 * - "Thursday, Oct 23 @ 8:00 PM"
 * - "2 hours"
 */
export function extractEventDetailsFromHtml(html: string): EventDetails {
  const eventDetails: EventDetails = {};

  // Extract date and time (e.g., "Thursday, Oct 23 @ 8:00 PM")
  const dateTimeRegex = /(\w+),\s+(\w+)\s+(\d+)\s+@\s+(\d+):(\d+)\s+(AM|PM)/i;
  const dateTimeMatch = html.match(dateTimeRegex);

  if (dateTimeMatch) {
    const [, , month, day, hour, minute, period] = dateTimeMatch;

    // Convert month name to number
    const monthMap: { [key: string]: string } = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    const monthNum = monthMap[month.toLowerCase().substring(0, 3)];

    // Convert 12-hour to 24-hour format
    let hour24 = parseInt(hour);
    if (period.toUpperCase() === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
      hour24 = 0;
    }

    // Assume current year if not specified
    const currentYear = new Date().getFullYear();
    const paddedDay = day.padStart(2, '0');
    const paddedHour = hour24.toString().padStart(2, '0');
    const paddedMinute = minute.padStart(2, '0');

    eventDetails.date = `${currentYear}-${monthNum}-${paddedDay}`;
    eventDetails.time = `${paddedHour}:${paddedMinute}`;
  }

  // Extract duration (e.g., "2 hours", "1.5 hours", "90 minutes")
  const durationRegex = /(\d+(?:\.\d+)?)\s+(hours?|hrs?|minutes?|mins?)/i;
  const durationMatch = html.match(durationRegex);

  if (durationMatch) {
    const [, value, unit] = durationMatch;
    const numValue = parseFloat(value);

    if (unit.toLowerCase().startsWith('hour') || unit.toLowerCase().startsWith('hr')) {
      eventDetails.duration = numValue;
    } else if (unit.toLowerCase().startsWith('minute') || unit.toLowerCase().startsWith('min')) {
      eventDetails.duration = numValue / 60;
    }
  }

  return eventDetails;
}

/**
 * Fetches and parses player names from a Reclub event URL
 * Mobile implementation - fetches HTML directly
 */
export async function importPlayersFromReclub(url: string): Promise<ReclubImportResult> {
  // Validate URL format
  if (!isValidReclubUrl(url)) {
    return {
      players: [],
      error: 'Invalid Reclub URL. Please provide a valid Reclub event link (e.g., https://reclub.co/m/...)',
    };
  }

  try {
    Logger.info('importPlayersFromReclub: Starting import', {
      action: 'reclub_import_start',
      metadata: { url },
    });

    // Fetch the page directly
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();
    Logger.debug('importPlayersFromReclub: Received HTML', { htmlLength: html.length });

    // Extract player names
    const playerNames = extractPlayerNamesFromHtml(html);

    if (playerNames.length === 0) {
      Logger.info('importPlayersFromReclub: No players found', {
        action: 'reclub_import_empty',
        metadata: { url },
      });
      return {
        players: [],
        error: 'No players found in the Reclub event. Make sure the event has confirmed players.',
      };
    }

    // Extract event details
    const eventDetails = extractEventDetailsFromHtml(html);

    Logger.info('importPlayersFromReclub: Import successful', {
      action: 'reclub_import_success',
      metadata: {
        url,
        playerCount: playerNames.length,
        hasEventDetails: Object.keys(eventDetails).length > 0,
      },
    });

    return {
      players: playerNames.map(name => ({ name })),
      eventDetails: Object.keys(eventDetails).length > 0 ? eventDetails : undefined,
    };
  } catch (error) {
    Logger.error('importPlayersFromReclub: Import failed', error as Error, {
      action: 'reclub_import_error',
      metadata: { url },
    });
    return {
      players: [],
      error: error instanceof Error ? error.message : 'Failed to import players from Reclub. Please check your internet connection and try again.',
    };
  }
}
