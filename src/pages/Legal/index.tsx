import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FileText, Lock, ShieldCheck, CreditCard, Scale } from 'lucide-react';
import { TERMS_VERSION, TERMS_DATE, CONTACT_EMAIL, OPERATOR } from '@/lib/legal';

// DRAFT NOTE FOR THE OWNER: these texts are a careful first draft written from the fal.ai and Tripo terms.
// Have a lawyer review them before you take real payments. Edit the constants in src/lib/legal.ts.

type Section = { title: string; body: string[] };
type Tab = 'terms' | 'aup' | 'privacy' | 'billing';

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: 'terms', label: 'Terms of Service', icon: FileText },
  { id: 'aup', label: 'Acceptable Use & 18+', icon: ShieldCheck },
  { id: 'privacy', label: 'Privacy Policy', icon: Lock },
  { id: 'billing', label: 'Billing & Refunds', icon: CreditCard },
];

const CONTENT: Record<Tab, { heading: string; sections: Section[] }> = {
  terms: {
    heading: 'Terms of Service',
    sections: [
      {
        title: '1. Who we are and what this is',
        body: [
          `Eidolon (eidolon.monster) is operated by ${OPERATOR} ("we", "us"). Eidolon lets adults create original dark-fantasy, mythology and hybrid character images and 3D models using AI. By creating an account or using Eidolon you agree to these Terms, the Acceptable Use & 18+ rules and the Privacy Policy.`,
        ],
      },
      {
        title: '2. You must be 18 or older',
        body: [
          'Eidolon is for adults only. You confirm that you are at least 18 years old (or the age of majority where you live) when you sign up. We may suspend or close any account we believe belongs to a person under 18, and we may ask you to confirm your age again.',
        ],
      },
      {
        title: '3. Your account',
        body: [
          'Keep your password private and do not share your account. You are responsible for everything done through your account. Tell us promptly if you think someone else has accessed it.',
        ],
      },
      {
        title: '4. What you create',
        body: [
          'You keep the rights you have in your own prompts. Subject to these Terms and to the rights of others, you may use the images and 3D models you create, including commercially, if you have a paid plan.',
          'AI output can be similar or identical across users, may contain mistakes, and is not guaranteed to be original or free of third-party rights. We give no promise of exclusivity, originality or non-infringement. You are responsible for how you use what you create.',
          'You give us a limited licence to store and process your prompts and creations so we can run the service, show them to you, keep them safe and review them for safety. If you choose to publish a creation to the community gallery, you also allow us to display it there.',
        ],
      },
      {
        title: '5. Rules',
        body: [
          'You must follow the Acceptable Use & 18+ rules. You must not use Eidolon, or its outputs, to train, fine-tune or improve any competing AI model, to scrape or systematically collect content, to resell access to the service, or to interfere with its security or operation.',
          'You are responsible for your use of Eidolon. If you break these rules, or cause a claim against us or our providers, you agree to compensate us for the resulting losses to the extent the law allows.',
        ],
      },
      {
        title: '6. Our providers',
        body: [
          'Eidolon relies on third-party providers to host data and to generate images and 3D models. Their terms and safety rules also apply to what can be created, and they may refuse or stop requests. The service may be unavailable or change from time to time.',
        ],
      },
      {
        title: '7. Moderation, suspension and closing accounts',
        body: [
          'We check prompts automatically and may review prompts and creations by hand. We may block requests, remove content, lock or close accounts, and report illegal content, including anything involving minors, to the authorities. Serious violations can lead to an immediate lock without warning. We may keep records of violations.',
        ],
      },
      {
        title: '8. Limits of liability',
        body: [
          'Eidolon is provided "as is" without warranties of any kind, to the fullest extent the law allows. To the fullest extent the law allows, we are not liable for indirect or consequential losses, lost profits or lost data, and our total liability to you for any claim is limited to the amount you paid us in the 12 months before the claim. Nothing in these Terms limits rights you have under law that cannot be limited.',
        ],
      },
      {
        title: '9. Changes and governing law',
        body: [
          `We may update these Terms. The current version is dated ${TERMS_DATE} (version ${TERMS_VERSION}). If a change is significant we will tell you in the service or by email, and continuing to use Eidolon means you accept it.`,
          'These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada that apply there, and disputes will be handled by the courts of Ontario, except where your local consumer law says otherwise.',
        ],
      },
      { title: '10. Contact', body: [`Questions or reports: ${CONTACT_EMAIL}`] },
    ],
  },
  aup: {
    heading: 'Acceptable Use & 18+ Rules',
    sections: [
      {
        title: 'Eidolon is dark fantasy for adults, not adult content',
        body: [
          'Eidolon is for adults (18+) who want mature, intense dark-fantasy, mythology and hybrid-creature art. "18+" means the themes can be dark. It does not mean sexual content is allowed: sexually explicit content and nudity are not permitted.',
        ],
      },
      {
        title: 'Never allowed',
        body: [
          'Anything involving minors or youthful-looking characters in any setting. Accounts that try this are locked immediately and reviewed.',
          'Nudity, sexual or pornographic content, or sexual violence.',
          'Real people: no images or models of real individuals, celebrities or public figures, and no deepfakes or impersonation.',
          'Extreme or gratuitous gore, torture, mutilation, or cruelty to animals.',
          'Hate, harassment, threats, or content that demeans people for who they are.',
          'Self-harm or suicide promotion, terrorism or violent extremism, or illegal activity.',
          'Trademarked characters, brands or logos you do not have rights to, and anything that infringes copyright or other rights.',
          'Attempting to get around our filters or our providers\' safety checks.',
        ],
      },
      {
        title: 'How we enforce it',
        body: [
          'Prompts are checked automatically and some are reviewed by a person. Blocked requests count toward warnings, and repeated or serious violations lock the account. Locked accounts are reviewed by the owner and may be closed without refund.',
          'We report child sexual abuse material and other illegal content to the appropriate authorities, and we cooperate with law enforcement and with our providers\' safety teams.',
        ],
      },
      {
        title: 'Reporting a problem',
        body: [
          `If you see something that breaks these rules, email ${CONTACT_EMAIL}. We review reports promptly.`,
          `Report a creation: if you believe a creation made with Eidolon copies your artwork, your character, or your trademark, email ${CONTACT_EMAIL} with a link or description of the creation, what it copies, and how to reach you. We will review it and remove the creation if it should not be here.`,
        ],
      },
    ],
  },
  privacy: {
    heading: 'Privacy Policy',
    sections: [
      {
        title: 'What we collect',
        body: [
          'Account details: your email address, display name and a securely stored password.',
          'Usage details: your plan, how many images and 3D models you have made this month, the date and version of the terms you accepted, and the approximate network address of requests (used for abuse prevention).',
          'Your content: the prompts you submit, the images and 3D models you create, and records of blocked requests and the words that triggered them. We keep prompts for safety review.',
          'Payment details are handled by our payment processor. We do not see or store your card number.',
        ],
      },
      {
        title: 'Who processes your information',
        body: [
          'We use trusted service providers to run Eidolon. Your prompts, and the images you send to the 3D studio, are sent to them so that they can produce your results:',
          'Supabase: accounts, database and file storage for your creations.',
          'fal.ai: generates images from your prompts. fal keeps request data for a limited time, about 90 days by default, and states it does not use customer content to train its own products for the models we use.',
          'Tripo: generates 3D models from your images or prompts.',
          'Stripe: processes payments and subscriptions.',
          'Web hosting and DNS providers deliver the website itself.',
          'Some of these providers are located outside Canada, so your information may be processed in other countries, including the United States.',
        ],
      },
      {
        title: 'How we use it',
        body: [
          'To run the service, generate your creations, apply your plan limits, keep Eidolon safe (moderation, abuse prevention, and legal compliance), take payments and answer support requests. We do not sell your personal information.',
        ],
      },
      {
        title: 'Your choices and rights',
        body: [
          `You can ask to see, correct or delete your information, or close your account, by emailing ${CONTACT_EMAIL}. We keep some records (such as safety and billing records) as long as the law or our legitimate safety needs require.`,
        ],
      },
      {
        title: 'Security and age',
        body: [
          'We protect data with access controls and encrypted connections, though no system is perfectly secure. Eidolon is not for anyone under 18 and we do not knowingly collect information from minors; if we learn an account belongs to a minor we will close it and delete the data.',
        ],
      },
      {
        title: 'Changes',
        body: [`We may update this policy. The current version is dated ${TERMS_DATE} (version ${TERMS_VERSION}).`],
      },
    ],
  },
  billing: {
    heading: 'Billing & Refunds',
    sections: [
      {
        title: 'Plans and limits',
        body: [
          'Free accounts can browse the gallery but cannot create. Paid plans include a monthly allowance of Standard images, High-quality images (on plans that include them) and 3D credits. A Standard 3D model uses 1 credit and a High-detail model uses 2. Allowances reset each calendar month and unused amounts do not roll over. Current allowances and prices are shown on the Pricing page and may change for future billing periods.',
        ],
      },
      {
        title: 'Subscriptions',
        body: [
          'Paid plans renew automatically each month until cancelled. You can cancel at any time and keep access until the end of the paid period. All prices are in Canadian dollars (CAD). Prices are shown before you pay and taxes may be added where required. If your card is in another currency, your bank or Stripe converts the amount.',
        ],
      },
      {
        title: 'Refunds',
        body: [
          'Because AI generation has real costs the moment you use it, payments are generally non-refundable once a billing period has started and part of the allowance has been used. If a generation fails and does not produce a result, it does not count against your allowance. If you were charged in error or something is wrong with your account, contact us and we will fix it. This does not limit any refund rights you have under the law where you live.',
        ],
      },
      {
        title: 'Locked or closed accounts',
        body: ['Accounts closed for breaking the Acceptable Use rules are not entitled to a refund.'],
      },
      { title: 'Contact', body: [`Billing questions: ${CONTACT_EMAIL}`] },
    ],
  },
};

export default function LegalPage() {
  const [params] = useSearchParams();
  const initial = (params.get('tab') as Tab) || 'terms';
  const [activeTab, setActiveTab] = useState<Tab>(CONTENT[initial] ? initial : 'terms');
  const doc = CONTENT[activeTab];

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6E8EC]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 sm:px-12 pt-36 pb-24">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest">
            <Scale className="w-3.5 h-3.5" />
            Legal
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">Terms, Rules &amp; Privacy</h1>
          <p className="text-sm text-gray-400">
            Version {TERMS_VERSION} &bull; {TERMS_DATE}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 border-b border-white/10 pb-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition ${
                activeTab === id
                  ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20'
                  : 'bg-[#10131B] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <article className="space-y-8">
          <h2 className="text-2xl font-bold text-white">{doc.heading}</h2>
          {doc.sections.map((s) => (
            <section key={s.title} className="space-y-2.5">
              <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">{s.title}</h3>
              {s.body.map((p, i) => (
                <p key={i} className="text-sm text-gray-300 leading-relaxed">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </article>
      </main>

      <Footer />
    </div>
  );
}
