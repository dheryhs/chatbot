"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, MessageSquare, User, Phone, Tag, FileText, Image, Pencil, Save, X } from "lucide-react";
import styles from "./chats.module.css";

interface WASession {
  id: string;
  sessionName: string;
  wahaSessionId: string;
  status: string;
}

interface ChatOverview {
  id: string;
  name?: string;
  picture?: string;
  lastMessage?: {
    body?: string;
    timestamp?: number;
    fromMe?: boolean;
  };
  _chat?: any;
}

interface ChatMessage {
  id: string | { id?: string; _serialized?: string };
  body?: string;
  fromMe?: boolean;
  timestamp?: number;
  type?: string;
  hasMedia?: boolean;
  from?: string;
  to?: string;
}

interface ContactProfile {
  id: string;
  name: string | null;
  phoneNumber: string;
  jid?: string;
  email?: string;
  source?: string;
  note?: string;
  tags: string[];
}

export default function ChatsPage() {
  // Session state
  const [sessions, setSessions] = useState<WASession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");

  // Chat list state
  const [chats, setChats] = useState<ChatOverview[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  // Profile state
  const [contactProfile, setContactProfile] = useState<ContactProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    source: "Manual",
    tags: "",
    note: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (Array.isArray(data)) {
        const working = data.filter((s: WASession) => s.status === "WORKING");
        setSessions(working);
        if (working.length > 0 && !selectedSessionId) {
          setSelectedSessionId(working[0].wahaSessionId);
          fetchChats(working[0].wahaSessionId);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchChats = async (sessionId: string) => {
    if (!sessionId) return;
    setChatsLoading(true);
    setChats([]);
    setActiveChatId(null);
    setMessages([]);
    setContactProfile(null);
    setIsEditingProfile(false);
    try {
      const res = await fetch(`/api/chats?sessionId=${sessionId}&limit=30`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setChats(data);
      } else {
        alert(data.error || "Failed to load chats");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setChatsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (!selectedSessionId || !chatId) return;
    setMessagesLoading(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages?sessionId=${selectedSessionId}&limit=30`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data.reverse());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchContactProfile = async (chatId: string) => {
    const phone = chatId.split("@")[0];
    try {
      const res = await fetch("/api/contacts");
      const contacts = await res.json();
      if (Array.isArray(contacts)) {
        const match = contacts.find((c: ContactProfile) => 
          c.phoneNumber === phone || c.jid === chatId
        );
        const profile = match || {
          id: "",
          name: null,
          phoneNumber: phone,
          jid: chatId,
          tags: [],
          source: "WhatsApp"
        };
        setContactProfile(profile);
        setIsEditingProfile(false);
      }
    } catch (error) {
      setContactProfile({
        id: "",
        name: null,
        phoneNumber: phone,
        jid: chatId,
        tags: [],
        source: "WhatsApp"
      });
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsEditingProfile(false);
    fetchMessages(chatId);
    fetchContactProfile(chatId);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeChatId || !selectedSessionId || sending) return;
    
    setSending(true);
    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(activeChatId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          text: messageText.trim()
        }),
      });

      if (res.ok) {
        setMessageText("");
        setTimeout(() => fetchMessages(activeChatId), 800);
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengirim pesan");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ---- Profile editing ----
  const handleStartEdit = () => {
    if (!contactProfile) return;
    setEditForm({
      name: contactProfile.name || "",
      email: contactProfile.email || "",
      source: contactProfile.source || "Manual",
      tags: contactProfile.tags ? contactProfile.tags.join(", ") : "",
      note: contactProfile.note || ""
    });
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!contactProfile || !activeChatId) return;
    setSavingProfile(true);

    const phone = contactProfile.phoneNumber;
    const jid = contactProfile.jid || activeChatId;
    const tagsArray = editForm.tags.split(",").map(t => t.trim()).filter(t => t);

    try {
      if (contactProfile.id) {
        // Update existing contact via PUT
        const res = await fetch(`/api/contacts/${contactProfile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editForm.name || null,
            phoneNumber: phone,
            jid,
            email: editForm.email || null,
            source: editForm.source,
            note: editForm.note || null,
            tags: tagsArray
          }),
        });
        if (res.ok) {
          await fetchContactProfile(activeChatId);
        } else {
          const data = await res.json();
          alert(data.error || "Gagal menyimpan profil");
        }
      } else {
        // Create new contact via POST
        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editForm.name || null,
            phoneNumber: phone,
            jid,
            email: editForm.email || null,
            source: editForm.source || "WhatsApp",
            note: editForm.note || null,
            tags: tagsArray
          }),
        });
        if (res.ok) {
          await fetchContactProfile(activeChatId);
        } else {
          const data = await res.json();
          alert(data.error || "Gagal menyimpan kontak");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingProfile(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helpers
  const getChatDisplayName = (chat: ChatOverview) => chat.name || chat.id;
  const getChatInitial = (chat: ChatOverview) => (chat.name || chat.id).charAt(0).toUpperCase();

  const getLastMessagePreview = (chat: ChatOverview) => {
    if (!chat.lastMessage?.body) return "No messages";
    const prefix = chat.lastMessage.fromMe ? "You: " : "";
    return prefix + chat.lastMessage.body;
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return "";
    const date = new Date(ts * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  };

  const isMediaMessage = (msg: ChatMessage) => {
    return msg.hasMedia || (msg.type && msg.type !== "chat" && msg.type !== "text" && msg.type !== "");
  };

  const getMessageBody = (msg: ChatMessage) => {
    if (isMediaMessage(msg)) return null;
    return msg.body || "";
  };

  const filteredChats = chats.filter(c => {
    const name = (c.name || c.id || "").toLowerCase();
    return name.includes(chatSearch.toLowerCase());
  });

  // ===== RENDER =====
  return (
    <div className={styles.chatPage}>
      {/* ====== LEFT: Chat List ====== */}
      <div className={styles.chatListPanel}>
        <div className={styles.chatListHeader}>
          <h2>Chat</h2>
          <select
            className={styles.sessionSelect}
            value={selectedSessionId}
            onChange={(e) => {
              setSelectedSessionId(e.target.value);
              fetchChats(e.target.value);
            }}
          >
            <option value="">Pilih WA Session</option>
            {sessions.map(s => (
              <option key={s.id} value={s.wahaSessionId}>
                {s.sessionName}
              </option>
            ))}
          </select>
          <div className={styles.chatSearchBar}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari chat..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.chatListBody}>
          {chatsLoading && <div className={styles.loadingCenter}>Memuat chat...</div>}
          
          {!chatsLoading && filteredChats.length === 0 && selectedSessionId && (
            <div className={styles.chatListEmpty}>
              {chats.length === 0 ? "Tidak ada chat ditemukan." : "Tidak ada hasil pencarian."}
            </div>
          )}

          {!chatsLoading && !selectedSessionId && (
            <div className={styles.chatListEmpty}>Pilih session WhatsApp terlebih dahulu.</div>
          )}

          {filteredChats.map(chat => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${activeChatId === chat.id ? styles.chatItemActive : ""}`}
              onClick={() => handleSelectChat(chat.id)}
            >
              <div className={styles.chatAvatar}>{getChatInitial(chat)}</div>
              <div className={styles.chatMeta}>
                <div className={styles.chatName}>{getChatDisplayName(chat)}</div>
                <div className={styles.chatPreview}>{getLastMessagePreview(chat)}</div>
              </div>
              <div className={styles.chatTime}>
                {formatTimestamp(chat.lastMessage?.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ====== CENTER: Messages ====== */}
      <div className={styles.messagesPanel}>
        {!activeChatId ? (
          <div className={styles.messagesEmpty}>
            <MessageSquare size={48} strokeWidth={1} />
            <p>Pilih percakapan untuk melihat pesan</p>
          </div>
        ) : (
          <>
            <div className={styles.messagesHeader}>
              <div className={styles.messagesHeaderAvatar}>
                {(contactProfile?.name || activeChatId).charAt(0).toUpperCase()}
              </div>
              <div className={styles.messagesHeaderInfo}>
                <h3>{contactProfile?.name || activeChatId.split("@")[0]}</h3>
                <p>{activeChatId}</p>
              </div>
            </div>

            <div className={styles.messagesBody}>
              {messagesLoading && <div className={styles.loadingCenter}>Memuat pesan...</div>}
              
              {!messagesLoading && messages.length === 0 && (
                <div className={styles.loadingCenter}>Tidak ada pesan.</div>
              )}

              {messages.map((msg, idx) => {
                const msgId = typeof msg.id === 'object' ? (msg.id._serialized || msg.id.id || String(idx)) : (msg.id || String(idx));
                return (
                  <div
                    key={msgId}
                    className={`${styles.messageRow} ${msg.fromMe ? styles.messageRowOutbound : styles.messageRowInbound}`}
                  >
                    <div className={`${styles.messageBubble} ${msg.fromMe ? styles.bubbleOutbound : styles.bubbleInbound}`}>
                      {isMediaMessage(msg) ? (
                        <div className={styles.bubbleMedia}>
                          <Image size={16} /> Media Message
                        </div>
                      ) : (
                        <span>{getMessageBody(msg)}</span>
                      )}
                      <div className={styles.bubbleTime}>
                        {formatTimestamp(msg.timestamp)}
                        {msg.fromMe && " ✓✓"}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.messageInputArea}>
              <input
                className={styles.messageInput}
                type="text"
                placeholder="Ketik pesan..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sending}
              >
                <Send size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ====== RIGHT: Profile (Editable) ====== */}
      <div className={styles.profilePanel}>
        {!activeChatId || !contactProfile ? (
          <div className={styles.profileEmpty}>
            <User size={32} strokeWidth={1} />
            <p style={{marginTop: 12}}>Pilih chat untuk melihat profil kontak</p>
          </div>
        ) : (
          <>
            <div className={styles.profileHeader}>
              <div className={styles.profileAvatar}>
                {(contactProfile.name || contactProfile.phoneNumber).charAt(0).toUpperCase()}
              </div>

              {isEditingProfile ? (
                <input
                  className={styles.profileInput}
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Nama kontak"
                  style={{textAlign: "center", fontWeight: 600}}
                />
              ) : (
                <div className={styles.profileName}>
                  {contactProfile.name || "Unnamed"}
                </div>
              )}
              <div className={styles.profileJid}>{contactProfile.jid || activeChatId}</div>

              {!isEditingProfile && (
                <button className={styles.profileEditBtn} onClick={handleStartEdit}>
                  <Pencil size={14} style={{marginRight: 4, verticalAlign: "middle"}} />
                  {contactProfile.id ? "Edit Kontak" : "Simpan ke Kontak"}
                </button>
              )}
            </div>

            <div className={styles.profileDetails}>
              {/* Phone — always read-only */}
              <div className={styles.profileField}>
                <span className={styles.profileFieldLabel}>Phone</span>
                <span className={styles.profileFieldValue}>{contactProfile.phoneNumber}</span>
              </div>

              {/* Email */}
              <div className={styles.profileField}>
                <span className={styles.profileFieldLabel}>Email</span>
                {isEditingProfile ? (
                  <input
                    className={styles.profileInput}
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                ) : (
                  <span className={styles.profileFieldValue}>
                    {contactProfile.email || <span style={{fontStyle: "italic", color: "var(--muted-foreground)"}}>—</span>}
                  </span>
                )}
              </div>

              {/* Source */}
              <div className={styles.profileField}>
                <span className={styles.profileFieldLabel}>Source</span>
                {isEditingProfile ? (
                  <select
                    className={styles.profileInput}
                    value={editForm.source}
                    onChange={(e) => setEditForm({...editForm, source: e.target.value})}
                  >
                    <option value="Manual">Manual</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="WhatsApp Import">WhatsApp Import</option>
                    <option value="Import">Import</option>
                    <option value="API">API</option>
                  </select>
                ) : (
                  <span className={styles.profileFieldValue}>{contactProfile.source || "WhatsApp"}</span>
                )}
              </div>

              {/* Labels */}
              <div className={styles.profileField}>
                <span className={styles.profileFieldLabel}>Labels</span>
                {isEditingProfile ? (
                  <input
                    className={styles.profileInput}
                    value={editForm.tags}
                    onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                    placeholder="VIP, Prospek, Komplain"
                  />
                ) : contactProfile.tags && contactProfile.tags.length > 0 ? (
                  <div className={styles.profileTags}>
                    {contactProfile.tags.map(t => (
                      <span key={t} className={styles.profileTag}>{t}</span>
                    ))}
                  </div>
                ) : (
                  <span className={styles.profileFieldValue} style={{fontStyle: "italic", color: "var(--muted-foreground)"}}>No labels</span>
                )}
              </div>

              {/* Notes */}
              <div className={styles.profileField}>
                <span className={styles.profileFieldLabel}>Catatan</span>
                {isEditingProfile ? (
                  <textarea
                    className={styles.profileTextarea}
                    value={editForm.note}
                    onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                    placeholder="Tulis catatan..."
                  />
                ) : (
                  <span className={styles.profileFieldValue}>
                    {contactProfile.note || <span style={{fontStyle: "italic", color: "var(--muted-foreground)"}}>—</span>}
                  </span>
                )}
              </div>
            </div>

            {/* Save / Cancel buttons */}
            {isEditingProfile && (
              <div className={styles.profileActions}>
                <button className={styles.profileCancelBtn} onClick={handleCancelEdit} disabled={savingProfile}>
                  Batal
                </button>
                <button className={styles.profileSaveBtn} onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
