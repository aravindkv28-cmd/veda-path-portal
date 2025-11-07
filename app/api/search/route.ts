// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../data/mock-db.js';
import Fuse from 'fuse.js';
import NerPipeline from '@/app/lib/ner';

const fuse = new Fuse(db, {
  keys: ['disease_name', 'ayurvedic_term'],
  includeScore: true,
  threshold: 0.4,
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

    const ner = await NerPipeline.getInstance();
    
    if (!ner) {
      console.error("NER model failed to initialize.");
      return NextResponse.json(
        { error: "Search service is not ready, please try again." },
        { status: 503 }
      );
    }

    console.log(`Received query: "${query}"`); // <-- FIXED THIS LINE
    
    const extractedEntities: any[] = await (ner as any)(query);
    console.log("Extracted entities:", extractedEntities);

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
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}