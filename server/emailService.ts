import nodemailer from 'nodemailer';

// Configuració del transportador Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface SubstitutionEmailData {
  professorOriginal: {
    nom: string;
    cognoms: string;
    email: string;
  };
  professorSubstitut: {
    nom: string;
    cognoms: string;
    email: string;
  };
  sortida: {
    nom: string;
    data: string;
  };
  classe: {
    assignatura: string;
    grup: string;
    horaInici: string;
    horaFi: string;
    aula?: string;
  };
  motiu: string;
}

export async function sendSubstitutionEmails(data: SubstitutionEmailData): Promise<void> {
  const { professorOriginal, professorSubstitut, sortida, classe, motiu } = data;

  // Format de la data
  const dataFormatted = new Date(sortida.data).toLocaleDateString('ca-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Email al professor original
  const emailOriginal = {
    from: process.env.GMAIL_USER,
    to: professorOriginal.email,
    subject: `Substitució confirmada - ${sortida.nom}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Substitució Confirmada</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Detalls de la substitució</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Sortida:</td>
              <td style="padding: 8px 0;">${sortida.nom}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Data:</td>
              <td style="padding: 8px 0;">${dataFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Classe afectada:</td>
              <td style="padding: 8px 0;">${classe.assignatura} - ${classe.grup}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Horari:</td>
              <td style="padding: 8px 0;">${classe.horaInici} - ${classe.horaFi}</td>
            </tr>
            ${classe.aula ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Aula:</td>
              <td style="padding: 8px 0;">${classe.aula}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Professor substitut:</td>
              <td style="padding: 8px 0;">${professorSubstitut.nom} ${professorSubstitut.cognoms}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;">
            <strong>La teva classe serà coberta correctament.</strong> El professor substitut ha estat notificat amb tots els detalls.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Aquest email ha estat generat automàticament pel sistema de gestió de substitucions del centre.
        </p>
      </div>
    `
  };

  // Email al professor substitut
  const emailSubstitut = {
    from: process.env.GMAIL_USER,
    to: professorSubstitut.email,
    subject: `Nova substitució assignada - ${sortida.nom}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Nova Substitució Assignada</h2>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">
            <strong>Se t'ha assignat una nova substitució</strong> per la sortida "${sortida.nom}"
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Detalls de la substitució</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Data:</td>
              <td style="padding: 8px 0;">${dataFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Classe a cobrir:</td>
              <td style="padding: 8px 0;">${classe.assignatura} - ${classe.grup}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Horari:</td>
              <td style="padding: 8px 0;">${classe.horaInici} - ${classe.horaFi}</td>
            </tr>
            ${classe.aula ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Aula:</td>
              <td style="padding: 8px 0;">${classe.aula}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Professor original:</td>
              <td style="padding: 8px 0;">${professorOriginal.nom} ${professorOriginal.cognoms}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Motiu:</td>
              <td style="padding: 8px 0;">${motiu}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Accions necessàries:</strong><br>
            • Confirma la substitució al sistema<br>
            • Revisa els materials de la classe<br>
            • Contacta amb el professor original si necessites més informació
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Aquest email ha estat generat automàticament pel sistema de gestió de substitucions del centre.
        </p>
      </div>
    `
  };

  try {
    // Enviar emails simultàniament
    await Promise.all([
      transporter.sendMail(emailOriginal),
      transporter.sendMail(emailSubstitut)
    ]);

    console.log('Emails de substitució enviats correctament');
  } catch (error) {
    console.error('Error enviant emails de substitució:', error);
    throw new Error('No s\'han pogut enviar les notificacions per email');
  }
}

// Verificar la configuració del transportador
export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Configuració d\'email verificada correctament');
    return true;
  } catch (error) {
    console.error('Error verificant configuració d\'email:', error);
    return false;
  }
}