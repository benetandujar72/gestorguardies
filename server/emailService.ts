import { gmailService, type SubstitutionEmailData } from './gmailService';

export async function sendSubstitutionEmails(data: SubstitutionEmailData): Promise<void> {
  return await gmailService.sendSubstitutionEmails(data);
}

// Verificar la configuració del Gmail API
export async function verifyEmailConfiguration(): Promise<boolean> {
  return await gmailService.verifyConfiguration();
}