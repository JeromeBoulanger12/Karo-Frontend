// DRAFT (ébauche): written from the product's data inventory, to be reviewed by a lawyer or privacy expert before launch.
// Bracketed values are placeholders to fill in.

export interface LegalSection {
  heading: string
  paragraphs: string[]
}

export interface LegalDocument {
  title: string
  summary: string
  sections: LegalSection[]
}

export const LEGAL_CONTACT_EMAIL = 'contact@karobudget.ca'

export const LEGAL_DOCUMENTS: Record<'privacy' | 'terms', Record<'fr' | 'en', LegalDocument>> = {
  privacy: {
    fr: {
      title: 'Politique de confidentialité',
      summary: "Ce que Karo recueille, pourquoi, qui y a accès, combien de temps nous le gardons et comment exercer vos droits, conformément à la Loi sur la protection des renseignements personnels dans le secteur privé (loi 25).",
      sections: [
        {
          heading: '1. Qui nous sommes',
          paragraphs: [
            'Karo est une application de budget personnel et de foyer, exploitée par Jérôme Boulanger, au Québec (« Karo », « nous »).',
            `Responsable de la protection des renseignements personnels : Jérôme Boulanger. Pour toute question ou demande : ${LEGAL_CONTACT_EMAIL}.`
          ]
        },
        {
          heading: '2. Renseignements recueillis',
          paragraphs: [
            'Identité : courriel, prénom et nom.',
            'Préférences : langue, fuseau horaire et choix de recevoir ou non des notifications.',
            'Données budgétaires que vous saisissez : comptes et soldes, enveloppes et transactions, emplois et paies, factures, dettes et cartes de crédit. Karo ne se connecte pas à votre banque et ne vous demande jamais vos identifiants bancaires.',
            'Foyer : nom et courriel des membres que vous invitez, et leurs invitations.',
            'Abonnement : forfait, statut et identifiant client chez Stripe. Karo ne reçoit ni votre numéro de carte ni votre adresse.',
            "Données techniques : jeton de session, date de dernière activité, version des documents acceptés et date d'acceptation, et journaux techniques (date des requêtes, erreurs) servant à la sécurité et au dépannage."
          ]
        },
        {
          heading: '3. Comment nous les recueillons',
          paragraphs: [
            'Directement auprès de vous, lorsque vous créez votre compte et utilisez Karo.',
            "Auprès d'un membre de votre foyer, lorsqu'il vous invite avec votre courriel.",
            'Auprès de Stripe, qui nous indique le statut de votre paiement et de votre abonnement.'
          ]
        },
        {
          heading: '4. Pourquoi nous les utilisons',
          paragraphs: [
            'Pour fournir le service : répartir vos paies, tenir vos enveloppes et vos factures, déposer les paies fixes et payer les factures automatiques que vous avez configurées, et vous envoyer les courriels liés à votre compte (confirmation, mot de passe, alertes, invitations).',
            'Pour gérer votre abonnement, sécuriser votre compte et respecter nos obligations légales.',
            "Nous ne vendons pas vos renseignements, nous ne les utilisons pas pour la publicité et nous ne dressons pas de profil de vous. Nous ne les utilisons pas à d'autres fins sans votre consentement, sauf si la loi le permet."
          ]
        },
        {
          heading: '5. Qui y a accès',
          paragraphs: [
            "Les membres de votre foyer voient les comptes et les enveloppes partagés du foyer, selon leur rôle. Vos données personnelles qui ne sont pas partagées ne leur sont pas visibles.",
            "Seul l'exploitant de Karo peut accéder aux données des comptes, et uniquement lorsque c'est nécessaire au soutien, à la sécurité ou au bon fonctionnement du service."
          ]
        },
        {
          heading: '6. Fournisseurs et communication hors du Québec',
          paragraphs: [
            'Supabase : authentification et base de données, hébergées à Montréal (Québec).',
            "Microsoft Azure : hébergement de l'API et des journaux techniques, région Canada Centre (Toronto, Ontario, hors Québec).",
            "GitHub Pages : hébergement de l'interface (aucune donnée de compte n'y est conservée).",
            'Resend : envoi des courriels, hors Québec (États-Unis).',
            "Stripe : paiement de l'abonnement. Stripe agit comme marchand de référence et recueille lui-même vos données de paiement et votre adresse de facturation, y compris pour les taxes de vente; il traite ces renseignements selon sa propre politique de confidentialité.",
            "Ces fournisseurs n'utilisent vos renseignements que pour nous rendre le service. Ceux qui les traitent hors du Québec sont soumis à des lois qui peuvent offrir une protection différente de celle du Québec."
          ]
        },
        {
          heading: '7. Conservation',
          paragraphs: [
            'Compte actif : vos renseignements sont conservés tant que vous utilisez Karo.',
            'Abonnement payant annulé : vos données sont conservées 90 jours pour vous permettre de les exporter ou de réactiver votre abonnement, puis elles sont supprimées.',
            'Compte gratuit inactif : après 24 mois sans connexion, nous vous avisons par courriel; sans réaction de votre part dans les 30 jours, le compte est supprimé.',
            "Factures et reçus d'abonnement : conservés pendant la durée exigée par les lois fiscales [six ans, à confirmer], même après la suppression du compte. Ils ne contiennent que les renseignements de facturation.",
            'Compte supprimé par vous : vos données sont effacées immédiatement. Les sauvegardes sont purgées dans un délai de [à définir].'
          ]
        },
        {
          heading: '8. Vos droits',
          paragraphs: [
            "Vous pouvez demander l'accès à vos renseignements, leur rectification ou leur suppression, recevoir vos données dans un format structuré et retirer votre consentement.",
            'Depuis votre profil, vous pouvez modifier vos renseignements, télécharger vos données (« Mes données ») et supprimer votre compte. Pour toute autre demande, écrivez au responsable désigné à la section 1. Nous répondons dans les 30 jours.',
            "Si vous n'êtes pas satisfait de notre réponse, vous pouvez porter plainte auprès de la Commission d'accès à l'information du Québec (cai.gouv.qc.ca)."
          ]
        },
        {
          heading: '9. Sécurité',
          paragraphs: [
            "Les échanges entre votre navigateur et Karo sont chiffrés (HTTPS). Les mots de passe ne sont jamais conservés en clair. L'accès aux données est limité à ce qui est nécessaire au service."
          ]
        },
        {
          heading: '10. Incidents de confidentialité',
          paragraphs: [
            "En cas d'incident présentant un risque de préjudice sérieux, nous avisons la Commission d'accès à l'information du Québec et les personnes concernées. Nous tenons un registre de tous les incidents."
          ]
        },
        {
          heading: '11. Témoins et stockage local',
          paragraphs: [
            "Karo utilise seulement le stockage local nécessaire à son fonctionnement : jeton de session, langue et identifiant du foyer. Aucun témoin publicitaire ni outil d'analyse n'est utilisé."
          ]
        },
        {
          heading: '12. Personnes de moins de 14 ans',
          paragraphs: [
            "Les renseignements d'une personne de moins de 14 ans ne peuvent être recueillis qu'avec le consentement du titulaire de l'autorité parentale ou du tuteur."
          ]
        },
        {
          heading: '13. Modifications',
          paragraphs: [
            'Nous publions les changements ici, avec une nouvelle date de version. En cas de changement important, nous vous en informons avant son entrée en vigueur.'
          ]
        }
      ]
    },
    en: {
      title: 'Privacy policy',
      summary: "What Karo collects, why, who can see it, how long we keep it and how to exercise your rights, in line with Quebec's Act respecting the protection of personal information in the private sector (Law 25).",
      sections: [
        {
          heading: '1. Who we are',
          paragraphs: [
            'Karo is a personal and household budgeting app, operated by Jérôme Boulanger in Quebec, Canada ("Karo", "we").',
            `Person in charge of the protection of personal information: Jérôme Boulanger. For questions or requests: ${LEGAL_CONTACT_EMAIL}.`
          ]
        },
        {
          heading: '2. Information we collect',
          paragraphs: [
            'Identity: email, first and last name.',
            'Preferences: language, time zone and whether you want notifications.',
            'Budget data you enter: accounts and balances, envelopes and transactions, jobs and paychecks, bills, debts and credit cards. Karo does not connect to your bank and never asks for your banking credentials.',
            'Household: name and email of the members you invite, and their invitations.',
            'Subscription: plan, status and customer identifier at Stripe. Karo receives neither your card number nor your address.',
            'Technical data: session token, last activity date, version and date of the documents you accepted, and technical logs (request dates, errors) used for security and troubleshooting.'
          ]
        },
        {
          heading: '3. How we collect it',
          paragraphs: [
            'Directly from you, when you create your account and use Karo.',
            'From a member of your household, when they invite you with your email.',
            'From Stripe, which tells us the status of your payment and subscription.'
          ]
        },
        {
          heading: '4. Why we use it',
          paragraphs: [
            'To provide the service: split your paychecks, keep your envelopes and bills, deposit the fixed paychecks and pay the automatic bills you set up, and send the emails related to your account (confirmation, password, alerts, invitations).',
            'To manage your subscription, keep your account secure and meet our legal obligations.',
            'We do not sell your information, do not use it for advertising and do not profile you. We do not use it for other purposes without your consent, unless the law allows it.'
          ]
        },
        {
          heading: '5. Who can see it',
          paragraphs: [
            "Members of your household see the household's shared accounts and envelopes, according to their role. Your personal data that is not shared is not visible to them.",
            "Only Karo's operator can access account data, and only when needed for support, security or keeping the service running."
          ]
        },
        {
          heading: '6. Providers and transfers outside Quebec',
          paragraphs: [
            'Supabase: authentication and database, hosted in Montréal (Quebec).',
            'Microsoft Azure: API and technical log hosting, Canada Central region (Toronto, Ontario, outside Quebec).',
            'GitHub Pages: hosting of the web interface (no account data is stored there).',
            'Resend: sends emails, outside Quebec (United States).',
            'Stripe: subscription payments. Stripe acts as merchant of record and collects your payment details and billing address itself, sales taxes included; it handles this information under its own privacy policy.',
            'These providers only use your information to provide the service to us. Those that process it outside Quebec are subject to laws that may offer different protection than Quebec law.'
          ]
        },
        {
          heading: '7. Retention',
          paragraphs: [
            'Active account: we keep your information as long as you use Karo.',
            'Cancelled paid subscription: we keep your data for 90 days so you can export it or reactivate your subscription, then it is deleted.',
            'Inactive free account: after 24 months without signing in, we notify you by email; if you do not respond within 30 days, the account is deleted.',
            'Invoices and subscription receipts: kept for the period required by tax law [six years, to confirm], even after the account is deleted. They contain billing information only.',
            'Account you delete: your data is erased immediately. Backups are purged within [period to define].'
          ]
        },
        {
          heading: '8. Your rights',
          paragraphs: [
            'You can ask for access to your information, its correction or deletion, receive your data in a structured format, and withdraw your consent.',
            'From your profile, you can edit your information, download your data ("My data") and delete your account. For any other request, write to the person in charge named in section 1. We respond within 30 days.',
            "If you are not satisfied with our answer, you can file a complaint with the Commission d'accès à l'information du Québec (cai.gouv.qc.ca)."
          ]
        },
        {
          heading: '9. Security',
          paragraphs: [
            'Traffic between your browser and Karo is encrypted (HTTPS). Passwords are never stored in plain text. Access to data is limited to what the service needs.'
          ]
        },
        {
          heading: '10. Privacy incidents',
          paragraphs: [
            "If an incident presents a risk of serious injury, we notify the Commission d'accès à l'information du Québec and the people concerned. We keep a register of all incidents."
          ]
        },
        {
          heading: '11. Cookies and local storage',
          paragraphs: [
            'Karo only uses the local storage it needs to work: session token, language and household identifier. No advertising cookies or analytics tools are used.'
          ]
        },
        {
          heading: '12. People under 14',
          paragraphs: [
            'Information about a person under 14 may only be collected with the consent of the person having parental authority or the tutor.'
          ]
        },
        {
          heading: '13. Changes',
          paragraphs: [
            'We post changes here, with a new version date. For an important change, we inform you before it takes effect.'
          ]
        }
      ]
    }
  },
  terms: {
    fr: {
      title: "Conditions d'utilisation",
      summary: "Les règles qui s'appliquent lorsque vous utilisez Karo : votre compte, votre foyer, les abonnements et nos engagements envers vous.",
      sections: [
        {
          heading: '1. Acceptation',
          paragraphs: [
            "Karo est exploité par Jérôme Boulanger, au Québec. En créant un compte, vous acceptez ces conditions et la politique de confidentialité."
          ]
        },
        {
          heading: "2. Ce qu'est Karo",
          paragraphs: [
            "Karo est un outil de budget personnel et de foyer : vous indiquez vos soldes et vos paies, et Karo les répartit dans des enveloppes.",
            "Karo ne se connecte pas à votre banque et ne déplace jamais d'argent réel. Les dépôts, transferts et paiements faits dans Karo sont des inscriptions dans votre budget seulement.",
            'Karo ne fournit pas de conseil financier, fiscal ou juridique.'
          ]
        },
        {
          heading: '3. Votre compte',
          paragraphs: [
            "Vous devez fournir des renseignements exacts et garder vos identifiants confidentiels. Un compte appartient à une seule personne.",
            "Une personne de moins de 14 ans ne peut créer un compte qu'avec le consentement du titulaire de l'autorité parentale. L'achat d'un abonnement est réservé aux personnes majeures."
          ]
        },
        {
          heading: '4. Foyer et membres',
          paragraphs: [
            "Le propriétaire d'un foyer peut inviter des membres, qui voient alors les comptes et les enveloppes partagés selon leur rôle. Invitez seulement des personnes qui acceptent de partager ce budget avec vous.",
            "Le nombre de membres dépend du forfait du propriétaire. Le propriétaire peut retirer un membre en tout temps."
          ]
        },
        {
          heading: '5. Forfaits, paiement et annulation',
          paragraphs: [
            "Karo offre un forfait gratuit et des forfaits payants (Pro, Famille). Les prix et ce que comprend chaque forfait sont affichés avant l'achat; les taxes applicables s'ajoutent.",
            "Le paiement est traité par Stripe, qui agit comme marchand de référence. Un abonnement se renouvelle automatiquement à la fin de chaque période (mois ou année) jusqu'à ce que vous l'annuliez.",
            "Vous pouvez annuler en tout temps depuis votre profil. L'annulation prend effet à la fin de la période déjà payée et vous gardez l'accès jusque-là. Les sommes payées ne sont pas remboursées, sauf lorsque la loi le prévoit.",
            "Si nous changeons le prix de votre forfait, nous vous avisons par courriel au moins 30 jours avant. Vous pouvez alors refuser le changement en annulant votre abonnement."
          ]
        },
        {
          heading: '6. Utilisation acceptable',
          paragraphs: [
            "Vous vous engagez à ne pas utiliser Karo à des fins illégales, à ne pas tenter d'accéder aux données d'autres personnes, à ne pas perturber le service et à ne pas en extraire le contenu de façon automatisée."
          ]
        },
        {
          heading: '7. Vos données',
          paragraphs: [
            "Les renseignements que vous saisissez vous appartiennent. Vous pouvez les télécharger ou les supprimer depuis votre profil. Nous les traitons selon la politique de confidentialité."
          ]
        },
        {
          heading: '8. Propriété intellectuelle',
          paragraphs: [
            "Le logiciel, le nom et l'apparence de Karo appartiennent à son exploitant. Vous obtenez le droit de les utiliser pour gérer votre budget, sans pouvoir les copier, les revendre ou les modifier."
          ]
        },
        {
          heading: '9. Montants calculés',
          paragraphs: [
            "Les répartitions, paies fixes déposées, échéances et soldes affichés sont calculés à partir de ce que vous saisissez. Karo ne connaît pas votre solde bancaire réel : vérifiez vos comptes et ajustez les montants au besoin avant de prendre une décision."
          ]
        },
        {
          heading: '10. Disponibilité et évolution du service',
          paragraphs: [
            "Nous faisons des efforts raisonnables pour que Karo soit disponible et exact, mais des interruptions peuvent survenir, notamment pour l'entretien. Nous pouvons faire évoluer les fonctionnalités; si un changement retire une fonctionnalité importante de votre forfait payant, nous vous en avisons à l'avance."
          ]
        },
        {
          heading: '11. Responsabilité',
          paragraphs: [
            "Nous ne sommes pas responsables des décisions financières que vous prenez à partir des montants que vous avez saisis dans Karo.",
            "Rien dans ces conditions ne limite les droits que vous accorde la Loi sur la protection du consommateur du Québec ou une autre loi d'ordre public."
          ]
        },
        {
          heading: '12. Suspension et fin du compte',
          paragraphs: [
            "Vous pouvez supprimer votre compte en tout temps depuis votre profil.",
            "Nous pouvons suspendre ou fermer un compte qui enfreint gravement ces conditions, après vous en avoir avisé lorsque c'est possible. Vos données sont alors traitées selon la politique de confidentialité."
          ]
        },
        {
          heading: '13. Modifications des conditions',
          paragraphs: [
            "Si nous modifions ces conditions de façon importante, nous vous envoyons par courriel, au moins 30 jours avant l'entrée en vigueur, la nouvelle version et la description du changement. Vous pouvez refuser le changement en supprimant votre compte ou en annulant votre abonnement, sans frais."
          ]
        },
        {
          heading: '14. Droit applicable',
          paragraphs: [
            "Ces conditions sont régies par les lois du Québec et les lois fédérales du Canada qui s'y appliquent. Si vous êtes un consommateur, vous pouvez vous adresser aux tribunaux du district de votre domicile au Québec."
          ]
        },
        {
          heading: '15. Langue',
          paragraphs: [
            "Ces conditions sont offertes en français et en anglais. En cas de différence, la version française prévaut."
          ]
        },
        {
          heading: '16. Nous joindre',
          paragraphs: [
            `Pour toute question sur ces conditions : ${LEGAL_CONTACT_EMAIL}.`
          ]
        }
      ]
    },
    en: {
      title: 'Terms of use',
      summary: 'The rules that apply when you use Karo: your account, your household, subscriptions and our commitments to you.',
      sections: [
        {
          heading: '1. Acceptance',
          paragraphs: [
            'Karo is operated by Jérôme Boulanger in Quebec, Canada. By creating an account, you accept these terms and the privacy policy.'
          ]
        },
        {
          heading: '2. What Karo is',
          paragraphs: [
            'Karo is a personal and household budgeting tool: you enter your balances and paychecks, and Karo splits them into envelopes.',
            'Karo does not connect to your bank and never moves real money. Deposits, transfers and payments made in Karo are entries in your budget only.',
            'Karo does not provide financial, tax or legal advice.'
          ]
        },
        {
          heading: '3. Your account',
          paragraphs: [
            'You must provide accurate information and keep your sign-in details confidential. An account belongs to a single person.',
            'A person under 14 may only create an account with the consent of the person having parental authority. Buying a subscription is reserved for adults.'
          ]
        },
        {
          heading: '4. Household and members',
          paragraphs: [
            "A household owner can invite members, who then see the shared accounts and envelopes according to their role. Only invite people who agree to share this budget with you.",
            "The number of members depends on the owner's plan. The owner can remove a member at any time."
          ]
        },
        {
          heading: '5. Plans, payment and cancellation',
          paragraphs: [
            'Karo offers a free plan and paid plans (Pro, Family). Prices and what each plan includes are shown before purchase; applicable taxes are added.',
            'Payment is handled by Stripe, which acts as merchant of record. A subscription renews automatically at the end of each period (month or year) until you cancel it.',
            'You can cancel at any time from your profile. Cancellation takes effect at the end of the period already paid and you keep access until then. Amounts paid are not refunded, except where the law provides otherwise.',
            'If we change the price of your plan, we notify you by email at least 30 days in advance. You can then refuse the change by cancelling your subscription.'
          ]
        },
        {
          heading: '6. Acceptable use',
          paragraphs: [
            "You agree not to use Karo for illegal purposes, not to try to access other people's data, not to disrupt the service and not to extract its content by automated means."
          ]
        },
        {
          heading: '7. Your data',
          paragraphs: [
            'The information you enter belongs to you. You can download or delete it from your profile. We process it according to the privacy policy.'
          ]
        },
        {
          heading: '8. Intellectual property',
          paragraphs: [
            "Karo's software, name and look belong to its operator. You get the right to use them to manage your budget, without copying, reselling or modifying them."
          ]
        },
        {
          heading: '9. Calculated amounts',
          paragraphs: [
            'The splits, fixed paychecks deposited, due dates and balances shown are calculated from what you enter. Karo does not know your actual bank balance: check your accounts and adjust amounts when needed before making a decision.'
          ]
        },
        {
          heading: '10. Availability and changes to the service',
          paragraphs: [
            'We make reasonable efforts to keep Karo available and accurate, but interruptions can happen, for example for maintenance. We may change features; if a change removes an important feature from your paid plan, we notify you in advance.'
          ]
        },
        {
          heading: '11. Liability',
          paragraphs: [
            'We are not responsible for financial decisions you make based on the amounts you entered in Karo.',
            "Nothing in these terms limits the rights granted to you by Quebec's Consumer Protection Act or any other law of public order."
          ]
        },
        {
          heading: '12. Suspension and closing the account',
          paragraphs: [
            'You can delete your account at any time from your profile.',
            'We may suspend or close an account that seriously breaches these terms, after notifying you when possible. Your data is then handled according to the privacy policy.'
          ]
        },
        {
          heading: '13. Changes to these terms',
          paragraphs: [
            'If we change these terms in an important way, we email you the new version and a description of the change at least 30 days before it takes effect. You can refuse the change by deleting your account or cancelling your subscription, at no cost.'
          ]
        },
        {
          heading: '14. Governing law',
          paragraphs: [
            'These terms are governed by the laws of Quebec and the federal laws of Canada that apply there. If you are a consumer, you may go to the courts of the district where you live in Quebec.'
          ]
        },
        {
          heading: '15. Language',
          paragraphs: [
            'These terms are available in French and English. If they differ, the French version prevails.'
          ]
        },
        {
          heading: '16. Contact us',
          paragraphs: [
            `For any question about these terms: ${LEGAL_CONTACT_EMAIL}.`
          ]
        }
      ]
    }
  }
}
