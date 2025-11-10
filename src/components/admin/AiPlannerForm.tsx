'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, AlertTriangle } from 'lucide-react';
import { suggestNextSteps, type SuggestNextStepsOutput } from '@/ai/flows/suggest-next-steps';
import { useToast } from '@/hooks/use-toast';

export default function AiPlannerForm() {
  const [patientCondition, setPatientCondition] = useState('');
  const [assignedTasks, setAssignedTasks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestNextStepsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuggestions(null);
    setError(null);

    if (!patientCondition.trim()) {
        toast({ title: "Validation Error", description: "Patient health condition is required.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const tasksArray = assignedTasks.split('\n').map(task => task.trim()).filter(task => task !== '');

    try {
      const result = await suggestNextSteps({
        patientHealthCondition: patientCondition,
        assignedTasks: tasksArray,
      });
      setSuggestions(result);
    } catch (err) {
      console.error("AI suggestion error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(`Failed to get suggestions: ${errorMessage}`);
      toast({ title: "AI Error", description: `Could not fetch suggestions. ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Wand2 className="mr-2 h-6 w-6 text-primary" /> AI Care Plan Assistant</CardTitle>
          <CardDescription>Enter patient details to get AI-powered task suggestions for caregivers.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patientCondition">Patient Health Condition</Label>
              <Textarea
                id="patientCondition"
                placeholder="e.g., Recovering from surgery, stable but needs mobility assistance."
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                rows={3}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="assignedTasks">Currently Assigned Tasks (one per line)</Label>
              <Textarea
                id="assignedTasks"
                placeholder="e.g., Administer medication at 9 AM&#x0a;Assist with bathing&#x0a;Monitor blood pressure"
                value={assignedTasks}
                onChange={(e) => setAssignedTasks(e.target.value)}
                rows={4}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Get Suggestions
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Suggested Next Steps</CardTitle>
          <CardDescription>AI-generated recommendations based on the input provided.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !suggestions && (
            <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Generating suggestions...</p>
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <h4 className="font-semibold">Error</h4>
              </div>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          {suggestions && !error && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary">Suggested Tasks:</h4>
                {suggestions.suggestedTasks.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 mt-1">
                    {suggestions.suggestedTasks.map((task, index) => (
                      <li key={index} className="text-sm">{task}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific tasks suggested.</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-primary">Reasoning:</h4>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{suggestions.reasoning}</p>
              </div>
            </div>
          )}
          {!isLoading && !suggestions && !error && (
            <p className="text-center text-muted-foreground py-8">Suggestions will appear here once generated.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
