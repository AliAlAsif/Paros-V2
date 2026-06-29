import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-4">
      <div className="bg-muted/50 p-4 rounded-full">
        <FileQuestion className="w-12 h-12 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">404 - Not Found</h1>
        <p className="mt-2 text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Button asChild className="mt-4">
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
