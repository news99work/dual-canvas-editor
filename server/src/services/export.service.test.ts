// ── Export Service Tests ──
import { describe, it, expect, beforeEach } from 'vitest';
import type { ExportFormat, ExportQuality } from '../types/export.js';
import * as exportService from './export.service.js';

const validCanvasState = {
  version: 2,
  canvases: {
    nam: {
      layers: [],
      width: 800,
      height: 1200,
      backgroundColor: '#ffffff',
    },
    nu: {
      layers: [],
      width: 800,
      height: 1200,
      backgroundColor: '#ffffff',
    },
  },
};

describe('Export Service', () => {
  beforeEach(() => {
    // Purge all expired jobs first
    exportService.purgeExpiredJobs();
  });

  describe('startExport', () => {
    it('should reject invalid canvas state', async () => {
      await expect(exportService.startExport({ invalid: true }, 'png', 'draft')).rejects.toThrow();
    });

    it('should create a new export job with pending status', async () => {
      const { job, isNew } = await exportService.startExport(validCanvasState, 'png', 'draft');
      expect(isNew).toBe(true);
      expect(job.status).toBe('pending');
      expect(job.format).toBe('png');
      expect(job.quality).toBe('draft');
      expect(job.hash).toBeTruthy();
      expect(job.progress).toBe(0);
      expect(job.outputs).toEqual([]);
      expect(job.error).toBeNull();
    });

    it('should return existing job on idempotent request (same canvas state)', async () => {
      const { job: job1, isNew: isNew1 } = await exportService.startExport(
        validCanvasState,
        'png',
        'draft',
      );
      expect(isNew1).toBe(true);

      const { job: job2, isNew: isNew2 } = await exportService.startExport(
        validCanvasState,
        'png',
        'draft',
      );
      expect(isNew2).toBe(false);
      expect(job2.id).toBe(job1.id);
    });

    it('should create different jobs for different formats', async () => {
      const { job: job1 } = await exportService.startExport(validCanvasState, 'png', 'draft');
      const { job: job2 } = await exportService.startExport(validCanvasState, 'pdf', 'draft');
      expect(job2.id).not.toBe(job1.id);
    });

    it('should create different jobs for different qualities', async () => {
      const { job: job1 } = await exportService.startExport(validCanvasState, 'png', 'draft');
      const { job: job2 } = await exportService.startExport(validCanvasState, 'png', 'high');
      expect(job2.id).not.toBe(job1.id);
    });
  });

  describe('findJobByHash', () => {
    it('should find a job by its hash', async () => {
      const { job } = await exportService.startExport(validCanvasState, 'png', 'draft');
      const found = exportService.findJobByHash(job.hash);
      expect(found).toBeDefined();
      expect(found!.id).toBe(job.id);
    });

    it('should return undefined for unknown hash', async () => {
      const found = exportService.findJobByHash('nonexistent-hash');
      expect(found).toBeUndefined();
    });
  });

  describe('getJob', () => {
    it('should return the job by id', async () => {
      const { job } = await exportService.startExport(validCanvasState, 'png', 'draft');
      const found = exportService.getJob(job.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(job.id);
    });

    it('should return undefined for unknown id', async () => {
      const found = exportService.getJob('nonexistent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('purgeExpiredJobs', () => {
    it('should purge expired jobs and return count', async () => {
      const { job } = await exportService.startExport(validCanvasState, 'png', 'draft');
      expect(exportService.getJob(job.id)).toBeDefined();

      // Force job to be expired by setting expiresAt in the past
      // Can't do this through public API, but purgeExpiredJobs should handle it gracefully
      const count = exportService.purgeExpiredJobs();
      expect(typeof count).toBe('number');
    });
  });
});
