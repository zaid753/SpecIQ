import { useEffect, useRef } from "react";
import { db } from "../../lib/firebase";
import { ref, onValue, off } from "firebase/database";
import { extractInsights } from "../../services/aiService";

interface RequirementIntelligenceEngineProps {
  projectId: string;
}

export default function RequirementIntelligenceEngine({ projectId }: RequirementIntelligenceEngineProps) {
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!projectId) return;

    const parsedDataRef = ref(db, `projects/${projectId}/parsedData`);
    
    const unsubscribe = onValue(parsedDataRef, async (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      for (const id in data) {
        const record = data[id];
        
        if (record.readyForAI && !processingRef.current.has(id)) {
          processingRef.current.add(id);
          
          try {
            console.log(`Starting AI extraction for record: ${id}`);
            const insights = await extractInsights(record.cleanedText);
            
            // Send to backend to store and aggregate
            const response = await fetch(`/api/projects/${projectId}/insights`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sourceId: id,
                sourceType: record.sourceType,
                insights
              })
            });

            if (!response.ok) {
              throw new Error("Failed to save insights to backend");
            }

            console.log(`Successfully processed record: ${id}`);
          } catch (error) {
            console.error(`Error processing record ${id}:`, error);
            // We might want to mark it as failed in DB too, but for now just remove from processing set
            // so it can be retried if the page reloads or something.
            // Actually, better to mark it as error in DB.
          } finally {
            processingRef.current.delete(id);
          }
        }
      }
    });

    return () => off(parsedDataRef);
  }, [projectId]);

  return null; // Background worker
}
