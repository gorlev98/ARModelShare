import JSZip from 'jszip';
import type { ValidationStage } from '@/types';

export const validationService = {
  // Simulate validation pipeline for uploaded models
  async validateModel(
    file: File,
    onStageUpdate?: (stages: ValidationStage[]) => void
  ): Promise<{ status: 'ready' | 'warning' | 'error'; issues: string[] }> {
    const stages: ValidationStage[] = [
      { stage: 'file-integrity', status: 'pending' },
      { stage: 'format-validation', status: 'pending' },
      { stage: 'ar-compatibility', status: 'pending' },
    ];

    const issues: string[] = [];

    // Stage 1: File Integrity
    stages[0].status = 'processing';
    onStageUpdate?.(stages);
    await this.delay(800);

    stages[0].status = 'passed';
    stages[0].message = 'File integrity verified';
    stages[1].status = 'processing';
    onStageUpdate?.(stages);

    // Stage 2: Format Validation
    await this.delay(1000);
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (extension === '.glb' || extension === '.gltf') {
      stages[1].status = 'passed';
      stages[1].message = `Valid ${extension.toUpperCase()} format detected`;
    } else if (extension === '.zip') {
      // Validate ZIP structure
      try {
        const zip = await JSZip.loadAsync(file);
        const files = Object.keys(zip.files);

        // Check for GLTF file
        const hasGltf = files.some(f => f.toLowerCase().endsWith('.gltf'));

        if (!hasGltf) {
          stages[1].status = 'failed';
          stages[1].message = 'ZIP must contain a .gltf file';
          issues.push('No .gltf file found in ZIP archive');
          onStageUpdate?.(stages);
          return { status: 'error', issues };
        }

        stages[1].status = 'passed';
        stages[1].message = `Valid ZIP archive with GLTF model (${files.length} files)`;
      } catch (error) {
        stages[1].status = 'failed';
        stages[1].message = 'Invalid ZIP file';
        issues.push('Failed to read ZIP archive');
        onStageUpdate?.(stages);
        return { status: 'error', issues };
      }
    } else {
      stages[1].status = 'failed';
      stages[1].message = 'Unsupported file format';
      issues.push('File format not supported');
      onStageUpdate?.(stages);
      return { status: 'error', issues };
    }

    stages[2].status = 'processing';
    onStageUpdate?.(stages);

    // Stage 3: AR Compatibility
    await this.delay(1200);

    // Simulate random compatibility check
    const isCompatible = Math.random() > 0.1; // 90% success rate

    if (isCompatible) {
      stages[2].status = 'passed';
      stages[2].message = 'Model is AR-compatible';
    } else {
      stages[2].status = 'failed';
      stages[2].message = 'Model may have compatibility issues';
      issues.push('Some AR devices may not support this model');
    }

    onStageUpdate?.(stages);

    // Determine final status
    const allPassed = stages.every(s => s.status === 'passed');
    const hasCriticalFailure = stages.some(s => s.stage === 'format-validation' && s.status === 'failed');

    return {
      status: allPassed ? 'ready' : hasCriticalFailure ? 'error' : 'warning',
      issues,
    };
  },

  // Helper to simulate async delays
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};
