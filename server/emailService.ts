import { gmailService, type SubstitutionEmailData } from './gmailService';

export async function sendSubstitutionEmails(data: SubstitutionEmailData): Promise<void> {
  return await gmailService.sendSubstitutionEmails(data);
}

// Verificar la configuració del Gmail API sense bloquejar
export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    // Verifica asíncrona sense bloquejar l'arrencada
    setTimeout(async () => {
      try {
        const result = await gmailService.verifyConfiguration();
        if (result) {
          console.log('✅ Configuració d\'email Gmail verificada correctament');
        }
      } catch (error) {
        console.log('⚠️  Error en la configuració d\'email - Les notificacions per email no funcionaran');
      }
    }, 1000);
    return true;
  } catch (error) {
    console.log('⚠️  Error en la configuració d\'email - Les notificacions per email no funcionaran');
    return false;
  }
}