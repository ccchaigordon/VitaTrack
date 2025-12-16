import { useRef, useState } from "react";
type Message = {
  role: "user" | "assistant";
  text: string;
  file: File[];
};

function ChatBubble({
  role,
  text,
  files,
}: {
  role: "user" | "assistant";
  text: string;
  files: File[];
}) {
  const isUser = role === "user";

  return (
    <div className={`w-full flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div className="flex items-start gap-3 max-w-[70%]">
        {/* USER AVATAR */}
        {isUser && (
          <img
            src="/src/assets/Chatbot/user.png"
            className="w-10 h-10 rounded-4 object-cover"
          />
        )}

        {/* COLUMN FOR FILES + BUBBLE */}
        <div className="flex flex-col">
          {/* FILE PREVIEWS ABOVE THE BUBBLE */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {files.map((file, index) => (
                <div key={index} className="max-w-[150px]">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="rounded-xl shadow max-w-full"
                    />
                  ) : (
                    <a
                      href={URL.createObjectURL(file)}
                      target="_blank"
                      className="text-sm"
                    >
                      📄 {file.name}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TEXT BUBBLE */}
          <div
            className={`px-5 py-3 text-sm whitespace-pre-line shadow-sm
              ${
                isUser
                  ? "bg-[#DDF3D8] text-gray-800 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
                  : "bg-white text-gray-700 rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl"
              }`}
          >
            {text}
          </div>
        </div>

        {/* AI ICON */}
        {!isUser && (
          <img src="/src/assets/Chatbot/AI.svg" className="w-6 h-6 mt-1" />
        )}
      </div>
    </div>
  );
}

export function ChatApp() {
  const [uploads, setUploads] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

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
    if (!input.trim()) return;

    const newUserMessage: Message = {
      role: "user",
      text: input.trim(),
      file: uploads,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // prepare request
    const formData = new FormData();
    formData.append("message", input.trim());

    uploads.forEach((file) => {
      formData.append("files", file);
    });

    setInput("");
    setUploads([]);

    try {
      const res = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        body: formData,
      });

      console.log("Form Data sent:", formData);

      const data = await res.json();

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

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/src/assets/Chatbot/5522.jpg')" }}
    >
      <div className="flex justify-center px-4 sm:px-6 lg:px-8">
        {/* MAIN CHAT UI */}
        <div
          className="flex gap-6 w-full 
         rounded-3xl bg-[#F5F7DE] p-8 h-[86vh] shadow-xl"
        >
          {/* LEFT SIDEBAR */}
          <div className="bg-white p-6 rounded-3xl w-75">
            <h1 className="mb-8 mt-4 text-left font-bold text-[10px]">
              CHAT VITATRACK
            </h1>

            <button className="bg-[#1A381D] hover:bg-green-800 text-white text-[14px] px-4 py-2 w-full rounded-full cursor-pointer">
              + New Chat
            </button>

            <div className="flex justify-between text-gray-500 text-[12px] mb-8 mt-8">
              <span>Your chats</span>
              <span className="cursor-pointer hover:text-gray-700">
                Clear All
              </span>
            </div>

            {/* Dummy chat list */}
            <div className="flex flex-col">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 cursor-pointer p-2 rounded-xl transition-all duration-200
                                        hover:bg-[#88987E]/26 hover:shadow-sm hover:scale-[1.02]"
                >
                  <img src="/src/assets/Chatbot/Messages.svg" className="w-6" />
                  <p className="text-[12px] text-gray-800">
                    Chat is chatting the chat…
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN CHAT AREA */}
          <div className="bg-white/50 flex-1 rounded-3xl p-10 flex flex-col items-center justify-start">
            {messages.length > 0 && (
              <div className="flex flex-col w-full gap-6 mb-6 overflow-y-auto pr-2 h-[60vh]">
                {messages.map((msg, index) => (
                  <ChatBubble
                    key={index}
                    role={msg.role}
                    text={msg.text}
                    files={msg.file}
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
    </div>
  );
}
