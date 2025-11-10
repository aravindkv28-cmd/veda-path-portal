// app/lib/ner.ts
import { pipeline, PipelineType } from '@xenova/transformers';

class NerPipeline {
  static task = 'token-classification';
  static model = 'Xenova/bert-base-NER';
  static instance: any = null;
  static loading = false;

  static async getInstance() {
    if (this.instance !== null) {
      return this.instance;
    }

    if (this.loading) {
      return null;
    }

    try {
      this.loading = true;
      console.log('🔄 Loading NER model...');
      this.instance = await pipeline(this.task, this.model);
      console.log('✅ NER model loaded');
      return this.instance;
    } catch (error) {
      console.error('❌ NER load failed:', error);
      return null;
    } finally {
      this.loading = false;
    }
  }
}

export default NerPipeline;