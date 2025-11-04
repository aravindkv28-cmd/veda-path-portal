// app/api/search/route.js
// --- UPGRADED to use separate NER loader ---

import { NextResponse } from 'next/server';
import { db } from '@/data/mock-db'; // Your mock database
import Fuse from 'fuse.js'; // Your fuzzy search library
import NerPipeline from '@/app/lib/ner'; // --- IMPORT OUR NEW HELPER ---

// --- CONFIGURE FUSE.JS (Your Scoring Algorithm) ---
const fuse = new Fuse(db, {
  keys: ['disease_name', 'ayurvedic_term'],
  includeScore: true,
  threshold: 0.4,
});

// This can help with serverless function performance
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // --- 1. GET THE USER'S RAW SEARCH NARRATIVE ---
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // --- 2. ENSURE THE NER MODEL IS LOADED ---
    const ner = await NerPipeline.getInstance();
    
    console.log(`Received query: "${query}"`);
    const extractedEntities = await ner(query);
    console.log("Extracted entities:", extractedEntities);

    if (extractedEntities.length === 0) {
      const results = fuse.search(query).map(result => result.item);
      return NextResponse.json(results);
    }

    // --- 3. SEARCH THE DATABASE FOR *EACH* EXTRACTED KEYWORD ---
    let allResults = [];
    const addedIds = new Set();

    for (const entity of extractedEntities) {
      const searchTerm = entity.word; _
      const searchResults = fuse.search(searchTerm);
      
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