import { useState } from "react";
import { Car } from "@/data/cars";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface AIComparisonReportProps {
  cars: Car[];
}

const AIComparisonReport = ({ cars }: AIComparisonReportProps) => {
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const generateReport = async () => {
    setIsLoading(true);
    setReport("");
    setIsVisible(true);

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-car-comparison`;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ cars }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast.error("AI service is busy. Please try again shortly.");
          setIsLoading(false);
          return;
        }
        if (resp.status === 402) {
          toast.error("AI credits exhausted. Please try later.");
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to generate report");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullReport = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullReport += content;
              setReport(fullReport);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("AI comparison error:", e);
      toast.error("Failed to generate AI report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      {!isVisible ? (
        <div className="text-center">
          <Button
            onClick={generateReport}
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-[hsl(190,90%,40%)] text-primary-foreground hover:opacity-90 transition-opacity px-8 py-6 text-base"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate AI Comparison Report
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Get a detailed pros/cons analysis with AI-powered recommendations
          </p>
        </div>
      ) : (
        <div className="gradient-card rounded-xl border border-primary/20 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">AI Comparison Report</h2>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsVisible(false);
                  setReport("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-6">
            {report ? (
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-table:text-muted-foreground prose-th:text-foreground prose-td:text-muted-foreground">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            {!isLoading && report && (
              <div className="mt-6 pt-4 border-t border-border/50 flex justify-center">
                <Button onClick={generateReport} variant="outline" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Regenerate Report
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIComparisonReport;
