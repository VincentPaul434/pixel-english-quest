type Metric = {
  id: string;
  name: string;
  value: number;
};

export type ReportHandler = (metric: Metric) => void;

export function reportWebVitals(onPerfEntry?: ReportHandler) {
  if (onPerfEntry) {
    return;
  }
}
