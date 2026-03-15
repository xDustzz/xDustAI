export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Attachment {
  mimeType: string;
  base64: string; // Raw base64 data (no data URI prefix)
  name: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  attachments?: Attachment[];
}

export enum Theme {
  PURPLE_BLUE = 'purple-blue',
  GREEN = 'green',
  CYAN_BLUE = 'cyan-blue',
  RED_ORANGE = 'red-orange',
}

// Added: Spanish, French, German, Japanese, Korean, Russian, Portuguese, Arabic, Hindi
export type Language = 'id' | 'en' | 'zh' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'ru' | 'pt' | 'ar' | 'hi';

export const GUEST_MESSAGE_LIMIT = 3;

export interface LanguagePack {
  greeting: string;
  placeholder: string;
  clearChat: string;
  clearConfirmTitle: string;
  clearConfirmText: string;
  yes: string;
  no: string;
  theme: string;
  language: string;
  settings: string;
  copy: string;
  copied: string;
  send: string;
  attach: string;
  photos: string;
  files: string;
  remove: string;
  edit: string;
  selectText: string;
  // New Limit Keys
  limitReachedTitle: string;
  limitReachedText: string;
  imageLimitTitle: string;
  imageLimitText: string;
  tryAgainAt: string;
  // New Feedback Key
  feedback: string;
  orUseThisLink: string;
  // Auth Keys
  loginRequired: string;
  guestLimitTitle: string;
  guestLimitText: string;
  loginBtn: string;
  createAccount: string;
  connect: string;
  premiumFeature: string;
  premiumText: string;
  logout: string;
  usernamePlaceholder: string;
  passwordPlaceholder: string;
  loginTitle: string;
  signupTitle: string;
  loginAction: string;
  signupAction: string;
  switchLogin: string;
  switchSignup: string;
  deleteAccountTitle: string;
  deleteInstruction: string;
  deleteAction: string;
  passCriteriaText: string;
  passwordRules: [string, string, string, string]; // [Min 8, Uppercase, Number, Symbol]
  errorUserExists: string;
  errorUserNotFound: string;
  errorWrongPass: string;
  errorPassCriteria: string;
  successCreated: string;
  welcomeBack: string;
  deleteSuccess: string;
  // Credits Page Keys
  general: string;
  credits: string;
  creator: string;
  helper: string;
  tester: string;
  version: string;
  helperValue: string;
  testerValue: string;
}