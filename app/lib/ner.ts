// app/lib/ner.ts
// --- THIS IS THE CORRECTED, COMPLETE CODE ---

import {
  pipeline,
  PipelineType, // <-- FIX 1: IMPORT THE TYPE
} from '@xenova/transformers';

class NerPipeline {
  static task: PipelineType = 'token-classification'; // <-- FIX 2: USE THE TYPE
  static model = 'Xenova/bert-base-NER';
  static instance: any = null;
  static loading = false;

  static async getInstance() {
    if (this.instance === null && !this.loading) {
      try {
        this.loading = true;
        console.log('🔄 Loading NER model...');
        this.instance = await pipeline(this.task, this.model);
        console.log('✅ NER model loaded');
        return this.instance;
      } catch (error) {
        console.error('❌ Error loading NER model:', error);
        this.instance = null; // Reset on failure
      } finally {
        this.loading = false;
      }
    } else if (this.loading) {
      // Wait for the model to finish loading if it's already in progress
      await new Promise<void>((resolve) => {
        const check = () => {
          if (!this.loading) {
            resolve();
          } else {
            setTimeout(check, 100); // Check again in 100ms
          }
        };
        check();
      });
      return this.instance;
    }
    
    return this.instance;
  }
}

export default NerPipeline;