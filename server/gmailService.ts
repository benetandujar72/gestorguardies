import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from './db';
import { systemSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface GmailEmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

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

class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: any;

  constructor() {
    // Utilitzar sempre la URL de Replit per aplicacions web
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || '5d121827-a5dd-4e63-9875-8d20cbab4506-00-2vq5a9umw9isu.spock.replit.dev';
    const redirectUri = `https://${domain}/oauth2callback`;
      
    // Utilitzar les credencials correctes (forçar les primeres de la llista)
    const clientId = '86658517609-tmcpm9an5ulqtnkiol1p61hbtu8tqau9.apps.googleusercontent.com';
    const clientSecret = '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';
    
    this.oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );

    // Set credentials if available
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
      });
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  private createEmailMessage(emailData: GmailEmailData): string {
    const { to, subject, html, from = process.env.GMAIL_USER } = emailData;
    
    const message = [
      `To: ${to}`,
      `From: ${from}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      html
    ].join('\n');

    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async sendEmail(emailData: GmailEmailData): Promise<boolean> {
    try {
      const raw = this.createEmailMessage(emailData);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: raw
        }
      });

      console.log('Email enviat amb èxit:', response.data.id);
      return true;
    } catch (error) {
      console.error('Error enviant email via Gmail API:', error);
      return false;
    }
  }

  async sendSubstitutionEmails(data: SubstitutionEmailData): Promise<void> {
    const { professorOriginal, professorSubstitut, sortida, classe, motiu } = data;

    // Format de la data
    const dataFormatted = new Date(sortida.data).toLocaleDateString('ca-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Email al professor original
    const emailOriginal: GmailEmailData = {
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
    const emailSubstitut: GmailEmailData = {
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
      const results = await Promise.allSettled([
        this.sendEmail(emailOriginal),
        this.sendEmail(emailSubstitut)
      ]);

      const sucessCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      
      if (sucessCount === 2) {
        console.log('Emails de substitució enviats correctament via Gmail API');
      } else {
        console.warn(`Només ${sucessCount} de 2 emails s'han enviat correctament`);
      }
    } catch (error) {
      console.error('Error enviant emails de substitució via Gmail API:', error);
      throw new Error('No s\'han pogut enviar les notificacions per email');
    }
  }

  async verifyConfiguration(): Promise<boolean> {
    try {
      // Test Gmail API access
      const response = await this.gmail.users.getProfile({
        userId: 'me'
      });
      
      console.log(`Gmail API connectada correctament per: ${response.data.emailAddress}`);
      return true;
    } catch (error) {
      console.error('Error verificant configuració Gmail API:', error);
      return false;
    }
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async setTokenFromCode(code: string): Promise<boolean> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      console.log('Tokens Gmail API obtinguts correctament');
      console.log('Refresh Token:', tokens.refresh_token);
      console.log('Access Token:', tokens.access_token);
      
      return true;
    } catch (error) {
      console.error('Error obtenint tokens Gmail API:', error);
      return false;
    }
  }
}

export const gmailService = new GmailService();
export { SubstitutionEmailData };