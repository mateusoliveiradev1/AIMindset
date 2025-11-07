interface QueryMetricRecord {
  key: string;
  duration: number; // ms
  size?: number;
  timestamp: number;
}

const STORAGE_KEY = 'local-query-metrics';
const MAX_RECORDS = 200;

class QueryMetricsTracker {
  private buffer: QueryMetricRecord[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.buffer = data.slice(-MAX_RECORDS);
        }
      }
    } catch {}
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.buffer.slice(-MAX_RECORDS)));
    } catch {}
  }

  record(key: string, duration: number, size?: number) {
    const rec: QueryMetricRecord = { key, duration: Math.round(duration), size, timestamp: Date.now() };
    this.buffer.push(rec);
    if (this.buffer.length > MAX_RECORDS) {
      this.buffer = this.buffer.slice(-MAX_RECORDS);
    }
    this.persist();
  }

  getAverageTime(): number {
    if (this.buffer.length === 0) return 0;
    const sum = this.buffer.reduce((acc, r) => acc + r.duration, 0);
    return Math.round(sum / this.buffer.length);
  }

  getRecent(n: number = 20): QueryMetricRecord[] {
    return this.buffer.slice(-n);
  }
}

export const queryMetricsTracker = new QueryMetricsTracker();