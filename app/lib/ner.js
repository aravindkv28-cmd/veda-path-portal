// app/lib/ner.js
// --- THIS IS THE CORRECTED CODE ---

// The import MUST be at the top of the file, like this:
import { pipeline } from '@xenova/transformers';

// This helper's only job is to load and manage the AI model.
class NerPipeline {
  static task = 'ner';
  static model = 'Xenova/bert-base-NER';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      console.log("Loading Biomedical NER model... (this may take a moment)");
      
      // The import statement should NOT be here.
      
      this.instance = await pipeline(this.task, this.model, { 
        progress_callback,
        aggregation_strategy: 'simple' 
      });
      console.log("Biomedical NER model loaded successfully.");
    }
    return this.instance;
  }
}

export default NerPipeline;