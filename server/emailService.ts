import { gmailService, type SubstitutionEmailData } from './gmailService';

export async function sendSubstitutionEmails(data: SubstitutionEmailData): Promise<void> {
  // TEMPORALMENT DESACTIVAT - Gmail service disabled to allow app testing
  console.log('⚠️  Email service temporalment desactivat. Email que s\'hauria enviat:', data);
  return Promise.resolve();
}

// Verificar la configuració del Gmail API sense bloquejar
export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    // TEMPORALMENT DESACTIVAT - Gmail service disabled to allow app testing
    console.log('⚠️  Gmail service temporalment desactivat - Les notificacions per email no funcionaran');
    return true;
  } catch (error) {
    console.log('⚠️  Error en la configuració d\'email - Les notificacions per email no funcionaran');
    return false;
  }
}