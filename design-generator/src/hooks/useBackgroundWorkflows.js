/**
 * useBackgroundWorkflows.js
 *
 * Custom hook that manages multiple concurrent production workflows.
 * Workflows run in the background and persist even when the modal is closed.
 *
 * Each job has: id, item, phase, progress state, liveImages, output, etc.
 * Starting a new job does NOT block starting additional ones.
 */

import { useState, useCallback, useRef } from 'react';
import { runProductionWorkflow } from '../services/productionWorkflowService.js';
import { saveDeliverable } from '../services/deliverableCacheService.js';

let jobIdCounter = 0;

/**
 * @returns {{
 *   jobs: Map<string, JobState>,
 *   startJob: (item: object, result: object) => string,
 *   cancelJob: (id: string) => void,
 *   removeJob: (id: string) => void,
 *   activeCount: number,
 * }}
 */
export default function useBackgroundWorkflows(onDeliverableGenerated) {
    // Using a ref for the actual job data (mutable) + a state counter to force re-renders
    const jobsRef = useRef(new Map());
    const [, setTick] = useState(0);
    const forceUpdate = useCallback(() => setTick(t => t + 1), []);

    // Blob URLs tracked per job for cleanup
    const blobUrlsRef = useRef(new Map()); // jobId → blobUrl[]

    const startJob = useCallback((item, result) => {
        const id = `job-${++jobIdCounter}-${Date.now()}`;
        const controller = new AbortController();

        const job = {
            id,
            item,
            phase: 'running',    // 'running' | 'done' | 'error'
            currentStep: 0,
            stepDetail: 'Iniciando...',
            overallPct: 0,
            liveImages: [],
            totalImages: 0,
            output: null,
            errorMsg: '',
            abortController: controller,
            startedAt: Date.now(),
        };

        jobsRef.current.set(id, job);
        blobUrlsRef.current.set(id, []);
        forceUpdate();

        // Progress callback — mutates the job in-place, then triggers re-render
        const handleProgress = ({ step, label, pct, detail, imageReady, totalImages: tot }) => {
            const j = jobsRef.current.get(id);
            if (!j) return;

            j.currentStep = step;
            j.stepDetail = detail || label;
            j.overallPct = pct;

            if (imageReady) {
                if (tot) j.totalImages = tot;
                const { index, arrayBuffer, error } = imageReady;

                if (arrayBuffer && arrayBuffer.byteLength > 1000) {
                    const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
                    const blobUrl = URL.createObjectURL(blob);
                    blobUrlsRef.current.get(id)?.push(blobUrl);
                    j.liveImages = [...j.liveImages];
                    j.liveImages[index] = { blobUrl, error: null };
                } else {
                    j.liveImages = [...j.liveImages];
                    j.liveImages[index] = { blobUrl: null, error: error || 'Falhou' };
                }
            }

            forceUpdate();
        };

        // Start the workflow
        runProductionWorkflow(item, result, handleProgress, controller.signal)
            .then(out => {
                const j = jobsRef.current.get(id);
                if (!j) return;
                j.output = out;
                j.overallPct = 100;
                j.currentStep = 6;
                j.phase = 'done';
                forceUpdate();

                // Save to deliverable cache
                if (item.lpId && item.deliverableKey) {
                    saveDeliverable(
                        item.lpId,
                        item.deliverableKey,
                        item.nome,
                        item.tipo,
                        out.docxBlob || null,
                        null,
                    )
                        .then(entry => onDeliverableGenerated?.(item.deliverableKey, entry))
                        .catch(err => console.warn('[BackgroundWorkflow] Cache save failed:', err));
                }
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                const j = jobsRef.current.get(id);
                if (!j) return;
                j.errorMsg = err.message || 'Erro desconhecido';
                j.phase = 'error';
                forceUpdate();
            });

        return id;
    }, [forceUpdate, onDeliverableGenerated]);

    const cancelJob = useCallback((id) => {
        const j = jobsRef.current.get(id);
        if (j) {
            j.abortController?.abort();
            j.phase = 'error';
            j.errorMsg = 'Cancelado pelo usuário';
            forceUpdate();
        }
    }, [forceUpdate]);

    const removeJob = useCallback((id) => {
        // Cleanup blob URLs
        const urls = blobUrlsRef.current.get(id) || [];
        urls.forEach(u => URL.revokeObjectURL(u));
        blobUrlsRef.current.delete(id);

        jobsRef.current.delete(id);
        forceUpdate();
    }, [forceUpdate]);

    // Derive jobs Map as a new reference for consumers
    const jobs = new Map(jobsRef.current);
    const activeCount = [...jobsRef.current.values()].filter(j => j.phase === 'running').length;

    return { jobs, startJob, cancelJob, removeJob, activeCount };
}
