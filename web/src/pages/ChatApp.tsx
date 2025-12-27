import { useRef, useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import { useUser } from "../contexts/UserContext";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  text: string;
  file?: File[]; // For newly uploaded files
  files?: FileItem[]; // For loaded messages from backend
  file_name?: string;
  file_url?: string;
};

type TimelineItem = {
  created_at: string;
  file_name: string | null;
  file_url: string | null;
  message: string | null;
  msg_id: string;
  role: "user" | "ai";
};

type FileItem = {
  file_url: string;
  file_name: string;
};

const normalizeMessageText = (message: unknown): string => {
  if (typeof message === "string") {
    // 🔥 try to parse JSON string
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed.reply === "string") {
        return parsed.reply;
      }
    } catch {
      // not JSON → normal text
      return message;
    }

    return message;
  }

  if (
    typeof message === "object" &&
    message !== null &&
    "reply" in message &&
    typeof (message as { reply?: string }).reply === "string"
  ) {
    return (message as { reply: string }).reply;
  }

  return "";
};

function ChatBubble({
  role,
  text,
  files,
}: {
  role: "user" | "assistant";
  text: string;
  files: FileItem[];
}) {
  const isUser = role === "user";
  const { me } = useUser();
  const avatarUrl = me?.user?.avatar_url || null;
  console.log("Avatar URL:", avatarUrl);

  const displayName = useMemo(() => {
    const username = me?.user?.username?.trim();
    if (username) return username;
    const email = me?.user?.email?.trim();
    if (email) return email.split("@")[0];
    return "User";
  }, [me?.user?.email, me?.user?.username]);

  function firstChar(v: string) {
    const s = v.trim();
    return s ? s[0].toUpperCase() : "U";
  }

  const avatarLetter = firstChar(displayName);

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-start gap-3 max-w-[75%] ${
          isUser ? "flex-row-reverse" : ""
        }`}
      >
        {!isUser && (
          <div className="shrink-0">
            <img
              src="/src/assets/Chatbot/AI.svg"
              className="w-8 h-8"
              alt="AI Assistant"
            />
          </div>
        )}
        {isUser && <Avatar src={avatarUrl} letter={avatarLetter} size="sm" />}
        <div className="flex flex-col gap-2">
          {files.length > 0 && (
            <div
              className={`flex flex-wrap gap-2 mb-1 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {files.map((file, index) => (
                <div key={index} className="max-w-[180px]">
                  {file.file_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="rounded-lg max-w-full border border-gray-200"
                    />
                  ) : (
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#2A4A2D] hover:text-[#1A381D] hover:underline flex items-center gap-1"
                    >
                      📄 {file.file_name}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className={`px-4 py-2.5 text-sm
              ${
                isUser
                  ? "bg-[#2A4A2D] text-white rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl whitespace-pre-line"
                  : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
              }`}
          >
            {isUser ? (
              text
            ) : (
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-6 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1 ml-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code
                          className="bg-gray-200 px-1.5 py-0.5 rounded text-xs text-gray-900 font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code
                        className="block bg-gray-100 border border-gray-200 rounded p-3 overflow-x-auto text-xs font-mono mb-2"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 border border-gray-200 rounded p-3 overflow-x-auto mb-2 text-xs font-mono">
                      {children}
                    </pre>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0 text-gray-900">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold mb-2 mt-3 first:mt-0 text-gray-900">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold mb-2 mt-2 first:mt-0 text-gray-900">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-sm font-semibold mb-1 mt-2 first:mt-0 text-gray-900">
                      {children}
                    </h4>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-700">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2A4A2D] underline hover:text-[#1A381D]"
                    >
                      {children}
                    </a>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                  hr: () => <hr className="my-3 border-gray-300" />,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="min-w-full border-collapse border border-gray-300">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gray-100">{children}</thead>
                  ),
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => (
                    <tr className="border-b border-gray-300">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 px-3 py-2">
                      {children}
                    </td>
                  ),
                }}
              >
                {text}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({
  src,
  letter,
  size = "md",
}: {
  src: string | null;
  letter: string;
  size?: "sm" | "md" | "lg";
}) {
  const [imgError, setImgError] = useState(false);

  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-sm"
      : size === "lg"
      ? "h-12 w-12 text-base"
      : "h-10 w-10 text-sm";

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt="Avatar"
        className={`${sizeClass} rounded-full object-cover`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} items-center justify-center rounded-full bg-[#DDF3D8] font-semibold text-[#1A381D]`}
    >
      {letter}
    </div>
  );
}

export function ChatApp() {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatList, setChatList] = useState<
    { chat_id: string; title: string }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChats = async () => {
      const data = await apiFetch<{ chat_id: string; title: string }[]>(
        "/fetchChatList",
        {
          method: "GET",
        }
      );
      setChatList(data);
    };
    fetchChats();
  }, []);

  // Load chat from URL parameter
  useEffect(() => {
    if (chatId && chatId !== activeChatId) {
      loadChatFromUrl(chatId);
    } else if (!chatId && activeChatId) {
      // If no chatId in URL but we have an active chat, clear it
      setActiveChatId(null);
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Internal function to load chat
  const loadChatFromUrl = async (chatId: string) => {
    const data = await apiFetch<{ chat_id: string; messages: TimelineItem[] }>(
      `/loadchat?chat_id=${chatId}`
    );

    console.log("Loaded chat data:", data);

    // group data based on msg_id
    const messages = data.messages.reduce(
      (
        acc: Array<{
          msg_id: string;
          role: "user" | "assistant";
          text: string;
          files: FileItem[];
        }>,
        item: TimelineItem
      ) => {
        const existingMsg = acc.find((m) => m.msg_id === item.msg_id);

        if (existingMsg) {
          // Append file info if exists
          if (item.file_url && item.file_name) {
            existingMsg.files.push({
              file_url: item.file_url,
              file_name: item.file_name,
            });
          }

          // IMPORTANT: only set text if it exists and current text is empty
          if (!existingMsg.text) {
            const normalized = normalizeMessageText(item.message);
            if (normalized) {
              existingMsg.text = normalized;
            }
          }
        } else {
          acc.push({
            msg_id: item.msg_id,
            role: item.role === "ai" ? "assistant" : "user",
            text: normalizeMessageText(item.message),
            files:
              item.file_url && item.file_name
                ? [
                    {
                      file_url: item.file_url,
                      file_name: item.file_name,
                    },
                  ]
                : [],
          });
        }

        return acc;
      },
      []
    );

    console.log("Grouped messages:", messages);

    setActiveChatId(data.chat_id);
    setMessages(messages);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  console.log("Chatlist:", chatList);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Uploaded file:", file);

    // OPTIONAL: upload to backend
    // uploadFileToServer(file);

    setUploads((prev) => [...prev, file]);
  };

  const handleRemoveUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText) return;

    const newUserMessage: Message = {
      role: "user",
      text: messageText,
      file: uploads,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    console.log("Active Chat ID:", activeChatId);

    const formData = new FormData();
    formData.append("message", messageText);
    formData.append("chat_id", activeChatId ?? "");
    formData.append("is_new_chat", activeChatId ? "false" : "true");

    uploads.forEach((file) => formData.append("files", file));

    setInput("");
    setUploads([]);

    try {
      const data = await apiFetch<{ chat_id: string; reply: string }>("/chat", {
        method: "POST",
        json: formData,
      });

      console.log("Chat response data:", data);
      const newChatId = activeChatId || data.chat_id;

      if (!activeChatId) {
        setActiveChatId(newChatId);
        // Navigate to the new chat URL
        navigate(`/chatbot/${newChatId}`, { replace: true });
      }

      setChatList((prev) => {
        const chatExists = prev.find((c) => c.chat_id === newChatId);

        if (chatExists) {
          return prev.map((c) =>
            c.chat_id === newChatId && c.title === "New chat"
              ? { ...c, title: messageText } // update title only if it's "New chat"
              : c
          );
        } else {
          // if somehow chat is not in the list, add it
          return [{ chat_id: newChatId, title: messageText }, ...prev];
        }
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply, file: [] },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Error: failed to contact server.",
          file: [],
        },
      ]);
    }
  };

  const loadChat = async (chatId: string) => {
    const data = await apiFetch<{ chat_id: string; messages: TimelineItem[] }>(
      `/loadchat?chat_id=${chatId}`
    );

    console.log("Loaded chat data:", data);

    // group data based on msg_id
    // group data based on msg_id
    const messages = data.messages.reduce(
      (
        acc: Array<{
          msg_id: string;
          role: "user" | "assistant";
          text: string;
          files: FileItem[];
        }>,
        item: TimelineItem
      ) => {
        const existingMsg = acc.find((m) => m.msg_id === item.msg_id);

        if (existingMsg) {
          // Append file info if exists
          if (item.file_url && item.file_name) {
            existingMsg.files.push({
              file_url: item.file_url,
              file_name: item.file_name,
            });
          }

          // IMPORTANT: only set text if it exists and current text is empty
          if (!existingMsg.text) {
            const normalized = normalizeMessageText(item.message);
            if (normalized) {
              existingMsg.text = normalized;
            }
          }
        } else {
          acc.push({
            msg_id: item.msg_id,
            role: item.role === "ai" ? "assistant" : "user",
            text: normalizeMessageText(item.message),
            files:
              item.file_url && item.file_name
                ? [
                    {
                      file_url: item.file_url,
                      file_name: item.file_name,
                    },
                  ]
                : [],
          });
        }

        return acc;
      },
      []
    );

    console.log("Grouped messages:", messages);

    setActiveChatId(data.chat_id);
    navigate(`/chatbot/${data.chat_id}`, { replace: true });

    setMessages(messages);
  };

  const newChat = async () => {
    try {
      // Clear UI immediately
      setMessages([]);
      setActiveChatId(null);

      // Create empty chat
      const data = await apiFetch<{ chat_id: string }>("/newchat", {
        method: "POST",
      });

      const newChatItem = { chat_id: data.chat_id, title: "New chat" };
      setChatList((prev) => [newChatItem, ...prev]);

      setActiveChatId(data.chat_id);
      navigate(`/chatbot/${data.chat_id}`, { replace: true });
    } catch (err) {
      console.error("Failed to create new chat", err);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await apiFetch<Record<string, never>>(`/deleteChat?chat_id=${chatId}`, {
        method: "DELETE",
      });

      // Remove from chat list
      setChatList((prev) => prev.filter((c) => c.chat_id !== chatId));

      // Reset current chat if it was active
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
        navigate("/chatbot", { replace: true });
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const clearAllChats = async () => {
    try {
      await apiFetch<Record<string, never>>(`/clearAllChats`, {
        method: "DELETE",
      });

      setChatList([]);
      setActiveChatId(null);
      setMessages([]);
      navigate("/chatbot", { replace: true });
    } catch (err) {
      console.error("Failed to clear all chats", err);
    }
  };

  return (
    <div className="bg-[#F5F7FA] flex-1 min-h-0 overflow-hidden flex flex-col">
      <div className="flex p-8 sm:px-6 lg:px-8 gap-6 max-w-[1600px] mx-auto w-full flex-1 min-h-0 overflow-hidden items-stretch">
        {/* LEFT SIDEBAR */}
        <div className="bg-white p-6 rounded-3xl w-75 border border-gray-200 shrink-0 flex flex-col">
          <h1 className="mb-6 mt-2 text-left font-bold text-xs text-gray-700 uppercase tracking-wider">
            Chat History
          </h1>

          <button
            onClick={newChat}
            className="bg-[#2A4A2D] hover:bg-[#1A381D] text-white text-sm font-medium px-4 py-2.5 w-full rounded-xl cursor-pointer transition-colors"
          >
            + New Chat
          </button>

          <div className="flex justify-between items-center text-gray-600 text-xs mb-4 mt-6">
            <span className="font-medium">Recent Chats</span>
            {chatList.length > 0 && (
              <button
                onClick={clearAllChats}
                className="cursor-pointer hover:text-red-600 text-xs transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Chat list */}
          <div className="flex flex-col overflow-y-auto mt-2 pr-1 flex-1 gap-1.5 scroll-smooth min-h-0">
            {chatList.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No chats yet. Start a new conversation!
              </p>
            ) : (
              chatList.map((chat) => (
                <div
                  key={chat.chat_id}
                  className={`flex items-center p-2.5 rounded-lg transition-all duration-200 cursor-pointer
                                hover:bg-gray-50
                                ${
                                  activeChatId === chat.chat_id
                                    ? "bg-[#DDF3D8] text-gray-900"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                  onClick={() => loadChat(chat.chat_id)}
                >
                  {/* Left: chat icon */}
                  <img
                    src="/src/assets/Chatbot/Messages.svg"
                    className="w-5 h-5 mr-2.5 shrink-0 opacity-70"
                    alt="Chat"
                  />

                  {/* Title: truncate */}
                  <p className="text-xs font-medium truncate flex-1 min-w-0">
                    {chat.title || "Untitled Chat"}
                  </p>

                  {/* Delete button only for active chat */}
                  {activeChatId === chat.chat_id && (
                    <button
                      className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 w-6 h-6 flex justify-center items-center rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.chat_id);
                      }}
                      aria-label="Delete chat"
                    >
                      <img
                        src="/src/assets/Chatbot/Delete.svg"
                        className="w-4 h-4"
                        alt="Delete"
                      />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="bg-white flex-1 rounded-3xl p-8 flex flex-col min-h-0 border border-gray-200 overflow-hidden">
          {messages.length > 0 && (
            <div
              ref={messagesContainerRef}
              className="flex flex-col w-full gap-4 pr-2 flex-1 min-h-0 overflow-y-auto scroll-smooth thin-scrollbar"
            >
              {messages.map((msg, index) => (
                <ChatBubble
                  key={index}
                  role={msg.role}
                  text={msg.text}
                  files={[
                    ...(msg.files || []), // loaded files
                    ...(msg.file?.map((f) => ({
                      file_name: f.name,
                      file_url: URL.createObjectURL(f),
                    })) || []), // newly uploaded
                  ]}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Empty State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="flex flex-col items-center gap-4">
                <img
                  src="/src/assets/Chatbot/Logo.svg"
                  className="w-[180px] opacity-90"
                  alt="VitaTrack Chat"
                />
                <h2 className="text-2xl font-semibold text-gray-700">
                  Hi! How can I help you today?
                </h2>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Ask me anything about fitness, nutrition, or wellness. I can
                  help you log meals, track workouts, and provide personalized
                  recommendations.
                </p>
              </div>
            </div>
          )}

          <div className="w-full flex justify-center mt-4">
            {/* Input Box */}
            <div className="flex flex-col bg-white rounded-2xl px-4 py-1.5 w-full max-w-3xl border border-gray-200">
              {/* Uploaded Files */}
              {uploads.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploads.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-100"
                    >
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded-md border border-gray-200"
                        />
                      ) : (
                        <span className="text-xs">
                          📄{" "}
                          {file.name.length > 20
                            ? file.name.substring(0, 20) + "..."
                            : file.name}
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveUpload(index)}
                        className="text-red-500 hover:text-red-700 ml-1 p-1 rounded hover:bg-red-50 transition-colors"
                        aria-label="Remove file"
                      >
                        <img
                          src="/src/assets/Chatbot/Button-delete.svg"
                          className="w-4 h-4"
                          alt="Remove"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Row */}
              <div className="flex items-center w-full gap-3">
                <button
                  onClick={handleOpenFilePicker}
                  className="cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Attach file"
                >
                  <img
                    src="/src/assets/Chatbot/Button-add.svg"
                    className="w-5 h-5 opacity-70"
                    alt="Add file"
                  />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple
                />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  className="flex-1 outline-none text-gray-700 text-sm bg-transparent placeholder:text-gray-400"
                  placeholder="Type your message..."
                />
                <button
                  className="cursor-pointer p-2 hover:bg-[#2A4A2D]/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <img
                    src="/src/assets/Chatbot/Button-send.svg"
                    className="w-5 h-5"
                    alt="Send"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
