"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { 
  Upload, 
  Send, 
  Loader2, 
  X, 
  Image as ImageIcon, 
  Video, 
  Zap, 
  MessageSquare,
  Search,
  Sparkles
} from 'lucide-react';

interface Message {
  role: 'bot' | 'user';
  content: string;
  image?: string | null;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
}

type AppMode = 'text' | 'image-fast' | 'image-pro' | 'image-turbo' | 'video' | 'visual-reasoning';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: '✨ Creative Studio is ready. Choose a tool to begin your next project.' }
  ]);
  const [input, setInput] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<AppMode>('text'); 
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // NEW: Ref to clear the file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getModeLabel = () => {
      switch(mode) {
          case 'text': return 'Storyteller';
          case 'image-fast': return 'Snap';
          case 'image-pro': return 'Masterpiece';
          case 'image-turbo': return 'Instant';
          case 'video': return 'Video';
          case 'visual-reasoning': return 'Analyzer';
          default: return 'Studio';
      }
  };

  const getModeColor = () => {
    switch(mode) {
      case 'image-fast': return '#eab308';
      case 'image-pro': return '#10b981';
      case 'image-turbo': return '#f59e0b';
      case 'video': return '#3b82f6';
      case 'visual-reasoning': return '#a855f7';
      default: return '#6366f1';
    }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMsg: Message = { role: 'user', content: input, image: selectedImage };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setInput('');
    
    // Store current image and reset states
    const imagePayload = selectedImage;
    setSelectedImage(null);
    
    // NEW: Clear the file input value so the same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
            prompt: userMsg.content, 
            imageUrl: imagePayload,
            mode: mode 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { 
        role: 'bot', 
        content: data.text, 
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType
      }]);

    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'bot', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <header style={{...styles.header, borderBottomColor: getModeColor()}}>
          <div style={{...styles.statusDot, backgroundColor: getModeColor(), boxShadow: `0 0 15px ${getModeColor()}`}}></div>
          <h1 style={styles.title}>Creative Studio</h1>
          <span style={styles.modeBadge}>{getModeLabel()}</span>
        </header>

        <div style={styles.chatWindow}>
          {messages.map((msg, index) => (
            <div key={index} style={{
              ...styles.messageRow,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              {msg.role === 'bot' && <div style={styles.botAvatar}>CS</div>}
              
              <div style={{
                ...styles.bubble,
                background: msg.role === 'user' ? getModeColor() : '#1c1c1e',
                color: msg.role === 'user' && mode === 'text' ? '#fff' : (msg.role === 'user' ? '#000' : '#fff'),
                fontWeight: msg.role === 'user' ? '500' : '400',
                border: msg.role === 'bot' ? '1px solid #2c2c2e' : 'none',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
                borderBottomLeftRadius: msg.role === 'bot' ? '4px' : '20px',
              }}>
                {msg.image && msg.role === 'user' && <img src={msg.image} alt="upload" style={styles.chatImage} />}
                {msg.content && <p style={styles.text}>{msg.content}</p>}

                {msg.mediaUrl && (
                   <div style={styles.mediaContainer}>
                      {msg.mediaType === 'image' && <img src={msg.mediaUrl} alt="generated" style={styles.generatedMedia} />}
                      {msg.mediaType === 'video' && <video src={msg.mediaUrl} controls autoPlay loop style={styles.generatedMedia} />}
                      <a href={msg.mediaUrl} download target="_blank" style={styles.downloadLink}>
                        Finalize & Save {getModeLabel()}
                      </a>
                   </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div style={styles.loadingRow}>
              <Loader2 className="animate-spin" size={18} color={getModeColor()} />
              <span style={{ color: getModeColor(), fontSize: '13px', fontWeight: '600' }}>
                {getModeLabel()} is working...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputWrapper}>
            <div style={styles.modeSwitchContainer}>
                {[
                    { id: 'text', label: 'Storyteller', icon: MessageSquare, color: '#6366f1' },
                    { id: 'image-fast', label: 'Snap', icon: Zap, color: '#eab308' },
                    { id: 'image-pro', label: 'Masterpiece', icon: ImageIcon, color: '#10b981' },
                    { id: 'image-turbo', label: 'Instant', icon: Sparkles, color: '#f59e0b' },
                    { id: 'video', label: 'Video', icon: Video, color: '#3b82f6' },
                    { id: 'visual-reasoning', label: 'Analyzer', icon: Search, color: '#a855f7' },
                ].map((tool) => (
                    <button 
                        key={tool.id}
                        type="button" 
                        onClick={() => setMode(tool.id as AppMode)}
                        style={{
                            ...styles.modeBtn, 
                            backgroundColor: mode === tool.id ? tool.color : '#1c1c1e', 
                            color: mode === tool.id ? (['image-fast', 'image-turbo'].includes(tool.id) ? '#000' : '#fff') : '#a1a1aa',
                            border: mode === tool.id ? `1px solid ${tool.color}` : '1px solid #2c2c2e',
                            transform: mode === tool.id ? 'scale(1.05)' : 'scale(1)',
                        }}
                    >
                        <tool.icon size={14} /> {tool.label}
                    </button>
                ))}
            </div>

            <form onSubmit={sendMessage} style={styles.inputArea}>
                {selectedImage && (
                    <div style={styles.previewContainer}>
                        <img src={selectedImage} style={styles.previewImage} alt="preview" />
                        {/* Reset file input when manually closing preview too */}
                        <button type="button" onClick={() => {
                          setSelectedImage(null);
                          if(fileInputRef.current) fileInputRef.current.value = "";
                        }} style={styles.closeBtn}><X size={14} /></button>
                    </div>
                )}
                
                <label style={styles.iconBtn} title="Reference Source">
                    <Upload size={20} />
                    {/* ADDED REF HERE */}
                    <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange} />
                </label>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Compose with ${getModeLabel()}...`}
                    style={styles.input}
                />
                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{
                    ...styles.sendBtn, 
                    backgroundColor: getModeColor(),
                    color: ['image-fast', 'image-turbo'].includes(mode) ? '#000' : '#fff'
                  }}
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}

// ... styles remain the same ...
const styles: { [key: string]: React.CSSProperties } = {
  pageWrapper: { backgroundColor: '#000000', minHeight: '100vh', display: 'flex', justifyContent: 'center', fontFamily: 'Inter, -apple-system, sans-serif' },
  container: { width: '100%', maxWidth: '750px', height: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #1c1c1e', borderRight: '1px solid #1c1c1e', position: 'relative' },
  header: { padding: '16px 24px', borderBottom: '2px solid #1c1c1e', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.5s ease' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%', transition: 'all 0.5s ease' },
  title: { color: '#fff', fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' },
  modeBadge: { marginLeft: 'auto', fontSize: '10px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', backgroundColor: '#1c1c1e', padding: '6px 12px', borderRadius: '20px', border: '1px solid #2c2c2e' },
  chatWindow: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px', backgroundColor: '#000' },
  messageRow: { display: 'flex', gap: '14px', width: '100%' },
  botAvatar: { width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#1c1c1e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', border: '1px solid #2c2c2e', flexShrink: 0 },
  bubble: { padding: '14px 20px', borderRadius: '24px', maxWidth: '80%', lineHeight: '1.6', fontSize: '15px', whiteSpace: 'pre-wrap', transition: 'all 0.3s ease' },
  text: { margin: 0, wordBreak: 'break-word' },
  chatImage: { maxWidth: '100%', borderRadius: '12px', marginBottom: '10px', border: '1px solid #2c2c2e' },
  mediaContainer: { marginTop: '16px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #2c2c2e', backgroundColor: '#000' },
  generatedMedia: { width: '100%', display: 'block', maxHeight: '450px', objectFit: 'contain' },
  downloadLink: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', backgroundColor: '#1c1c1e', color: '#fff', textDecoration: 'none', fontSize: '12px', fontWeight: '700', borderTop: '1px solid #2c2c2e' },
  loadingRow: { display: 'flex', alignItems: 'center', gap: '14px', paddingLeft: '48px' },
  inputWrapper: { backgroundColor: '#000', borderTop: '1px solid #1c1c1e', display: 'flex', flexDirection: 'column' },
  modeSwitchContainer: { display: 'flex', gap: '10px', padding: '16px 20px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' },
  modeBtn: { border: 'none', padding: '10px 18px', borderRadius: '14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0 },
  inputArea: { padding: '12px 20px 24px 20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' },
  previewContainer: { position: 'absolute', bottom: '100px', left: '20px', backgroundColor: '#1c1c1e', padding: '8px', borderRadius: '14px', border: '1px solid #2c2c2e', display: 'flex', alignItems: 'center' },
  previewImage: { width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px' },
  closeBtn: { position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#ff453a', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  input: { flex: 1, padding: '16px 24px', borderRadius: '30px', border: '1px solid #1c1c1e', backgroundColor: '#1c1c1e', color: '#fff', fontSize: '16px', outline: 'none', transition: 'all 0.3s' },
  iconBtn: { cursor: 'pointer', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' },
  sendBtn: { border: 'none', padding: '14px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' },
};