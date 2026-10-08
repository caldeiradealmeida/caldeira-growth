import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import type { CgiUiText } from "../config";

// Etapa final. O telefone passou para a identificação (Etapa 1), então aqui
// não se coleta mais nada: o que resta é a espera enquanto o parecer é gerado.
// A etapa continua existindo porque é ela que segura a pessoa na tela durante
// a geração -- removê-la deixaria o usuário olhando para o nada.
type CgiPhoneStepProps = {
  t: CgiUiText;
  isSubmitting: boolean;
  isLeadSubmitting: boolean;
  viewResult: () => void;
};

export function CgiPhoneStep({
  t,
  isSubmitting,
  isLeadSubmitting,
  viewResult,
}: CgiPhoneStepProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-primary/20">
        <CardContent className="p-6 md:p-8">
          <Badge variant="outline">{t.step4}</Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight">
            {t.phoneTitle}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t.phoneBody}
          </p>

          {isSubmitting && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.reportAlertBody}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={viewResult} disabled={isLeadSubmitting}>
              <Search className="mr-2 h-4 w-4" />
              {t.viewResult}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
