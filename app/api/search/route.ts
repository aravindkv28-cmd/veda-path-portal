// app/api/search/route.ts
// --- THIS IS THE CORRECTED, COMPLETE CODE ---

import { NextResponse } from 'next/server';
// import { db } from '../../../data/mock-db.js'; // <-- REMOVED THIS BROKEN IMPORT
import Fuse from 'fuse.js';
import NerPipeline from '@/app/lib/ner';

// --- HARDCODED DATABASE TO BYPASS IMPORT ERROR ---
const db = [
  {
    id: 1,
    disease_name: 'Cough',
    ayurvedic_term: 'Kasa',
    snomed_code: '284196006',
    patient_explanation: 'A cough (Kasa) is a reflex action to clear your airways of mucus and irritants such as dust or smoke.'
  },
  {
    id: 2,
    disease_name: 'Fever',
    ayurvedic_term: 'Jvara',
    snomed_code: '386661006',
    patient_explanation: 'A fever (Jvara) is when your body temperature is higher than normal. It is a common sign of infection.'
  },
  {
    id: 3,
    disease_name: 'Diabetes',
    ayurvedic_term: 'Madhumeha',
    snomed_code: '73211009',
    patient_explanation: 'Diabetes (Madhumeha) is a chronic condition where the body cannot control the amount of sugar in the blood.'
  },
  {
    id: 4,
    disease_name: 'Arthritis',
    ayurvedic_term: 'Sandhivata',
    snomed_code: '84229003',
    patient_explanation: 'Arthritis (Sandhivata) causes pain, swelling, and stiffness in the joints, often related to inflammation.'
  },
  {
    id: 5,
    disease_name: 'Headache',
    ayurvedic_term: 'Shirahshula',
    snomed_code: '25064002',
    patient_explanation: 'A headache (Shirahshula) is a pain or discomfort in the head or scalp. It can be a symptom of stress, migraine, or other issues.'
  }
];
// --- END OF HARDCODED DATABASE ---

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