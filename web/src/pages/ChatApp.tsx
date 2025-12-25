import { useRef, useState, useEffect } from "react";
import { apiFetch } from "../services/api";

type Message = {
  role: "user" | "assistant";
  text: string;
  file?: File[];         // For newly uploaded files
  files?: FileItem[];    // For loaded messages from backend
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
    typeof (message as any).reply === "string"
  ) {
    return (message as any).reply;
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

  return (
    <div className={`w-full flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div className="flex items-start gap-3 max-w-[70%]">
        {isUser && <img src="/src/assets/Chatbot/user.png" className="w-10 h-10 rounded-4 object-cover" />}
        <div className="flex flex-col">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {files.map((file, index) => (
                <div key={index} className="max-w-[150px]">
                  {file.file_url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="rounded-xl shadow max-w-full"
                    />
                  ) : (
                    <a href={file.file_url} target="_blank" className="text-sm">
                      📄 {file.file_name}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className={`px-5 py-3 text-sm whitespace-pre-line shadow-sm
              ${isUser
                ? "bg-[#DDF3D8] text-gray-800 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
                : "bg-white text-gray-700 rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl"
              }`}
          >
            {text}
          </div>
        </div>
        {!isUser && <img src="/src/assets/Chatbot/AI.svg" className="w-6 h-6 mt-1" />}
      </div>
    </div>
  );
}
export function ChatApp() {
  const [uploads, setUploads] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [msg_id, setMsgId] = useState<string | null>(null);
  const [chatList, setChatList] = useState<{ chat_id: string; title: string }[]>([]);
  const [activeTab, setActiveTab] = useState('progress');
  const [chatOpen, setChatOpen] = useState(false);

  const activeBtn = "bg-[#CDEE6E] text-black shadow-sm";
  const inactiveBtn = "text-gray-400 hover:bg-lime-50";
  const chatSectionActive = activeTab === "chat" 

  useEffect(() => {
    const fetchChats = async () => {
      const data = await apiFetch<{ chat_id: string; title: string }[]>('/fetchChatList', {
        method: 'GET'
      });
      setChatList(data);
    };
    fetchChats();
  }, []);

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
    setMessages(prev => [...prev, newUserMessage]);

    const formData = new FormData();
    formData.append("message", messageText);
    formData.append("chat_id", activeChatId ?? "");
    formData.append("is_new_chat", activeChatId ? "false" : "true");

    uploads.forEach(file => formData.append("files", file));

    setInput("");
    setUploads([]);

    try {
      const data = await apiFetch<{ chat_id: string; reply: string }>("/chat", {
        method: "POST",
        json: formData,
      });

      const chatId = activeChatId || data.chat_id;

      if (!activeChatId) setActiveChatId(chatId);

      setChatList(prev => {
        const chatExists = prev.find(c => c.chat_id === chatId);

        if (chatExists) {
          return prev.map(c =>
            c.chat_id === chatId && c.title === "New chat"
              ? { ...c, title: messageText } // update title only if it's "New chat"
              : c
          );
        } else {
          // if somehow chat is not in the list, add it
          return [{ chat_id: chatId, title: messageText }, ...prev];
        }
      });

      setMessages(prev => [...prev, { role: "assistant", text: data.reply, file: [] }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", text: "Error: failed to contact server.", file: [] },
      ]);
    }
  };


  const loadChat = async (chatId: string) => {
    setActiveTab("chat");
    setChatOpen(false);

    const data = await apiFetch<{ chat_id: string; messages: any[] }>(
      `/loadchat?chat_id=${chatId}`
    );

    console.log("Loaded chat data:", data);

    // group data based on msg_id
    // group data based on msg_id
    const messages = data.messages.reduce((acc: any[], item: TimelineItem) => {
      const existingMsg = acc.find(m => m.msg_id === item.msg_id);

      if (existingMsg) {
        // Append file info if exists
        if (item.file_url && item.file_name) {
          existingMsg.files.push({
            file_url: item.file_url,
            file_name: item.file_name
          });
        }

        // ✅ IMPORTANT: only set text if it exists and current text is empty
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
          files: item.file_url && item.file_name
            ? [{
                file_url: item.file_url,
                file_name: item.file_name
              }]
            : []
        });
      }

      return acc;
    }, []);


    console.log("Grouped messages:", messages);

    setActiveChatId(data.chat_id);

    setMessages(messages);
  };


  const newChat = async () => {
    try {
      // Clear UI immediately
      setMessages([]);
      setActiveChatId(null);

      // Create empty chat
      const data = await apiFetch<{ chat_id: string }>("/newchat", {
        method: "POST"
      });

      const newChatItem = { chat_id: data.chat_id, title: "New chat" };
      setChatList(prev => [newChatItem, ...prev]);

      setActiveChatId(data.chat_id);

    } catch (err) {
      console.error("Failed to create new chat", err);
    }
  };

  return (
    <div
      className="bg-[#F5F7FA] bg-cover bg-center bg-no-repeat"
    >
      <div className="flex justify-center p-8 sm:px-6 lg:px-8 gap-6">
        {/* MAIN CHAT UI */}
        {/* <div
          className="flex gap-6 w-full max-w-[1390px]
         rounded-3xl p-8 h-[80vh] shadow-xl"
        > */}
          {/* LEFT SIDEBAR */}
          <div className="bg-white p-6 rounded-3xl w-75 shadow-sm h-[82vh]">
            <h1 className="mb-8 mt-4 text-left font-bold text-[10px]">
              CHAT VITATRACK
            </h1>

            <button 
              onClick={newChat}
              className="bg-[#1A381D] hover:bg-green-800 text-white text-[14px] px-4 py-2 w-full rounded-full cursor-pointer">              
              + New Chat
            </button>

            <div className="flex justify-between text-gray-500 text-[12px] mb-8 mt-8">
              <span>Your chats</span>
              <span className="cursor-pointer hover:text-gray-700">
                Clear All
              </span>
            </div>

            {/* Chat list */}
            <div className="flex flex-col overflow-y-auto mt-2 pr-1 h-[52vh]">
              {chatList.map((chat) => (
                <div
                  key={chat.chat_id}
                  className={`flex items-center gap-4 cursor-pointer p-2 rounded-xl transition-all duration-200
                        hover:bg-[#88987E]/26 hover:shadow-sm hover:scale-[1.02]
                        ${activeChatId === chat.chat_id ? activeBtn : inactiveBtn}`}
                      
                  onClick={() => loadChat(chat.chat_id)} // load messages for selected chat
                >
                  <img src="/src/assets/Chatbot/Messages.svg" className="w-6" />
                  <p className="text-[12px] text-gray-800 truncate">{chat.title || "Untitled Chat"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN CHAT AREA */}
          <div className="bg-white flex-1 rounded-3xl p-10 flex flex-col items-center justify-start shadow-sm">
            {messages.length > 0 && (
              <div className="flex flex-col w-full gap-6 mb-6 overflow-y-auto pr-2 h-[60vh]">
                {messages.map((msg, index) => (
                  <ChatBubble
                    key={index}
                    role={msg.role}
                    text={msg.text}
                    files={[
                      ...(msg.files || []), // loaded files
                      ...(msg.file?.map(f => ({ file_name: f.name, file_url: URL.createObjectURL(f) })) || []), // newly uploaded
                    ]}
                  />
                ))}
              </div>
            )}

            {/* Bubble */}
            {messages.length === 0 && (
              <div>
                <img
                  src="/src/assets/Chatbot/Logo.svg"
                  className="w-[200px] mb-2 mt-4"
                />

                <h2 className="text-xl font-semibold mb-8">
                  Hi, How can I help You?
                </h2>
              </div>
            )}

            {/* Input Box */}
            <div className="flex flex-col bg-white shadow-lg rounded-[20px] px-4 py-3 w-full max-w-2xl">
              {/* Uploaded Files */}
              {uploads.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploads.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-[8px] text-sm text-gray-700"
                    >
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded-[8px]"
                        />
                      ) : (
                        <span>📄 {file.name}</span>
                      )}
                      <button
                        onClick={() => handleRemoveUpload(index)}
                        className="text-red-500 hover:text-red-700 font-bold ml-2"
                      >
                        <img
                          src="/src/assets/Chatbot/Button-delete.svg"
                          className="w-6 cursor-pointer"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Row */}
              <div className="flex items-center w-full">
                <button
                  onClick={handleOpenFilePicker}
                  className="cursor-pointer"
                >
                  <img
                    src="/src/assets/Chatbot/Button-add.svg"
                    className="w-6"
                  />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 ml-6 outline-none text-gray-700 text-[13px]"
                  placeholder="What's in your mind?..."
                />
                <button className="cursor-pointer" onClick={sendMessage}>
                  <img
                    src="/src/assets/Chatbot/Button-send.svg"
                    className="w-6"
                  />
                </button>
              </div>
            </div>
          </div>
        
      </div>
    </div>
  );
}
