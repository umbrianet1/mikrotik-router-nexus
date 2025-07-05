
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Router as RouterIcon } from "lucide-react";

interface EmptyRouterStateProps {
  onAddRouter: () => void;
}

const EmptyRouterState = ({ onAddRouter }: EmptyRouterStateProps) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-8 text-center">
        <RouterIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Routers Added</h3>
        <p className="text-slate-400 mb-4">
          Add your first MikroTik router to start managing your network.
        </p>
        <Button onClick={onAddRouter} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add First Router
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyRouterState;
