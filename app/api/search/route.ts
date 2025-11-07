// app/api/search/route.ts
// --- THIS IS THE CORRECTED, COMPLETE CODE ---

import { NextResponse } from 'next/server';
import { db } from '@/data/mock-db.js'; // Your mock database
import Fuse from 'fuse.js'; // Your fuzzy search library
import NerPipeline from '@/app/lib/ner'; // Import our AI helper

// --- CONFIGURE FUSE.JS (Your Scoring Algorithm) ---
const fuse = new Fuse(db, {
  keys: ['disease_name', 'ayurvedic_term'],
  includeScore: true,
  threshold: 0.4,
  isCaseSensitive: false,
});

// This can help with serverless function performance
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // --- 1. GET THE USER'S RAW SEARCH NARRATIVE ---
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // --- 2. ENSURE THE NER MODEL IS LOADED ---
    const ner = await NerPipeline.getInstance();

    // --- ADDED CHECK TO PREVENT BUILD ERROR ---
    if (!ner) {
      console.error("NER model failed to initialize.");
      // Return a server error response
      return NextResponse.json(
        { error: "Search service is not ready, please try again." },
        { status: 503 } // 503 Service Unavailable
      );
    }
    // --- END OF FIX ---

    console.log(`Received query: "${query}"`);

    // We add ': any[]' to tell the code what to expect
    const extractedEntities: any[] = await (ner as any)(query);
    console.log("Extracted entities:", extractedEntities);

    // --- 3. SEARCH DATABASE FOR EXTRACTED KEYWORDS ---
    let allResults: any[] = [];
    const addedIds = new Set();

    if (extractedEntities.length > 0) {
      for (const entity of extractedEntities) {
        const searchTerm = entity.word;
        const searchResults = fuse.search(searchTerm);

        for (const result of searchResults) {
          if (!addedIds.has(result.item.id)) {
            allResults.push(result.item);
            addedIds.add(result.item.id);
          }
        }
      }
    } else {
      // If NER finds nothing, just search for the whole query
      const searchResults = fuse.search(query);
      for (const result of searchResults) {
        if (!addedIds.has(result.item.id)) {
          allResults.push(result.item);
          addedIds.add(result.item.id);
        }
      }
    }

    // --- 4. SEND THE FINAL, COMBINED RESULTS BACK ---
    return NextResponse.json(allResults);

  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}