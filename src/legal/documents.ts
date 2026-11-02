// DRAFT (ébauche): written from the product's data inventory, to be reviewed by a lawyer or privacy expert before launch.
// Bracketed values are placeholders to fill in.

export interface LegalSection {
  heading: string
  paragraphs: string[]
}

export interface LegalDocument {
  title: string
  sections: LegalSection[]
}

export const LEGAL_DOCUMENTS: Record<'privacy' | 'terms', Record<'fr' | 'en', LegalDocument>> = {
  privacy: {
    fr: {
      title: 'Politique de confidentialité',
      sections: [
        {
          heading: '1. Qui nous sommes',
          paragraphs: [
            'Karo est une application de suivi budgétaire personnel et de foyer, exploitée par Jérôme Boulanger, au Québec.',
            'Responsable de la protection des renseignements personnels : Jérôme Boulanger. Pour toute question ou demande : [courriel de contact à publier].'
          ]
        },
        {
          heading: '2. Renseignements recueillis',
          paragraphs: [
            'Identité : courriel, prénom et nom.',
            "Adresse postale (facultative) : utilisée à l'inscription et pour le paiement de l'abonnement.",
            'Préférences : fuseau horaire et choix de recevoir ou non des notifications.',
            'Données financières que vous saisissez : comptes et soldes, enveloppes et transactions, sources de revenu et paies, dettes, membres du foyer et invitations.',
            'Données techniques : jeton de session, langue et identifiant du foyer.'
          ]
        },
        {
          heading: '3. Pourquoi nous les utilisons',
          paragraphs: [
            'Pour fournir le service : répartir vos paies, suivre vos enveloppes et vos factures, vous rappeler les échéances et déposer les paies fixes que vous avez configurées.',
            'Pour gérer votre abonnement et sécuriser votre compte.',
            'Nous ne vendons pas vos renseignements et nous ne les utilisons pas pour la publicité.'
          ]
        },
        {
          heading: '4. Fournisseurs qui traitent vos renseignements',
          paragraphs: [
            'Supabase : authentification et base de données. Actuellement hébergée aux États-Unis; migration vers le Canada prévue au lancement.',
            'Microsoft Azure : hébergement de l\'API, région Canada central.',
            "GitHub Pages : hébergement de l'interface.",
            "Resend : envoi des courriels d'invitation, hors Québec (États-Unis).",
            "Lemon Squeezy : paiement de l'abonnement; ce fournisseur agit comme marchand de référence et traite vos données de paiement."
          ]
        },
        {
          heading: '5. Conservation',
          paragraphs: [
            'Compte actif : vos renseignements sont conservés tant que vous utilisez Karo.',
            'Abonnement payant annulé : vos données sont conservées 90 jours pour vous permettre de les exporter ou de réactiver votre abonnement, puis elles sont supprimées.',
            'Compte gratuit inactif : après 24 mois sans connexion, nous vous avisons par courriel, puis le compte est supprimé si vous ne réagissez pas.',
            'Factures et reçus d\'abonnement : conservés pendant la durée exigée par les lois fiscales [six ans, à confirmer], même après la suppression du compte. Ces documents ne contiennent que les renseignements de facturation.',
            'Compte supprimé par vous : vos données sont effacées immédiatement. Les sauvegardes sont purgées dans un délai de [à définir].'
          ]
        },
        {
          heading: '6. Vos droits',
          paragraphs: [
            "Vous pouvez demander l'accès à vos renseignements, leur rectification, leur suppression, leur transfert dans un format structuré, et retirer votre consentement.",
            'Vous supprimez votre compte depuis votre profil. Pour les autres demandes, écrivez au responsable désigné ci-dessus. Nous répondons dans les 30 jours.'
          ]
        },
        {
          heading: '7. Incidents de confidentialité',
          paragraphs: [
            "En cas d'incident présentant un risque de préjudice sérieux, nous avisons la Commission d'accès à l'information du Québec et les personnes concernées, et nous tenons un registre des incidents."
          ]
        },
        {
          heading: '8. Témoins et stockage local',
          paragraphs: [
            "Karo utilise seulement le stockage local nécessaire au fonctionnement : jeton de session, langue et identifiant du foyer. Aucun outil de publicité ou d'analyse n'est utilisé."
          ]
        },
        {
          heading: '9. Modifications',
          paragraphs: [
            'Nous publions les changements importants ici, avec une nouvelle date de version. Vous êtes invité à accepter à nouveau la version en vigueur.'
          ]
        }
      ]
    },
    en: {
      title: 'Privacy policy',
      sections: [
        {
          heading: '1. Who we are',
          paragraphs: [
            'Karo is a personal and household budgeting app, operated by Jérôme Boulanger in Quebec, Canada.',
            'Person in charge of personal information: Jérôme Boulanger. For questions or requests: [contact email to publish].'
          ]
        },
        {
          heading: '2. Information we collect',
          paragraphs: [
            'Identity: email, first and last name.',
            'Mailing address (optional): used at sign-up and to pay the subscription.',
            'Preferences: time zone and whether you want notifications.',
            'Financial data you enter: accounts and balances, envelopes and transactions, income sources and paychecks, debts, household members and invitations.',
            'Technical data: session token, language and household identifier.'
          ]
        },
        {
          heading: '3. Why we use it',
          paragraphs: [
            'To provide the service: split your paychecks, track your envelopes and bills, remind you of due dates and deposit the fixed paychecks you set up.',
            'To manage your subscription and keep your account secure.',
            'We do not sell your information and do not use it for advertising.'
          ]
        },
        {
          heading: '4. Providers that process your information',
          paragraphs: [
            'Supabase: authentication and database. Currently hosted in the United States; a move to Canada is planned for launch.',
            'Microsoft Azure: API hosting, Canada Central region.',
            'GitHub Pages: hosting of the web interface.',
            'Resend: sends invitation emails, outside Quebec (United States).',
            'Lemon Squeezy: subscription payments; it acts as merchant of record and processes payment details.'
          ]
        },
        {
          heading: '5. Retention',
          paragraphs: [
            'Active account: we keep your information as long as you use Karo.',
            'Cancelled paid subscription: we keep your data for 90 days so you can export it or reactivate your subscription, then it is deleted.',
            'Inactive free account: after 24 months without signing in, we notify you by email, then the account is deleted if you do not respond.',
            'Invoices and subscription receipts: kept for the period required by tax law [six years, to confirm], even after the account is deleted. They contain billing information only.',
            'Account you delete: your data is erased immediately. Backups are purged within [period to define].'
          ]
        },
        {
          heading: '6. Your rights',
          paragraphs: [
            'You can ask for access to your information, its correction or deletion, its transfer in a structured format, and withdraw your consent.',
            'You can delete your account from your profile. For other requests, write to the person in charge above. We respond within 30 days.'
          ]
        },
        {
          heading: '7. Privacy incidents',
          paragraphs: [
            "If an incident presents a risk of serious injury, we notify the Commission d'accès à l'information du Québec and the people concerned, and we keep a register of incidents."
          ]
        },
        {
          heading: '8. Cookies and local storage',
          paragraphs: [
            'Karo only uses the local storage it needs to work: session token, language and household identifier. No advertising or analytics tool is used.'
          ]
        },
        {
          heading: '9. Changes',
          paragraphs: [
            'We post important changes here, with a new version date. You will be asked to accept the version in force again.'
          ]
        }
      ]
    }
  },
  terms: {
    fr: {
      title: "Conditions d'utilisation",
      sections: [
        {
          heading: '1. Objet',
          paragraphs: [
            'Karo est un outil de suivi budgétaire personnel et de foyer. Il ne fournit pas de conseil financier, fiscal ou juridique.'
          ]
        },
        {
          heading: '2. Votre compte',
          paragraphs: [
            "Vous êtes responsable de l'exactitude des renseignements que vous saisissez et de la confidentialité de vos identifiants."
          ]
        },
        {
          heading: '3. Abonnements',
          paragraphs: [
            "Les fonctionnalités dépendent de votre forfait (Gratuit, Pro, Famille). Les prix sont affichés avant l'achat. La facturation et l'annulation sont gérées par notre fournisseur de paiement."
          ]
        },
        {
          heading: '4. Vos données',
          paragraphs: [
            'Vous restez propriétaire des renseignements que vous saisissez. Nous les traitons selon la politique de confidentialité.'
          ]
        },
        {
          heading: '5. Paie automatique et notifications',
          paragraphs: [
            "Les montants calculés (répartitions, paies fixes déposées, échéances) sont des estimations basées sur ce que vous saisissez. Karo ne connaît pas votre solde bancaire réel : vérifiez vos comptes et ajustez les montants au besoin."
          ]
        },
        {
          heading: '6. Disponibilité',
          paragraphs: [
            "Le service est fourni tel quel, sans garantie d'exactitude ni de disponibilité continue."
          ]
        },
        {
          heading: '7. Responsabilité',
          paragraphs: [
            'Dans la mesure permise par la loi, notre responsabilité est limitée au montant payé pour le service au cours des douze derniers mois.'
          ]
        },
        {
          heading: '8. Résiliation',
          paragraphs: [
            'Vous pouvez supprimer votre compte à tout moment depuis votre profil.'
          ]
        },
        {
          heading: '9. Droit applicable',
          paragraphs: [
            'Ces conditions sont régies par les lois du Québec et les lois fédérales canadiennes applicables. Les tribunaux du district de [à préciser] sont compétents.'
          ]
        },
        {
          heading: '10. Modifications',
          paragraphs: [
            'Nous pouvons modifier ces conditions. Les changements importants vous seront présentés pour acceptation.'
          ]
        }
      ]
    },
    en: {
      title: 'Terms of use',
      sections: [
        {
          heading: '1. Purpose',
          paragraphs: [
            'Karo is a personal and household budgeting tool. It does not provide financial, tax or legal advice.'
          ]
        },
        {
          heading: '2. Your account',
          paragraphs: [
            'You are responsible for the accuracy of the information you enter and for keeping your sign-in details confidential.'
          ]
        },
        {
          heading: '3. Subscriptions',
          paragraphs: [
            'Features depend on your plan (Free, Pro, Family). Prices are shown before purchase. Billing and cancellation are handled by our payment provider.'
          ]
        },
        {
          heading: '4. Your data',
          paragraphs: [
            'You keep ownership of the information you enter. We process it according to the privacy policy.'
          ]
        },
        {
          heading: '5. Automatic paychecks and notifications',
          paragraphs: [
            'Calculated amounts (splits, fixed paychecks deposited, due dates) are estimates based on what you enter. Karo does not know your actual bank balance: check your accounts and adjust amounts when needed.'
          ]
        },
        {
          heading: '6. Availability',
          paragraphs: [
            'The service is provided as is, without guarantee of accuracy or continuous availability.'
          ]
        },
        {
          heading: '7. Liability',
          paragraphs: [
            'To the extent permitted by law, our liability is limited to the amount paid for the service over the last twelve months.'
          ]
        },
        {
          heading: '8. Termination',
          paragraphs: [
            'You can delete your account at any time from your profile.'
          ]
        },
        {
          heading: '9. Governing law',
          paragraphs: [
            'These terms are governed by the laws of Quebec and applicable federal laws of Canada. The courts of the district of [to specify] have jurisdiction.'
          ]
        },
        {
          heading: '10. Changes',
          paragraphs: [
            'We may change these terms. Important changes will be presented to you for acceptance.'
          ]
        }
      ]
    }
  }
}
