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
export const maxDuration = 60; // Vercel: allow 60s for model loading

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    console.log(`🔍 Query: "${query}"`);

    let allResults: any[] = [];
    const addedIds = new Set();
    let usedNER = false;

    // Try NER with 5-second timeout
    try {
      const nerPromise = NerPipeline.getInstance();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 5000)
      );
      
      const ner = await Promise.race([nerPromise, timeoutPromise]);
      
      if (ner) {
        const extractedEntities: any[] = await (ner as any)(query);
        console.log("✅ NER entities:", extractedEntities);

        if (extractedEntities.length > 0) {
          usedNER = true;
          for (const entity of extractedEntities) {
            const searchResults = fuse.search(entity.word);
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
      console.warn("⚠️ NER failed:", nerError);
    }

    // Fallback: Direct Fuse.js search
    if (!usedNER || allResults.length === 0) {
      console.log('🔍 Using direct search');
      const searchResults = fuse.search(query);
      
      for (const result of searchResults) {
        if (!addedIds.has(result.item.id)) {
          allResults.push(result.item);
          addedIds.add(result.item.id);
        }
      }
    }

    console.log(`✅ Found ${allResults.length} results`);
    return NextResponse.json(allResults);
    
  } catch (error) {
    console.error("❌ Search error:", error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
```

---

### **Step 5: Create `.gitignore` (if not exists)**

Make sure you're NOT ignoring the `data` folder:
```
# .gitignore
node_modules/
.next/
out/
.env*.local
.vercel
*.log
.DS_Store
# DON'T add data/ here!