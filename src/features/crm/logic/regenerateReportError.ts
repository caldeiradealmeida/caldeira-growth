export function regenerateReportErrorMessage(code: string | undefined | null): string {
  switch (code) {
    case "forbidden":
      return "Você não tem permissão para regenerar este relatório.";
    case "assessment_not_completed":
      return "Este assessment ainda não foi concluído.";
    case "assessment_missing_lead":
    case "lead_not_found":
      return "Não foi possível localizar os dados originais do lead.";
    case "incomplete_answers":
      return "Respostas incompletas para este assessment.";
    case "score_mismatch":
      return "Não foi possível validar o score original. Regeneração bloqueada por segurança.";
    case "versioning_not_enabled":
      return "Este assessment já possui um relatório salvo e o banco ainda não foi migrado para permitir múltiplas versões. Nenhum dado foi alterado.";
    case "ai_generation_failed":
      return "Falha ao gerar o relatório com a IA. Tente novamente.";
    case "report_persistence_failed":
      return "O relatório foi gerado, mas não foi possível salvá-lo. Tente novamente.";
    default:
      return "Não foi possível regenerar o relatório agora.";
  }
}
