import { useRef, useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import { useUser } from "../contexts/UserContext";
import ReactMarkdown from "react-markdown";
import { TypeAnimation } from "react-type-animation";
import { MealLogForm } from "../components/acm/MealLogForm";
import { WorkoutLogForm } from "../components/acm/WorkoutLogForm";
import { ImagePreview } from "../components/acm/ImagePreview";
import { ConfirmDelete } from "../components/acm/ConfirmDelete";
import chatbotImg from "../../public/vita.png";
import messagesIcon from "../assets/Chatbot/Messages.svg"
import deleteIcon from "../assets/Chatbot/Delete.svg"
import chatbotLogo from "../assets/Chatbot/Logo.svg"
import addIcon from "../assets/Chatbot/Button-add.svg"
import sendIcon from "../assets/Chatbot/Button-send.svg"
import deleteButton from "../assets/Chatbot/Button-delete.svg"
interface MealLog {
  meal_name: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  meal_time: string;
  source: "ai assistant" | "user_message" | "image_file" | "pdf_file" | "text_file";
  created_at: string; // ISO timestamp
}

interface WorkoutLog {
  exercise_name: string;
  calories_burned: number;
  duration: number; // minutes
  sets: number | null;
  reps: number | null;
  source: "user_message" | "ai assistant" | "image_file" | "pdf_file" | "text_file";
  created_at: string; // ISO timestamp
}

type ChatData = MealLog | WorkoutLog;

type Message = {
  role: "user" | "assistant";
  text: string;
  files?: FileItem[];
  file_name?: string;
  file_url?: string;
  msg_id?: string;
  isTyping?: boolean;
  choices?: string[];
  data?: ChatData[];
};

type TimelineItem = {
  created_at: string;
  file_name: string | null;
  file_url: string | null;
  file_type: string | null;
  message: string | null;
  msg_id: string;
  log_data: ChatData[] | null;
  role: "user" | "ai";
};

type FileItem = {
  file_url: string;
  file_name: string;
  file_type: string;
};

export function TypingIndicator() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-[#2A4A2D] rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

const normalizeMessageText = (message: unknown): string => {
  if (typeof message === "string") {
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed.reply === "string") {
        return parsed.reply;
      }
    } catch {
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

function downloadCSV(filename: string, rows: any[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);

  const csv = [
    headers.join(","), 
    ...rows.map((row) =>
      headers
        .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function TypingText({
  text,
  onFinish,
}: {
  text: string;
  speed?: number;
  onFinish?: () => void;
}) {
  const finishedRef = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish?.();
      }
    }, 7000);

    return () => clearTimeout(timeout);
  }, [text, onFinish]);

  return (
    <TypeAnimation
      sequence={[
        text,
        () => {
          finishedRef.current = true;
          onFinish?.();
        },
      ]}
      speed={80}
      cursor={false}
      wrapper="div"
      preRenderFirstString={false} 
    />
  );
}

function ChatBubble({
  role,
  text,
  files,
  isTyping,
  onTypingEnd,
  choices,
  onChoiceClick,
  data,
  isLast = false,
  onImageClick,
}: {
  role: "user" | "assistant";
  text: string;
  files: FileItem[];
  isTyping?: boolean;
  onTypingEnd?: () => void;
  choices?: string[];
  onChoiceClick?: (choice: string) => void;
  data?: ChatData[];
  isLast?: boolean;
  onImageClick?: (src: string) => void;
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

  console.log("CSV data:", data, Array.isArray(data));

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-start gap-3 max-w-[75%] ${
          isUser ? "flex-row-reverse" : ""
        }`}
      >
        {!isUser && (
          <div className="shrink-0 sm:block hidden">
            <img
              src={chatbotImg}
              className="w-10 h-10"
              alt="AI Assistant"
            />
          </div>
        )}
        {isUser &&   
          <div className="hidden sm:block">
            <Avatar src={avatarUrl} letter={avatarLetter} size="sm" />
          </div>}
        <div className="flex flex-col gap-2">
          {files.length > 0 && (
            <div
              className={`flex flex-wrap gap-2 mb-1 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {files.map((file, index) => (
                <div key={index} className="max-w-[180px]">
                  {file.file_type.startsWith("image/") ? (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      onClick={() => onImageClick?.(file.file_url)}
                      className="rounded-lg max-w-full border border-gray-200 cursor-pointer hover:opacity-80"
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
            className={`px-4 py-2.5 sm:text-sm text-xs
                ${
                  isUser
                    ? "bg-[#2A4A2D] text-white rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl whitespace-pre-line"
                    : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl px-0 py-0"
                }`}
          >
            {isUser ? (
              text
            ) : text === "..." ? (
              <TypingIndicator />
            ) : isTyping ? (
              <TypingText
                text={text}
                speed={80}
                onFinish={() => onTypingEnd?.()}
              />
            ) : (
              <div>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-6 last:mb-0 leading-relaxed">
                        {children}
                      </p>
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
                      <h1 className="sm:text-lg text-xs font-bold mb-2 mt-3 first:mt-0 text-gray-900">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="sm:text-base text-xs font-bold mb-2 mt-3 first:mt-0 text-gray-900">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="sm:text-sm text-xs font-bold mb-2 mt-2 first:mt-0 text-gray-900">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="sm:text-sm text-xs font-semibold mb-1 mt-2 first:mt-0 text-gray-900">
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
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
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

                {Array.isArray(data) && data.length > 0 && (
                  <button
                    onClick={() => downloadCSV("data.csv", data)}
                    className="mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg text-xs"
                  >
                    ⬇ Download CSV
                  </button>
                )}

                {isLast && choices && choices.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {choices.map((choice, idx) => (
                      <button
                        key={idx}
                        className="bg-[#2A4A2D] text-white px-3 py-1.5 rounded-lg hover:bg-[#1A381D] lg:text-sm text-xs w-auto lg:w-32"
                        onClick={() => onChoiceClick?.(choice)}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
  size?: "sm" | "md" | "lg" | "hidden";
}) {
  const [imgError, setImgError] = useState(false);

  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-sm"
      : size === "lg"
      ? "h-12 w-12 text-base"
      : size === "hidden"
      ? "hidden"
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
    const [searchParams, setSearchParams] = useSearchParams();
    const [uploads, setUploads] = useState<File[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatList, setChatList] = useState<
      { chat_id: string; title: string }[]
    >([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const hasProcessedInitialMessage = useRef(false);
    const [showMealModal, setShowMealModal] = useState(false);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});
    const [confirmTitle, setConfirmTitle] = useState("");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmText, setConfirmText] = useState("Confirm");
    const [cancelText, setCancelText] = useState("Cancel");

  // Mobile Menu States
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAnimating, setMobileAnimating] = useState(false);

  function openMobileMenu() {
    setMobileOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMobileAnimating(true);
      });
    });
  }

  function closeMobileMenu() {
    setMobileAnimating(false);
    setTimeout(() => setMobileOpen(false), 300);
  }

  const handleChoiceClick = async (choice: string) => {
    console.log("User selected choice:", choice);
    if (!choice) return;

    // No input & no files, then open modal
    if (!input.trim() && uploads.length === 0) {
      if (choice === "Log meal") {
        setShowMealModal(true);
        return;
      }
      if (choice === "Log workout") {
        setShowWorkoutModal(true);
        return;
      }

      sendMessage(choice);
      return;
    }

    sendMessage(choice);
  };

  useEffect(() => {
    if (messages.length === 0) {
      const typingMessageId = Date.now().toString() + "-typing";
      setMessages([
        {
          role: "assistant",
          text: "...",
          msg_id: typingMessageId,
          isTyping: true,
        },
      ]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.msg_id === typingMessageId
              ? {
                  ...msg,
                  text: "Hi! How can I help you today?",
                  choices: [
                    "Log meal",
                    "View meals log",
                    "Log workout",
                    "View workouts log",
                    "Meal recommendation",
                    "Workout recommendation",
                  ],
                  isTyping: true,
                }
              : msg
          )
        );
      }, 1000);
    }
  }, []);

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
  }, [chatId]);

  // Handle auto-send message from query parameter
  useEffect(() => {
    const messageParam = searchParams.get("message");
    if (
      messageParam &&
      !chatId &&
      !activeChatId &&
      !hasProcessedInitialMessage.current &&
      messages.length <= 1
    ) {
      hasProcessedInitialMessage.current = true;
      const messageToSend = messageParam;
      setSearchParams({}, { replace: true });
      setTimeout(() => {
        sendMessage(messageToSend);
      }, 500);
    }
    if (chatId || activeChatId) {
      hasProcessedInitialMessage.current = false;
    }
  }, [searchParams]);

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
          data?: ChatData[];
        }>,
        item: TimelineItem
      ) => {
        const existingMsg = acc.find((m) => m.msg_id === item.msg_id);

        console.log("existingMsg:", existingMsg);

        if (existingMsg) {
          // Append file info if exists
          if (item.file_url && item.file_name && item.file_type) {
            existingMsg.files.push({
              file_url: item.file_url,
              file_name: item.file_name,
              file_type: item.file_type,
            });
          }

          // IMPORTANT: only set text if it exists and current text is empty
          if (!existingMsg.text) {
            const normalized = normalizeMessageText(item.message);
            if (normalized) {
              existingMsg.text = normalized;
            }
          }

          console.log("Existing message before adding log_data:", existingMsg);

          if (!existingMsg.data && item.log_data) {
            existingMsg.data = item.log_data;
            console.log(
              "Item log data added to existing message:",
              item.log_data
            );
          }
        } else {
          acc.push({
            msg_id: item.msg_id,
            role: item.role === "ai" ? "assistant" : "user",
            text: normalizeMessageText(item.message),
            files:
              item.file_url && item.file_name && item.file_type
                ? [
                    {
                      file_url: item.file_url,
                      file_name: item.file_name,
                      file_type: item.file_type,
                    },
                  ]
                : [],
            data: Array.isArray(item.log_data) ? item.log_data : undefined,
          });
        }

        console.log("Item log_data:", item.log_data);

        return acc;
      },
      []
    );

    console.log("Grouped messages:", messages);

    setActiveChatId(data.chat_id);
    setMessages(messages);
  };

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

    setUploads((prev) => [...prev, file]);
  };

  const handleRemoveUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (forcedMessage?: string) => {
    const messageText = input.trim() || forcedMessage || "";

    if (!messageText) return;

    const newUserMessage: Message = {
      role: "user",
      text: messageText,
      files: uploads.map((file) => ({
        file_name: file.name,
        file_url: URL.createObjectURL(file),
        file_type: file.type,
      })),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    console.log("Active Chat ID:", activeChatId);

    const typingMessageId = Date.now().toString() + "-typing"; // unique id
    const typingMessage: Message = {
      role: "assistant",
      text: "...",
      msg_id: typingMessageId,
    };
    setMessages((prev) => [...prev, typingMessage]);

    const formData = new FormData();
    formData.append("message", messageText);
    formData.append("chat_id", activeChatId ?? "");
    formData.append("is_new_chat", activeChatId ? "false" : "true");
    formData.append("choice", forcedMessage ? forcedMessage : "");

    uploads.forEach((file) => formData.append("files", file));

    setInput("");
    setUploads([]);

    try {
      const data = await apiFetch<{
        chat_id: string;
        reply: string;
        choices: string[];
        data: ChatData[];
      }>("/chat", {
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

      setMessages((prev) =>
        prev.map((msg) =>
          msg.msg_id === typingMessageId
            ? {
                ...msg,
                text: data.reply,
                data: data.data ?? [],
                isTyping: true,
                choices: data.choices ? data.choices : [],
              }
            : msg
        )
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.msg_id === typingMessageId
            ? {
                ...msg,
                text: "Error: failed to contact server.",
                isTyping: true,
              }
            : msg
        )
      );
    }
  };

  const loadChat = async (chatId: string) => {
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
          data?: ChatData[];
        }>,
        item: TimelineItem
      ) => {
        const existingMsg = acc.find((m) => m.msg_id === item.msg_id);

        console.log("existingMsg:", existingMsg);

        if (existingMsg) {
          // Append file info if exists
          if (item.file_url && item.file_name && item.file_type) {
            existingMsg.files.push({
              file_url: item.file_url,
              file_name: item.file_name,
              file_type: item.file_type,
            });
          }

          // Only set text if it exists and current text is empty
          if (!existingMsg.text) {
            const normalized = normalizeMessageText(item.message);
            if (normalized) {
              existingMsg.text = normalized;
            }
          }

          console.log("Existing message before adding log_data:", existingMsg);

          if (!existingMsg.data && item.log_data) {
            existingMsg.data = item.log_data;
            console.log(
              "Item log data added to existing message:",
              item.log_data
            );
          }
        } else {
          acc.push({
            msg_id: item.msg_id,
            role: item.role === "ai" ? "assistant" : "user",
            text: normalizeMessageText(item.message),
            files:
              item.file_url && item.file_name && item.file_type
                ? [
                    {
                      file_url: item.file_url,
                      file_name: item.file_name,
                      file_type: item.file_type,
                    },
                  ]
                : [],
            data: Array.isArray(item.log_data) ? item.log_data : undefined,
          });
        }

        console.log("Item log_data:", item.log_data);

        return acc;
      },
      []
    );

    console.log("Grouped messages:", messages);

    setActiveChatId(data.chat_id);
    navigate(`/chatbot/${data.chat_id}`, { replace: true });

    setMessages(messages);

    const typingMessageId = Date.now().toString() + "-typing";
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: "...",
        msg_id: typingMessageId,
        isTyping: true,
      },
    ]);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.msg_id === typingMessageId
            ? {
                ...msg,
                text: "Hi! How can I help you today?",
                choices: [
                  "Log meal",
                  "View meals log",
                  "Log workout",
                  "View workouts log",
                  "Meal recommendation",
                  "Workout recommendation",
                ],
                isTyping: true,
              }
            : msg
        )
      );
    }, 1000);
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

      // Add default first message
      const typingMessageId = Date.now().toString() + "-typing";
      setMessages([
        {
          role: "assistant",
          text: "...",
          msg_id: typingMessageId,
          isTyping: true,
        },
      ]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.msg_id === typingMessageId
              ? {
                  ...msg,
                  text: "Hi! How can I help you today?",
                  choices: [
                    "Log meal",
                    "View meals log",
                    "Log workout",
                    "View workouts log",
                    "Meal recommendation",
                    "Workout recommendation",
                  ],
                  isTyping: true,
                }
              : msg
          )
        );
      }, 1000);
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

      const typingMessageId = Date.now().toString() + "-typing";
      setMessages([
        {
          role: "assistant",
          text: "...",
          msg_id: typingMessageId,
          isTyping: true,
        },
      ]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.msg_id === typingMessageId
              ? {
                  ...msg,
                  text: "Hi! How can I help you today?",
                  choices: [
                    "Log meal",
                    "View meals log",
                    "Log workout",
                    "View workouts log",
                    "Meal recommendation",
                    "Workout recommendation",
                  ],
                  isTyping: true,
                }
              : msg
          )
        );
      }, 1000);
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

      const typingMessageId = Date.now().toString() + "-typing";
      setMessages([
        {
          role: "assistant",
          text: "...",
          msg_id: typingMessageId,
          isTyping: true,
        },
      ]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.msg_id === typingMessageId
              ? {
                  ...msg,
                  text: "Hi! How can I help you today?",
                  choices: [
                    "Log meal",
                    "View meals log",
                    "Log workout",
                    "View workouts log",
                    "Meal recommendation",
                    "Workout recommendation",
                  ],
                  isTyping: true,
                }
              : msg
          )
        );
      }, 1000);
    } catch (err) {
      console.error("Failed to clear all chats", err);
    }
  };

  const handleMealSubmit = async (mealData: {
      meal_description: string;
      meal_time: string;
    }) => {
      console.log("Meal data submitted:", mealData);
      const mealMessage = mealData.meal_description + " for " + mealData.meal_time;
      const messageText = mealMessage;
      console.log("Submitting meal message:", mealMessage);

      const typingMessageId = Date.now().toString() + "-typing"; // unique id
      const typingMessage: Message = {
        role: "assistant",
        text: "...",
        msg_id: typingMessageId
      };
      setMessages((prev) => [...prev, typingMessage]);
      const formData = new FormData();
      formData.append("message", mealMessage);
      formData.append("chat_id", activeChatId ?? "");
      formData.append("is_new_chat", activeChatId ? "false" : "true");
      formData.append("choice", "Log meal");

      try {
        const data = await apiFetch<{ chat_id: string; reply: string, choices: string[], data: ChatData[] }>("/chat", {
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

        setMessages((prev) =>
          prev.map((msg) =>
            msg.msg_id === typingMessageId
              ? { ...msg, text: data.reply, data: data.data ?? [], isTyping: true, choices: data.choices ? data.choices : [] }
              : msg
          )
        );
      } catch (err) {
        console.error(err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.msg_id === typingMessageId
              ? { ...msg, text: "Error: failed to contact server.", isTyping: true }
              : msg
          )
        );
      }
      
      setShowMealModal(false);
    };

    const handleWorkoutSubmit = async (workoutData: {
      exercise_name: string;
      sets: string;
      reps: string;
      duration: string;
      calories_burned: string;
    }) => {
      console.log("Workout data submitted:", workoutData);
      const workoutMessage =
        Number(workoutData.sets) > 0 && Number(workoutData.reps) > 0
          ? `I did ${workoutData.sets} sets of ${workoutData.reps} reps of ${workoutData.exercise_name}, lasting ${workoutData.duration} minutes and burning ${workoutData.calories_burned} calories.`
          : `I did ${workoutData.exercise_name} for ${workoutData.duration} minutes, burning ${workoutData.calories_burned} calories.`;

      const messageText = workoutMessage;
      console.log("Submitting workout message:", workoutMessage);

      const typingMessageId = Date.now().toString() + "-typing"; // unique id
      const typingMessage: Message = {
        role: "assistant",
        text: "...",
        msg_id: typingMessageId
      };
      setMessages((prev) => [...prev, typingMessage]);
      const formData = new FormData();
      formData.append("message", workoutMessage);
      formData.append("chat_id", activeChatId ?? "");
      formData.append("is_new_chat", activeChatId ? "false" : "true");
      formData.append("choice", "Log workout");

      try {
        const data = await apiFetch<{ chat_id: string; reply: string, choices: string[], data: ChatData[] }>("/chat", {
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

        setMessages((prev) =>
          prev.map((msg) =>
            msg.msg_id === typingMessageId
              ? { ...msg, text: data.reply, data: data.data ?? [], isTyping: true, choices: data.choices ? data.choices : [] }
              : msg
          )
        );
      } catch (err) {
        console.error(err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.msg_id === typingMessageId
              ? { ...msg, text: "Error: failed to contact server.", isTyping: true }
              : msg
          )
        );
      }
      
      setShowMealModal(false);
    };

  return (
    <div className="bg-[#F5F7FA] flex-1 min-h-0 overflow-hidden flex flex-col">
      <div className="flex p-8 sm:px-6 lg:px-8 gap-6 max-w-[1600px] mx-auto w-full flex-1 min-h-0 overflow-hidden items-stretch">

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[150] lg:hidden">
            {/* Backdrop */}
            <button
              type="button"
              onClick={closeMobileMenu}
              className={`fixed inset-0 bg-black w-full h-full cursor-default transition-opacity duration-300 ${
                mobileAnimating ? "opacity-25" : "opacity-0"
              }`}
              aria-label="Close menu"
            />

            {/* Sidebar Panel */}
            <nav
              className={`fixed bottom-0 left-0 top-0 flex w-[250px] flex-col overflow-y-auto bg-white shadow-2xl rounded-r-2xl p-4 transition-transform duration-300 ease-out ${
                mobileAnimating ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              {/* LEFT SIDEBAR */}
              <div className="bg-white p-0 rounded-3xl w-full h-full flex flex-col">
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 items-start self-end"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <h1 className="mb-6 mt-2 text-left font-bold text-xs text-gray-700 uppercase tracking-wider">
                  Chat History
                </h1>

                <button
                   onClick={() => {
                      newChat();         
                      closeMobileMenu(); 
                    }}
                  className="bg-[#2A4A2D] hover:bg-[#1A381D] text-white text-sm font-medium px-4 py-2.5 w-full rounded-xl cursor-pointer transition-colors"
                >
                  + New Chat
                </button>

                <div className="flex justify-between items-center text-gray-600 text-xs mb-4 mt-6">
                  <span className="font-medium">Recent Chats</span>
                  {chatList.length > 0 && (
                    <button
                      onClick={() => {
                        setConfirmTitle("Clear All Chats?");
                        setConfirmMessage(
                          "Are you sure you want to clear all chats? This cannot be undone."
                        );
                        setConfirmText("Clear All");
                        setCancelText("Cancel");
                        setConfirmAction(() => clearAllChats);
                        setShowConfirmModal(true);
                        closeMobileMenu();
                      }}
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
                        onClick={() => {
                          loadChat(chat.chat_id); // load the chat
                          closeMobileMenu(); // close the sidebar
                        }}
                      >
                        {/* Left: chat icon */}
                        <img
                          src={messagesIcon}
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
                              setConfirmTitle("Delete Chat?");
                              setConfirmMessage(
                                "Are you sure you want to delete this chat? This action cannot be undone."
                              );
                              setConfirmText("Delete");
                              setCancelText("Cancel");
                              setConfirmAction(
                                () => () => deleteChat(chat.chat_id)
                              );
                              setShowConfirmModal(true);
                              closeMobileMenu();
                            }}
                            aria-label="Delete chat"
                          >
                            <img
                              src={deleteIcon}
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
            </nav>
          </div>
        )}

        {/* LEFT SIDEBAR */}
        <div className="hidden lg:flex bg-white p-6 rounded-3xl w-75 border border-gray-200 shrink-0 flex flex-col">
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
                onClick={() => {
                  setConfirmTitle("Clear All Chats?");
                  setConfirmMessage(
                    "Are you sure you want to clear all chats? This cannot be undone."
                  );
                  setConfirmText("Clear All");
                  setCancelText("Cancel");
                  setConfirmAction(() => clearAllChats);
                  setShowConfirmModal(true);
                }}
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
                    src={messagesIcon}
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
                        setConfirmTitle("Delete Chat?");
                        setConfirmMessage(
                          "Are you sure you want to delete this chat? This action cannot be undone."
                        );
                        setConfirmText("Delete");
                        setCancelText("Cancel");
                        setConfirmAction(() => () => deleteChat(chat.chat_id));
                        setShowConfirmModal(true);
                      }}
                      aria-label="Delete chat"
                    >
                      <img
                        src={deleteIcon}
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
        <div className="bg-white flex-1 rounded-3xl sm:p-8 p-4 flex flex-col min-h-0 border border-gray-200 overflow-hidden relative">
          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center justify-start gap-4 mb-2 sticky z-50">
            <button
              type="button"
              onClick={openMobileMenu}
              className="flex cursor-pointer  rounded-lg p-2 text-gray-600 bg-white border border-gray-200 shadow-sm transition-colors hover:bg-lime-50"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          {messages.length > 0 && (
            <div
              ref={messagesContainerRef}
              className="flex flex-col lg:w-full gap-4 pr-2 flex-1 min-h-0 overflow-y-auto scroll-smooth thin-scrollbar"
            >
              {messages.map((msg, index) => (
                <ChatBubble
                  key={index}
                  role={msg.role}
                  text={msg.text}
                  data={msg.data}
                  files={msg.files || []}
                  isTyping={msg.isTyping}
                  onTypingEnd={() => {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.msg_id === msg.msg_id ? { ...m, isTyping: false } : m
                      )
                    );
                  }}
                  choices={msg.choices}
                  onChoiceClick={(choice) => {
                    handleChoiceClick(choice);
                  }}
                  isLast={index === messages.length - 1}
                  onImageClick={(src) => setPreviewImage(src)}
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
                  src={chatbotLogo}
                  className="sm:w-[180px] w-[100px] opacity-90"
                  alt="VitaTrack Chat"
                />
                <h2 className="sm:text-2xl text-xl font-semibold text-gray-700">
                  Hi! How can I help you today?
                </h2>
                <p className="sm:text-sm text-xs text-gray-500 text-center max-w-md">
                  Ask me anything about fitness, nutrition, or wellness. I can
                  help you log meals, track workouts, and provide personalized
                  recommendations.
                </p>
              </div>
            </div>
          )}

          {showMealModal && (
            <MealLogForm
              onSubmit={(mealData) => {
                setShowMealModal(false);
                handleMealSubmit(mealData);
              }}
              onClose={() => setShowMealModal(false)}
            />
          )}

          {showWorkoutModal && (
            <WorkoutLogForm
              onSubmit={(workoutData) => {
                setShowWorkoutModal(false);
                handleWorkoutSubmit(workoutData);
              }}
              onClose={() => setShowWorkoutModal(false)}
            />
          )}

          {previewImage && (
            <ImagePreview
              src={previewImage}
              onClose={() => setPreviewImage(null)}
            />
          )}

          {showConfirmModal && (
            <ConfirmDelete
              isOpen={showConfirmModal}
              title={confirmTitle}
              message={confirmMessage}
              confirmText={confirmText}
              cancelText={cancelText}
              onCancel={() => setShowConfirmModal(false)}
              onConfirm={() => {
                confirmAction();
                setShowConfirmModal(false);
              }}
            />
          )}

          <div className="w-full flex justify-center mt-4">
            {/* Input Box */}
            <div className="flex flex-col bg-white rounded-2xl sm:px-4 py-1.5 w-full max-w-3xl border border-gray-200">
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
                          src={deleteButton}
                          className="w-4 h-4 cursor-pointer"
                          alt="Remove"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Row */}
              <div className="flex items-center w-full sm:gap-3 gap-1">
                <button
                  onClick={handleOpenFilePicker}
                  className="cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Attach file"
                >
                  <img
                    src={addIcon}
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
                  className="flex-1 min-w-0 outline-none text-gray-700 sm:text-sm text-xs bg-transparent placeholder:text-gray-400"
                  placeholder="Ask Vita..."
                />
                <button
                  className="cursor-pointer p-2 hover:bg-[#2A4A2D]/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <img
                    src={sendIcon}
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
