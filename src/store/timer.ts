import { defineStore } from "pinia";
import { ref } from "vue";

type TimerJob = {
    id: string;
    fn: () => Promise<void> | void;
};

export const useGlobalTimerStore =
    defineStore("globalTimer", () => {
        const intervalMs = ref(Number(import.meta.env.VITE_GLOBAL_TIMER_INTERVAL) || 15000);
        const timerId = ref<number | null>(null);
        const jobs = new Map<string, TimerJob>();

        const subscribers = ref(0);

        function startTimer() {
            if (timerId.value === null) {
                timerId.value = window.setInterval(() => {
                    for (const job of jobs.values()) {
                        job.fn();
                    }
                }, intervalMs.value);
                console.log("[GlobalTimer] Started");
            }
        }

        function stopTimer() {
            if (timerId.value !== null) {
                clearInterval(timerId.value);
                timerId.value = null;
                console.log("[GlobalTimer] Stopped");
            }
        }

        function registerJob(id: string, fn: () => Promise<void> | void) {
            jobs.set(id, { id, fn });
            // execute immediately, ignore all exception
            try {
                fn();
            } catch (e) {
                console.error('Job immediate execution error:', e)
            } finally {
                addSubscriber();
            }
        }

        function unregisterJob(id: string) {
            jobs.delete(id);
            removeSubscriber();
        }

        function addSubscriber() {
            subscribers.value++;
            if (subscribers.value === 1) {
                startTimer();
            }
        }

        function removeSubscriber() {
            subscribers.value--;
            if (subscribers.value <= 0) {
                subscribers.value = 0;
                stopTimer();
            }
        }

        return {
            intervalMs,
            registerJob,
            unregisterJob,
        };
    });
