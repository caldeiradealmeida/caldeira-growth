import { useEffect, useState } from "react";

export function useCgiReportProgress(isSubmitting: boolean) {
  const [reportProgress, setReportProgress] = useState(0);

  useEffect(() => {
    if (!isSubmitting) return;

    setReportProgress(12);
    const interval = window.setInterval(() => {
      setReportProgress((current) => {
        if (current < 45) return current + 7;
        if (current < 72) return current + 4;
        if (current < 90) return current + 2;
        return current;
      });
    }, 1800);

    return () => window.clearInterval(interval);
  }, [isSubmitting]);

  return { reportProgress, setReportProgress };
}
