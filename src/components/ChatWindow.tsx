import React from "react";
import ChatBox, { type ChatBoxHandle } from "./ChatBox";

interface ChatWindowProps {
	onCommand: (cmd: string) => void;
}

const ChatWindow = React.forwardRef<ChatBoxHandle, ChatWindowProps>(
	({ onCommand }, ref) => <ChatBox ref={ref} onCommand={onCommand} />,
);

export default ChatWindow;
