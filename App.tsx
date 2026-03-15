import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, Trash2, X, Check, Sparkles, Globe, ChevronDown, Paperclip, Image as ImageIcon, FileText, Download, Copy, AlertTriangle, Clock, Pencil, MousePointer2, RefreshCw, User, LogIn, Lock, ShieldCheck, Eye, EyeOff, UserMinus, Bug, Crown, HelpCircle, Tag, GitBranch, ExternalLink, Maximize2, Loader2 } from 'lucide-react';
import StarBackground from './components/StarBackground';
import CodeBlock from './components/CodeBlock';
import Tooltip from './components/Tooltip';
import { sendMessageToGemini } from './services/geminiService';
import { getLanguagePack, getLanguageName } from './utils/i18n';
import { Message, Role, Theme, Language, Attachment, GUEST_MESSAGE_LIMIT } from './types';

// LIMITS CONSTANTS
const MAX_MESSAGES_PER_SESSION = 10; 
const LOCKOUT_DURATION_MS = 5 * 60 * 60 * 1000; // 5 Hours

const MAX_IMAGES_PER_SESSION = 3;
const IMAGE_LOCKOUT_DURATION_MS = 3 * 60 * 60 * 1000; // 3 Hours

const FEEDBACK_LINK = "https://xdustzz.github.io/xDustSurvey/";
const FEEDBACK_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(FEEDBACK_LINK)}&bgcolor=ffffff&color=000000&margin=10`;

// OBFUSCATED STORAGE KEYS
const STORAGE_KEYS = {
    CHAT_LOCKOUT: '_x_sys_cl_v2', 
    CHAT_COUNT: '_x_sys_cc_v2', 
    IMG_LOCKOUT: '_x_sys_il_v2', 
    IMG_COUNT: '_x_sys_ic_v2', 
    USERNAME: '_x_usr_id_v2', 
    IS_LOGGED_IN: '_x_auth_tk_v2',
    GUEST_MSG_COUNT: '_x_g_ctr_v2',
    USERS_DB: '_x_db_users_v1' // Local User Database
};

// --- STORAGE HELPERS ---
const safeStorage = {
    getItem: (key: string) => {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value); } catch (e) {}
    },
    removeItem: (key: string) => {
        try { localStorage.removeItem(key); } catch (e) {}
    }
};

// WIREFRAME BUST LOGO
const XDustLogo = ({ theme }: { theme: Theme }) => {
  const getColors = () => {
    switch (theme) {
      case Theme.GREEN: return { start: '#34d399', end: '#059669', glow: '#10b981' };
      case Theme.CYAN_BLUE: return { start: '#22d3ee', end: '#2563eb', glow: '#06b6d4' };
      case Theme.RED_ORANGE: return { start: '#fb923c', end: '#dc2626', glow: '#f97316' };
      case Theme.PURPLE_BLUE: 
      default: return { start: '#c084fc', end: '#7c3aed', glow: '#a855f7' };
    }
  };

  const colors = getColors();

  return (
    <svg width="140" height="140" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] md:w-[160px] md:h-[160px]">
      <defs>
        <linearGradient id="wireframeGradient" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor={colors.start} />
          <stop offset="100%" stopColor={colors.end} />
        </linearGradient>
      </defs>
      
      {/* ROBOT BUST STRUCTURE */}
      <g stroke="url(#wireframeGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 35 15 L 65 15 L 75 25 L 75 40 L 65 52 L 35 52 L 25 40 L 25 25 Z" />
        <path d="M 25 25 L 35 35 M 75 25 L 65 35" opacity="0.6" />
        <path d="M 32 32 L 42 32" strokeWidth="2" stroke={colors.glow} className="animate-pulse" />
        <path d="M 58 32 L 68 32" strokeWidth="2" stroke={colors.glow} className="animate-pulse" />
        <path d="M 42 52 L 40 60" />
        <path d="M 58 52 L 60 60" />
        <path d="M 50 52 L 50 60" opacity="0.5" />
        <path d="M 20 60 L 80 60 L 70 85 L 50 92 L 30 85 Z" />
        <path d="M 35 60 L 40 75 L 60 75 L 65 60" opacity="0.7" />
        <path d="M 20 60 L 10 55 M 80 60 L 90 55" opacity="0.5" />
      </g>
      
      <circle cx="50" cy="72" r="3" fill={colors.glow} className="animate-pulse" stroke="none">
        <animate attributeName="opacity" values="1;0.4;1" dur="3s" repeatCount="indefinite" />
      </circle>
      
      <path d="M 0 0 L 100 0" stroke={colors.glow} strokeWidth="0.5" opacity="0">
        <animate attributeName="d" values="M 0 10 L 100 10; M 0 90 L 100 90" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.2;0" dur="4s" repeatCount="indefinite" />
      </path>
    </svg>
  );
};

// Typing Indicator
const TypingIndicator = ({ initialText }: { initialText: string }) => {
  const [text, setText] = useState(initialText);
  
  useEffect(() => {
    setText(initialText);
    if (initialText.includes('Drawing') || initialText.includes('Reading')) return;

    if (initialText === 'Thinking') {
        const timer = setTimeout(() => setText('Typing'), 3000);
        return () => clearTimeout(timer);
    }
  }, [initialText]);

  return (
    <div className="flex justify-start w-full animate-slide-up">
        <div className="bg-white/10 border border-white/10 px-4 py-3 md:px-5 md:py-4 rounded-3xl rounded-bl-none flex items-center gap-4 shadow-lg backdrop-blur-md">
            <span className="text-[9px] md:text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase min-w-[50px] md:min-w-[60px] animate-pulse whitespace-nowrap">{text.trim()}</span>
            <div className="flex gap-1.5">
                <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-white/70 animate-wave" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-white/70 animate-wave" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-white/70 animate-wave" style={{ animationDelay: '300ms' }}></div>
            </div>
        </div>
    </div>
  );
};

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const navLang = navigator.language.split('-')[0];
    const supported: Language[] = ['id', 'en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'ru', 'pt', 'ar', 'hi'];
    return supported.includes(navLang as Language) ? (navLang as Language) : 'en';
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Thinking');
  const [theme, setTheme] = useState<Theme>(Theme.PURPLE_BLUE);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPage, setSettingsPage] = useState<'general' | 'credits'>('general');

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  
  // LOGIN & ACCOUNT STATE
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [guestMsgCount, setGuestMsgCount] = useState(0);

  // AUTH STATE
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'delete'>('login');
  const [authInput, setAuthInput] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // LIMITS STATE
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [userMsgCount, setUserMsgCount] = useState<number>(0);
  const [imageLockoutTime, setImageLockoutTime] = useState<number | null>(null);
  const [userImageCount, setUserImageCount] = useState<number>(0);
  const [showLockoutModal, setShowLockoutModal] = useState(false);
  const [lockoutType, setLockoutType] = useState<'chat' | 'image' | 'guest'>('chat');

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectionModeId, setSelectionModeId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const langPack = getLanguagePack(language);
  const isRTL = language === 'ar';

  const lastUserMessageId = messages.slice().reverse().find(m => m.role === Role.USER)?.id;

  // --- AUTO LOGIN CHECK ON MOUNT & CROSS-TAB SYNC ---
  useEffect(() => {
    const checkLoginStatus = () => {
      const storedLogin = safeStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      const storedUsername = safeStorage.getItem(STORAGE_KEYS.USERNAME);
      if (storedLogin === 'true' && storedUsername) {
          setIsLoggedIn(true);
          setUsername(storedUsername);
      } else {
          setIsLoggedIn(false);
          setUsername(null);
      }
    };

    const now = Date.now();
    checkLoginStatus(); // Initial check

    // Load guest limit count
    const storedGuestCount = safeStorage.getItem(STORAGE_KEYS.GUEST_MSG_COUNT);
    setGuestMsgCount(storedGuestCount ? parseInt(storedGuestCount, 10) : 0);
    
    // Limits logic
    const storedLockout = safeStorage.getItem(STORAGE_KEYS.CHAT_LOCKOUT);
    const storedCount = safeStorage.getItem(STORAGE_KEYS.CHAT_COUNT);
    if (storedLockout) {
        let lockoutEnd = parseInt(storedLockout, 10);
        if (lockoutEnd > now + (24 * 60 * 60 * 1000)) lockoutEnd = 0; 
        if (now < lockoutEnd) {
            setLockoutTime(lockoutEnd);
            setUserMsgCount(MAX_MESSAGES_PER_SESSION);
        } else {
            safeStorage.removeItem(STORAGE_KEYS.CHAT_LOCKOUT);
            safeStorage.setItem(STORAGE_KEYS.CHAT_COUNT, '0');
            setUserMsgCount(0);
            setLockoutTime(null);
        }
    } else {
        setUserMsgCount(storedCount ? parseInt(storedCount, 10) : 0);
    }

    const storedImgLockout = safeStorage.getItem(STORAGE_KEYS.IMG_LOCKOUT);
    const storedImgCount = safeStorage.getItem(STORAGE_KEYS.IMG_COUNT);
    if (storedImgLockout) {
        let lockoutEnd = parseInt(storedImgLockout, 10);
        if (lockoutEnd > now + (24 * 60 * 60 * 1000)) lockoutEnd = 0;
        if (now < lockoutEnd) {
            setImageLockoutTime(lockoutEnd);
            setUserImageCount(MAX_IMAGES_PER_SESSION);
        } else {
            safeStorage.removeItem(STORAGE_KEYS.IMG_LOCKOUT);
            safeStorage.setItem(STORAGE_KEYS.IMG_COUNT, '0');
            setUserImageCount(0);
            setImageLockoutTime(null);
        }
    } else {
        setUserImageCount(storedImgCount ? parseInt(storedImgCount, 10) : 0);
    }

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.IS_LOGGED_IN || e.key === STORAGE_KEYS.USERNAME) {
        checkLoginStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, attachments, editingMessageId]); 

  // ... (File handling logic remains same) ...
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!isLoggedIn) {
        alert(langPack.premiumText);
        setShowLoginModal(true);
        return;
    }
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      const files = Array.from(e.clipboardData.files) as File[];
      processFiles(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    processFiles(files);
    e.target.value = ''; 
  };

  const processFiles = async (files: File[]) => {
      const validFiles = files.filter(file => {
        if (file.size > 8 * 1024 * 1024) { 
            alert(`File ${file.name} is too large. Max 8MB.`);
            return false;
        }
        return true;
    });
    try {
      const newAttachments: Attachment[] = await Promise.all(validFiles.map(async (file) => {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        const base64Data = base64.split(',')[1];
        let mimeType = file.type;
        if (!mimeType) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            switch (ext) {
            case 'md': mimeType = 'text/markdown'; break;
            case 'ts': case 'tsx': mimeType = 'text/plain'; break;
            case 'js': case 'jsx': mimeType = 'text/javascript'; break;
            case 'json': mimeType = 'application/json'; break;
            case 'csv': mimeType = 'text/csv'; break;
            case 'py': mimeType = 'text/x-python'; break;
            case 'html': mimeType = 'text/html'; break;
            case 'css': mimeType = 'text/css'; break;
            default: mimeType = 'text/plain';
            }
        }
        return { name: file.name, mimeType: mimeType, base64: base64Data };
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
      setShowAttachMenu(false);
    } catch (err) {
      console.error("Error reading file", err);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- INTERNAL AUTH SYSTEM ---

  const getUsersDB = () => {
      const db = safeStorage.getItem(STORAGE_KEYS.USERS_DB);
      return db ? JSON.parse(db) : {};
  };

  const saveUsersDB = (db: any) => {
      safeStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
  };
  
  // Detailed validation to show which specific rule is met
  const checkPasswordStrength = (pass: string) => {
    return [
      pass.length >= 8,                       // Min Length
      /[A-Z]/.test(pass),                     // Uppercase
      /[0-9]/.test(pass),                     // Number
      /[!@#$%^&*(),.?":{}|<>]/.test(pass)     // Symbol
    ];
  };

  const validatePassword = (pass: string) => {
      const checks = checkPasswordStrength(pass);
      return checks.every(Boolean);
  };

  const handleAuthSubmit = () => {
      setAuthError(null);
      setAuthSuccess(null);
      const users = getUsersDB();
      const { username: rawUser, password } = authInput;
      const user = rawUser.trim();

      if (!user) {
          setAuthError("Username required");
          return;
      }

      if (authMode === 'login') {
          if (!users[user]) {
              setAuthError(langPack.errorUserNotFound);
              return;
          }
          if (users[user].password !== password) {
              setAuthError(langPack.errorWrongPass);
              return;
          }
          // Login Success
          setIsLoggedIn(true);
          setUsername(user);
          safeStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
          safeStorage.setItem(STORAGE_KEYS.USERNAME, user);
          setShowLoginModal(false);
          setAuthInput({ username: '', password: '' });
          alert(`${langPack.welcomeBack} ${user}!`);
      } else if (authMode === 'signup') {
          if (users[user]) {
              setAuthError(langPack.errorUserExists);
              return;
          }
          if (!validatePassword(password)) {
              setAuthError(langPack.errorPassCriteria);
              return;
          }
          // Create User
          users[user] = {
              password: password, // In a real app, hash this.
              createdAt: Date.now()
          };
          saveUsersDB(users);
          
          // Auto Login
          setIsLoggedIn(true);
          setUsername(user);
          safeStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
          safeStorage.setItem(STORAGE_KEYS.USERNAME, user);
          setShowLoginModal(false);
          setAuthInput({ username: '', password: '' });
          alert(langPack.successCreated);
      } else if (authMode === 'delete') {
          if (!users[user]) {
             setAuthError(langPack.errorUserNotFound); 
             return;
          }
          // Delete
          delete users[user];
          saveUsersDB(users);
          setAuthSuccess(langPack.deleteSuccess);
          setAuthInput({ username: '', password: '' });
          if (isLoggedIn && username === user) {
             handleLogout();
          }
      }
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setUsername(null);
      safeStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
      safeStorage.removeItem(STORAGE_KEYS.USERNAME);
      setShowSettings(false);
  };

  // ... (handleSendMessage and other logic remains same) ...
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isLoading) return;

    const drawingKeywords = [
        'draw', 'paint', 'generate image', 'make a picture', 'create an image', 
        'create a picture', 'gambar', 'lukis', 'buat gambar', 'foto', 'photo', 'image', 'ilustrasi',
        'edit image', 'modify image', 'change image', 'regenerate', 're-generate', 
        'ubah gambar', 'ganti gambar', 'edit gambar'
    ];
    const isImageRequest = drawingKeywords.some(kw => inputValue.toLowerCase().includes(kw));
    const now = Date.now();

    if (!isLoggedIn) {
        if (guestMsgCount >= GUEST_MESSAGE_LIMIT) {
            setLockoutType('guest');
            setShowLockoutModal(true);
            return;
        }
        if (isImageRequest || attachments.length > 0) {
            setLockoutType('guest'); 
            alert(langPack.premiumText);
            setShowLoginModal(true);
            return;
        }
    }

    if (isLoggedIn) {
        if (lockoutTime && now < lockoutTime) {
            setLockoutType('chat');
            setShowLockoutModal(true);
            return;
        }
        if (isImageRequest) {
            if (imageLockoutTime && now < imageLockoutTime) {
                setLockoutType('image');
                setShowLockoutModal(true);
                return;
            }
            if (userImageCount >= MAX_IMAGES_PER_SESSION) {
                const newLockout = now + IMAGE_LOCKOUT_DURATION_MS;
                setImageLockoutTime(newLockout);
                safeStorage.setItem(STORAGE_KEYS.IMG_LOCKOUT, newLockout.toString());
                setLockoutType('image');
                setShowLockoutModal(true);
                return;
            }
        }
        if (userMsgCount >= MAX_MESSAGES_PER_SESSION) {
            const newLockout = now + LOCKOUT_DURATION_MS;
            setLockoutTime(newLockout);
            safeStorage.setItem(STORAGE_KEYS.CHAT_LOCKOUT, newLockout.toString());
            setLockoutType('chat');
            setShowLockoutModal(true);
            return;
        }
    }

    if (!isLoggedIn) {
        const newGuestCount = guestMsgCount + 1;
        setGuestMsgCount(newGuestCount);
        safeStorage.setItem(STORAGE_KEYS.GUEST_MSG_COUNT, newGuestCount.toString());
    } else {
        const newMsgCount = userMsgCount + 1;
        setUserMsgCount(newMsgCount);
        safeStorage.setItem(STORAGE_KEYS.CHAT_COUNT, newMsgCount.toString());
    }

    let status = 'Thinking';
    if (isImageRequest) status = 'Thinking ';

    if (attachments.length > 0) {
        const hasImage = attachments.some(a => a.mimeType.startsWith('image/'));
        const hasFile = attachments.some(a => !a.mimeType.startsWith('image/'));
        if (hasImage && hasFile) status = 'Analyzing & Reading';
        else if (hasImage) status = 'Analyzing';
        else if (hasFile) status = 'Reading';
    }
    setLoadingStatus(status);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: inputValue,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachments([]); 
    setIsLoading(true);

    const checkImageAccess = async (): Promise<boolean> => {
        if (!isLoggedIn) return false; 
        const now = Date.now();
        const storedImgLockout = safeStorage.getItem(STORAGE_KEYS.IMG_LOCKOUT);
        const storedImgCount = safeStorage.getItem(STORAGE_KEYS.IMG_COUNT);
        const currentCount = storedImgCount ? parseInt(storedImgCount, 10) : 0;
        if (storedImgLockout && now < parseInt(storedImgLockout, 10)) {
             setLockoutType('image');
             setShowLockoutModal(true);
             return false;
        }
        if (currentCount >= MAX_IMAGES_PER_SESSION) {
             const newLockout = now + IMAGE_LOCKOUT_DURATION_MS;
             setImageLockoutTime(newLockout);
             setLockoutType('image');
             setShowLockoutModal(true);
             safeStorage.setItem(STORAGE_KEYS.IMG_LOCKOUT, newLockout.toString());
             return false;
        }
        const newCount = currentCount + 1;
        setUserImageCount(newCount);
        safeStorage.setItem(STORAGE_KEYS.IMG_COUNT, newCount.toString());
        return true;
    };

    try {
      const { text, generatedAttachments } = await sendMessageToGemini(
        messages, 
        inputValue, 
        language, 
        userMsg.attachments,
        (newStatus) => setLoadingStatus(newStatus),
        checkImageAccess 
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: text,
        timestamp: Date.now(),
        attachments: generatedAttachments 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
        const errorMsg: Message = {
            id: Date.now().toString(),
            role: Role.MODEL,
            text: "⚠️ System Error: Something went wrong. Please try again.",
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditValue(msg.text);
    setSelectionModeId(null); 
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditValue('');
  };

  const handleSubmitEdit = async (originalMsgId: string) => {
    const msgIndex = messages.findIndex(m => m.id === originalMsgId);
    if (msgIndex === -1) return;
    const previousHistory = messages.slice(0, msgIndex);
    const oldMsg = messages[msgIndex];
    const newMsg: Message = {
        ...oldMsg,
        text: editValue,
        id: `edited-${Date.now()}`, 
        timestamp: Date.now()
    };
    setMessages([...previousHistory, newMsg]);
    setEditingMessageId(null);
    setIsLoading(true);
    setLoadingStatus('Regenerating');
    try {
        const { text, generatedAttachments } = await sendMessageToGemini(
            [...previousHistory, newMsg], 
            "", 
            language,
            undefined, 
            (s) => setLoadingStatus(s)
        );
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: Role.MODEL,
            text: text,
            timestamp: Date.now(),
            attachments: generatedAttachments
        };
        setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: Role.MODEL,
            text: "Error regenerating response.",
            timestamp: Date.now()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const clearChat = () => {
    setShowClearConfirm(false);
    setIsClearing(true);
    setTimeout(() => {
      setMessages([]);
      setIsClearing(false);
    }, 500);
  };

  const handleDownload = () => {
    if(!selectedImage) return;
    const link = document.createElement('a');
    link.href = selectedImage.url;
    link.download = selectedImage.name || 'image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
 };

 const handleCopyImage = async () => {
    if(!selectedImage) return;
    try {
      const response = await fetch(selectedImage.url);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      alert(langPack.copied); 
    } catch (err) {
      console.error('Failed to copy', err);
      alert("Clipboard copy not supported in this environment.");
    }
 };

 const handleCopyText = (id: string, text: string) => {
    try {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
        console.warn("Clipboard access denied");
    }
 };

 const toggleSelectionMode = (id: string) => {
    setSelectionModeId(prev => prev === id ? null : id);
 };

  const getThemeGradient = () => {
    switch (theme) {
      case Theme.GREEN: return 'from-green-900 via-emerald-950 to-black';
      case Theme.CYAN_BLUE: return 'from-cyan-900 via-blue-950 to-black';
      case Theme.RED_ORANGE: return 'from-red-900 via-orange-950 to-black';
      case Theme.PURPLE_BLUE: 
      default: return 'from-indigo-950 via-purple-950 to-black';
    }
  };
  
  // Dynamic Glass Colors for Auth Modal based on Theme
  // Made stronger (more opacity/blur) for the "liquid glass strong" feel
  const getGlassStyle = () => {
      switch (theme) {
        case Theme.GREEN: return 'border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.25)] bg-emerald-950/20';
        case Theme.CYAN_BLUE: return 'border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.25)] bg-cyan-950/20';
        case Theme.RED_ORANGE: return 'border-orange-500/30 shadow-[0_0_80px_rgba(249,115,22,0.25)] bg-orange-950/20';
        case Theme.PURPLE_BLUE: 
        default: return 'border-purple-500/30 shadow-[0_0_80px_rgba(168,85,247,0.25)] bg-[#0f0f1a]/20';
      }
  };
  
  const getButtonGradient = () => {
      switch (theme) {
        case Theme.GREEN: return 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40';
        case Theme.CYAN_BLUE: return 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/40';
        case Theme.RED_ORANGE: return 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/40';
        case Theme.PURPLE_BLUE: 
        default: return 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40';
      }
  };

  const getAccentColor = () => {
    switch (theme) {
      case Theme.GREEN: return 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
      case Theme.CYAN_BLUE: return 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]';
      case Theme.RED_ORANGE: return 'bg-orange-500 hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]';
      case Theme.PURPLE_BLUE: 
      default: return 'bg-purple-500 hover:bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]';
    }
  };

  const getTextGradient = () => {
    switch (theme) {
      case Theme.GREEN: return 'from-emerald-400 to-green-500';
      case Theme.CYAN_BLUE: return 'from-cyan-400 to-blue-500';
      case Theme.RED_ORANGE: return 'from-orange-400 to-red-500';
      case Theme.PURPLE_BLUE: 
      default: return 'from-indigo-400 to-purple-500';
    }
  };

  // ... (render content functions remain same) ...
  const processMathHTML = (text: string) => {
     let clean = text
        .replace(/\\times/g, '&times;')
        .replace(/\\cdot/g, '&middot;')
        .replace(/\\leq/g, '&le;')
        .replace(/\\geq/g, '&ge;')
        .replace(/\\neq/g, '&ne;')
        .replace(/\\approx/g, '&asymp;')
        .replace(/\\pi/g, 'π')
        .replace(/\\infty/g, '∞')
        .replace(/\\pm/g, '±')
        .replace(/\\theta/g, 'θ')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\gamma/g, 'γ')
        .replace(/\\sigma/g, 'σ')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\sqrt\{(.*?)\}/g, '√<span style="border-top:1px solid currentColor; padding-top:1px">$1</span>')
        .replace(/\^\{?([a-zA-Z0-9\+\-\(\)]+)\}?/g, '<sup>$1</sup>')
        .replace(/_\{?([a-zA-Z0-9\+\-\(\)]+)\}?/g, '<sub>$1</sub>');
     return clean;
  };
  const parseStyledText = (text: string) => {
    const codeParts = text.split(/(`[^`]+`)/g);
    return codeParts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return <code key={i} className="bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded-md font-mono text-sm border border-white/10 mx-0.5">{part.slice(1, -1)}</code>;
      }
      const mathParts = part.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);
      return (
        <React.Fragment key={i}>
            {mathParts.map((subPart, j) => {
                if (subPart.startsWith('$$') && subPart.endsWith('$$') && subPart.length > 4) {
                    const mathContent = subPart.slice(2, -2);
                    return <span key={j} className="font-serif italic text-emerald-400 px-1" dangerouslySetInnerHTML={{__html: processMathHTML(mathContent)}} />;
                } else if (subPart.startsWith('$') && subPart.endsWith('$') && subPart.length > 2) {
                    const mathContent = subPart.slice(1, -1);
                    return <span key={j} className="font-serif italic text-blue-200 px-1" dangerouslySetInnerHTML={{__html: processMathHTML(mathContent)}} />;
                }
                return <React.Fragment key={j}>{parseRecursiveStyles(subPart)}</React.Fragment>;
            })}
        </React.Fragment>
      );
    });
  };

  // Helper to detect links and raw URLs
  const parseLinks = (text: string): React.ReactNode[] => {
      // Regex detects: [markdown](link) OR raw urls like https://...
      // 1. Markdown Links: \[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)
      // 2. Raw URLs: (\bhttps?:\/\/[^\s]+)
      const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^\s\)]+\)|(?<!\()https?:\/\/[^\s]+(?!\)))/g);
      
      return parts.map((chunk, i) => {
          // Check Markdown Link
          const mdMatch = chunk.match(/^\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)$/);
          if (mdMatch) {
              return (
                  <a key={i} href={mdMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 underline-offset-2 transition-all drop-shadow-[0_0_5px_rgba(59,130,246,0.8)] inline-flex items-center gap-0.5">
                      {mdMatch[1]} <ExternalLink size={10} className="inline opacity-70" />
                  </a>
              );
          }
          // Check Raw URL
          const urlMatch = chunk.match(/^(https?:\/\/[^\s]+)$/);
          if (urlMatch) {
              return (
                  <a key={i} href={urlMatch[1]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 underline-offset-2 transition-all drop-shadow-[0_0_5px_rgba(59,130,246,0.8)] break-all">
                      {urlMatch[1]}
                  </a>
              );
          }
          return chunk;
      });
  };

  const parseRecursiveStyles = (text: string): React.ReactNode[] => {
      // First split by links, then process bold/italic inside the text chunks
      const linkParts = parseLinks(text);
      
      return linkParts.map((linkPart, lpIdx) => {
          if (typeof linkPart !== 'string') return <React.Fragment key={lpIdx}>{linkPart}</React.Fragment>;

          const parts = linkPart.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);
          return (
            <React.Fragment key={lpIdx}>
                {parts.map((chunk, i) => {
                    if (chunk.startsWith('***') && chunk.endsWith('***')) return <strong key={i} className="font-bold italic text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{chunk.slice(3,-3)}</strong>;
                    if (chunk.startsWith('**') && chunk.endsWith('**')) return <strong key={i} className="font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{chunk.slice(2,-2)}</strong>;
                    if (chunk.startsWith('*') && chunk.endsWith('*')) return <em key={i} className="italic text-white/90">{chunk.slice(1,-1)}</em>;
                    return chunk;
                })}
            </React.Fragment>
          );
      });
  };
  const renderTable = (lines: string[], keyPrefix: string) => {
    const rows = lines.map(line => 
        line.split('|')
            .map(cell => cell.trim())
            .filter((cell, index, arr) => {
                 return !(index === 0 && cell === '') && !(index === arr.length - 1 && cell === '');
            })
    );
    if (rows.length === 0) return null;
    let headerRow: string[] = [];
    let bodyRows: string[][] = rows;
    let alignments: ('left' | 'center' | 'right')[] = [];
    if (rows.length >= 2 && rows[1].some(c => c.replace(/[\s-:]/g, '') === '')) {
       headerRow = rows[0];
       const separatorRow = rows[1];
       alignments = separatorRow.map(cell => {
           if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
           if (cell.endsWith(':')) return 'right';
           return 'left';
       });
       bodyRows = rows.slice(2);
    }
    const maxCols = Math.max(headerRow.length, ...bodyRows.map(r => r.length));
    const padRow = (row: string[]) => {
        const padded = [...row];
        while (padded.length < maxCols) padded.push('');
        return padded;
    };
    const finalHeader = headerRow.length > 0 ? padRow(headerRow) : [];
    const finalBody = bodyRows.map(padRow);
    return (
        <div key={keyPrefix} className="my-3 block w-full overflow-x-auto rounded-xl border border-white/20 bg-white/5 shadow-lg">
            <table className="w-full border-collapse text-sm min-w-[400px]">
                {finalHeader.length > 0 && (
                    <thead>
                        <tr className="bg-white/10 border-b border-white/10">
                            {finalHeader.map((cell, idx) => (
                                <th key={idx} className={`px-4 py-3 font-semibold text-white text-${alignments[idx] || 'left'}`}>
                                    {parseStyledText(cell)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {finalBody.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-white/5 hover:bg-white/5 transition-colors last:border-0">
                            {row.map((cell, cIdx) => (
                                <td key={cIdx} className={`px-4 py-2 text-white/90 align-top text-${alignments[cIdx] || 'left'}`}>
                                    {parseStyledText(cell)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  };
  const renderBlockContent = (text: string) => {
    const lines = text.split('\n');
    const blocks: React.ReactNode[] = [];
    let currentType: 'text' | 'table' | 'list' = 'text';
    let buffer: string[] = [];
    const flushBuffer = () => {
        if (buffer.length === 0) return;
        if (currentType === 'table') {
            blocks.push(renderTable(buffer, `blk-${Math.random()}`));
        } else if (currentType === 'list') {
            blocks.push(
              <ul key={`list-${Math.random()}`} className="list-disc pl-6 space-y-1 mb-2 text-white/90">
                {buffer.map((item, idx) => (
                  <li key={idx} className="pl-1 leading-relaxed">
                    {parseStyledText(item.replace(/^[\*\-]\s+/, ''))}
                  </li>
                ))}
              </ul>
            );
        } else {
            const content = buffer.join('\n');
            blocks.push(
                <div key={`blk-${Math.random()}`} className="whitespace-pre-wrap break-words mb-2 w-full">
                    {parseStyledText(content)}
                </div>
            );
        }
        buffer = [];
    };
    lines.forEach((line) => {
        const trimmed = line.trim();
        const isTableLine = trimmed.startsWith('|') && trimmed.endsWith('|');
        const isHeaderLine = trimmed.startsWith('### ');
        const isListLine = trimmed.startsWith('* ') || trimmed.startsWith('- ');
        if (isTableLine) {
            if (currentType !== 'table') { flushBuffer(); currentType = 'table'; }
            buffer.push(line);
        } else if (isListLine) {
            if (currentType !== 'list') { flushBuffer(); currentType = 'list'; }
            buffer.push(line);
        } else if (isHeaderLine) {
            flushBuffer();
            blocks.push(
                <h3 key={`h3-${Math.random()}`} className="text-2xl font-bold text-white mt-6 mb-3 drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] border-b border-white/10 pb-2 inline-block">
                    {parseStyledText(trimmed.replace(/^###\s+/, ''))}
                </h3>
            );
            currentType = 'text'; 
        } else {
            if (trimmed === '' && (currentType === 'table' || currentType === 'list')) {
                flushBuffer();
                currentType = 'text';
            } else if (currentType !== 'text') {
                flushBuffer();
                currentType = 'text';
                buffer.push(line);
            } else {
                buffer.push(line);
            }
        }
    });
    flushBuffer();
    return blocks;
  };
  const renderMessageContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3);
        const newLineIndex = content.indexOf('\n');
        const lang = newLineIndex !== -1 ? content.slice(0, newLineIndex).trim() : '';
        const code = newLineIndex !== -1 ? content.slice(newLineIndex + 1) : content;
        return <CodeBlock key={index} language={lang} value={code} currentLanguage={language} />;
      }
      return <div key={index} className="w-full">{renderBlockContent(part)}</div>;
    });
  };
  
  // Calculate password strength state for UI
  const passwordStrength = checkPasswordStrength(authInput.password);

  // Tab switch logic for animations
  const handleTabChange = (page: 'general' | 'credits') => {
      // Determine direction logic could be here if needed, but for 2 tabs, generic slide works.
      setSettingsPage(page);
  };

  return (
    <div className={`relative w-full h-[100dvh] overflow-hidden bg-gradient-to-br ${getThemeGradient()} text-white transition-all duration-1000 ease-in-out font-[Outfit]`}>
      <StarBackground />
      <Tooltip />
      
      <input type="file" ref={imageInputRef} accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
      <input type="file" ref={fileInputRef} accept=".pdf,.txt,.js,.ts,.html,.css,.json,.md,.csv" multiple className="hidden" onChange={handleFileSelect} />

      {/* FIXED POSITION BUTTONS - CONFIRMING TRASH IS HERE */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50 flex gap-3 md:gap-4 pointer-events-auto">
        <button 
          onClick={() => setShowClearConfirm(true)}
          className="p-2.5 md:p-3 rounded-full liquid-glass liquid-glass-interactive hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-300 text-white/80 hover:text-red-400 shadow-lg hover:shadow-red-500/20"
          data-tooltip={langPack.clearChat}
        >
          <Trash2 size={18} className="md:w-5 md:h-5" />
        </button>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2.5 md:p-3 rounded-full liquid-glass liquid-glass-interactive hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-300 text-white/80 hover:text-white shadow-lg relative"
          data-tooltip={langPack.settings}
        >
          {isLoggedIn && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0f0f1a]"></div>}
          <Settings size={18} className="md:w-5 md:h-5" />
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-2 md:p-4 lg:p-8">
        
        <div className="mb-4 md:mb-8 text-center animate-slide-up mt-8 md:mt-0" style={{ animationDelay: '0ms' }}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">
            xDustAI
          </h1>
          <div className="h-1 w-16 md:w-24 mx-auto mt-2 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full blur-[1px]"></div>
          {isLoggedIn ? (
              <div className="mt-2 text-xs md:text-sm text-green-300/80 font-mono tracking-wide flex items-center justify-center gap-1"><ShieldCheck size={12}/> {username}</div>
          ) : (
              <div className="mt-2 text-xs md:text-sm text-white/40 font-mono tracking-wide">{guestMsgCount}/{GUEST_MESSAGE_LIMIT} Free Messages</div>
          )}
        </div>

        <div className="w-full max-w-4xl h-[80dvh] md:h-[75vh] liquid-glass rounded-2xl md:rounded-[2.5rem] flex flex-col overflow-hidden relative shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)]">
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="animate-float mb-6 md:mb-8 relative">
                   <div className={`absolute inset-0 opacity-10 blur-[50px] rounded-full animate-pulse transition-colors duration-1000 ${theme === Theme.GREEN ? 'bg-emerald-500' : theme === Theme.CYAN_BLUE ? 'bg-cyan-500' : theme === Theme.RED_ORANGE ? 'bg-orange-500' : 'bg-purple-500'}`}></div>
                   <XDustLogo theme={theme} />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-light text-white/90 animate-slide-up" style={{ animationDelay: '200ms' }}>
                  {langPack.greeting}
                </h2>
              </div>
            ) : (
              <div className={`space-y-6 md:space-y-8 ${isClearing ? 'animate-exit' : ''}`}>
                {messages.map((msg, index) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col w-full ${msg.role === Role.USER ? 'items-end' : 'items-start'} gap-2 animate-slide-up`}
                    style={{ animationDuration: '0.4s' }}
                  >
                    
                    {editingMessageId === msg.id ? (
                        <div className="w-full max-w-[95%] md:max-w-[85%] lg:max-w-[75%] animate-pop-bounce flex flex-col gap-3">
                             <div className="liquid-glass p-1 rounded-3xl backdrop-blur-xl">
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full bg-transparent border-none p-4 text-white text-[15px] focus:outline-none min-h-[80px] resize-none leading-relaxed"
                                    autoFocus
                                />
                             </div>
                             <div className="flex justify-end gap-2">
                                <button onClick={handleCancelEdit} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"><X size={20} /></button>
                                <button onClick={() => handleSubmitEdit(msg.id)} className={`liquid-glass px-6 py-3 rounded-full flex items-center gap-2 text-white font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all ${getAccentColor().replace('shadow-', '')}`}><span className="text-sm">Update</span><Send size={16} /></button>
                             </div>
                        </div>
                    ) : (
                        <>
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className={`flex flex-wrap gap-2 max-w-[100%] ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                                    {msg.attachments.map((att, i) => (
                                        <div key={i} className="transition-transform hover:scale-[1.02]">
                                            {att.mimeType.startsWith('image/') ? (
                                                <img src={`data:${att.mimeType};base64,${att.base64}`} alt="attachment" onClick={() => setSelectedImage({url: `data:${att.mimeType};base64,${att.base64}`, name: att.name})} className="max-h-[200px] md:max-h-[300px] max-w-full rounded-2xl border border-white/20 shadow-lg object-contain bg-black/20 cursor-pointer" />
                                            ) : (
                                                <div className={`flex items-center gap-3 p-3 md:p-4 rounded-2xl border backdrop-blur-md shadow-lg ${msg.role === Role.USER ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/80'}`}>
                                                    <div className="p-2 bg-white/10 rounded-lg"><FileText size={20} className="md:w-6 md:h-6" /></div>
                                                    <div className="flex flex-col overflow-hidden max-w-[150px] md:max-w-[200px]"><span className="text-xs md:text-sm font-medium truncate">{att.name}</span><span className="text-[9px] md:text-[10px] uppercase opacity-50">{att.mimeType.split('/')[1] || 'FILE'}</span></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {msg.text && (
                                <div className={`flex flex-col gap-1 w-fit max-w-[92%] md:max-w-[80%] lg:max-w-[70%] relative group ${msg.role === Role.USER ? 'items-end' : 'items-start'} min-w-0`}>
                                    {/* SPECIAL WARNING MESSAGE STYLING */}
                                    {msg.text.startsWith('⚠️') ? (
                                        <div className="bg-orange-500/10 border border-orange-500/30 text-orange-200 px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl backdrop-blur-md flex items-center gap-3 shadow-lg">
                                            <AlertTriangle size={24} className="shrink-0 text-orange-400 animate-pulse" />
                                            <span className="text-sm md:text-base font-medium leading-relaxed">{msg.text.replace('⚠️', '').trim()}</span>
                                        </div>
                                    ) : (
                                        <div dir={isRTL && msg.role === Role.MODEL ? 'rtl' : 'ltr'} className={`relative px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl backdrop-blur-md shadow-lg transition-all hover:scale-[1.01] duration-300 w-full overflow-hidden ${msg.role === Role.USER ? `${getAccentColor()} text-white rounded-br-none font-semibold border border-white/20` : 'bg-white/10 border border-white/10 text-gray-100 rounded-bl-none hover:bg-white/15 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]'} ${selectionModeId === msg.id ? 'select-text cursor-text ring-2 ring-blue-400/50' : 'select-none'}`}>
                                        {msg.role === Role.MODEL && (<div className="absolute -top-5 md:-top-6 left-0 text-[10px] md:text-xs text-white/30 flex items-center gap-1 mb-1 ml-2"><Sparkles size={10} className="md:w-3 md:h-3 text-blue-300" /> AI</div>)}
                                        <div className="text-[14px] md:text-[15px] leading-relaxed tracking-wide break-words w-full">{renderMessageContent(msg.text)}</div>
                                        </div>
                                    )}
                                    
                                    {!msg.text.startsWith('⚠️') && (
                                        <div className={`flex items-center gap-2 px-2 mt-1 ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === Role.USER ? (
                                                <>
                                                    {msg.id === lastUserMessageId && (<button onClick={() => handleStartEdit(msg)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" data-tooltip={langPack.edit}><Pencil size={12} className="md:w-3.5 md:h-3.5" /></button>)}
                                                    <button onClick={() => handleCopyText(msg.id, msg.text)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors flex items-center gap-1" data-tooltip={langPack.copy}>{copiedMessageId === msg.id ? <Check size={12} className="md:w-3.5 md:h-3.5 text-green-400"/> : <Copy size={12} className="md:w-3.5 md:h-3.5" />}</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => toggleSelectionMode(msg.id)} className={`p-1.5 rounded-lg transition-colors ${selectionModeId === msg.id ? 'bg-white/30 text-white' : 'hover:bg-white/10 text-white/40 hover:text-white'}`} data-tooltip={langPack.selectText}><MousePointer2 size={12} className="md:w-3.5 md:h-3.5" /></button>
                                                    <button onClick={() => handleCopyText(msg.id, msg.text)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" data-tooltip={langPack.copy}>{copiedMessageId === msg.id ? <Check size={12} className="md:w-3.5 md:h-3.5 text-green-400"/> : <Copy size={12} className="md:w-3.5 md:h-3.5" />}</button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                  </div>
                ))}

                {isLoading && (
                   <div className="flex flex-col items-start gap-2 w-full animate-slide-up">
                        <div className="flex items-center gap-2 mb-1 ml-2"><Sparkles size={12} className="text-blue-300 animate-pulse" /> <span className="text-xs text-blue-200/50 font-medium">xDustAI</span></div>
                        <TypingIndicator initialText={loadingStatus} />
                   </div>
                )}
                
                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 md:p-5 bg-gradient-to-t from-black/50 via-black/20 to-transparent backdrop-blur-sm border-t border-white/5 relative">
            
            {/* Attachment Previews */}
            {attachments.length > 0 && (
                <div className="flex gap-4 mb-3 overflow-x-auto pb-2 pt-2 px-1 custom-scrollbar">
                    {attachments.map((att, index) => (
                        <div key={index} className="relative group shrink-0 animate-pop-bounce">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl border border-white/20 bg-white/10 overflow-hidden flex items-center justify-center relative">
                                {att.mimeType.startsWith('image/') ? (
                                    <img src={`data:${att.mimeType};base64,${att.base64}`} alt={att.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <FileText className="text-white/60" size={20} />
                                )}
                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                            </div>
                            <button 
                                onClick={() => removeAttachment(index)} 
                                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-red-500/80 hover:border-red-500 transition-all shadow-lg z-10 flex items-center justify-center"
                                data-tooltip={langPack.remove}
                            >
                                <X size={10} strokeWidth={2.5} />
                            </button>
                            <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white/90 truncate text-center z-10 pointer-events-none font-medium drop-shadow-md">{att.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {showAttachMenu && (
              <div ref={attachMenuRef} className="absolute bottom-full left-3 md:left-5 mb-4 bg-[#0f0f12]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] z-50 animate-pop-bounce flex flex-col gap-1 min-w-[160px]">
                 <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all group text-left"><div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform"><ImageIcon size={18} /></div><span className="text-sm font-medium">{langPack.photos}</span></button>
                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all group text-left"><div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform"><FileText size={18} /></div><span className="text-sm font-medium">{langPack.files}</span></button>
              </div>
            )}

            <div className="flex gap-2 md:gap-3 items-end">
              <button 
                onClick={() => {
                    if (!isLoggedIn) {
                        alert(langPack.premiumText);
                        setShowLoginModal(true);
                    } else {
                        setShowAttachMenu(!showAttachMenu);
                    }
                }} 
                disabled={!!lockoutTime && lockoutType === 'chat' && isLoggedIn} 
                className={`p-3 md:p-4 rounded-2xl flex items-center justify-center shrink-0 border transition-bouncy ${showAttachMenu ? 'bg-white/20 text-white border-white/80 scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95'} ${!isLoggedIn ? 'opacity-50' : ''}`} 
                data-tooltip={langPack.attach}
              >
                  {!isLoggedIn ? <Lock size={20} /> : <Paperclip size={20} className="md:w-[22px] md:h-[22px] transition-transform duration-300" />}
              </button>
              
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl focus-within:bg-white/10 focus-within:border-white/30 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300">
                <textarea 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSendMessage();}}} 
                    onPaste={handlePaste} 
                    placeholder={langPack.placeholder} 
                    dir={isRTL ? 'rtl' : 'ltr'} 
                    className="w-full bg-transparent border-none py-3 md:py-4 px-4 text-white placeholder-white/30 focus:outline-none focus:ring-0 font-light text-base md:text-lg min-h-[50px] md:min-h-[60px] max-h-[120px] md:max-h-[150px] resize-none disabled:cursor-not-allowed"
                    rows={1} 
                />
              </div>
              <button onClick={handleSendMessage} disabled={(!inputValue.trim() && attachments.length === 0) || isLoading} className={`p-3 md:p-4 rounded-2xl transition-all duration-300 shadow-xl flex items-center justify-center shrink-0 border border-white/10 ${(!inputValue.trim() && attachments.length === 0) || isLoading ? 'bg-white/5 text-white/20 cursor-not-allowed' : `${getAccentColor()} text-white transform hover:scale-110 active:scale-95 active:rotate-12`}`} data-tooltip={langPack.send}>{isLoading ? <RefreshCw size={20} className="md:w-6 md:h-6 animate-spin" /> : <Send size={20} className="md:w-6 md:h-6" strokeWidth={2.5} />}</button>
            </div>
          </div>
        </div>
      </div>

      {/* --- IMAGE VIEWER MODAL (NEW) --- */}
      {selectedImage && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in">
            {/* Image Container with Constraints */}
            <div className="relative w-full h-full flex flex-col items-center justify-center">
                <div className="relative group max-w-full max-h-[80vh] flex items-center justify-center">
                    <img 
                        src={selectedImage.url} 
                        alt={selectedImage.name} 
                        className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 animate-zoom-in" 
                    />
                </div>
                
                {/* Controls Bar with Ultra Glass Effect */}
                <div className="mt-8 flex items-center gap-6 animate-slide-up">
                    <button 
                        onClick={() => setSelectedImage(null)} 
                        className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all backdrop-blur-3xl border border-white/20 hover:border-white/40 hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] group"
                        data-tooltip="Close"
                    >
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                    
                    <button 
                        onClick={handleDownload} 
                        className="p-4 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-blue-100 transition-all backdrop-blur-3xl border border-blue-400/20 hover:border-blue-400/40 hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                        data-tooltip="Download"
                    >
                        <Download size={24} />
                    </button>
                    
                    <button 
                        onClick={handleCopyImage} 
                        className="p-4 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-100 transition-all backdrop-blur-3xl border border-emerald-400/20 hover:border-emerald-400/40 hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                        data-tooltip="Copy"
                    >
                        <Copy size={24} />
                    </button>
                </div>
                
                <span className="mt-4 text-white/40 text-sm font-mono tracking-widest uppercase animate-pulse">{selectedImage.name}</span>
            </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* INTERNAL AUTHENTICATION MODAL */}
      {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
              <div className={`w-full max-w-sm rounded-3xl p-8 text-center animate-pop-bounce relative overflow-hidden backdrop-blur-3xl border border-opacity-30 ${getGlassStyle()}`}>
                   <button onClick={() => { setShowLoginModal(false); setAuthError(null); setAuthSuccess(null); setAuthInput({ username: '', password: '' }); }} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"><X size={20} /></button>
                   
                   <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 ring-1 ring-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] relative group">
                        {/* Glow effect for icon */}
                        <div className="absolute inset-0 rounded-full bg-white/5 blur-xl group-hover:bg-white/10 transition-colors"></div>
                        {authMode === 'delete' ? <Trash2 size={32} className="text-red-500 relative z-10" /> : <Lock size={32} className="text-white/80 relative z-10" />}
                   </div>
                   
                   <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                       {authMode === 'login' ? langPack.loginTitle : authMode === 'signup' ? langPack.signupTitle : langPack.deleteAccountTitle}
                   </h3>

                   {/* Error/Success Messages */}
                   {authError && (
                       <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-xs flex items-center gap-2 justify-center animate-shake">
                           <AlertTriangle size={14} /> {authError}
                       </div>
                   )}
                   {authSuccess && (
                       <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-200 text-xs flex items-center gap-2 justify-center">
                           <Check size={14} /> {authSuccess}
                       </div>
                   )}

                   {/* INPUT FORM */}
                   <div className="flex flex-col gap-4 mt-6">
                       {authMode === 'delete' && <p className="text-white/60 text-sm mb-2">{langPack.deleteInstruction}</p>}
                       
                       <div className="relative group">
                           <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/80 transition-colors" />
                           <input 
                                type="text" 
                                value={authInput.username}
                                onChange={(e) => setAuthInput({...authInput, username: e.target.value})}
                                placeholder={langPack.usernamePlaceholder}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300 shadow-inner"
                                autoFocus
                           />
                       </div>

                       {(authMode === 'login' || authMode === 'signup') && (
                           <>
                               <div className="relative group">
                                   <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/80 transition-colors" />
                                   <input 
                                        type={showPassword ? "text" : "password"}
                                        value={authInput.password}
                                        onChange={(e) => setAuthInput({...authInput, password: e.target.value})}
                                        placeholder={langPack.passwordPlaceholder}
                                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300 shadow-inner"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAuthSubmit()}
                                   />
                                   <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors p-1">
                                       {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                   </button>
                               </div>

                               {/* PASSWORD STRENGTH VISUALIZER (Only for Signup) */}
                               {authMode === 'signup' && (
                                   <div className="mt-1 grid grid-cols-4 gap-2">
                                       {passwordStrength.map((isValid, index) => (
                                           <div key={index} className="flex flex-col gap-1 items-center">
                                                <div className={`w-full h-1.5 rounded-full transition-all duration-500 ease-out ${isValid ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'bg-white/10'}`} />
                                                <span className={`text-[9px] uppercase tracking-wide font-bold transition-colors duration-300 ${isValid ? 'text-emerald-400' : 'text-white/20'}`}>
                                                    {langPack.passwordRules[index]}
                                                </span>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </>
                       )}

                       <button 
                            onClick={handleAuthSubmit}
                            className={`w-full py-3.5 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg mt-2 transform hover:scale-[1.02] active:scale-95 ${authMode === 'delete' ? 'bg-red-600 hover:bg-red-500 shadow-red-900/30' : getButtonGradient()}`}
                       >
                           {authMode === 'login' ? langPack.loginAction : authMode === 'signup' ? langPack.signupAction : langPack.deleteAction}
                       </button>

                       {/* Switch Modes */}
                       <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                           {authMode !== 'delete' ? (
                               <button 
                                    onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(null); setAuthInput({username:'', password:''}); }}
                                    className="text-xs text-white/50 hover:text-white transition-colors"
                                >
                                    {authMode === 'login' ? langPack.switchSignup : langPack.switchLogin}
                                </button>
                           ) : (
                                <button onClick={() => { setAuthMode('login'); setAuthError(null); }} className="text-xs text-white/50 hover:text-white transition-colors">Cancel</button>
                           )}
                       </div>
                   </div>
              </div>
          </div>
      )}

      {/* CLEAR CHAT CONFIRMATION MODAL (High Quality Liquid Glass Redesign) */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="w-full max-w-sm bg-black/20 backdrop-blur-3xl border border-red-500/30 rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(220,38,38,0.2)] animate-pop-bounce relative overflow-hidden ring-1 ring-white/5">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
              <div className="absolute inset-0 bg-red-500/5 blur-3xl pointer-events-none"></div>
              <div className="relative z-10">
                 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-transparent flex items-center justify-center mx-auto mb-6 text-red-400 ring-1 ring-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.3)] backdrop-blur-md">
                    <Trash2 size={36} strokeWidth={1.5} className="drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">{langPack.clearConfirmTitle}</h3>
                 <p className="text-white/70 mb-8 text-sm leading-relaxed font-light">{langPack.clearConfirmText}</p>
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowClearConfirm(false)} className="py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-medium transition-all backdrop-blur-sm border border-white/5 hover:border-white/10">{langPack.no}</button>
                    <button onClick={clearChat} className="py-3.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-200 font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-red-500/40 backdrop-blur-md border border-red-500/50 hover:scale-[1.02] active:scale-95">{langPack.yes}</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* LOCKOUT MODAL (High Quality Liquid Glass Orange Redesign) */}
      {showLockoutModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="w-full max-w-sm bg-black/20 backdrop-blur-3xl border border-orange-500/30 rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(249,115,22,0.2)] animate-pop-bounce relative overflow-hidden ring-1 ring-white/5">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
              <div className="absolute inset-0 bg-orange-500/5 blur-3xl pointer-events-none"></div>
              <div className="relative z-10">
                 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent flex items-center justify-center mx-auto mb-6 text-orange-400 ring-1 ring-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.3)] backdrop-blur-md">
                    <AlertTriangle size={36} strokeWidth={1.5} className="drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                 </div>
                 
                 {lockoutType === 'guest' ? (
                     <>
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">{langPack.guestLimitTitle}</h3>
                        <p className="text-white/70 mb-8 text-sm leading-relaxed font-light">{langPack.guestLimitText}</p>
                        <button onClick={() => {setShowLockoutModal(false); setAuthMode('login'); setShowLoginModal(true);}} className="w-full py-4 rounded-xl bg-blue-600/80 hover:bg-blue-500/90 text-white font-bold transition-all shadow-lg backdrop-blur-md border border-blue-500/30 hover:shadow-blue-500/40">{langPack.loginBtn}</button>
                     </>
                 ) : (
                     <>
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">
                            {lockoutType === 'chat' ? langPack.limitReachedTitle : langPack.imageLimitTitle}
                        </h3>
                        <p className="text-white/70 mb-8 text-sm leading-relaxed font-light">
                            {lockoutType === 'chat' ? langPack.limitReachedText : langPack.imageLimitText}
                        </p>
                        <div className="flex flex-col items-center gap-2 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <span className="text-xs uppercase tracking-widest text-white/40 font-bold">{langPack.tryAgainAt}</span>
                            <div className="flex items-center gap-2 text-2xl font-mono text-orange-400 drop-shadow-md">
                                <Clock size={20} />
                                <span>
                                    {new Date(lockoutType === 'chat' ? (lockoutTime || 0) : (imageLockoutTime || 0)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setShowLockoutModal(false)} className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/5 hover:border-white/10 backdrop-blur-sm">Okay</button>
                     </>
                 )}
              </div>
           </div>
        </div>
      )}

      {showSettings && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md bg-black/20 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)] relative overflow-hidden animate-slide-up ring-1 ring-white/5">
               {/* Close Button with enhanced glass effect */}
               <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/50 hover:text-white transition-all z-20 backdrop-blur-md shadow-lg group"><X size={18} className="group-hover:rotate-90 transition-transform" /></button>
               
               {/* SETTINGS CAPSULE TABS */}
               <div className="flex p-1.5 bg-black/40 backdrop-blur-xl rounded-2xl mb-8 border border-white/10 relative z-10 shadow-inner">
                   <button 
                     onClick={() => setSettingsPage('general')} 
                     className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${settingsPage === 'general' ? 'text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-white/10 bg-white/10' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                   >
                       {/* Active glow background */}
                       {settingsPage === 'general' && <div className="absolute inset-0 bg-blue-500/10 blur-md"></div>}
                       <span className="relative z-10">{langPack.general}</span>
                   </button>
                   <button 
                     onClick={() => setSettingsPage('credits')} 
                     className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${settingsPage === 'credits' ? 'text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-white/10 bg-white/10' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                   >
                        {/* Active glow background */}
                        {settingsPage === 'credits' && <div className="absolute inset-0 bg-purple-500/10 blur-md"></div>}
                       <span className="relative z-10">{langPack.credits}</span>
                   </button>
               </div>
               
               {/* CONTENT AREA WITH SLIDE TRANSITIONS - Added min-h to prevent layout jump and clipping */}
               <div key={settingsPage} className={`min-h-[380px] ${settingsPage === 'general' ? 'animate-slide-in-left' : 'animate-slide-in-right'}`}>
                   {settingsPage === 'general' ? (
                       <div>
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Settings className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" /> {langPack.settings}</h2>
                            
                            {/* ACCOUNT SECTION IN SETTINGS */}
                            <div className="mb-6 p-1 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 shadow-lg relative overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
                                <div className="relative p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2"><User size={12}/> Account</span>
                                        {isLoggedIn && <span className="text-[9px] px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 font-mono border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.2)]">ACTIVE</span>}
                                    </div>
                                    {isLoggedIn ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3 text-white font-mono text-sm bg-black/20 p-2 rounded-lg border border-white/5"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> {username}</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={handleLogout} className="py-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-white/70 hover:text-red-400 text-xs font-bold transition-all border border-white/5 hover:border-red-500/30 flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]"><X size={14} /> {langPack.logout}</button>
                                                <button onClick={() => { setShowSettings(false); setAuthMode('delete'); setShowLoginModal(true); setAuthError(null); }} className="py-2.5 rounded-xl bg-red-900/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-red-500/10 hover:border-red-500/20"><UserMinus size={14} /> Delete</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <p className="text-xs text-white/60 mb-1 pl-1">{langPack.guestLimitText}</p>
                                            <button onClick={() => {setShowSettings(false); setAuthMode('login'); setShowLoginModal(true);}} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-900/30 text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-95"><LogIn size={14} /> {langPack.loginBtn}</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 block ml-1">{langPack.theme}</label>
                                <div className="grid grid-cols-4 gap-3 bg-black/20 p-2 rounded-2xl border border-white/5">
                                {[Theme.PURPLE_BLUE, Theme.GREEN, Theme.CYAN_BLUE, Theme.RED_ORANGE].map((t) => (
                                    <button key={t} onClick={() => setTheme(t)} className={`h-10 rounded-xl transition-all duration-300 relative overflow-hidden group ${theme === t ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f1a] scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'hover:scale-105 opacity-60 hover:opacity-100'}`}>
                                    <div className="absolute inset-0" style={{background: t === Theme.GREEN ? 'linear-gradient(135deg, #10b981, #059669)' : t === Theme.CYAN_BLUE ? 'linear-gradient(135deg, #06b6d4, #2563eb)' : t === Theme.RED_ORANGE ? 'linear-gradient(135deg, #f97316, #dc2626)' : 'linear-gradient(135deg, #a855f7, #7c3aed)'}} />
                                    </button>
                                ))}
                                </div>
                            </div>
                            <div className="mb-8 relative" ref={langMenuRef}>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 block ml-1">{langPack.language}</label>
                                <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="w-full flex items-center justify-between px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all group shadow-sm">
                                    <span className="flex items-center gap-3"><div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform"><Globe size={16} /></div><span className="font-medium">{getLanguageName(language)}</span></span>
                                    <ChevronDown size={16} className={`text-white/50 transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isLangMenuOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#0f0f12]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-60 overflow-y-auto z-20 animate-pop-bounce custom-scrollbar ring-1 ring-white/5">
                                    {['id', 'en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'ru', 'pt', 'ar', 'hi'].map((langCode) => (
                                        <button key={langCode} onClick={() => { setLanguage(langCode as Language); setIsLangMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-white/5 last:border-0 ${language === langCode ? 'text-blue-400 bg-blue-500/10 font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>{getLanguageName(langCode as Language)}</button>
                                    ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center gap-5">
                                <div className="flex flex-col items-center gap-4 group">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] group-hover:text-white/50 transition-colors">{langPack.feedback}</span>
                                    <div className="p-3 bg-white rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"><img src={FEEDBACK_QR_URL} alt="Feedback QR" className="w-24 h-24 mix-blend-multiply opacity-90" onError={() => setQrError(true)} /></div>
                                </div>
                                <div className="text-center flex flex-col gap-1">
                                    <span className="text-[9px] text-white/30 uppercase tracking-widest">{langPack.orUseThisLink}</span>
                                    <a href={FEEDBACK_LINK} target="_blank" rel="noreferrer" className={`text-xs font-bold bg-gradient-to-r ${getTextGradient()} bg-clip-text text-transparent hover:opacity-80 transition-opacity border-b border-white/10 pb-0.5 break-all`}>https://xdustzz.github.io/xDustSurvey/</a>
                                </div>
                            </div>
                       </div>
                   ) : (
                       <div className="flex flex-col gap-5">
                            <div className="text-center mb-6 animate-float">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center ring-1 ring-white/10 shadow-[0_0_40px_rgba(168,85,247,0.15)] backdrop-blur-md relative">
                                    <div className="absolute inset-0 bg-white/5 blur-lg rounded-full animate-pulse"></div>
                                    <Crown size={36} className="text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] relative z-10" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-1 tracking-tight drop-shadow-lg">xDustAI</h2>
                                <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">Liquid Intelligence</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="liquid-glass p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] border border-white/5 hover:border-white/20 hover:shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]"><User size={18} /></div>
                                        <span className="text-sm font-semibold text-white/90">{langPack.creator}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-white to-blue-300 animate-glow">Dustine Xavielo</span>
                                </div>

                                <div className="liquid-glass p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] border border-white/5 hover:border-white/20 hover:shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-green-500/20 text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.2)]"><HelpCircle size={18} /></div>
                                        <span className="text-sm font-semibold text-white/90">{langPack.helper}</span>
                                    </div>
                                    <span className="text-sm text-white/50 font-mono tracking-wide">{langPack.helperValue}</span>
                                </div>

                                <div className="liquid-glass p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] border border-white/5 hover:border-white/20 hover:shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]"><Bug size={18} /></div>
                                        <span className="text-sm font-semibold text-white/90">{langPack.tester}</span>
                                    </div>
                                    <span className="text-sm text-white/50 font-mono tracking-wide">{langPack.testerValue}</span>
                                </div>

                                <div className="liquid-glass p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] border border-white/5 hover:border-white/20 hover:shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]"><Tag size={18} /></div>
                                        <span className="text-sm font-semibold text-white/90">{langPack.version}</span>
                                    </div>
                                    <span className="text-sm font-bold bg-white/10 px-2 py-0.5 rounded text-white/80 font-mono border border-white/5">v2.6.1</span>
                                </div>
                            </div>
                       </div>
                   )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

export default App;