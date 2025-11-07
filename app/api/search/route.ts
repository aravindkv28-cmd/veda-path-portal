// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../data/mock-db.js';
import Fuse from 'fuse.js';
import NerPipeline from '@/app/lib/ner';

const fuse = new Fuse(db, {
  keys: ['disease_name', 'ayurvedic_term'],
  includeScore: true,
  threshold: 0.6,
  isCaseSensitive: false,
});

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    console.log(`Received query: "${query}"`);

    let allResults: any[] = [];
    const addedIds = new Set();

    // Try to use NER, but fall back to direct search if it fails
    try {
      const ner = await NerPipeline.getInstance();
      
      if (ner) {
        const extractedEntities: any[] = await (ner as any)(query);
        console.log("Extracted entities:", extractedEntities);

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
        }
      }
    } catch (nerError) {
      console.warn("NER failed, falling back to direct search:", nerError);
    }

    // If NER didn't find anything or failed, do direct search
    if (allResults.length === 0) {
      const searchResults = fuse.search(query);
      
      for (const result of searchResults) {
        if (!addedIds.has(result.item.id)) {
          allResults.push(result.item);
          addedIds.add(result.item.id);
        }
      }
    }

    return NextResponse.json(allResults);
    
  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json({ 
      error: 'An internal server error occurred.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}